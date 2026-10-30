/**
 * Cliente Supabase para el SERVIDOR — C-01 foundation-infra.
 *
 * - SOLO usar en Server Components, Server Actions o Route Handlers (R1).
 * - `createClient()` (anon + cookies): lecturas con RLS.
 * - `createServiceRoleClient()` (service_role, sin cookies persistidas):
 *   SOLO para mutaciones admin puntuales desde C-02. NUNCA exponer al cliente.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { SESSION_COOKIE_OPTIONS } from "./cookie-options";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` invocado desde un Server Component: se ignora porque
            // el middleware (C-03) refresca la sesión. Patrón oficial @supabase/ssr.
          }
        },
      },
    },
  );
}

export function createServiceRoleClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Intencionalmente no-op: el service_role no persiste sesión en cookies.
        },
      },
    },
  );
}
