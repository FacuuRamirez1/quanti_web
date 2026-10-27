import { LeadsViewState } from "@/lib/leads-filters";

interface LeadsEmptyStateProps {
  state: LeadsViewState;
}

export function LeadsEmptyState({ state }: LeadsEmptyStateProps) {
  if (state.type === "ok") return null;

  if (state.type === "empty") {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">Todavía no hay leads registrados</h3>
        <p className="mt-2 text-slate-500">
          Cuando alguien se registre en la landing, aparecerá aquí.
        </p>
      </div>
    );
  }

  if (state.type === "no-results") {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">No hay resultados para los filtros aplicados</h3>
        <p className="mt-2 text-slate-500">
          <a
            href={state.clearUrl}
            className="text-brand-700 hover:text-brand-800 underline font-medium"
          >
            Limpiar filtros
          </a>
          {" para ver todos los leads."}
        </p>
      </div>
    );
  }

  if (state.type === "out-of-range") {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">Esta página no existe</h3>
        <p className="mt-2 text-slate-500">
          <a
            href={state.firstPageUrl}
            className="text-brand-700 hover:text-brand-800 underline font-medium"
          >
            Ir a la primera página
          </a>
        </p>
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="text-center py-12" role="alert">
        <svg
          className="mx-auto h-12 w-12 text-error-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">No pudimos cargar los leads</h3>
        <p className="mt-2 text-slate-500">
          Probá de nuevo en unos minutos. Si el problema persiste, contactá al administrador.
        </p>
      </div>
    );
  }

  return null;
}