/**
 * Server Action de captura de leads — C-04 landing-captura-politicas.
 *
 * Orden PINeado (espejo de `signInWithPassword` de C-03; todo en servidor, R1):
 *  (a) Honeypot: si el señuelo llega completo → MISMO éxito aparente que un
 *      envío válido (locked decision 4), SIN INSERT, SIN sesión, SIN tocar
 *      contadores de rate limit.
 *  (b) Validación zod con el `leadSchema` COMPARTIDO de `lib/validaciones.ts`
 *      (owned by C-02 — NUNCA redefinido); incluye `acepta_politicas === true`
 *      (el bypass del cliente se rechaza acá; la DB lo rechazaría por CHECK).
 *      Errores por campo, sin guardar nada.
 *  (c) Rate limit dual IP+email de leads (`lib/rate-limit.ts`): bloqueado →
 *      error genérico con reintento, sin INSERT.
 *  (d) INSERT con cliente servidor anon (RLS `WITH CHECK` como última
 *      defensa) + `politicas_version` + `consent_at`. Duplicado `23505`
 *      (incl. case-insensitive por índice `lower(email)`, RN-LEAD-05) →
 *      aviso amable SIN crear ni modificar (sin SELECT previo: evita TOCTOU).
 *      Caída de Supabase → error genérico con reintento, sin exponer detalles.
 */
"use server";

import { headers } from "next/headers";
import {
  LEAD_DUPLICATE_MESSAGE,
  LEAD_GENERIC_ERROR,
  LEAD_SUCCESS_MESSAGE,
} from "@/lib/leads-copy";
import { POLITICAS_VERSION } from "@/lib/politicas";
import { checkLeadRateLimit, recordLeadAttempt } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/validaciones";

export type LeadState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: {
    nombre?: string[];
    apellido?: string[];
    email?: string[];
    acepta_politicas?: string[];
  };
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

export async function registrarLead(
  _prevState: LeadState,
  formData: FormData,
): Promise<LeadState> {
  // (a) Honeypot invisible: éxito simulado, sin INSERT, sin rate limit.
  const trap = formData.get("website");
  if (typeof trap === "string" && trap !== "") {
    return { ok: true, message: LEAD_SUCCESS_MESSAGE };
  }

  // (b) Re-validación en servidor con el schema compartido (R2).
  // El checkbox llega como "on"/ausente: se mapea a boolean antes de parsear.
  const parsed = leadSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    apellido: String(formData.get("apellido") ?? ""),
    email: String(formData.get("email") ?? ""),
    acepta_politicas: formData.get("acepta_politicas") === "on",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        nombre: flat.nombre ?? undefined,
        apellido: flat.apellido ?? undefined,
        email: flat.email ?? undefined,
        acepta_politicas: flat.acepta_politicas ?? undefined,
      },
    };
  }
  const { nombre, apellido, email } = parsed.data;

  // (c) Rate limit server-side (sin INSERT ante exceso).
  const ip = await clientIp();
  if (checkLeadRateLimit(ip, email).blocked) {
    return { message: LEAD_GENERIC_ERROR };
  }
  recordLeadAttempt(ip, email);

  // (d) INSERT anon validado (RLS + CHECK como última defensa).
  const supabase = await createClient();
  const { error } = await supabase.from("posibles_clientes").insert({
    nombre,
    apellido,
    email,
    acepta_politicas: true,
    politicas_version: POLITICAS_VERSION,
    consent_at: new Date().toISOString(),
  });

  if (error) {
    // Duplicado exacto o case-insensitive (índice lower(email)): aviso
    // amable sin crear ni modificar. Sin SELECT previo (sin TOCTOU).
    if (error.code === "23505") {
      return { ok: true, message: LEAD_DUPLICATE_MESSAGE };
    }
    return { message: LEAD_GENERIC_ERROR };
  }

  return { ok: true, message: LEAD_SUCCESS_MESSAGE };
}
