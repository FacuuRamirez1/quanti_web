import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { LeadsPageResult, LeadRow } from "@/lib/leads-query";

// `leads-data` importa `server-only` y Supabase: se reemplaza por un doble de la capa de datos.
const getLeadsPage = vi.fn<(filters: unknown) => Promise<LeadsPageResult>>();
vi.mock("@/lib/leads-data", () => ({ getLeadsPage: (f: unknown) => getLeadsPage(f) }));

import AdminPage from "./page";

const ROW: LeadRow = {
  id: 1,
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@test.com",
  acepta_politicas: true,
  politicas_version: "v1.0",
  consent_at: "2026-10-15T14:30:00+00:00",
  created_at: "2026-10-15T14:30:00+00:00",
};

async function render(params: Record<string, string> = {}): Promise<string> {
  const element = await AdminPage({ searchParams: Promise.resolve(params) });
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  getLeadsPage.mockReset();
});

describe("AdminPage — cableado de estados (4.11)", () => {
  it("{status:'error'} -> aviso genérico role=alert, sin tabla ni estado vacío, formulario disponible", async () => {
    getLeadsPage.mockResolvedValue({ status: "error" });
    const html = await render();
    expect(html).toContain('role="alert"');
    expect(html).toContain("No pudimos cargar los leads");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("Todavía no hay leads");
    expect(html).toMatch(/<form[^>]*action="\/admin"/);
  });

  it("sin leads y sin filtros -> estado vacío", async () => {
    getLeadsPage.mockResolvedValue({ status: "ok", rows: [], total: 0, totalPages: 1, currentPage: 1 });
    const html = await render();
    expect(html).toContain("Todavía no hay leads registrados");
    expect(html).not.toContain("<table");
    expect(html).not.toContain('role="alert"');
  });

  it("sin resultados con filtros -> 'sin resultados' distinto del vacío", async () => {
    getLeadsPage.mockResolvedValue({ status: "ok", rows: [], total: 0, totalPages: 1, currentPage: 1 });
    const html = await render({ nombre: "zzz" });
    expect(html).toContain("No hay resultados para los filtros aplicados");
    expect(html).not.toContain("Todavía no hay leads");
  });

  it("ok -> tabla con la fila y total; pasa los filtros parseados a la capa de datos", async () => {
    getLeadsPage.mockResolvedValue({ status: "ok", rows: [ROW], total: 1, totalPages: 1, currentPage: 1 });
    const html = await render({ nombre: " Ana ", page: "abc" });
    expect(html).toContain("<table");
    expect(html).toContain("ana@test.com");
    expect(getLeadsPage).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Ana", page: 1, email: undefined, from: undefined, to: undefined }),
    );
  });

  it("página fuera de rango con filtros -> enlace a la 1 que preserva filtros (sin page)", async () => {
    getLeadsPage.mockResolvedValue({ status: "ok", rows: [], total: 45, totalPages: 3, currentPage: 9 });
    const html = await render({ nombre: "lead", from: "2026-09-30", page: "9" });
    expect(html).toContain("Esta página no existe");
    expect(html).toContain('href="/admin?nombre=lead&amp;from=2026-09-30"');
    expect(html).not.toContain("<table");
  });

  it("page inválida no redirige ni rompe: se consulta la página 1", async () => {
    getLeadsPage.mockResolvedValue({ status: "ok", rows: [ROW], total: 1, totalPages: 1, currentPage: 1 });
    for (const bad of ["0", "-3", "abc", "1.5", "1001"]) {
      await render({ page: bad });
      expect(getLeadsPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    }
  });
});
