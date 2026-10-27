/**
 * Sección numerada de la Política de Privacidad — diseño Figma `/politicas`.
 *
 * Server Component puro: separador verde suave arriba, título con número
 * en verde marca (`1)`) y cuerpo con sangría respecto del título.
 */
import type { ReactNode } from "react";

export function PoliticaSeccion({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[#689F38]/50 py-10 md:py-14">
      <h2 className="text-2xl font-semibold text-neutral-950 md:px-8 md:text-3xl">
        <span className="text-[#689F38]">{numero})</span> {titulo}
      </h2>
      <div className="mt-4 space-y-5 text-sm leading-relaxed font-medium text-neutral-900 md:mt-5 md:pr-12 md:pl-[4.5rem] md:text-base">
        {children}
      </div>
    </section>
  );
}
