import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RUN_ID = Date.now().toString(36);
const TEST_EMAIL_PREFIX = `e2e+${RUN_ID}`;
const TEST_DOMAIN = "@quanti-test.local";
const CREDENTIALS_FILE = path.resolve(process.cwd(), ".e2e-credentials.json");
const RUN_ID_FILE = path.resolve(process.cwd(), ".e2e-run-id");

// Passwords aleatorias por corrida (nunca hardcodeadas)
const randomPassword = () => `Aa1!${crypto.randomBytes(18).toString("base64url")}`;

const ADMIN_EMAIL = `admin-${TEST_EMAIL_PREFIX}${TEST_DOMAIN}`;
const SUPERADMIN_EMAIL = `superadmin-${TEST_EMAIL_PREFIX}${TEST_DOMAIN}`;
const NOROLE_EMAIL = `norole-${TEST_EMAIL_PREFIX}${TEST_DOMAIN}`;
const ADMIN_PASSWORD = randomPassword();
const SUPERADMIN_PASSWORD = randomPassword();
const NOROLE_PASSWORD = randomPassword();

async function ensureUser(email: string, password: string) {
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = existing.users.find((u) => u.email === email);

  if (user) {
    // Actualizar password por si cambió
    await supabase.auth.admin.updateUserById(user.id, { password });
    return user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

async function ensureProfile(userId: string, role: "admin" | "superadmin" | null) {
  const { error } = await supabase.from("perfiles").upsert({
    id: userId,
    role,
  });
  if (error) throw error;
}

async function cleanupTestData() {
  // Borrar leads de prueba (residuos de corridas anteriores incluidos)
  await supabase.from("posibles_clientes").delete().ilike("email", "%@quanti-test.local");
  await supabase.from("posibles_clientes").delete().ilike("email", "e2e+%");

  // Borrar perfiles y usuarios de prueba (dominio exclusivo de tests)
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const testUserIds = users.users
    .filter((u) => u.email?.endsWith(TEST_DOMAIN))
    .map((u) => u.id);

  if (testUserIds.length > 0) {
    await supabase.from("perfiles").delete().in("id", testUserIds);
    for (const id of testUserIds) {
      await supabase.auth.admin.deleteUser(id);
    }
  }
}

async function globalSetup() {
  if (process.env.E2E_ALLOW_LIVE_DB !== "1") {
    console.log("[E2E] E2E_ALLOW_LIVE_DB != 1 → skipping DB setup");
    return;
  }

  console.log("[E2E] Setting up test users and profiles...");

  // Limpiar residuos de runs anteriores con el mismo patrón
  await cleanupTestData();

  // Crear usuarios
  const adminId = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  const superadminId = await ensureUser(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  const noroleId = await ensureUser(NOROLE_EMAIL, NOROLE_PASSWORD);

  // Crear perfiles (solo para admin y superadmin; norole no tiene perfil)
  await ensureProfile(adminId, "admin");
  await ensureProfile(superadminId, "superadmin");
  // noroleId NO tiene perfil → simula usuario autenticado sin rol

  // Compartir RUN_ID con workers y teardown; credenciales a archivo (gitignored, se borra en teardown)
  process.env.E2E_RUN_ID = RUN_ID;
  fs.writeFileSync(RUN_ID_FILE, RUN_ID);
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(
      {
        admin: { id: adminId, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        superadmin: { id: superadminId, email: SUPERADMIN_EMAIL, password: SUPERADMIN_PASSWORD },
        norole: { id: noroleId, email: NOROLE_EMAIL, password: NOROLE_PASSWORD },
      },
      null,
      2
    )
  );

  console.log("[E2E] Test users created:", {
    admin: ADMIN_EMAIL,
    superadmin: SUPERADMIN_EMAIL,
    norole: NOROLE_EMAIL,
  });

  // Warm-up: arrancar una sesión para que el webServer esté listo
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage();
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await browser.close();
}

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3105";

export default globalSetup;