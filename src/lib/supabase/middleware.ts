/**
 * Helper de sesión para middleware — C-01 foundation-infra.
 *
 * Patrón oficial `@supabase/ssr` (`updateSession`): refresca la sesión una vez
 * por request y devuelve la respuesta con las cookies actualizadas.
 *
 * ⚠️ NO se usa todavía: el `middleware.ts` raíz es un STUB en C-01 (denegar por
 * defecto hacia `/admin/login`). C-03 cablea este helper + chequeo de rol
 * manteniendo el matcher y las rutas. No borrar.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";
import { SESSION_COOKIE_OPTIONS } from "./cookie-options";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No agregar código entre createServerClient y getClaims: un error acá
  // desloguea usuarios aleatoriamente (advertencia oficial @supabase/ssr).
  await supabase.auth.getClaims();

  return supabaseResponse;
}
