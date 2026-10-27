/**
 * Tarjeta de métrica del panel admin — diseño Figma `/admin`.
 * Título + ícono (arriba), valor destacado y leyenda.
 */
import type { ReactNode } from "react";

export function AdminStatCard({
  title,
  value,
  caption,
  icon,
  valueClassName = "text-[#1d1f1b]",
}: {
  title: string;
  value: ReactNode;
  caption: string;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e9eae6] bg-white px-[26px] pt-5 pb-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="pt-1 text-[17px] text-[#444641]">{title}</h2>
        <span aria-hidden="true" className="text-[#5b8f27]">
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-[40px] leading-none font-bold ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-6 text-[15px] text-[#6b6d68]">{caption}</p>
    </div>
  );
}
