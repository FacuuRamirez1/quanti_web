/**
 * Módulo puro de parseo/validación de searchParams para /admin leads.
 * Sin dependencias de servidor, testeable con Vitest.
 */

export const PAGE_SIZE = 20;
export const MAX_PAGE = 1000;
export const MAX_FILTER_LENGTH = 100;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PAGE_RE = /^\d{1,4}$/;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

// --- Utilidades ---

/**
 * Escapa caracteres especiales de LIKE para que se busquen literalmente.
 * Orden: primero backslash, luego % y _.
 */
export function escapeLikePattern(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Escapa metacaracteres de regex POSIX para búsqueda literal con `imatch`.
 * Se usa solo cuando el término contiene `*`: en PostgREST `*` es comodín de
 * like/ilike y NO se puede escapar (`\*` se convierte en `\%`), verificado en vivo.
 */
export function escapeRegexLiteral(input: string): string {
  return input.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

/**
 * Normaliza un valor de searchParams: toma el primer string si es array,
 * hace trim, y devuelve undefined si no es string válido o supera longitud.
 */
function normalizeParam(value: unknown): string | undefined {
  const str = Array.isArray(value) ? value[0] : value;
  if (typeof str !== "string") return undefined;
  const trimmed = str.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_FILTER_LENGTH) return undefined;
  if (CONTROL_CHARS_RE.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Parsea y valida fecha YYYY-MM-DD a Date UTC (00:00:00.000Z de ese día).
 * Devuelve undefined si el formato es inválido o la fecha no existe.
 * El carácter inclusivo de `to` lo resuelve buildDateRange (día siguiente, exclusivo).
 */
function parseUtcDate(value: unknown): Date | undefined {
  const str = normalizeParam(value);
  if (!str) return undefined;

  const match = DATE_RE.exec(str);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1; // 0-indexed
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  // Rechaza fechas inexistentes (2026-02-30, 2026-13-01, etc.)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * Construye el rango de fechas para la query Supabase.
 * - from: gte (inclusive) al inicio del día UTC
 * - to: lt (exclusivo) al inicio del día siguiente UTC
 */
export function buildDateRange(
  from: Date | undefined,
  to: Date | undefined
): { gte: string | undefined; lt: string | undefined } {
  const gte = from ? from.toISOString() : undefined;

  let lt: string | undefined;
  if (to) {
    const nextDay = new Date(to.getTime() + MS_PER_DAY);
    lt = nextDay.toISOString();
  }

  return { gte, lt };
}

/**
 * Parsea y valida página: entero 1..MAX_PAGE, default 1.
 */
export function parsePage(value: unknown): number {
  const str = normalizeParam(value);
  if (!str) return 1;
  if (!PAGE_RE.test(str)) return 1;
  const parsed = Number(str);
  if (parsed < 1 || parsed > MAX_PAGE) return 1;
  return parsed;
}

/**
 * Calcula offset para range() de Supabase (0-indexed).
 */
export function pageOffset(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

/**
 * Calcula total de páginas (mínimo 1).
 */
export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

// --- API principal ---

export interface ParsedLeadsFilters {
  nombre: string | undefined;
  email: string | undefined;
  from: Date | undefined;
  to: Date | undefined;
  page: number;
}

/**
 * Parsea y valida searchParams de /admin para filtros de leads.
 * - nombre/email: trim, max 100 chars, case-insensitive search (ilike)
 * - from/to: YYYY-MM-DD válido, interpretado en UTC (a 00:00:00.000Z del día; `to` es
 *   el día original, buildDateRange le suma un día para el límite exclusivo)
 * - page: 1..1000, default 1
 * - Parámetros inválidos se descartan individualmente (no rompen la página)
 * - from > to descarta ambos
 */
export function parseLeadsFilters(searchParams: Record<string, unknown>): ParsedLeadsFilters {
  // Cada parámetro se normaliza de forma independiente: uno inválido no descarta a los demás.
  const nombre = normalizeParam(searchParams.nombre);
  const email = normalizeParam(searchParams.email)?.toLowerCase();
  let from = parseUtcDate(searchParams.from);
  let to = parseUtcDate(searchParams.to);

  // from > to (ambos días de calendario): se descartan ambos
  if (from && to && from > to) {
    from = undefined;
    to = undefined;
  }

  return { nombre, email, from, to, page: parsePage(searchParams.page) };
}

/**
 * Formatea fecha ISO a es-AR con zona UTC visible.
 * Devuelve "Sin registro" para null/undefined/empty.
 */
export function formatLeadDate(isoString: string | null | undefined): string {
  if (!isoString) return "Sin registro";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Sin registro";
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date) + " UTC";
  } catch {
    return "Sin registro";
  }
}

/**
 * Valor ISO UTC para el atributo `datetime` de <time>.
 * Devuelve undefined para null/undefined/vacío/inválido.
 */
export function toLeadDateTime(isoString: string | null | undefined): string | undefined {
  if (!isoString) return undefined;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * URL canónica de /admin con los filtros activos y la página pedida.
 * La página 1 omite `page`. Fechas como YYYY-MM-DD (UTC). Valores codificados.
 */
export function buildLeadsUrl(filters: ParsedLeadsFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.nombre) params.set("nombre", filters.nombre);
  if (filters.email) params.set("email", filters.email);
  if (filters.from) params.set("from", toDateParam(filters.from));
  if (filters.to) params.set("to", toDateParam(filters.to));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export type LeadsViewStateType = "empty" | "no-results" | "ok" | "out-of-range" | "error";

export interface LeadsViewStateBase {
  type: LeadsViewStateType;
  message: string;
}

export interface EmptyState extends LeadsViewStateBase {
  type: "empty";
}

export interface NoResultsState extends LeadsViewStateBase {
  type: "no-results";
  clearUrl: string;
}

export interface OkState extends LeadsViewStateBase {
  type: "ok";
}

export interface OutOfRangeState extends LeadsViewStateBase {
  type: "out-of-range";
  firstPageUrl: string;
}

export interface ErrorState extends LeadsViewStateBase {
  type: "error";
}

export type LeadsViewState = EmptyState | NoResultsState | OkState | OutOfRangeState | ErrorState;

/**
 * Resuelve el estado de la vista de leads basado en datos y filtros.
 */
export function resolveLeadsViewState(
  rows: unknown[],
  totalCount: number,
  filters: ParsedLeadsFilters,
  currentPage: number
): LeadsViewState {
  const hasFilters = !!(filters.nombre || filters.email || filters.from || filters.to);
  const totalPgs = totalPages(totalCount);

  if (totalCount === 0 && !hasFilters) {
    return { type: "empty", message: "Todavía no hay leads registrados." };
  }

  if (totalCount === 0 && hasFilters) {
    return {
      type: "no-results",
      message: "No hay resultados para los filtros aplicados.",
      clearUrl: "/admin",
    };
  }

  if (currentPage > totalPgs && totalCount > 0) {
    return {
      type: "out-of-range",
      message: "Esta página no existe.",
      firstPageUrl: buildLeadsUrl(filters, 1),
    };
  }

  return { type: "ok", message: "" };
}