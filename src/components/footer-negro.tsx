/**
 * Footer negro compartido de rutas públicas — spec "Landing Próximamente" §C.
 *
 * Server Component puro (R1): solo texto centrado de derechos reservados.
 * Sin enlace al admin por ahora (el acceso es directo por `/admin/login`).
 * Sin precios (R4), sin WhatsApp (R7).
 */

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
