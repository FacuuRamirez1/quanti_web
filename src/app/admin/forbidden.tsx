/**
 * Página 403 del segmento /admin — C-03 auth-admin-shell.
 * La renderiza `forbidden()` (Next 15) ante sesión sin rol suficiente.
 * Sin contenido admin, sin PII, sin detalles internos.
 */
export default function AdminForbidden() {
  return (
    <section aria-labelledby="titulo-403">
      <h1 id="titulo-403">Acceso denegado</h1>
      <p>No tenés permiso para ver esta sección.</p>
    </section>
  );
}
