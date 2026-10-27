/**
 * Contrato de variables de entorno — C-01 foundation-infra.
 *
 * - Valida con zod y falla RÁPIDO en arranque nombrando la variable faltante.
 * - Las 6 variables viven en `.env.example` (placeholders) y los valores reales
 *   solo en `.env.local` (gitignored, R3) o en envs Vercel desde C-05.
 * - ⚠️ SOLO importar desde código de SERVIDOR (Server Components, Server
 *   Actions, Route Handlers, middleware). NUNCA desde Client Components:
 *   este módulo menciona `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY`
 *   y el cliente browser (`lib/supabase/client.ts`) NO lo importa (R1/R3).
 */
import { z } from "zod";

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CONTACTO_DESTINO",
  "RESEND_REMITENTE",
] as const;

for (const key of REQUIRED_VARS) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Falta la variable de entorno requerida: ${key}. ` +
        `Copiá ".env.example" a ".env.local" y completá el valor ` +
        `(Supabase Dashboard → Project Settings → API para el trío Supabase; ` +
        `el trío Resend/CONTACTO se verifica en C-09).`,
    );
  }
}

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL no puede estar vacía")
    .refine((v) => v.startsWith("https://"), {
      message:
        "NEXT_PUBLIC_SUPABASE_URL debe ser una URL https (ej. https://xyz.supabase.co)",
    }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY no puede estar vacía"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY no puede estar vacía"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY no puede estar vacía"),
  CONTACTO_DESTINO: z.string().email("CONTACTO_DESTINO debe ser un email válido"),
  RESEND_REMITENTE: z.string().email("RESEND_REMITENTE debe ser un email válido"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
