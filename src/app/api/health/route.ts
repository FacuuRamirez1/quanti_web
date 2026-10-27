/**
 * Health check mínimo — C-01 foundation-infra.
 *
 * - Responde 200 + `{ "status": "ok" }` sin auth (spec: health-check-mínimo).
 * - A propósito NO importa `lib/env` ni clientes Supabase: debe responder
 *   incluso sin variables configuradas.
 */
export async function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
