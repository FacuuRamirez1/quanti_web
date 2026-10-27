import { describe, it, expect } from "vitest";
import {
  parseLeadsFilters,
  escapeLikePattern,
  buildDateRange,
  parsePage,
  pageOffset,
  totalPages,
  formatLeadDate,
  toLeadDateTime,
  resolveLeadsViewState,
  buildLeadsUrl,
  PAGE_SIZE,
  MAX_PAGE,
  type ParsedLeadsFilters,
} from "./leads-filters";

const NO_FILTERS: ParsedLeadsFilters = {
  nombre: undefined,
  email: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

describe("parseLeadsFilters", () => {
  it("returns defaults when no params provided", () => {
    expect(parseLeadsFilters({})).toEqual(NO_FILTERS);
  });

  it("trims nombre and email", () => {
    const result = parseLeadsFilters({ nombre: "  gar  ", email: "  TEST@EXAMPLE.COM  " });
    expect(result.nombre).toBe("gar");
    expect(result.email).toBe("test@example.com");
  });

  it("takes first value when params are repeated (array)", () => {
    const result = parseLeadsFilters({ nombre: ["a", "b"], email: ["first@test.com", "second@test.com"] });
    expect(result.nombre).toBe("a");
    expect(result.email).toBe("first@test.com");
  });

  it("descarta valores con caracteres de control (NUL, saltos, etc.) en lugar de pasarlos a la consulta", () => {
    const bads = [0, 10, 9, 31, 127].map((c) => `a${String.fromCharCode(c)}b`).concat([String.fromCharCode(0), String.fromCharCode(127)]);
    for (const bad of bads) {
      expect(parseLeadsFilters({ nombre: bad, email: bad }), JSON.stringify(bad)).toEqual(NO_FILTERS);
    }
    // El resto de los parametros validos se conserva
    expect(parseLeadsFilters({ nombre: `a${String.fromCharCode(0)}b`, email: "x@y.com" }).email).toBe("x@y.com");
    // Espacios/saltos en los extremos siguen recortandose (trim) y no cuentan como control interno
    expect(parseLeadsFilters({ nombre: `  ana${String.fromCharCode(10)}` }).nombre).toBe("ana");
  });

  it("takes the first page value when repeated", () => {
    expect(parseLeadsFilters({ page: ["2", "5"] }).page).toBe(2);
  });

  it("discards objects and arrays whose first item is not a string", () => {
    const result = parseLeadsFilters({ nombre: { a: 1 }, email: [{ a: 1 }, "x@y.com"] });
    expect(result.nombre).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(parseLeadsFilters({ nombre: [1, 2] }).nombre).toBeUndefined();
    expect(parseLeadsFilters({ nombre: [] }).nombre).toBeUndefined();
    expect(parseLeadsFilters({ nombre: 42 }).nombre).toBeUndefined();
    expect(parseLeadsFilters({ nombre: null }).nombre).toBeUndefined();
  });

  it("an invalid param does not discard the other valid ones", () => {
    const result = parseLeadsFilters({ nombre: { a: 1 }, email: "a@b.com", from: "2026-10-01", page: "3" });
    expect(result.nombre).toBeUndefined();
    expect(result.email).toBe("a@b.com");
    expect(result.from).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    expect(result.page).toBe(3);
  });

  it("discards strings longer than 100 characters", () => {
    const long = "a".repeat(101);
    const result = parseLeadsFilters({ nombre: long, email: long });
    expect(result.nombre).toBeUndefined();
    expect(result.email).toBeUndefined();
  });

  it("accepts strings exactly 100 characters", () => {
    const exactly100 = "a".repeat(100);
    const result = parseLeadsFilters({ nombre: exactly100, email: exactly100 });
    expect(result.nombre).toBe(exactly100);
    expect(result.email).toBe(exactly100);
  });

  it("treats whitespace-only values as absent and trims before measuring length", () => {
    expect(parseLeadsFilters({ nombre: "   " }).nombre).toBeUndefined();
    expect(parseLeadsFilters({ nombre: "  " + "a".repeat(100) + "  " }).nombre).toBe("a".repeat(100));
    expect(parseLeadsFilters({ nombre: "a".repeat(101) + "   " }).nombre).toBeUndefined();
  });

  it("discards date and page values longer than 100 characters", () => {
    const long = "2026-10-01" + "0".repeat(100);
    expect(parseLeadsFilters({ from: long, to: long, page: "1".repeat(101) })).toEqual(NO_FILTERS);
  });

  it("parses valid from/to dates keeping `to` as the original day (UTC midnight)", () => {
    const result = parseLeadsFilters({ from: "2026-10-01", to: "2026-10-20" });
    expect(result.from).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    // buildDateRange suma el día siguiente: no se suma dos veces
    expect(result.to).toEqual(new Date("2026-10-20T00:00:00.000Z"));
  });

  it("discards invalid date format", () => {
    const result = parseLeadsFilters({ from: "01-10-2026", to: "2026/10/20" });
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });

  it("discards non-existent calendar date but keeps the other bound", () => {
    const result = parseLeadsFilters({ from: "2026-02-30", to: "2026-10-20" });
    expect(result.from).toBeUndefined();
    expect(result.to).toEqual(new Date("2026-10-20T00:00:00.000Z"));
  });

  it("rejects malformed and impossible calendar dates, accepts leap day", () => {
    const bad = [
      "2026-13-01",
      "2026-00-10",
      "2026-1-01",
      "2026-10-1",
      "2026-10-32",
      "2026-02-29",
      "2026-04-31",
      "20261001",
      " ",
      "2026-10-01T00:00:00Z",
    ];
    for (const value of bad) {
      expect(parseLeadsFilters({ from: value }).from, value).toBeUndefined();
    }
    expect(parseLeadsFilters({ from: "2028-02-29" }).from).toEqual(new Date("2028-02-29T00:00:00.000Z"));
  });

  it("discards both when from > to", () => {
    const result = parseLeadsFilters({ from: "2026-10-20", to: "2026-10-01" });
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });

  it("from one day after to is also inverted; same day is valid", () => {
    const inverted = parseLeadsFilters({ from: "2026-10-21", to: "2026-10-20" });
    expect(inverted.from).toBeUndefined();
    expect(inverted.to).toBeUndefined();
    const same = parseLeadsFilters({ from: "2026-10-20", to: "2026-10-20" });
    expect(same.from).toEqual(new Date("2026-10-20T00:00:00.000Z"));
    expect(same.to).toEqual(new Date("2026-10-20T00:00:00.000Z"));
  });

  it("an inverted range does not discard nombre/email/page", () => {
    const result = parseLeadsFilters({ from: "2026-10-20", to: "2026-10-01", nombre: "gar", page: "2" });
    expect(result.nombre).toBe("gar");
    expect(result.page).toBe(2);
  });

  it("composes with buildDateRange: `to` is inclusive through the whole day (end to end)", () => {
    const { from, to } = parseLeadsFilters({ from: "2026-10-01", to: "2026-10-20" });
    expect(buildDateRange(from, to)).toEqual({
      gte: "2026-10-01T00:00:00.000Z",
      lt: "2026-10-21T00:00:00.000Z",
    });
  });

  it("parses valid page number", () => {
    expect(parseLeadsFilters({ page: "3" }).page).toBe(3);
  });

  it("defaults page to 1 for invalid values", () => {
    expect(parseLeadsFilters({ page: "0" }).page).toBe(1);
    expect(parseLeadsFilters({ page: "-3" }).page).toBe(1);
    expect(parseLeadsFilters({ page: "1.5" }).page).toBe(1);
    expect(parseLeadsFilters({ page: "abc" }).page).toBe(1);
    expect(parseLeadsFilters({ page: "1001" }).page).toBe(1);
  });

  it("does not escape LIKE wildcards (escape happens once, when building the pattern)", () => {
    expect(parseLeadsFilters({ nombre: "50%_a\\b" }).nombre).toBe("50%_a\\b");
  });
});

describe("escapeLikePattern", () => {
  it("escapes backslash first", () => {
    expect(escapeLikePattern("\\")).toBe("\\\\");
  });

  it("escapes percent sign", () => {
    expect(escapeLikePattern("%")).toBe("\\%");
  });

  it("escapes underscore", () => {
    expect(escapeLikePattern("_")).toBe("\\_");
  });

  it("escapes mixed pattern", () => {
    expect(escapeLikePattern("50%_a\\b")).toBe("50\\%\\_a\\\\b");
  });

  it("returns empty string for empty input", () => {
    expect(escapeLikePattern("")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeLikePattern("hola mundo")).toBe("hola mundo");
  });

  it("escapes every occurrence, not only the first", () => {
    expect(escapeLikePattern("%%")).toBe("\\%\\%");
    expect(escapeLikePattern("__")).toBe("\\_\\_");
    expect(escapeLikePattern("a_b%c_d")).toBe("a\\_b\\%c\\_d");
  });

  it("does not let a user backslash neutralize the escape of the next wildcard", () => {
    // entrada literal: \%  ->  \\\%  (backslash escapado + % escapado)
    expect(escapeLikePattern("\\%")).toBe("\\\\\\%");
  });

  it("produces a pattern that matches only the literal text (LIKE semantics model)", () => {
    const reEscape = (c: string): string => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const likeToRegex = (pattern: string): RegExp => {
      let out = "";
      for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        if (ch === "\\" && i + 1 < pattern.length) {
          i += 1;
          out += reEscape(pattern[i]);
        } else if (ch === "%") {
          out += ".*";
        } else if (ch === "_") {
          out += ".";
        } else {
          out += reEscape(ch);
        }
      }
      return new RegExp("^" + out + "$", "s");
    };
    const contains = (needle: string, candidate: string): boolean =>
      likeToRegex(`%${escapeLikePattern(needle)}%`).test(candidate);

    expect(contains("50%_a\\b", "x50%_a\\by")).toBe(true);
    expect(contains("50%_a\\b", "x50ZZaZb")).toBe(false);
    expect(contains("%", "abc")).toBe(false);
    expect(contains("%", "100%")).toBe(true);
    expect(contains("_", "ab")).toBe(false);
    expect(contains("_", "a_b")).toBe(true);
    expect(contains("\\", "a\\b")).toBe(true);
    expect(contains("\\", "ab")).toBe(false);
  });
});

