import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Guardrail estático R5 / RN-LEAD-04: no existe código de exportación de leads
 * (CSV/Excel/descarga) en src/app, src/components ni src/lib. Los patrones
 * distinguen el uso de la palabra `export` de JS (no se busca) de código de exportación real.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const DIRS = ["src/app", "src/components", "src/lib"];

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

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

/** Patrones de código de exportación/descarga de datos. Ninguno matchea la palabra clave `export` de JS. */
export const EXPORT_CODE_PATTERNS: Array<[string, RegExp]> = [
  ["header Content-Disposition", /content-disposition/i],
  ["MIME de CSV/Excel", /text\/csv|ms-excel|spreadsheetml|application\/vnd\.openxmlformats/i],
  ["librería de planillas/CSV", /\bxlsx\b|exceljs|papaparse|fast-csv|csv-(?:stringify|parse|writer)|json2csv/i],
  ["archivo .csv/.xlsx/.xls", /\.(?:csv|xlsx|xls)\b/i],
  ["Blob / object URL", /new\s+Blob\s*\(|createObjectURL/],
  ["atributo/propiedad download", /(?:\s|\.)download\s*(?:=|:)|<a\b[^>]*\sdownload(?=[\s>/=])/],
  ["identificador de exportación de leads", /\bexport(?:ar)?[-_]?(?:leads?|csv|excel|data|clientes)\b|\bexportLeads?\b|\bdescargar\b/i],
];

describe("guardrail R5: sin exportación de leads (4.10)", () => {
  const files = DIRS.flatMap((d) => walk(path.join(ROOT, d)));

  it("inspecciona archivos (el guardrail no es trivial)", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const [label, pattern] of EXPORT_CODE_PATTERNS) {
    it(`ningún archivo de src/app, src/components o src/lib contiene: ${label}`, () => {
      const hits = files
        .filter((f) => pattern.test(stripComments(readFileSync(f, "utf8"))))
        .map(rel);
      expect(hits).toEqual([]);
    });
  }

  it("no hay rutas (route.ts/page.tsx) cuyo segmento sea export/download/csv/excel", () => {
    const hits = files.map(rel).filter((f) => /(^|\/)(export|exports|download|csv|excel)(\/|\.|$)/i.test(f));
    expect(hits).toEqual([]);
  });

  it("los detectores sí detectan código de exportación real (anti-tautología)", () => {
    const bad = [
      'return new Response(csv, { headers: { "Content-Disposition": "attachment" } })',
      'const type = "text/csv"',
      'import * as XLSX from "xlsx"',
      'const name = "leads.csv"',
      "const url = URL.createObjectURL(blob)",
      "<a href={u} download>x</a>",
      "<a href={u} download=\"x\">x</a>",
      "export async function exportLeads() {}",
    ];
    for (const sample of bad) {
      expect(
        EXPORT_CODE_PATTERNS.some(([, re]) => re.test(sample)),
        `no detecta: ${sample}`,
      ).toBe(true);
    }
    // La palabra clave `export` de JS no dispara falsos positivos
    for (const ok of ["export function LeadsTable() {}", "export const PAGE_SIZE = 20;", "export default async function Page() {}"]) {
      expect(EXPORT_CODE_PATTERNS.some(([, re]) => re.test(ok)), `falso positivo: ${ok}`).toBe(false);
    }
  });
});
