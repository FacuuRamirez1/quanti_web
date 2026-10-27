import { ParsedLeadsFilters, PAGE_SIZE, buildLeadsUrl } from "@/lib/leads-filters";

interface LeadsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filters: ParsedLeadsFilters;
}

export function LeadsPagination({
  currentPage,
  totalPages,
  totalCount,
  filters,
}: LeadsPaginationProps) {
  if (totalPages <= 1 && totalCount <= PAGE_SIZE) return null;

  const buildUrl = (page: number) => buildLeadsUrl(filters, page);

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <nav
      aria-label="Paginación de leads"
      className="mt-6 flex items-center justify-center gap-4 sm:justify-end"
    >
      {/* El conteo "Mostrando N de M registros" vive en el pie de la tarjeta (page). */}
      <div className="flex flex-wrap items-center gap-2">
        {prevPage ? (
          <a
            href={buildUrl(prevPage)}
            className="px-3 py-1.5 text-sm font-medium text-[#444641] bg-white border border-[#dcddd8] rounded-lg hover:bg-[#f2f3f1] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            rel="prev"
          >
            ← Anterior
          </a>
        ) : (
          <span
            className="px-3 py-1.5 text-sm font-medium text-[#c4c6c0] border border-[#e9eae6] rounded-lg cursor-not-allowed"
            aria-disabled="true"
          >
            ← Anterior
          </span>
        )}

        <span className="px-3 py-1.5 text-sm text-[#6b6d68]" aria-current="page">
          Página {currentPage} de {totalPages}
        </span>

        {nextPage ? (
          <a
            href={buildUrl(nextPage)}
            className="px-3 py-1.5 text-sm font-medium text-[#444641] bg-white border border-[#dcddd8] rounded-lg hover:bg-[#f2f3f1] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            rel="next"
          >
            Siguiente →
          </a>
        ) : (
          <span
            className="px-3 py-1.5 text-sm font-medium text-[#c4c6c0] border border-[#e9eae6] rounded-lg cursor-not-allowed"
            aria-disabled="true"
          >
            Siguiente →
          </span>
        )}
      </div>
    </nav>
  );
}