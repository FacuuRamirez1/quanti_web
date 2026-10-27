/**
 * Menú lateral del panel admin — diseño Figma `/admin`.
 *
 * "Posibles clientes" es la única sección existente (`/admin`, activa).
 * "Dashboard" figura en el diseño pero aún no tiene ruta: se muestra como
 * ítem no interactivo (sin enlace a una página inexistente).
 */
import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

export function AdminSidebar() {
  return (
    <aside className="border-b border-[#e4e6e0] bg-white px-4 py-4 lg:w-[262px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-[18px] lg:py-10">
      <nav aria-label="Menú de administración">
        <p className="hidden px-4 text-[13px] font-semibold tracking-wide text-[#73756f] lg:block">
          MENÚ
        </p>
        <ul className="flex gap-2 lg:mt-6 lg:flex-col lg:gap-3">
          <li>
            <span
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-lg text-[#2a2c28]"
            >
              <LayoutDashboard aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              Dashboard
              <span className="sr-only">(próximamente)</span>
            </span>
          </li>
          <li>
            <Link
              href="/admin"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-[#eaf1e3] px-4 py-2 text-lg leading-tight font-semibold text-[#4f7f22]"
            >
              <Users aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={1.75} />
              <span className="lg:max-w-[5.5rem]">Posibles clientes</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
