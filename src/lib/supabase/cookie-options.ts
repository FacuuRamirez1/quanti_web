/**
 * Opciones de las cookies de sesión Supabase — C-03 auth-admin-shell.
 *
 * `@supabase/ssr` emite las cookies con `httpOnly: false` por default (pensado
 * para que el cliente browser lea la sesión). Este repo NO usa el cliente
 * browser para la sesión (R1: todo vía servidor), así que se fuerzan
 * `httpOnly` (no legibles por JS ante un XSS) y `secure` (solo HTTPS;
 * `localhost` cuenta como contexto seguro en los navegadores modernos).
 * `@supabase/ssr` mezcla estas opciones en cada cookie que pasa a `setAll`.
 */
import type { CookieOptionsWithName } from "@supabase/ssr";

export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
};
