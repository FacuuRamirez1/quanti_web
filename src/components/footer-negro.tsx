/**
 * Footer negro compartido de rutas públicas — spec "Landing Próximamente" §C.
 *
 * Server Component puro (R1): texto centrado + enlace discreto "Admin" → `/admin`
 * (criterio C-03 3.4; el middleware redirige a `/admin/login` sin sesión).
 * Sin precios (R4), sin WhatsApp (R7); hover solo opacity/underline (R8).
 */
import Link from "next/link";

/** `compact`: franja fina (diseño del login admin). */
export function FooterNegro({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="bg-black text-white">
      <p
        className={`mx-auto w-full max-w-7xl px-4 text-center text-sm sm:px-6 lg:px-8 ${
          compact ? "py-2 text-white" : "py-6 text-white/80"
        }`}
      >
        ® 2026 Quanti. Todos los derechos reservados.
      </p>
    </footer>
  );
}