describe("buildDateRange", () => {
  it("returns gte for from only", () => {
    expect(buildDateRange(new Date("2026-10-01T00:00:00.000Z"), undefined)).toEqual({
      gte: "2026-10-01T00:00:00.000Z",
      lt: undefined,
    });
  });

  it("returns lt for to only (next day)", () => {
    expect(buildDateRange(undefined, new Date("2026-10-20T00:00:00.000Z"))).toEqual({
      gte: undefined,
      lt: "2026-10-21T00:00:00.000Z",
    });
  });

  it("returns both gte and lt", () => {
    expect(
      buildDateRange(new Date("2026-10-01T00:00:00.000Z"), new Date("2026-10-20T00:00:00.000Z"))
    ).toEqual({
      gte: "2026-10-01T00:00:00.000Z",
      lt: "2026-10-21T00:00:00.000Z",
    });
  });

  it("returns undefined for both undefined", () => {
    expect(buildDateRange(undefined, undefined)).toEqual({ gte: undefined, lt: undefined });
  });

  it.each([
    ["2026-12-31", "2027-01-01T00:00:00.000Z"],
    ["2026-10-31", "2026-11-01T00:00:00.000Z"],
    ["2026-04-30", "2026-05-01T00:00:00.000Z"],
    ["2026-02-28", "2026-03-01T00:00:00.000Z"],
    ["2028-02-28", "2028-02-29T00:00:00.000Z"],
    ["2028-02-29", "2028-03-01T00:00:00.000Z"],
  ])("to = %s is exclusive up to %s", (day, expectedLt) => {
    expect(buildDateRange(undefined, new Date(`${day}T00:00:00.000Z`)).lt).toBe(expectedLt);
  });

  it("`to` includes the last millisecond of the day and excludes the next midnight", () => {
    const lt = new Date(buildDateRange(undefined, new Date("2026-10-20T00:00:00.000Z")).lt as string).getTime();
    expect(new Date("2026-10-20T23:59:59.999Z").getTime() < lt).toBe(true);
    expect(new Date("2026-10-21T00:00:00.000Z").getTime() < lt).toBe(false);
  });

  it("`from` includes T00:00:00.000Z and excludes the previous millisecond", () => {
    const gte = new Date(buildDateRange(new Date("2026-10-01T00:00:00.000Z"), undefined).gte as string).getTime();
    expect(new Date("2026-10-01T00:00:00.000Z").getTime() >= gte).toBe(true);
    expect(new Date("2026-09-30T23:59:59.999Z").getTime() >= gte).toBe(false);
  });
});

