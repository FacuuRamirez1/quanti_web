# Proposal — C-03 auth-admin-shell

## Why

Instancia 1 no es desplegable sin acceso admin autenticado: C-02 dejó el contrato de datos (leads + `perfiles` como única fuente de roles, RLS probada) y C-01 dejó `middleware.ts` stub + `/admin/login` stub que deniegan todo. C-03 convierte ese stub en autenticación real para que C-05 pueda mostrar leads solo a `admin`/`superadmin` (RN-AU-01/02, Flujo 3).

## What Changes

- `/admin/login` pública real: formulario email + password → `signInWithPassword` (server-side); error genérico sin revelar existencia de usuario (Flujo 3); errores de campo con `aria-describedby` / `role="alert"`; si ya hay sesión válida, redirige a `/admin`.
- Protección anti-abuso del login (paridad con enfoque C-04 del formulario de leads): rate limit server-side en la Server Action (clave dual por IP + por email, 5 intentos fallidos por ventana de 10 minutos, backoff progresivo: 5.º fallo → bloqueo 2 min, 6.º → bloqueo 10 min, 7.º en adelante → bloqueo 30 min; contadores solo en servidor) + campo honeypot invisible (si llega completo → rechazo silencioso con mensaje genérico BYTE-IDÉNTICO al de credenciales inválidas y al de rate limit excedido — copia exacta: "Credenciales inválidas o cuenta no encontrada." — sin llamar a Supabase Auth y sin contaminar los contadores de rate limit); dependency-light (contador in-memory compatible con serverless Vercel; trade-off vs Redis/Upstash documentado en design, fuera de scope). A11y preservada: el error genérico se anuncia vía `role="alert"` sin distinguir honeypot de password incorrecta ni de bloqueo (diferencia de timing por skip de llamada Auth en honeypot ya aceptada).
- `middleware.ts` Supabase completo (reemplaza stub C-01): protege `/admin` y `/admin/*` (excepto `/admin/login`), crea/refresca cookies `httpOnly`/`secure` vía `updateSession` de `lib/supabase/middleware.ts`, redirige sin sesión a `/admin/login` conservando destino (`?next=`).
- Resolución de rol exclusivamente vía tabla `perfiles` (decisión C-02/DD-09 — `user_metadata` MUST NOT usarse): helper server-only `requireRole()` que lee sesión + `perfiles.role`; sin rol suficiente → 403 + aviso interno (log server, sin filtrar datos); rol insuficiente nunca renderiza contenido admin.
- Logout que cierra sesión en cliente y servidor (botón en shell admin + `signOut` server action/route que limpia cookies vía `updateSession`).
- Shell admin mínima (`/admin/layout.tsx` + `/admin/page.tsx` placeholder de C-05): verifica sesión + rol en servidor (RSC, R1) antes de renderizar; placeholder indica que el listado de leads llega en C-05.
- Link discreto al admin en el footer del layout raíz (RN-AU-03, visible desde Instancia 1; footer completo en C-06/C-09) — p. ej. "Acceso admin" → `/admin/login`, sin alterar landmarks/skip-link de C-01.
- **BREAKING**: el stub C-01 que redirigía todo `/admin/*` a login sin Supabase deja de existir; a partir de este change toda ruta `/admin` exige cookie de sesión Supabase válida.

## Capabilities

### New Capabilities

- `auth-admin-shell`: autenticación admin y cáscara protegida — login, middleware de sesión, resolución de rol por `perfiles`, 403 por rol insuficiente, logout cliente+servidor, shell admin mínima, link discreto en footer y protección anti-abuso del login (rate limit server-side clave dual IP+email: 5 fallidos/10 min, backoff 2/10/30 min en 5.º/6.º/7.º+, contadores solo servidor + honeypot con error genérico byte-idéntico "Credenciales inválidas o cuenta no encontrada." para los 3 casos sin contaminar contadores).

### Modified Capabilities

- `foundation-infra`: el Requirement "Rutas /admin están protegidas por stub" cambia a protección real con Supabase (sesión + refresh de cookies); el stub deja de ser el comportamiento especificado. El resto de requirements (scaffold, health, envs, clientes, LHCI, migraciones) no cambia.

## Impact

- Afecta: `middleware.ts` (reescritura sobre helper C-01), `app/admin/login/page.tsx` (stub → formulario real + Server Action con honeypot + rate limit), nuevo `app/admin/layout.tsx` + `app/admin/page.tsx` placeholder, `lib/supabase/*` (sin cambios de firma; se cablea `updateSession`), `lib/validaciones.ts` (nuevo `loginSchema` zod, sin tocar `leadSchema`; el honeypot se valida solo en servidor, fuera del schema de credenciales), `lib/rate-limit.ts` nuevo (contador in-memory por IP+email con ventana/backoff, sin dependencias), `lib/auth.ts` nuevo (helpers `requireRole`/`getRole` server-only).
- Dependencias: requiere C-02 archivado (tabla `perfiles` + RLS + bootstrap manual del primer admin documentado en runbook C-02). Bloquea C-05 (panel de leads).
- Gobernanza CRÍTICO (CHANGES.md): orden SEQUENTIAL elegido por el usuario — C-03 primero, C-04 después, sin paralelismo.
- Sin cambios de DB ni migraciones en este change; sin secretos nuevos (R3: `service_role` nunca en cliente); toda lectura sensible/mutación vía Server Components/Actions/Route Handlers (R1).
