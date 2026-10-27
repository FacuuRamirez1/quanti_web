import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Guardrails estáticos C-05 (R1/R3): la lectura de leads solo ocurre en servidor
 * con cliente anon + RLS; ningún Client Component toca Supabase.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "src");

// Quita comentarios de línea y de bloque para no dar falsos positivos con texto explicativo.
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join("/");
const read = (f: string) => readFileSync(f, "utf8");

/** Módulos importados (import ... from "x", import "x", import("x"), require("x")). */
export function importedModules(source: string): string[] {
  const code = stripComments(source);
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
  return [...code.matchAll(re)].map((m) => m[1]);
}

/** Directiva "use client" como primer statement (ignorando comentarios). */
export function isClientComponent(source: string): boolean {
  return /^\s*["']use client["']/.test(stripComments(source));
}

const touchesSupabase = (mod: string) => /@supabase|(^|\/)supabase(\/|$)/.test(mod);

const FORBIDDEN_SERVER_TOKENS = [
  "service_role",
  "SUPABASE_SERVICE_ROLE_KEY",
  "createServiceRoleClient",
  "user_metadata",
];

describe("guardrails: capa de datos de leads (R3)", () => {
  for (const file of ["src/lib/leads-data.ts", "src/lib/leads-query.ts"]) {
    it(`${file} no usa service_role ni user_metadata`, () => {
      const code = stripComments(read(path.join(ROOT, file)));
      for (const token of FORBIDDEN_SERVER_TOKENS) {
        expect(code, `${file} contiene ${token}`).not.toContain(token);
      }
    });
  }

  it("leads-data.ts es server-only y llama requireRole", () => {
    const code = stripComments(read(path.join(SRC, "lib", "leads-data.ts")));
    expect(code).toMatch(/^\s*import\s+["']server-only["'];/);
    expect(code).toContain("requireRole(");
  });

  it("leads-query.ts y leads-filters.ts siguen puros (sin Supabase ni server-only)", () => {
    for (const f of ["leads-query.ts", "leads-filters.ts"]) {
      const mods = importedModules(read(path.join(SRC, "lib", f)));
      expect(mods.filter((m) => touchesSupabase(m) || m === "server-only")).toEqual([]);
    }
  });
});

describe("guardrails: Client Components sin Supabase (R1)", () => {
  const adminComponents = walk(path.join(SRC, "components", "admin"));
  const adminClientFiles = walk(path.join(SRC, "app", "admin")).filter((f) => isClientComponent(read(f)));

  it("encuentra los archivos a inspeccionar (el test no es vacío)", () => {
    expect(adminComponents.length).toBeGreaterThan(0);
    expect(adminClientFiles.length).toBeGreaterThan(0);
  });

  it("ningún archivo de src/components/admin importa @supabase ni @/lib/supabase", () => {
    const offenders = adminComponents.filter((f) => importedModules(read(f)).some(touchesSupabase));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('ningún "use client" bajo src/app/admin importa @supabase ni @/lib/supabase', () => {
    const offenders = adminClientFiles.filter((f) => importedModules(read(f)).some(touchesSupabase));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('ningún "use client" bajo src/ importa la capa de datos (leads-data / auth)', () => {
    const offenders = walk(SRC)
      .filter((f) => isClientComponent(read(f)))
      .filter((f) => importedModules(read(f)).some((m) => /leads-data|\/lib\/auth$/.test(m)));
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe("guardrails: los detectores no son triviales", () => {
  it("importedModules detecta import, import side-effect, dynamic import y require; ignora comentarios", () => {
    const src = [
      'import { a } from "@supabase/ssr";',
      "import '@/lib/supabase/server';",
      'const x = await import("../supabase/client");',
      "const y = require('@supabase/supabase-js');",
      '// import { z } from "@supabase/ignored";',
      '/* import q from "@/lib/supabase/ignored2"; */',
    ].join("\n");
    expect(importedModules(src)).toEqual([
      "@supabase/ssr",
      "@/lib/supabase/server",
      "../supabase/client",
      "@supabase/supabase-js",
    ]);
    expect(importedModules(src).every(touchesSupabase)).toBe(true);
  });

  it("touchesSupabase no marca módulos ajenos", () => {
    for (const m of ["react", "@/lib/leads-filters", "./LeadsTable", "@/lib/utils"]) {
      expect(touchesSupabase(m)).toBe(false);
    }
  });

  it("isClientComponent reconoce la directiva con comillas simples/dobles y la ignora en comentarios", () => {
    expect(isClientComponent('"use client";\nimport x from "y";')).toBe(true);
    expect(isClientComponent("'use client'\nexport {}")).toBe(true);
    expect(isClientComponent('// "use client"\nexport {}')).toBe(false);
    expect(isClientComponent('import x from "y";')).toBe(false);
  });

  it("stripComments elimina comentarios pero conserva el código", () => {
    const out = stripComments('// service_role\nconst a = 1; /* user_metadata */');
    expect(out).not.toContain("service_role");
    expect(out).not.toContain("user_metadata");
    expect(out).toContain("const a = 1;");
  });
});