describe("parsePage / pageOffset / totalPages", () => {
  it("parsePage returns 1 for valid page 1", () => {
    expect(parsePage("1")).toBe(1);
  });

  it("parsePage returns 1 for invalid values", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("1001")).toBe(1);
  });

  it("parsePage accepts boundaries and strict integers only", () => {
    expect(parsePage("1000")).toBe(1000);
    expect(parsePage("999")).toBe(999);
    expect(parsePage("2")).toBe(2);
    expect(parsePage(" 3 ")).toBe(3);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage("12abc")).toBe(1);
    expect(parsePage("1e2")).toBe(1);
    expect(parsePage("+3")).toBe(1);
    expect(parsePage("0x10")).toBe(1);
    expect(parsePage("99999999999999999999")).toBe(1);
    expect(parsePage(5)).toBe(1);
    expect(parsePage(["2", "9"])).toBe(2);
  });

  it("exposes PAGE_SIZE=20 and MAX_PAGE=1000", () => {
    expect(PAGE_SIZE).toBe(20);
    expect(MAX_PAGE).toBe(1000);
  });

  it("pageOffset calculates correctly", () => {
    expect(pageOffset(1)).toBe(0);
    expect(pageOffset(2)).toBe(20);
    expect(pageOffset(3)).toBe(40);
    expect(pageOffset(MAX_PAGE)).toBe(19980);
  });

  it("totalPages calculates correctly with PAGE_SIZE=20", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(totalPages(40)).toBe(2);
    expect(totalPages(41)).toBe(3);
  });
});

