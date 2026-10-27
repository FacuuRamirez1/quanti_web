import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `server-only` lanza fuera de un bundle de servidor de React; en Vitest se neutraliza.
vi.mock("server-only", () => ({}));

const calls: Array<{ method: string; args: unknown[] }> = [];
let response: { data: unknown; error: unknown; count: number | null };
/** Respuestas consecutivas de `.range()`; si se vacía se usa `response`. */
let responseQueue: Array<{ data: unknown; error: unknown; count: number | null }> = [];

const requireRole = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/auth", () => ({ requireRole: (...a: unknown[]) => requireRole(...a) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: (...a: unknown[]) => createClient(...a) }));

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "select", "ilike", "gte", "lt", "order", "or", "filter"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.range = (...args: unknown[]) => {
    calls.push({ method: "range", args });
    return Promise.resolve(responseQueue.shift() ?? response);
  };
  return builder;
}

import { getLeadsPage } from "./leads-data";

const FILTERS = { nombre: undefined, email: undefined, from: undefined, to: undefined, page: 1 };
const ROW = {
  id: 7,
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@test.com",
  acepta_politicas: true,
  politicas_version: "v1.0",
  consent_at: "2026-10-15T14:30:00+00:00",
  created_at: "2026-10-15T14:30:00.5+00:00",
};

