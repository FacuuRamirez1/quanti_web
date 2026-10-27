/**
 * Shell admin — C-03 auth-admin-shell, maquetado según diseño Figma `/admin`.
 * Verifica sesión + rol EN SERVIDOR (R1) antes de renderizar: sin rol
 * suficiente `requireRole()` responde 403 sin contenido admin.
 *
 * Vive en el grupo `(panel)` para NO envolver a `/admin/login` (ruta pública
 * según spec: "El layout y las páginas bajo `/admin` (excepto login) SHALL
 * verificar sesión + rol"). Los grupos de ruta no alteran la URL.
 *
 * El layout raíz ya provee `<main id="contenido">`: acá se usa `div` para no
 * anidar landmarks `main`.
 */
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await requireRole(["admin", "superadmin"], "/admin");

  return (
    <div className="flex min-h-dvh flex-col bg-[#f2f3f1]">
      <AdminHeader
        role={role}
        actions={
          <LogoutButton className="h-auto rounded-md border-[#c4c6c0] px-1.5 py-0 text-sm font-normal text-[#6b6d68] shadow-none" />
        }
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-[50px] lg:pt-9 lg:pb-[60px]">
          {children}
        </div>
      </div>
      <footer className="bg-[#181a16] px-4 py-[23px] text-center text-[15px] leading-[22px] text-white">
        © 2026 Quanti. Todos los derechos reservados.
      </footer>
    </div>
  );
}
