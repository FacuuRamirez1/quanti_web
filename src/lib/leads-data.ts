import "server-only";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildLeadsQuery,
  toLeadsPageResult,
  LEAD_COLUMNS,
  type LeadsPageResult,
} from "@/lib/leads-query";
import { type ParsedLeadsFilters } from "@/lib/leads-filters";

// Re-export types and schemas from the pure module
export { leadRowSchema, type LeadRow, type LeadsPageResult } from "@/lib/leads-query";
export { buildLeadsQuery, toLeadsPageResult } from "@/lib/leads-query";

/** Código PostgREST de "Requested range not satisfiable" (offset > total). */
const RANGE_NOT_SATISFIABLE = "PGRST103";

/**
 * Capa de datos server-side: ejecuta la consulta real contra Supabase.
 * - Requiere rol admin/superadmin ANTES de crear el cliente o consultar
 *   (doble defensa: layout + aquí; RLS `posibles_clientes_select_admin` es la última)
 * - Usa cliente anon + cookies de sesión (RLS decide fila por fila)
 * - NO usa service_role (R3)
 * - Los filtros llegan como valores parametrizados vía `.ilike/.gte/.lt`
 *   (nunca `.or()` ni strings de filtro interpolados)
 * - Devuelve union discriminada LeadsPageResult; el error nunca expone detalles
 */
export async function getLeadsPage(filters: ParsedLeadsFilters): Promise<LeadsPageResult> {
  // Guardia de autorización antes de consultar (doble defensa)
  await requireRole(["admin", "superadmin"], "/admin");

  const supabase = await createClient();
  const descriptor = buildLeadsQuery(filters);

  const run = (range: { from: number; to: number }) => {
    let query = supabase
      .from("posibles_clientes")
      .select(LEAD_COLUMNS, { count: descriptor.count });

    for (const filter of descriptor.filters) {
      if (filter.operator === "ilike") {
        query = query.ilike(filter.column, filter.value);
      } else if (filter.operator === "imatch") {
        // Término con `*`: regex literal escapada (valor parametrizado, no string de filtro).
        query = query.filter(filter.column, "imatch", filter.value);
      } else if (filter.operator === "gte") {
        query = query.gte(filter.column, filter.value);
      } else {
        query = query.lt(filter.column, filter.value);
      }
    }

    for (const { column, ascending } of descriptor.order) {
      query = query.order(column, { ascending });
    }

    return query.range(range.from, range.to);
  };

  let { data, error, count } = await run(descriptor.range);

  if (error?.code === RANGE_NOT_SATISFIABLE) {
    // Offset mayor al total (HTTP 416): no es una falla. Se re-consulta solo para
    // obtener el total real y la vista resuelve "página fuera de rango".
    ({ data, error, count } = await run({ from: 0, to: 0 }));
    if (!error) data = [];
  }

  if (error) {
    // Solo el código (sin message/details/hint, que pueden contener valores = PII).
    console.error("[getLeadsPage] Supabase error code:", error.code);
  }

  return toLeadsPageResult({ data, error, count }, filters.page);
}
