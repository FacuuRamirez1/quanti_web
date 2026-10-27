import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { ParsedLeadsFilters } from "@/lib/leads-filters";

interface LeadsFiltersProps {
  filters: ParsedLeadsFilters;
  /** Encabezado opcional a la izquierda del buscador (título de la tarjeta). */
  children?: ReactNode;
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#dcddd8] bg-white px-3 text-sm text-[#1d1f1b] placeholder:text-[#8a8c87] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent";

const LABEL_CLASS = "mb-1 block text-xs font-medium text-[#6b6d68]";

export function LeadsFilters({ filters, children }: LeadsFiltersProps) {
  const hasFilters = !!(filters.nombre || filters.email || filters.from || filters.to);

  return (
    <form method="GET" action="/admin" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {children ? <div>{children}</div> : null}

        <div className="relative w-full md:w-[354px] md:shrink-0">
          <label htmlFor="filter-nombre" className="sr-only">
            Nombre
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#6b6d68]"
            strokeWidth={1.75}
          />
          <input
            type="text"
            id="filter-nombre"
            name="nombre"
            defaultValue={filters.nombre ?? ""}
            placeholder="Buscar clientes..."
            className="h-[50px] w-full rounded-lg border border-[#dcddd8] bg-white pr-3 pl-10 text-[15px] text-[#1d1f1b] placeholder:text-[#8a8c87] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent"
            maxLength={100}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <label htmlFor="filter-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            type="text"
            inputMode="email"
            id="filter-email"
            name="email"
            defaultValue={filters.email ?? ""}
            placeholder="Buscar por email..."
            className={INPUT_CLASS}
            maxLength={100}
          />
        </div>

        <div className="w-[calc(50%-0.375rem)] sm:w-40">
          <label htmlFor="filter-from" className={LABEL_CLASS}>
            Desde
          </label>
          <input
            type="date"
            id="filter-from"
            name="from"
            defaultValue={filters.from ? filters.from.toISOString().split("T")[0] : ""}
            className={INPUT_CLASS}
          />
        </div>

        <div className="w-[calc(50%-0.375rem)] sm:w-40">
          <label htmlFor="filter-to" className={LABEL_CLASS}>
            Hasta
          </label>
          <input
            type="date"
            id="filter-to"
            name="to"
            defaultValue={filters.to ? filters.to.toISOString().split("T")[0] : ""}
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="submit"
          className="h-10 rounded-lg bg-[#548523] px-5 text-sm font-medium text-white hover:bg-[#456f1c] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Filtrar
        </button>

        {hasFilters && (
          <a
            href="/admin"
            className="inline-flex h-10 items-center rounded-lg border border-[#dcddd8] px-4 text-sm font-medium text-[#444641] hover:bg-[#f2f3f1] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Limpiar filtros
          </a>
        )}
      </div>
    </form>
  );
}
