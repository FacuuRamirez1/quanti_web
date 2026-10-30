/**
 * Sección numerada de la Política de Privacidad — diseño Figma `/politicas`.
 *
 * Server Component puro: separador verde suave arriba, título con número
 * en verde marca (`1)`) y cuerpo con sangría respecto del título.
 */
import type { ReactNode } from "react";
import { poppins } from "@/lib/fonts";

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
    <section className={`${poppins.className} border-t border-[#689F38]/50 py-8 md:py-10 lg:py-14`}>
      <h2 className="text-2xl leading-snug font-semibold text-neutral-950 lg:px-8 lg:text-3xl">
        <span className="text-[#689F38]">{numero})</span> {titulo}
      </h2>
      <div className="mt-3 space-y-4 text-[0.9375rem] leading-relaxed font-medium text-neutral-900 sm:text-base md:mt-4 md:space-y-5 md:pl-8 lg:pr-12 lg:pl-[4.5rem]">
        {children}
      </div>
    </section>
  );
}
