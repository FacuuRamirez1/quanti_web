/**
 * Middleware de sesión — C-03 auth-admin-shell (reemplaza stub C-01).
 *
 * - Solo verifica SESIÓN (barato, edge): `updateSession` refresca las cookies
 *   de sesión en cada request, emitidas con `httpOnly`/`secure`/`SameSite=Lax`
 *   vía `SESSION_COOKIE_OPTIONS` (`lib/supabase/cookie-options.ts`); al copiarlas
 *   a un redirect se conservan sus atributos. `getUser()` decide la redirección
 *   (verdad server, no claims cacheados). El ROL vive en
 *   `src/app/admin/layout.tsx` vía `requireRole()` (una query a `perfiles` por
 *   render, 403 sin filtrar datos).
 * - `/admin/login` siempre pasa (nunca loop): sin sesión la deja pasar;
 *   con sesión redirige a `next` interno o `/admin`.
 * - Resto de `/admin/*` sin sesión → `/admin/login?next=<destino>`.
 * - Rutas públicas fuera de `/admin` no llegan acá (matcher).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveAdminDest } from "@/lib/admin-dest";
import { env } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

/** Copia las cookies refrescadas por updateSession a una respuesta de redirect. */
function withRefreshedCookies(
  redirect: NextResponse,
  refreshed: NextResponse,
): NextResponse {
  for (const c of refreshed.cookies.getAll()) {
    redirect.cookies.set(c.name, c.value, c);
  }
  return redirect;
}

export async function middleware(request: NextRequest) {
  // Refresca la sesión una vez por request (patrón oficial @supabase/ssr).
  const sessionResponse = await updateSession(request);

  // Verdad de identidad solo-lectura sobre las cookies del request.
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: la escritura ya la hizo updateSession.
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;

  // El login nunca exige sesión (si no, loop de redirección).
  if (pathname === "/admin/login") {
    if (!user) return sessionResponse;
    const dest = resolveAdminDest(request.nextUrl.searchParams.get("next"));
    const url = new URL(dest, request.url);
    return withRefreshedCookies(NextResponse.redirect(url), sessionResponse);
  }

  // Resto de /admin/* exige sesión.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return withRefreshedCookies(NextResponse.redirect(url), sessionResponse);
  }

  return sessionResponse;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
