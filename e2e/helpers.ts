import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Cargar .env.local explícitamente desde la raíz del proyecto
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env.local"));
} catch {
  // sin .env.local: se usan las variables ya presentes en el entorno
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RUN_ID = process.env.E2E_RUN_ID || Date.now().toString(36);
const TEST_EMAIL_PREFIX = `e2e+${RUN_ID}`;
const TEST_DOMAIN = "@quanti-test.local";

let seq = 0;

/** Email de prueba: SIEMPRE `e2e+<runid>-...@quanti-test.local` (único patrón que se siembra y se borra). */
function testEmail(tag: string): string {
  seq += 1;
  return `${TEST_EMAIL_PREFIX}-${tag}-${seq}${TEST_DOMAIN}`;
}

export interface SeedOverrides {
  /** Fragmento que se incluye en el email (permite filtrar por email en los tests). */
  tag?: string;
  nombre?: string;
  apellido?: string;
  acepta_politicas?: boolean;
  politicas_version?: string | null;
  consent_at?: string | null;
  created_at?: string;
}

function toRow(o: SeedOverrides, fallbackTag: string) {
  return {
    nombre: o.nombre ?? "Test",
    apellido: o.apellido ?? "User",
    email: testEmail(o.tag ?? fallbackTag),
    acepta_politicas: o.acepta_politicas ?? true,
    politicas_version: o.politicas_version !== undefined ? o.politicas_version : "v1.0",
    consent_at: o.consent_at !== undefined ? o.consent_at : new Date().toISOString(),
    created_at: o.created_at ?? new Date().toISOString(),
  };
}

export interface SeededLead {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  created_at: string;
}

export const e2e = {
  prefix: TEST_EMAIL_PREFIX,

  async seedLead(overrides: SeedOverrides = {}): Promise<SeededLead> {
    const { data, error } = await supabase
      .from("posibles_clientes")
      .insert(toRow(overrides, "lead"))
      .select()
      .single();
    if (error) throw error;
    return data as SeededLead;
  },

  /**
   * Siembra `count` leads con created_at descendente (`stepMs`, 1 min por defecto, desde
   * `baseTime`; stepMs=0 => todos empatados), nombres `${namePrefix}${i}`. Devuelve en orden de inserción (i=0 el más nuevo).
   */
  async seedLeads(
    count: number,
    base: SeedOverrides & { namePrefix?: string; baseTime?: string; stepMs?: number } = {},
  ): Promise<SeededLead[]> {
    const baseMs = new Date(base.baseTime ?? "2026-10-01T12:00:00.000Z").getTime();
    const rows = Array.from({ length: count }, (_, i) =>
      toRow(
        {
          ...base,
          tag: `${base.tag ?? "bulk"}${i}`,
          nombre: base.nombre ?? `${base.namePrefix ?? "Lead"}${i}`,
          created_at: new Date(baseMs - i * (base.stepMs ?? 60_000)).toISOString(),
        },
        "bulk",
      ),
    );
    const { data, error } = await supabase.from("posibles_clientes").insert(rows).select();
    if (error) throw error;
    const byEmail = new Map((data as SeededLead[]).map((r) => [r.email, r]));
    return rows.map((r) => byEmail.get(r.email)!);
  },

  /** Borra SOLO los leads sembrados por los tests (patrón e2e+...@quanti-test.local). */
  async cleanupAllE2E(): Promise<void> {
    const { error } = await supabase
      .from("posibles_clientes")
      .delete()
      .ilike("email", `e2e+%${TEST_DOMAIN}`);
    if (error) throw error;
  },

  /**
   * Limpia los leads de prueba y aborta si hay leads que NO son de prueba:
   * las aserciones de conteo/paginación asumen una tabla sin leads reales y
   * nunca se borra nada ajeno.
   */
  async resetLeads(): Promise<void> {
    await this.cleanupAllE2E();
    const { count, error } = await supabase
      .from("posibles_clientes")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    if ((count ?? 0) > 0) {
      throw new Error(
        `[E2E] La tabla posibles_clientes tiene ${count} leads que no son de prueba; los e2e de /admin requieren tabla sin leads reales (no se borra nada ajeno).`,
      );
    }
  },
};

// --- Credenciales y login ---

export type TestRole = "admin" | "superadmin" | "norole";

interface Credentials {
  admin: { email: string; password: string };
  superadmin: { email: string; password: string };
  norole: { email: string; password: string };
}

let cachedCreds: Credentials | undefined;

export function credentials(): Credentials {
  if (cachedCreds) return cachedCreds;
  const file = path.resolve(process.cwd(), ".e2e-credentials.json");
  if (!fs.existsSync(file)) {
    throw new Error("Credentials file not found. Run globalSetup first (E2E_ALLOW_LIVE_DB=1).");
  }
  cachedCreds = JSON.parse(fs.readFileSync(file, "utf-8")) as Credentials;
  return cachedCreds;
}

/** Login por UI y espera a quedar en /admin (o falla con el mensaje de error del form). */
export async function loginAs(page: Page, role: TestRole): Promise<void> {
  const { email, password } = credentials()[role];
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]:has-text("Ingresar")');
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 15_000 });
}

/** Espera a que termine una navegación a /admin (h1 real presente y sin skeleton de carga). */
export async function settled(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { level: 1, name: "Panel de administración" })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

/** Va a /admin con query y espera a que cargue el contenido principal. */
export async function gotoAdmin(page: Page, query = ""): Promise<void> {
  await page.goto(`/admin${query}`);
  await settled(page);
}

/** Columna `n` (0-based) de cada fila del tbody. */
export async function columnTexts(page: Page, n: number): Promise<string[]> {
  const texts = await page.locator(`tbody tr td:nth-child(${n + 1})`).allTextContents();
  return texts.map((t) => t.trim());
}
