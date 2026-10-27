/**
 * Server Action de login admin — C-03 auth-admin-shell.
 *
 * Orden PINeado (todo en servidor, R1):
 *  (a) Honeypot: si el señuelo llega completo → copia genérica byte-idéntica
 *      SIN llamar a Supabase Auth y SIN tocar contadores de rate limit.
 *  (b) Validación zod (`loginSchema`); errores de campo por campo.
 *  (c) Rate limit dual IP+email: bloqueado → misma copia, sin Auth.
 *  (d) `signInWithPassword` real; fallo → cuenta como fallo + misma copia;
 *      éxito → limpia contadores y redirige a destino interno o /admin.
 *
 * Los 3 rechazos usan la MISMA constante (byte-identidad garantizada) y se
 * anuncian vía `role="alert"` en el formulario.
 */
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_GENERIC_ERROR, resolveAdminDest } from "@/lib/admin-dest";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validaciones";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
} | null;

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export async function signInWithPassword(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // (a) Honeypot invisible: rechazo silencioso, sin Auth, sin rate limit.
  const trap = formData.get("website");
  if (typeof trap === "string" && trap !== "") {
    return { error: LOGIN_GENERIC_ERROR };
  }

  const next = resolveAdminDest(
    typeof formData.get("next") === "string"
      ? (formData.get("next") as string)
      : "",
  );

  // (b) Validación de credenciales (formato, no veracidad).
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: { email: flat.email ?? undefined, password: flat.password ?? undefined },
    };
  }
  const { email, password } = parsed.data;

  // (c) Rate limit server-side (sin Auth ante exceso).
  const ip = await clientIp();
  if (checkLoginRateLimit(ip, email).blocked) {
    return { error: LOGIN_GENERIC_ERROR };
  }

  // (d) Intento real contra Supabase Auth.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    recordLoginFailure(ip, email);
    return { error: LOGIN_GENERIC_ERROR };
  }

  recordLoginSuccess(ip, email);
  redirect(next);
}
