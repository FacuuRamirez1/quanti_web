/**
 * Acciones del shell admin — C-03 auth-admin-shell.
 * `signOut` cierra la sesión en el servidor (cookies) y el llamador
 * (botón cliente) completa el lado cliente con replace + refresh.
 */
"use server";

import { createClient } from "@/lib/supabase/server";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
