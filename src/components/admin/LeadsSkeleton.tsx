export function LeadsSkeleton() {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Cargando leads">
      <table className="w-full" role="table">
        <caption className="sr-only">Leads registrados (cargando...)</caption>
        <thead>
          <tr className="bg-[#f5f6f3]">
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </th>
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </th>
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </th>
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            </th>
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            </th>
            <th scope="col" className="px-4 py-3">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edefeb]">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}