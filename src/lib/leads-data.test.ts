import { describe, it, expect } from "vitest";
import {
  leadRowSchema,
  buildLeadsQuery,
  toLeadsPageResult,
  LEAD_COLUMNS,
} from "./leads-query";
import { parseLeadsFilters, escapeLikePattern } from "./leads-filters";

describe("leadRowSchema", () => {
  const valid = {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@test.com",
    acepta_politicas: true,
    politicas_version: "v1.0",
    consent_at: "2026-10-15T14:30:00+00:00",
    created_at: "2026-10-15T14:30:00.123456+00:00",
  };

  it("acepta una fila válida completa y conserva los valores", () => {
    const result = leadRowSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it("acepta politicas_version y consent_at nulos y los conserva como null", () => {
    const result = leadRowSchema.safeParse({ ...valid, politicas_version: null, consent_at: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.politicas_version).toBeNull();
      expect(result.data.consent_at).toBeNull();
    }
  });

  it("acepta el formato real de timestamptz de PostgREST (microsegundos y +00:00), 'Z' y offsets", () => {
    for (const created_at of [
      "2026-10-15T14:30:00.123456+00:00",
      "2026-10-15T14:30:00Z",
      "2026-10-15T11:30:00-03:00",
    ]) {
      expect(leadRowSchema.safeParse({ ...valid, created_at }).success).toBe(true);
    }
  });

  it("rechaza id inválido: string, no entero (BIGINT identity) y null", () => {
    expect(leadRowSchema.safeParse({ ...valid, id: "not-a-number" }).success).toBe(false);
    expect(leadRowSchema.safeParse({ ...valid, id: "1" }).success).toBe(false);
    expect(leadRowSchema.safeParse({ ...valid, id: 1.5 }).success).toBe(false);
    expect(leadRowSchema.safeParse({ ...valid, id: null }).success).toBe(false);
  });

  it("rechaza created_at inválido: texto, solo fecha, vacío, null, calendario imposible", () => {
    for (const created_at of ["not-a-date", "2026-10-15", "", null, "2026-13-45T00:00:00Z", "15/10/2026"]) {
      expect(leadRowSchema.safeParse({ ...valid, created_at }).success).toBe(false);
    }
  });

  it.each([
    "id",
    "nombre",
    "apellido",
    "email",
    "acepta_politicas",
    "politicas_version",
    "consent_at",
    "created_at",
  ])("rechaza fila sin el campo %s", (field) => {
    const row: Record<string, unknown> = { ...valid };
    delete row[field];
    expect(leadRowSchema.safeParse(row).success).toBe(false);
  });

  it("rechaza fila casi vacía", () => {
    expect(leadRowSchema.safeParse({ id: 4, nombre: "Test" }).success).toBe(false);
  });

  it("rechaza null en campos NOT NULL y tipos incorrectos", () => {
    expect(leadRowSchema.safeParse({ ...valid, nombre: null }).success).toBe(false);
    expect(leadRowSchema.safeParse({ ...valid, email: null }).success).toBe(false);
    expect(leadRowSchema.safeParse({ ...valid, acepta_politicas: "true" }).success).toBe(false);
  });

  it("LEAD_COLUMNS lista exactamente las claves del schema (sin select('*'))", () => {
    expect(LEAD_COLUMNS.split(",").sort()).toEqual(Object.keys(leadRowSchema.shape).sort());
  });
});

describe("buildLeadsQuery", () => {
  const base = { nombre: undefined, email: undefined, from: undefined, to: undefined, page: 1 };
  const ORDER = [
    { column: "created_at", ascending: false },
    { column: "id", ascending: false },
  ];

  it("sin filtros: descriptor base (created_at DESC, id DESC; rango 0..19; count exact)", () => {
    expect(buildLeadsQuery(base)).toEqual({
      filters: [],
      order: ORDER,
      range: { from: 0, to: 19 },
      count: "exact",
    });
  });

  it("combina nombre + email + rango de fechas (AND) con descriptor exacto", () => {
    const filters = parseLeadsFilters({
      nombre: " gar ",
      email: "test@example.com",
      from: "2026-10-01",
      to: "2026-10-20",
      page: "3",
    });
    expect(buildLeadsQuery(filters)).toEqual({
      filters: [
        { column: "nombre", operator: "ilike", value: "%gar%" },
        { column: "email", operator: "ilike", value: "%test@example.com%" },
        { column: "created_at", operator: "gte", value: "2026-10-01T00:00:00.000Z" },
        // to = 2026-10-20 original => lt día siguiente (único +1 día, en buildDateRange)
        { column: "created_at", operator: "lt", value: "2026-10-21T00:00:00.000Z" },
      ],
      order: ORDER,
      range: { from: 40, to: 59 },
      count: "exact",
    });
  });

  it("escapa el patrón exactamente una vez (sin doble escape)", () => {
    // entrada: 50%_a\b  ->  %50\%\_a\\b%
    const input = "50%_a\\b";
    const d = buildLeadsQuery({ ...base, nombre: input });
    expect(d.filters).toEqual([
      { column: "nombre", operator: "ilike", value: "%50\\%\\_a\\\\b%" },
    ]);
    expect(d.filters[0].value).toBe(`%${escapeLikePattern(input)}%`);
  });

  it("parseLeadsFilters + buildLeadsQuery no duplican el escape (flujo puro completo)", () => {
    const d = buildLeadsQuery(parseLeadsFilters({ nombre: "100%" }));
    expect(d.filters[0].value).toBe("%100\\%%");
  });

  it("escapa % y _ también en email", () => {
    const d = buildLeadsQuery({ ...base, email: "a_b%@x.com" });
    expect(d.filters[0]).toEqual({ column: "email", operator: "ilike", value: "%a\\_b\\%@x.com%" });
  });

  it("'*' es comodín en PostgREST ilike (verificado en vivo): un término con '*' usa imatch con regex escapada", () => {
    const d = buildLeadsQuery({ ...base, nombre: "a*b" });
    expect(d.filters).toEqual([{ column: "nombre", operator: "imatch", value: String.raw`a\*b` }]);
  });

  it("imatch escapa todos los metacaracteres de regex (literal) y también aplica a email", () => {
    const d = buildLeadsQuery({ ...base, email: "x.y+(z)*[q]{1}|^$?\\" });
    expect(d.filters).toEqual([
      {
        column: "email",
        operator: "imatch",
        value: String.raw`x\.y\+\(z\)\*\[q\]\{1\}\|\^\$\?\\`,
      },
    ]);
  });

  it("sin '*' sigue usando ilike (no cambia la semántica de %/_)", () => {
    expect(buildLeadsQuery({ ...base, nombre: "a%b" }).filters[0].operator).toBe("ilike");
  });

  it("no agrega filtro ilike si nombre/email están vacíos", () => {
    expect(buildLeadsQuery({ ...base, nombre: "", email: "" }).filters).toEqual([]);
  });

  it("solo from: gte inclusivo, sin lt", () => {
    const d = buildLeadsQuery({ ...base, from: new Date("2026-10-01T00:00:00.000Z") });
    expect(d.filters).toEqual([{ column: "created_at", operator: "gte", value: "2026-10-01T00:00:00.000Z" }]);
  });

  it("solo to: lt = día siguiente a la fecha original (consistente con Fase 2)", () => {
    const d = buildLeadsQuery({ ...base, to: new Date("2026-10-20T00:00:00.000Z") });
    expect(d.filters).toEqual([{ column: "created_at", operator: "lt", value: "2026-10-21T00:00:00.000Z" }]);
  });

  it("to = 12-31 cruza de año en lt", () => {
    const d = buildLeadsQuery(parseLeadsFilters({ to: "2026-12-31" }));
    expect(d.filters).toEqual([{ column: "created_at", operator: "lt", value: "2027-01-01T00:00:00.000Z" }]);
  });

  it("rango por página: 1 -> 0..19, 2 -> 20..39, 3 -> 40..59, 1000 -> 19980..19999", () => {
    expect(buildLeadsQuery({ ...base, page: 1 }).range).toEqual({ from: 0, to: 19 });
    expect(buildLeadsQuery({ ...base, page: 2 }).range).toEqual({ from: 20, to: 39 });
    expect(buildLeadsQuery({ ...base, page: 3 }).range).toEqual({ from: 40, to: 59 });
    expect(buildLeadsQuery({ ...base, page: 1000 }).range).toEqual({ from: 19980, to: 19999 });
  });

  it("siempre count exact y desempate id DESC después de created_at DESC", () => {
    for (const page of [1, 7]) {
      const d = buildLeadsQuery({ ...base, nombre: "x", page });
      expect(d.count).toBe("exact");
      expect(d.order).toEqual(ORDER);
    }
  });
});

describe("toLeadsPageResult", () => {
  const row = (id: number) => ({
    id,
    nombre: "A",
    apellido: "B",
    email: `a${id}@b.com`,
    acepta_politicas: true,
    politicas_version: "v1.0",
    consent_at: "2026-10-15T14:30:00.000Z",
    created_at: "2026-10-15T14:30:00.000Z",
  });
  const ok = (data: unknown, count: number | null) => ({ data, error: null, count });

  it("filas válidas -> ok con total, totalPages y currentPage", () => {
    expect(toLeadsPageResult(ok([row(2), row(1)], 21), 1)).toEqual({
      status: "ok",
      rows: [row(2), row(1)],
      total: 21,
      totalPages: 2,
      currentPage: 1,
    });
  });

  it("totalPages: 0->1, 20->1, 21->2, 40->2, 41->3", () => {
    const pages = [0, 20, 21, 40, 41].map((n) => {
      const r = toLeadsPageResult(ok([], n), 1);
      return r.status === "ok" ? r.totalPages : -1;
    });
    expect(pages).toEqual([1, 1, 2, 2, 3]);
  });

  it("count null -> total 0 y data null -> lista vacía", () => {
    const expected = { status: "ok", rows: [], total: 0, totalPages: 1, currentPage: 1 };
    expect(toLeadsPageResult(ok([], null), 1)).toEqual(expected);
    expect(toLeadsPageResult({ data: null, error: null, count: null }, 1)).toEqual(expected);
  });

  it("página fuera de rango con count>0: ok con filas vacías (lo resuelve la vista)", () => {
    expect(toLeadsPageResult(ok([], 25), 9)).toEqual({
      status: "ok",
      rows: [],
      total: 25,
      totalPages: 2,
      currentPage: 9,
    });
  });

  it("error de Supabase -> {status:'error'} exacto, sin message/code/details/hint", () => {
    const error = {
      code: "PGRST116",
      message: 'relation "x" does not exist',
      details: "secret info",
      hint: "internal hint",
    };
    const r = toLeadsPageResult({ data: null, error, count: null }, 1);
    expect(r).toStrictEqual({ status: "error" });
    const json = JSON.stringify(r);
    for (const leak of ["PGRST116", "does not exist", "secret info", "internal hint"]) {
      expect(json).not.toContain(leak);
    }
  });

  it("el error tiene prioridad aunque venga data parcial", () => {
    expect(toLeadsPageResult({ data: [row(1)], error: { code: "X" }, count: 1 }, 1)).toStrictEqual({
      status: "error",
    });
  });

  it("una fila que no valida el schema -> error completo (no se omite en silencio, design.md)", () => {
    const bad = { ...row(2), created_at: "no-es-fecha" };
    expect(toLeadsPageResult(ok([row(1), bad], 2), 1)).toStrictEqual({ status: "error" });
  });

  it("data que no es array (shape inesperado) -> error", () => {
    expect(toLeadsPageResult(ok({ id: 1 }, 1), 1)).toStrictEqual({ status: "error" });
    expect(toLeadsPageResult(ok("x", 1), 1)).toStrictEqual({ status: "error" });
  });

  it("el error por fila inválida no filtra datos de la fila (PII)", () => {
    const bad = { ...row(2), email: "pii@secret.com", created_at: "x" };
    expect(JSON.stringify(toLeadsPageResult(ok([bad], 1), 1))).not.toContain("pii@secret.com");
  });
});
