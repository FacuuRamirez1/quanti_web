/**
 * Cliente Supabase para el BROWSER — C-01 foundation-infra.
 *
 * - Usa `@supabase/ssr` (`createBrowserClient`).
 * - Lee SOLO `NEXT_PUBLIC_*` (cero claves hardcodeadas, R3).
 * - NO importa `lib/env` a propósito: ese módulo valida claves de servidor
 *   que no existen en el browser y rompería el bundle (R1/R3).
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "[supabase/client] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Completá .env.local (ver .env.example).",
    );
  }
  return createBrowserClient(url, anonKey);
}
