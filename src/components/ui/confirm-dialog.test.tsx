import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmDialog } from "./confirm-dialog";

const noop = () => {};

function render(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  return renderToStaticMarkup(
    <ConfirmDialog
      open={false}
      title="¿Cerrar sesión?"
      description="Vas a salir del panel de administración."
      confirmLabel="Cerrar sesión"
      onConfirm={noop}
      onCancel={noop}
      {...props}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("renderiza un <dialog> nombrado por su título y descripto por su texto", () => {
    const html = render();
    const labelledby = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/)?.[1];
    const describedby = html.match(/<dialog[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();
    expect(html).toMatch(new RegExp(`<h2[^>]*id="${labelledby}"[^>]*>¿Cerrar sesión\\?</h2>`));
    expect(html).toMatch(
      new RegExp(`<p[^>]*id="${describedby}"[^>]*>Vas a salir del panel de administración\\.</p>`),
    );
  });

  it("ofrece Cancelar (por defecto) y la acción confirmatoria como botones type=button", () => {
    const html = render({ cancelLabel: "Volver" });
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Volver<\/button>/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Cerrar sesión<\/button>/);
    expect(render()).toMatch(/>Cancelar<\/button>/);
  });

  it("pending: ambos botones deshabilitados y el confirmatorio muestra el spinner", () => {
    const html = render({ pending: true });
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2);
    expect(html).toContain('aria-busy="true"');
  });

  it("R8: sin transiciones de color/all en el diálogo", () => {
    const html = render();
    expect(html).not.toMatch(/\btransition-(all|\[)/);
  });
});
