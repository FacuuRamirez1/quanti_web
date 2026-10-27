import { LeadRow } from "@/lib/leads-query";
import { formatLeadDate, toLeadDateTime } from "@/lib/leads-filters";

interface LeadsTableProps {
  rows: LeadRow[];
}

const TH_CLASS = "h-14 px-6 text-left text-[15px] font-semibold whitespace-nowrap text-[#6b6d68]";
const TD_CLASS = "px-6 py-5 text-[15px] text-[#2a2c28]";

export function LeadsTable({ rows }: LeadsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <caption className="sr-only">
          Leads registrados ({rows.length} en esta página)
        </caption>
        <thead>
          <tr className="bg-[#f5f6f3]">
            <th scope="col" className={`${TH_CLASS} rounded-tl-lg`}>
              Nombre
            </th>
            <th scope="col" className={TH_CLASS}>
              Apellido
            </th>
            <th scope="col" className={TH_CLASS}>
              Email
            </th>
            <th scope="col" className={TH_CLASS}>
              Fecha
            </th>
            <th scope="col" className={TH_CLASS}>
              Versión políticas
            </th>
            <th scope="col" className={`${TH_CLASS} rounded-tr-lg`}>
              Consentimiento
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-y border-[#edefeb] hover:bg-[#fafbf9]">
              <td className={`${TD_CLASS} font-semibold text-[#1d1f1b]`}>{row.nombre}</td>
              <td className={TD_CLASS}>{row.apellido}</td>
              <td className={TD_CLASS}>{row.email}</td>
              <td className={`${TD_CLASS} whitespace-nowrap`}>
                <time dateTime={toLeadDateTime(row.created_at)}>
                  {formatLeadDate(row.created_at)}
                </time>
              </td>
              <td className={TD_CLASS}>
                {row.politicas_version ?? "Sin registro"}
              </td>
              <td className={`${TD_CLASS} whitespace-nowrap`}>
                {row.consent_at ? (
                  <time dateTime={toLeadDateTime(row.consent_at)}>
                    {formatLeadDate(row.consent_at)}
                  </time>
                ) : (
                  "Sin registro"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
