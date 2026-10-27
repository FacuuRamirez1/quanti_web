/**
 * Barra superior del panel admin — diseño Figma `/admin`.
 *
 * Server Component: isologo + "Panel de gestión" a la izquierda; a la
 * derecha avatar, rol legible y debajo el slot `actions` (cierre de sesión).
 */
import type { ReactNode } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import type { AdminRole } from "@/lib/auth";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Administrador",
  superadmin: "Superadministrador",
};

export function AdminHeader({
  role,
  actions,
}: {
  role: AdminRole;
  actions?: ReactNode;
}) {
  return (
    <header className="flex min-h-[102px] items-center justify-between gap-4 border-b border-[#eeefeb] bg-white px-4 py-4 sm:px-9">
      <div className="flex items-center gap-2.5">
        <Image
          src="/quanti-icono.png"
          alt=""
          width={197}
          height={197}
          sizes="52px"
          priority
          className="h-11 w-11 shrink-0 sm:h-13 sm:w-13"
        />
        <div className="leading-none">
          <p className="text-2xl font-semibold tracking-tight text-[#1d1f1b] sm:text-[33px]">
            Quanti
          </p>
          <p className="mt-1 text-xs text-[#6b6d68] sm:text-[13px]">
            Panel de gestión
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2f3f1] text-[#3a3c37]"
        >
          <User className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <p className="text-base font-semibold text-[#1d1f1b]">
            {ROLE_LABEL[role]}
          </p>
          {actions ? <div className="mt-1">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
