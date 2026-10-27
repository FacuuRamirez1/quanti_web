/**
 * Destino post-login seguro — C-03 auth-admin-shell.
 *
 * Módulo PURO y edge-safe (sin `server-only`, sin imports de servidor):
 * lo usan `middleware.ts` (edge), la página de login y su Server Action.
 * Solo acepta rutas internas bajo `/admin`; cualquier otro valor (incluido
 * `/admin/login` para evitar loops) colapsa a `/admin` (anti open-redirect).
 */
export function resolveAdminDest(value: string | null | undefined): string {
  if (!value) return "/admin";
  if (!value.startsWith("/")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  if (
    value === "/admin/login" ||
    value.startsWith("/admin/login?") ||
    value.startsWith("/admin/login/")
  ) {
    return "/admin";
  }
  if (value !== "/admin" && !value.startsWith("/admin/")) return "/admin";
  return value;
}

/** Copia byte-idéntica pineada del error genérico del login (los 3 casos). */
export const LOGIN_GENERIC_ERROR =
  "Credenciales inválidas o cuenta no encontrada.";
