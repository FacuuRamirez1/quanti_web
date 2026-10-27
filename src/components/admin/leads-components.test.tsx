import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadsEmptyState } from "./LeadsEmptyState";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsSkeleton } from "./LeadsSkeleton";
import { LeadsTable } from "./LeadsTable";
import { LeadsPagination } from "./LeadsPagination";
import type { LeadRow } from "@/lib/leads-query";
import type { ParsedLeadsFilters } from "@/lib/leads-filters";

const NO_FILTERS: ParsedLeadsFilters = {
  nombre: undefined,
  email: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

const ROW: LeadRow = {
  id: 1,
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@test.com",
  acepta_politicas: true,
  politicas_version: "v1.0",
  consent_at: "2026-10-15T20:30:00-03:00",
  created_at: "2026-10-15T23:59:59.000Z",
};

describe("LeadsEmptyState (4.11)", () => {
  it("error: role=alert con copy genérica y sin detalles internos", () => {
    const html = renderToStaticMarkup(<LeadsEmptyState state={{ type: "error", message: "" }} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("No pudimos cargar los leads");
    for (const leak of ["PGRST", "postgres", "supabase", "42501", "stack"]) {
      expect(html.toLowerCase()).not.toContain(leak.toLowerCase());
    }
  });

  it("empty (sin leads) y no-results (con filtros) son estados distintos; solo no-results ofrece 'Limpiar filtros'", () => {
    const empty = renderToStaticMarkup(<LeadsEmptyState state={{ type: "empty", message: "x" }} />);
    const none = renderToStaticMarkup(
      <LeadsEmptyState state={{ type: "no-results", message: "x", clearUrl: "/admin" }} />,
    );
    expect(empty).toContain("Todavía no hay leads registrados");
    expect(empty).not.toContain("Limpiar filtros");
    expect(empty).not.toContain('role="alert"');
    expect(none).toContain("No hay resultados para los filtros aplicados");
    expect(none).not.toContain("Todavía no hay leads");
    expect(none).toContain('href="/admin"');
    expect(none).toContain("Limpiar filtros");
  });

  it("out-of-range: enlace a la página 1 con el href recibido (filtros preservados)", () => {
    const html = renderToStaticMarkup(
      <LeadsEmptyState state={{ type: "out-of-range", message: "x", firstPageUrl: "/admin?nombre=gar" }} />,
    );
    expect(html).toContain('href="/admin?nombre=gar"');
    expect(html).toContain("Esta página no existe");
  });

  it("ok no renderiza nada", () => {
    expect(renderToStaticMarkup(<LeadsEmptyState state={{ type: "ok", message: "" }} />)).toBe("");
  });
});

describe("LeadsSkeleton (4.11)", () => {
  it("expone aria-busy=true y una etiqueta accesible; sin role=alert", () => {
    const html = renderToStaticMarkup(<LeadsSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Cargando leads"');
    expect(html).not.toContain('role="alert"');
  });
});

describe("LeadsTable (4.4)", () => {
  it("<time datetime> con ISO UTC y texto con sufijo UTC (created_at y consent_at normalizado desde -03:00)", () => {
    const html = renderToStaticMarkup(<LeadsTable rows={[ROW]} />);
    // React serializa el atributo como dateTime en static markup; HTML no distingue mayúsculas
    const normalized = html.replace(/dateTime=/g, "datetime=");
    expect(normalized).toContain('<time datetime="2026-10-15T23:59:59.000Z">15/10/26, 11:59 p. m. UTC</time>');
    expect(normalized).toContain('<time datetime="2026-10-15T23:30:00.000Z">15/10/26, 11:30 p. m. UTC</time>');
  });

  it("nulos -> 'Sin registro' en versión y consentimiento, sin <time> para el consentimiento", () => {
    const html = renderToStaticMarkup(
      <LeadsTable rows={[{ ...ROW, politicas_version: null, consent_at: null }]} />,
    );
    expect(html.match(/Sin registro/g)).toHaveLength(2);
    expect(html.match(/<time /g)).toHaveLength(1); // solo created_at
  });

  it("escapa HTML de usuario", () => {
    const html = renderToStaticMarkup(<LeadsTable rows={[{ ...ROW, nombre: "<b>x</b>" }]} />);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
});

describe("LeadsPagination (4.8)", () => {
  it("página 1 de 3: anterior deshabilitado (span sin href ni tabindex), siguiente es enlace con filtros", () => {
    const html = renderToStaticMarkup(
      <LeadsPagination
        currentPage={1}
        totalPages={3}
        totalCount={45}
        filters={{ ...NO_FILTERS, nombre: "lead" }}
      />,
    );
    expect(html).toMatch(/<span[^>]*aria-disabled="true"[^>]*>← Anterior<\/span>/);
    expect(html).not.toMatch(/<span[^>]*(href|tabindex)=/i);
    expect(html).toContain('href="/admin?nombre=lead&amp;page=2"');
    expect(html).toContain("Página 1 de 3");
  });

  it("última página: siguiente deshabilitado; anterior vuelve sin page cuando es la 1", () => {
    const html = renderToStaticMarkup(
      <LeadsPagination currentPage={2} totalPages={2} totalCount={21} filters={NO_FILTERS} />,
    );
    expect(html).toMatch(/<span[^>]*aria-disabled="true"[^>]*>Siguiente →<\/span>/);
    expect(html).toContain('href="/admin"');
  });

  it("una sola página no renderiza paginación", () => {
    expect(
      renderToStaticMarkup(<LeadsPagination currentPage={1} totalPages={1} totalCount={20} filters={NO_FILTERS} />),
    ).toBe("");
  });
});

describe("R8: animaciones solo transform/opacity (5.2)", () => {
  const FILTERED: ParsedLeadsFilters = { ...NO_FILTERS, nombre: "ana" };
  const markups: Record<string, string> = {
    "LeadsFilters sin filtros": renderToStaticMarkup(<LeadsFilters filters={NO_FILTERS} />),
    "LeadsFilters con filtros (Limpiar)": renderToStaticMarkup(<LeadsFilters filters={FILTERED} />),
    LeadsTable: renderToStaticMarkup(<LeadsTable rows={[ROW]} />),
    LeadsPagination: renderToStaticMarkup(
      <LeadsPagination currentPage={2} totalPages={3} totalCount={50} filters={NO_FILTERS} />,
    ),
    LeadsSkeleton: renderToStaticMarkup(<LeadsSkeleton />),
  };

  for (const [name, html] of Object.entries(markups)) {
    it(`${name}: sin transition de color/borde/background ni transition-all`, () => {
      expect(html.length).toBeGreaterThan(0);
      expect(html).not.toMatch(/\btransition-(colors|all|shadow|\[)/);
      expect(html).not.toMatch(/\bduration-/);
    });
  }

  it("el único movimiento permitido (skeleton) es animate-pulse, que anima solo opacity", () => {
    expect(markups.LeadsSkeleton).toContain("animate-pulse");
    expect(markups.LeadsSkeleton).not.toMatch(/animate-(spin|bounce|ping)/);
  });
});
