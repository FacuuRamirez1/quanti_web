import { getLeadsPage } from "@/lib/leads-data";
import { parseLeadsFilters, resolveLeadsViewState } from "@/lib/leads-filters";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { LeadsFilters } from "@/components/admin/LeadsFilters";
import { LeadsPagination } from "@/components/admin/LeadsPagination";
import { LeadsEmptyState } from "@/components/admin/LeadsEmptyState";
import { LeadsSkeleton } from "@/components/admin/LeadsSkeleton";
import { Suspense } from "react";
import { CircleCheck, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

interface AdminPageProps {
  searchParams: Promise<{
    nombre?: string;
    email?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  // Parse and validate filters (page inválida => 1, vía parsePage dentro de parseLeadsFilters)
  const filters = parseLeadsFilters(params);

  // Fetch leads data (server-side with auth guard)
  const result = await getLeadsPage(filters);

  // Resolve view state
  const viewState = resolveLeadsViewState(
    result.status === "ok" ? result.rows : [],
    result.status === "ok" ? result.total : 0,
    filters,
    filters.page
  );

  // Override with error state if data fetch failed
  const finalState = result.status === "error" ? { type: "error" as const, message: "" } : viewState;

  // Extract data for ok state (type-safe after finalState check)
  const rows = result.status === "ok" ? result.rows : [];
  const total = result.status === "ok" ? result.total : 0;
  const currentPage = result.status === "ok" ? result.currentPage : 1;
  const totalPages = result.status === "ok" ? result.totalPages : 1;

  return (
    <section aria-labelledby="titulo-admin">
      <header>
        <nav aria-label="Ruta de navegación">
          <ol className="flex items-center gap-1.5 text-base text-[#6b6d68]">
            <li>Administración</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Clientes</li>
          </ol>
        </nav>
        <h1 id="titulo-admin" className="mt-3 text-3xl font-bold tracking-tight text-[#1d1f1b] sm:text-[40px] sm:leading-tight">
          Posibles clientes
        </h1>
        <p className="mt-1 text-[17px] text-[#6b6d68]">
          Gestioná los contactos interesados en Quanti.
        </p>
      </header>

      <div className="mt-7 grid gap-[22px] md:grid-cols-2">
        <AdminStatCard
          title="Total de registros"
          value={result.status === "ok" ? result.total : "—"}
          caption="Posibles clientes registrados"
          icon={<Users className="h-8 w-8" strokeWidth={1.75} />}
        />
        <AdminStatCard
          title="Estado del panel"
          value="Activo"
          valueClassName="text-[#548523] text-[34px] font-semibold"
          caption="Gestión de contactos"
          icon={<CircleCheck className="h-6 w-6" strokeWidth={2} />}
        />
      </div>

      <div className="mt-[30px] rounded-2xl border border-[#e9eae6] bg-white px-4 pt-5 pb-8 sm:px-[26px]">
        {/* Filters form (GET, server-side) con el encabezado de la tarjeta */}
        <LeadsFilters filters={filters}>
          <div className="sm:pl-1 sm:pt-3">
            <h2 className="text-[26px] font-bold tracking-tight text-[#1d1f1b]">
              Listado de clientes
            </h2>
            <p className="mt-1 text-base text-[#6b6d68]">
              Datos recibidos desde el formulario web.
            </p>
          </div>
        </LeadsFilters>

        {/* Results */}
        <div className="mt-8">
          <Suspense fallback={<LeadsSkeleton />}>
            {finalState.type !== "ok" ? (
              <LeadsEmptyState state={finalState} />
            ) : (
              <>
                <LeadsTable rows={rows} />
                <LeadsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={total}
                  filters={filters}
                />
              </>
            )}
          </Suspense>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 px-1 text-[15px] sm:pr-8">
          <p className="text-[#6b6d68]">
            {finalState.type === "ok"
              ? `Mostrando ${rows.length} de ${total} registros`
              : null}
          </p>
          <p className="font-semibold text-[#548523]">Quanti · Admin</p>
        </div>
      </div>
    </section>
  );
}
