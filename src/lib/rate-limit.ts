/**
 * Rate limit in-memory del login admin — C-03 auth-admin-shell.
 *
 * SOLO servidor (`import "server-only"`; la Server Action de login es la
 * única consumidora). Sin dependencias.
 *
 * Modelo (umbrales pineados por el usuario):
 * - Clave dual: se lleva un contador por IP normalizada Y otro por email
 *   normalizado (trim+lowercase). Basta que UNA de las dos claves esté
 *   bloqueada para rechazar el intento (sin llamar a Auth).
 * - Ventana deslizante de 10 minutos con contador de fallos reales.
 * - Intentos 1.º–4.º pasan a Supabase Auth; ante fallo real se incrementan
 *   AMBOS contadores. El 5.º en ventana se rechaza SIN llamar a Auth con
 *   bloqueo de 15 min; el 6.º extiende a 20 min; el 7.º en adelante +5 min c/u
 *   (7º→25 min, 8º→30 min, 9º→35 min...).
 * - El conteo NUNCA se toca ante honeypot (la Action retorna antes) ni ante
 *   éxito (el éxito LIMPIA ambas claves: un login válido no deja lastre).
 * - Todo rechazo (inválidas / honeypot / bloqueo) responde la MISMA copia
 *   exacta desde la Action, anunciada vía `role="alert"`.
 *
 * Trade-off vs Redis/Upstash (documentado por diseño, Decisión 8): el Map
 * vive por instancia/proceso — en serverless Vercel un cold start o el
 * escalado horizontal lo reinicia, y un atacante distribuido por muchas IPs
 * lo diluye (la clave por email mitiga parcialmente esto). Aceptable para
 * un login interno de bajo tráfico + freno nativo de Supabase Auth como
 * segunda capa. Si el abuso escala, reemplazar ESTE módulo por un backend
 * persistente sin cambiar la Server Action (change nuevo, fuera de scope).
 */
import "server-only";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REAL_ATTEMPTS = 4;

type Entry = { count: number; windowStart: number; blockedUntil: number };

const store = new Map<string, Entry>();

function blockForMs(ordinal: number): number {
  // Backoff escalonado: 5º→15 min, 6º→20 min, 7º→25 min, 8º→30 min, +5 min c/u
  if (ordinal <= 5) return 15 * 60 * 1000;
  if (ordinal === 6) return 20 * 60 * 1000;
  return (25 + (ordinal - 7) * 5) * 60 * 1000;
}

