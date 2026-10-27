/**
 * Helpers de autorización server-only — C-03 auth-admin-shell.
 *
 * - Única fuente de rol: tabla `perfiles` (decisión C-02/DD-09).
 * - NUNCA `user_metadata` (editable por el usuario, prohibido por skill
 *   `supabase` y spec C-02) ni `service_role` (anon + RLS alcanza: la policy
 *   `perfiles_select_own` permite leer la propia fila).
 * - SOLO importar desde Server Components, Server Actions o Route Handlers
 *   (R1). El `import 'server-only'` hace fallar el build si un Client
 *   Component lo referencia.
 */
import "server-only";

import { forbidden } from "next/navigation";
import { createClient } from "./supabase/server";

export type AdminRole = "admin" | "superadmin";

const ALLOWED_ROLES: readonly AdminRole[] = ["admin", "superadmin"];

function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "superadmin";
}

/**
 * Lee la sesión y resuelve el rol desde `perfiles`.
 * Retorna `null` ante: sin sesión, sin fila en `perfiles`, rol distinto o
 * error de query (fail-closed). Nunca lanza por ausencia de rol.
 */
export async function getRole(): Promise<AdminRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select("role")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  if (!isAdminRole(data.role)) return null;
  return data.role;
}

/**
 * Exige uno de los roles permitidos (por defecto admin/superadmin).
 * Ante rol insuficiente responde 403 vía `forbidden()` (Next 15) sin
 * renderizar contenido admin, tras registrar un aviso interno en servidor
 * con `uid` + ruta (sin PII: sin email, sin tokens).
 */
export async function requireRole(
  allowed: readonly AdminRole[] = ALLOWED_ROLES,
  route = "/admin",
): Promise<AdminRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn(`[auth] 403 sin sesión en ${route}`);
    forbidden();
  }

  const { data, error } = await supabase
    .from("perfiles")
    .select("role")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  const role = !error && data && isAdminRole(data.role) ? data.role : null;

  if (!role || !allowed.includes(role)) {
    // Aviso interno: uid + ruta únicamente (RN-AU, sin PII en logs).
    console.warn(`[auth] 403 rol insuficiente uid=${user.id} ruta=${route}`);
    forbidden();
  }

  return role;
}
