import { z } from "zod";
import {
  type ParsedLeadsFilters,
  PAGE_SIZE,
  escapeLikePattern,
  escapeRegexLiteral,
  buildDateRange,
  pageOffset,
  totalPages,
} from "@/lib/leads-filters";

/**
 * Módulo PURO de descriptores de query y mapeo de resultados.
 * Sin dependencias de servidor, testeable con Vitest.
 * NO usa 'server-only', NO importa Supabase, NO usa createClient.
 */

// --- Tipos de salida ---

/**
 * Fila de lead validada y normalizada para la vista.
 * Coincide con la tabla `posibles_clientes` (C-02).
 */
export const leadRowSchema = z.object({
  id: z.number().int(), // BIGINT identity (C-02); PostgREST lo serializa como number
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  acepta_politicas: z.boolean(),
  politicas_version: z.string().nullable(),
  consent_at: z.string().nullable(),
  created_at: z.string().datetime({ offset: true }), // ISO 8601 con timezone
});

export type LeadRow = z.infer<typeof leadRowSchema>;

/** Columnas explícitas del SELECT (nunca `*`): mínimo dato necesario, alineado al schema. */
export const LEAD_COLUMNS =
  "id,nombre,apellido,email,acepta_politicas,politicas_version,consent_at,created_at";

/**
 * Resultado de la consulta paginada de leads.
 * Union discriminada para manejo explícito de error.
 */
export type LeadsPageResult =
  | { status: "ok"; rows: LeadRow[]; total: number; totalPages: number; currentPage: number }
  | { status: "error" };

/**
 * Descriptor puro de la query de Supabase.
 * No ejecuta nada; solo describe qué se va a consultar.
 * Útil para tests unitarios sin necesidad de DB.
 */
export interface LeadsQueryDescriptor {
  filters: Array<{
    column: string;
    operator: "ilike" | "imatch" | "gte" | "lt";
    value: string;
  }>;
  /** Orden total: created_at DESC y desempate estable id DESC. */
  order: Array<{ column: string; ascending: boolean }>;
  range: { from: number; to: number };
  count: "exact";
}

/**
 * Filtro de texto "contiene", case-insensitive y literal.
 * PostgREST convierte `*` en `%` en like/ilike sin posibilidad de escape
 * (verificado en vivo, design.md §3): si el término trae `*` se usa `imatch`
 * (regex POSIX) con el término escapado; si no, `ilike` con `%`/`_`/`\` escapados.
 */
function buildTextFilter(
  column: string,
  term: string,
): LeadsQueryDescriptor["filters"][number] {
  if (term.includes("*")) {
    return { column, operator: "imatch", value: escapeRegexLiteral(term) };
  }
  return { column, operator: "ilike", value: `%${escapeLikePattern(term)}%` };
}

/**
 * Construye el descriptor de query pura a partir de filtros parseados.
 * No toca Supabase; solo transforma filtros a descriptores.
 */
export function buildLeadsQuery(filters: ParsedLeadsFilters): LeadsQueryDescriptor {
  const queryFilters: LeadsQueryDescriptor["filters"] = [];

  // Filtros nombre/email: búsqueda parcial case-insensitive literal
  for (const [column, term] of [
    ["nombre", filters.nombre],
    ["email", filters.email],
  ] as const) {
    if (term) queryFilters.push(buildTextFilter(column, term));
  }

  // Rango de fechas: buildDateRange es el único que calcula lt (día siguiente a `to`)
  const { gte, lt } = buildDateRange(filters.from, filters.to);
  if (gte) {
    queryFilters.push({
      column: "created_at",
      operator: "gte",
      value: gte,
    });
  }
  if (lt) {
    queryFilters.push({
      column: "created_at",
      operator: "lt",
      value: lt,
    });
  }

  const offset = pageOffset(filters.page);

  return {
    filters: queryFilters,
    order: [
      { column: "created_at", ascending: false },
      { column: "id", ascending: false },
    ],
    range: { from: offset, to: offset + PAGE_SIZE - 1 },
    count: "exact",
  };
}

/**
 * Respuesta cruda de supabase-js ya resuelta (forma mínima que usamos).
 */
export interface SupabaseListResponse {
  data: unknown;
  error: unknown;
  count: number | null;
}

/**
 * Mapea la respuesta de Supabase a LeadsPageResult (union discriminada).
 * - `error` truthy -> {status:'error'} SIN propagar code/message/details/hint.
 * - Valida cada fila con leadRowSchema; una fila inválida -> error completo
 *   (no se omiten filas en silencio; design.md §6).
 * - Función pura: no loguea (el logging sin PII vive en leads-data.ts).
 */
export function toLeadsPageResult(
  response: SupabaseListResponse,
  currentPage: number
): LeadsPageResult {
  if (response.error) {
    return { status: "error" };
  }

  const data = response.data ?? [];
  if (!Array.isArray(data)) {
    return { status: "error" };
  }

  const validatedRows: LeadRow[] = [];
  for (const row of data) {
    const parsed = leadRowSchema.safeParse(row);
    if (!parsed.success) {
      return { status: "error" };
    }
    validatedRows.push(parsed.data);
  }

  const total = response.count ?? 0;
  return {
    status: "ok",
    rows: validatedRows,
    total,
    totalPages: totalPages(total),
    currentPage,
  };
}