beforeEach(() => {
  calls.length = 0;
  responseQueue = [];
  response = { data: [], error: null, count: 0 };
  requireRole.mockReset().mockResolvedValue("admin");
  createClient.mockReset().mockImplementation(async () => makeBuilder());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getLeadsPage — autorización", () => {
  it("exige admin/superadmin con ruta /admin", async () => {
    await getLeadsPage(FILTERS);
    expect(requireRole).toHaveBeenCalledWith(["admin", "superadmin"], "/admin");
  });

  it("requireRole corre ANTES de crear el cliente y de cualquier consulta", async () => {
    await getLeadsPage(FILTERS);
    expect(requireRole.mock.invocationCallOrder[0]).toBeLessThan(createClient.mock.invocationCallOrder[0]);
  });

  it("si requireRole lanza (forbidden), NO se crea el cliente ni se consulta, y el error se propaga", async () => {
    requireRole.mockRejectedValue(new Error("NEXT_HTTP_ERROR_FALLBACK;403"));
    await expect(getLeadsPage(FILTERS)).rejects.toThrow("403");
    expect(createClient).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});

describe("getLeadsPage — consulta", () => {
  it("consulta posibles_clientes con columnas explícitas (no '*') y count exact", async () => {
    await getLeadsPage(FILTERS);
    expect(calls[0]).toEqual({ method: "from", args: ["posibles_clientes"] });
    const select = calls[1];
    expect(select.method).toBe("select");
    expect(select.args[0]).not.toBe("*");
    expect(select.args[0]).toBe(
      "id,nombre,apellido,email,acepta_politicas,politicas_version,consent_at,created_at",
    );
    expect(select.args[1]).toEqual({ count: "exact" });
  });

  it("aplica filtros parametrizados (ilike/gte/lt), orden created_at DESC + id DESC y range", async () => {
    await getLeadsPage({
      nombre: "a,b)(",
      email: "x@y.com",
      from: new Date("2026-10-01T00:00:00.000Z"),
      to: new Date("2026-10-20T00:00:00.000Z"),
      page: 2,
    });
    expect(calls.slice(2)).toEqual([
      { method: "ilike", args: ["nombre", "%a,b)(%"] },
      { method: "ilike", args: ["email", "%x@y.com%"] },
      { method: "gte", args: ["created_at", "2026-10-01T00:00:00.000Z"] },
      { method: "lt", args: ["created_at", "2026-10-21T00:00:00.000Z"] },
      { method: "order", args: ["created_at", { ascending: false }] },
      { method: "order", args: ["id", { ascending: false }] },
      { method: "range", args: [20, 39] },
    ]);
  });

  it("nunca arma filtros por string (.or/.filter): caracteres de PostgREST no pueden inyectar", async () => {
    await getLeadsPage({ ...FILTERS, nombre: "x),email.ilike.%", email: "a,or(b)" });
    expect(calls.some((c) => c.method === "or" || c.method === "filter")).toBe(false);
  });
});

describe("getLeadsPage — término con '*'", () => {
  it("usa .filter(col,'imatch',regex literal) y NUNCA ilike con '*' (comodín de PostgREST)", async () => {
    await getLeadsPage({ ...FILTERS, nombre: "a*b" });
    expect(calls.slice(2, 3)).toEqual([{ method: "filter", args: ["nombre", "imatch", String.raw`a\*b`] }]);
    expect(calls.some((c) => c.method === "ilike")).toBe(false);
    expect(calls.some((c) => c.method === "or")).toBe(false);
  });
});

describe("getLeadsPage — página fuera de rango (PGRST103 = HTTP 416)", () => {
  const RANGE_ERROR = { code: "PGRST103", message: "Requested range not satisfiable", details: "d", hint: null };

  it("offset mayor al total: NO es un error; devuelve ok con filas vacías y el total real (re-consulta count)", async () => {
    responseQueue = [
      { data: null, error: RANGE_ERROR, count: null },
      { data: [], error: null, count: 45 },
    ];
    const r = await getLeadsPage({ ...FILTERS, page: 9 });
    expect(r).toEqual({ status: "ok", rows: [], total: 45, totalPages: 3, currentPage: 9 });
    // Segunda consulta solo para contar: mismas columnas/filtros, range mínimo 0..0
    const ranges = calls.filter((c) => c.method === "range").map((c) => c.args);
    expect(ranges).toEqual([[160, 179], [0, 0]]);
  });

  it("con filtros, la re-consulta aplica los mismos filtros", async () => {
    responseQueue = [
      { data: null, error: RANGE_ERROR, count: null },
      { data: [], error: null, count: 0 },
    ];
    const r = await getLeadsPage({ ...FILTERS, nombre: "zz", page: 5 });
    expect(r).toEqual({ status: "ok", rows: [], total: 0, totalPages: 1, currentPage: 5 });
    expect(calls.filter((c) => c.method === "ilike")).toHaveLength(2);
  });

  it("si la re-consulta también falla -> error genérico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    responseQueue = [
      { data: null, error: RANGE_ERROR, count: null },
      { data: null, error: { code: "XX000", message: "boom" }, count: null },
    ];
    expect(await getLeadsPage({ ...FILTERS, page: 9 })).toStrictEqual({ status: "error" });
  });

  it("otros errores NO disparan la re-consulta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    response = { data: null, error: { code: "42501", message: "x" }, count: null };
    await getLeadsPage({ ...FILTERS, page: 9 });
    expect(calls.filter((c) => c.method === "range")).toHaveLength(1);
  });
});

describe("getLeadsPage — resultado", () => {
  it("filas válidas -> ok con total y páginas", async () => {
    response = { data: [ROW], error: null, count: 41 };
    const r = await getLeadsPage({ ...FILTERS, page: 3 });
    expect(r).toEqual({ status: "ok", rows: [ROW], total: 41, totalPages: 3, currentPage: 3 });
  });

  it("error de Supabase -> {status:'error'} sin detalles; log solo con el código (sin PII)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    response = {
      data: null,
      error: { code: "42501", message: 'permission denied for "ana@test.com"', details: "pii", hint: "h" },
      count: null,
    };
    const r = await getLeadsPage({ ...FILTERS, nombre: "ana" });
    expect(r).toStrictEqual({ status: "error" });
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain("42501");
    for (const leak of ["ana@test.com", "permission denied", "pii"]) {
      expect(logged).not.toContain(leak);
    }
  });

  it("fila inválida -> error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    response = { data: [{ ...ROW, created_at: "x" }], error: null, count: 1 };
    expect(await getLeadsPage(FILTERS)).toStrictEqual({ status: "error" });
  });
});