function normalizeIp(ip: string | null | undefined): string {
  return (ip ?? "unknown").trim().toLowerCase() || "unknown";
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function keyFor(kind: "ip" | "email", value: string): string {
  return `${kind}:${value}`;
}

function prune(now: number, entry: Entry): Entry {
  if (now - entry.windowStart >= WINDOW_MS && now >= entry.blockedUntil) {
    return { count: 0, windowStart: now, blockedUntil: 0 };
  }
  return entry;
}

function getEntry(key: string, now: number): Entry {
  const existing = store.get(key);
  if (!existing) {
    const fresh: Entry = { count: 0, windowStart: now, blockedUntil: 0 };
    store.set(key, fresh);
    return fresh;
  }
  const pruned = prune(now, existing);
  store.set(key, pruned);
  return pruned;
}

export type RateLimitVerdict =
  | { blocked: false }
  | { blocked: true; retryAfterSec: number };

/**
 * Pre-chequeo (ANTES de llamar a Auth). Si alguna clave está bloqueada, o el
 * intento cae 5.º+ dentro de la ventana, lo rechaza y escala el bloqueo.
 * Efecto lateral: solo escribe ante un intento que RESULTA bloqueado
 * (extensión del backoff); los intentos que pasan no tocan contadores.
 */
export function checkLoginRateLimit(
  ip: string | null | undefined,
  email: string | null | undefined,
  now = Date.now(),
): RateLimitVerdict {
  const keys = [
    keyFor("ip", normalizeIp(ip)),
    keyFor("email", normalizeEmail(email)),
  ];

  let longestRemaining = 0;

  for (const key of keys) {
    const entry = getEntry(key, now);

    if (now < entry.blockedUntil) {
      // Intento durante el bloqueo: cuenta como siguiente ordinal y extiende.
      entry.count += 1;
      entry.blockedUntil = now + blockForMs(entry.count);
      store.set(key, entry);
      longestRemaining = Math.max(longestRemaining, entry.blockedUntil - now);
      continue;
    }

    if (entry.count >= MAX_REAL_ATTEMPTS) {
      // 5.º+ dentro de la ventana (4 fallos reales ya acumulados, o bloqueo
      // expirado con cuenta alta): se rechaza SIN llamar a Auth y se escala
      // el backoff (5.º→2 min, 6.º→10 min, 7.º+→30 min).
      entry.count += 1;
      entry.blockedUntil = now + blockForMs(entry.count);
      store.set(key, entry);
      longestRemaining = Math.max(longestRemaining, entry.blockedUntil - now);
    }
  }

  if (longestRemaining > 0) {
    return { blocked: true, retryAfterSec: Math.ceil(longestRemaining / 1000) };
  }
  return { blocked: false };
}

/**
 * Registra un fallo REAL de Auth (solo tras intento no-honeypot, no-bloqueado
 * que Supabase rechazó). Incrementa ambas claves.
 */
export function recordLoginFailure(
  ip: string | null | undefined,
  email: string | null | undefined,
  now = Date.now(),
): void {
  for (const key of [
    keyFor("ip", normalizeIp(ip)),
    keyFor("email", normalizeEmail(email)),
  ]) {
    const entry = getEntry(key, now);
    // Si el intento pasó el pre-chequeo, por construcción count <= 3 acá
    // (el 4.º fallo real deja count=4 y el siguiente intento ya se bloquea).
    entry.count += 1;
    store.set(key, entry);
  }
}

/** Un login válido limpia ambas claves (sin lastre tras éxito). */
export function recordLoginSuccess(
  ip: string | null | undefined,
  email: string | null | undefined,
): void {
  store.delete(keyFor("ip", normalizeIp(ip)));
  store.delete(keyFor("email", normalizeEmail(email)));
}

/** Solo para tests/verificación: expone el estado interno de una clave. */
export function __rateLimitDebug(
  kind: "ip" | "email",
  value: string,
): Entry | undefined {
  const v = kind === "ip" ? normalizeIp(value) : normalizeEmail(value);
  return store.get(keyFor(kind, v));
}

/** Solo para tests/verificación: vacía todo el store. */
export function __rateLimitReset(): void {
  store.clear();
}

// ---------------------------------------------------------------------------
// Rate limit del formulario público de leads — C-04 landing-captura-politicas.
//
// Extiende ESTE módulo (no lo duplica): comparte mecánica con el login
// (Map in-memory, ventana deslizante de 10 min, clave dual IP+email
// normalizadas, backoff 2/10/30 min) con umbrales propios de formulario
// público: 5 envíos/10 min por IP+email (el login es más estricto por ser
// credential-stuffing; el lead es freno anti-spam).
//
// Diferencias intencionales vs login:
// - Namespace de claves propio (`lead-ip:` / `lead-email:`): un atacante del
//   formulario no contamina el login ni viceversa. `__rateLimitReset` limpia
//   ambos (mismo store).
// - Cada intento real (validado, no-honeypot) CUENTA, incluso el exitoso:
//   el éxito NO limpia (un spammer no resetea su cuota registrando leads).
//   Solo hay `recordLeadAttempt`, sin equivalente a `recordLoginSuccess`.
// - El honeypot NUNCA toca contadores (la Action retorna antes, misma regla
//   C-03: no envenenable).
// ---------------------------------------------------------------------------

/** Envíos validados permitidos por ventana de 10 min (IP o email). */
const MAX_LEAD_SENDS = 5;

function leadKeyFor(kind: "ip" | "email", value: string): string {
  const v = kind === "ip" ? normalizeIp(value) : normalizeEmail(value);
  return `lead-${kind}:${v}`;
}

/**
 * Pre-chequeo (ANTES del INSERT). Si alguna clave lead está bloqueada, o el
 * intento cae 6.º+ dentro de la ventana (5 envíos ya acumulados), lo rechaza
 * y escala el backoff (6.º→2 min, 7.º→10 min, 8.º+→30 min, alineado al login
 * restando el offset de umbral).
 * Efecto lateral: solo escribe ante un intento que RESULTA bloqueado.
 */
export function checkLeadRateLimit(
  ip: string | null | undefined,
  email: string | null | undefined,
  now = Date.now(),
): RateLimitVerdict {
  const keys = [leadKeyFor("ip", ip ?? ""), leadKeyFor("email", email ?? "")];

  let longestRemaining = 0;

  // Offset para reutilizar la escala del login: el 6.º envío de leads
  // equivale al 5.º intento de login (primer escalón: 2 min).
  const toLoginOrdinal = (leadCount: number): number =>
    leadCount - (MAX_LEAD_SENDS - MAX_REAL_ATTEMPTS);

  for (const key of keys) {
    const entry = getEntry(key, now);

    if (now < entry.blockedUntil) {
      entry.count += 1;
      entry.blockedUntil = now + blockForMs(toLoginOrdinal(entry.count));
      store.set(key, entry);
      longestRemaining = Math.max(longestRemaining, entry.blockedUntil - now);
      continue;
    }

    if (entry.count >= MAX_LEAD_SENDS) {
      entry.count += 1;
      entry.blockedUntil = now + blockForMs(toLoginOrdinal(entry.count));
      store.set(key, entry);
      longestRemaining = Math.max(longestRemaining, entry.blockedUntil - now);
    }
  }

  if (longestRemaining > 0) {
    return { blocked: true, retryAfterSec: Math.ceil(longestRemaining / 1000) };
  }
  return { blocked: false };
}

/**
 * Registra un intento REAL de lead (validado, no-honeypot, no-bloqueado).
 * Se llama una vez por envío que llega al INSERT (éxito, duplicado o fallo
 * de DB: todos consumen cuota). Incrementa ambas claves lead.
 */
export function recordLeadAttempt(
  ip: string | null | undefined,
  email: string | null | undefined,
  now = Date.now(),
): void {
  for (const key of [
    leadKeyFor("ip", ip ?? ""),
    leadKeyFor("email", email ?? ""),
  ]) {
    const entry = getEntry(key, now);
    entry.count += 1;
    store.set(key, entry);
  }
}

/** Solo para tests/verificación: expone el estado interno de una clave lead. */
export function __leadRateLimitDebug(
  kind: "ip" | "email",
  value: string,
): Entry | undefined {
  return store.get(
    kind === "ip" ? leadKeyFor("ip", value) : leadKeyFor("email", value),
  );
}
