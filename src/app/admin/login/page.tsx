import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FooterNegro } from "@/components/footer-negro";
import { resolveAdminDest } from "@/lib/admin-dest";
import { getRole } from "@/lib/auth";
import { poppins } from "@/lib/fonts";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso de administración — Quanti",
  description: "Acceso restringido a la administración del sitio Quanti.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const dest = resolveAdminDest(params.next);

  // Sesión válida con rol suficiente: salta el formulario.
  const role = await getRole();
  if (role) redirect(dest);

  return (
    <div className={`${poppins.className} flex min-h-dvh flex-col bg-black`}>
      <section
        aria-labelledby="titulo-login"
        className="relative isolate flex flex-1 flex-col items-center overflow-hidden px-4 pb-12 text-white"
      >
        {/* Fondo decorativo: invernadero + velo oscuro. */}
        <Image
          src="/Login-bg.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/55" />

        <h1 id="titulo-login" className="sr-only">
          Acceso de administración
        </h1>

        <Image
          src="/quanti-logo.png"
          alt="Logotipo de Quanti — Vegetales Hidropónicos"
          width={1254}
          height={565}
          sizes="(max-width: 640px) 220px, 280px"
          className="mt-9 h-auto w-55 object-contain sm:w-70"
        />

        <div className="mt-16 w-full max-w-142.5 rounded-2xl bg-white/15 px-6 pt-5 pb-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:mt-25 sm:px-9">
          <h2 className="text-center text-sm font-medium text-white">
            Iniciar Sesión
          </h2>
          <div className="mt-4">
            <LoginForm next={dest} />
          </div>
        </div>
      </section>

      <FooterNegro compact />
    </div>
  );
}