describe("formatLeadDate", () => {
  it("formats ISO string to es-AR with UTC suffix", () => {
    expect(formatLeadDate("2026-10-15T14:30:00.000Z")).toMatch(
      /^\d{2}\/\d{2}\/\d{2}, \d{1,2}:\d{2} [ap]\. m\. UTC$/
    );
  });

  it("returns placeholder for null/undefined", () => {
    expect(formatLeadDate(null)).toBe("Sin registro");
    expect(formatLeadDate(undefined)).toBe("Sin registro");
  });

  it("returns placeholder for empty string and unparseable dates", () => {
    expect(formatLeadDate("")).toBe("Sin registro");
    expect(formatLeadDate("no-es-fecha")).toBe("Sin registro");
  });

  it("renders the UTC calendar day regardless of the process TZ (border timestamps)", () => {
    expect(formatLeadDate("2026-10-15T23:59:59.999Z")).toMatch(/^15\/10\/26, 11:59 p\. m\. UTC$/);
    expect(formatLeadDate("2026-10-16T00:00:00.000Z")).toMatch(/^16\/10\/26, 12:00 a\. m\. UTC$/);
    expect(formatLeadDate("2026-01-01T00:00:00.000Z")).toMatch(/^1\/1\/26, 12:00 a\. m\. UTC$/);
  });

  it("normalizes offset timestamps to UTC", () => {
    expect(formatLeadDate("2026-10-15T23:30:00-03:00")).toMatch(/^16\/10\/26, 2:30 a\. m\. UTC$/);
  });
});

describe("toLeadDateTime (valor ISO para <time datetime>)", () => {
  it("normalizes to an ISO UTC string", () => {
    expect(toLeadDateTime("2026-10-15T14:30:00.000Z")).toBe("2026-10-15T14:30:00.000Z");
    expect(toLeadDateTime("2026-10-15T23:30:00-03:00")).toBe("2026-10-16T02:30:00.000Z");
  });

  it("returns undefined for null, undefined, empty and invalid values", () => {
    expect(toLeadDateTime(null)).toBeUndefined();
    expect(toLeadDateTime(undefined)).toBeUndefined();
    expect(toLeadDateTime("")).toBeUndefined();
    expect(toLeadDateTime("nope")).toBeUndefined();
  });
});

describe("resolveLeadsViewState", () => {
  it("returns empty state when no leads and no filters", () => {
    expect(resolveLeadsViewState([], 0, NO_FILTERS, 1)).toEqual({
      type: "empty",
      message: "Todavía no hay leads registrados.",
    });
  });

  it("returns no-results state when filters applied but no matches", () => {
    expect(resolveLeadsViewState([], 0, { ...NO_FILTERS, nombre: "gar" }, 1)).toEqual({
      type: "no-results",
      message: "No hay resultados para los filtros aplicados.",
      clearUrl: "/admin",
    });
  });

  it.each([
    ["email", { email: "a@b.com" }],
    ["from", { from: new Date("2026-10-01T00:00:00.000Z") }],
    ["to", { to: new Date("2026-10-20T00:00:00.000Z") }],
  ])("returns no-results when only the %s filter is active", (_label, partial) => {
    expect(resolveLeadsViewState([], 0, { ...NO_FILTERS, ...partial }, 1).type).toBe("no-results");
  });

  it("a page number alone is not a filter: total 0 stays 'empty' on page 3", () => {
    expect(resolveLeadsViewState([], 0, { ...NO_FILTERS, page: 3 }, 3).type).toBe("empty");
  });

  it("returns ok state when leads found", () => {
    expect(resolveLeadsViewState([{ id: 1 }], 1, NO_FILTERS, 1).type).toBe("ok");
  });

  it("boundaries: 20 leads fit in page 1; page 2 is out-of-range; 21 leads make page 2 valid", () => {
    expect(resolveLeadsViewState([{}], 20, NO_FILTERS, 1).type).toBe("ok");
    expect(resolveLeadsViewState([], 20, NO_FILTERS, 2).type).toBe("out-of-range");
    expect(resolveLeadsViewState([{}], 21, NO_FILTERS, 2).type).toBe("ok");
  });

  it("returns out-of-range state when page > totalPages and count > 0", () => {
    expect(resolveLeadsViewState([], 21, NO_FILTERS, 3)).toEqual({
      type: "out-of-range",
      message: "Esta página no existe.",
      firstPageUrl: "/admin",
    });
  });

  it("out-of-range con filtros: el enlace a la página 1 PRESERVA los filtros activos (y omite page)", () => {
    const state = resolveLeadsViewState(
      [],
      5,
      {
        nombre: "gar",
        email: "a@b.com",
        from: new Date("2026-10-10T00:00:00.000Z"),
        to: new Date("2026-10-15T00:00:00.000Z"),
        page: 7,
      },
      7,
    );
    expect(state).toEqual({
      type: "out-of-range",
      message: "Esta página no existe.",
      firstPageUrl: "/admin?nombre=gar&email=a%40b.com&from=2026-10-10&to=2026-10-15",
    });
  });

  it("out-of-range con un solo filtro (nombre con tilde) lo codifica y no arrastra el resto", () => {
    const state = resolveLeadsViewState([], 5, { ...NO_FILTERS, nombre: "García", page: 4 }, 4);
    expect(state.type === "out-of-range" && state.firstPageUrl).toBe("/admin?nombre=Garc%C3%ADa");
  });

  it("out-of-range applies also with filters when the filtered total is > 0", () => {
    expect(resolveLeadsViewState([], 5, { ...NO_FILTERS, nombre: "gar" }, 2).type).toBe("out-of-range");
  });
});


describe("buildLeadsUrl", () => {
  it("sin filtros: /admin; página 1 no agrega page", () => {
    expect(buildLeadsUrl(NO_FILTERS, 1)).toBe("/admin");
  });

  it("página > 1 agrega page al final, después de los filtros", () => {
    expect(buildLeadsUrl({ ...NO_FILTERS, nombre: "Test" }, 2)).toBe("/admin?nombre=Test&page=2");
  });

  it("fechas como YYYY-MM-DD en UTC (sin corrimiento de día)", () => {
    const f = { ...NO_FILTERS, from: new Date("2026-12-31T00:00:00.000Z"), to: new Date("2027-01-01T00:00:00.000Z") };
    expect(buildLeadsUrl(f, 3)).toBe("/admin?from=2026-12-31&to=2027-01-01&page=3");
  });

  it("codifica valores con &, = y # (no se pueden colar parámetros)", () => {
    expect(buildLeadsUrl({ ...NO_FILTERS, nombre: "a&page=9#x" }, 1)).toBe("/admin?nombre=a%26page%3D9%23x");
  });
});
