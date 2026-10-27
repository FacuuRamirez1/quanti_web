import { createClient } from "@supabase/supabase-js";
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

const TEST_DOMAIN = "@quanti-test.local";

function removeLocalArtifacts() {
  for (const f of [".e2e-credentials.json", ".e2e-run-id"]) {
    fs.rmSync(path.resolve(process.cwd(), f), { force: true });
  }
}

async function globalTeardown() {
  if (process.env.E2E_ALLOW_LIVE_DB !== "1") {
    console.log("[E2E] E2E_ALLOW_LIVE_DB != 1 -> skipping DB teardown");
    return;
  }

  console.log("[E2E] Cleaning up test data...");

  // Leads de prueba (prefijo e2e+ y dominio de tests)
  for (const pattern of ["e2e+%", "%@quanti-test.local"]) {
    const { error } = await supabase.from("posibles_clientes").delete().ilike("email", pattern);
    if (error) console.error("[E2E] Error cleaning leads:", error);
  }

  // Usuarios y perfiles de prueba (dominio exclusivo de tests)
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const testUserIds = users.users
    .filter((u) => u.email?.endsWith(TEST_DOMAIN))
    .map((u) => u.id);

  if (testUserIds.length > 0) {
    await supabase.from("perfiles").delete().in("id", testUserIds);
    for (const id of testUserIds) {
      await supabase.auth.admin.deleteUser(id);
    }
    console.log(`[E2E] Cleaned ${testUserIds.length} test users`);
  }

  // Verificación final
  const { data: remainingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const remaining = remainingUsers.users.filter((u) => u.email?.endsWith(TEST_DOMAIN));
  const { count: leadsLeft } = await supabase
    .from("posibles_clientes")
    .select("id", { count: "exact", head: true })
    .ilike("email", "%@quanti-test.local");

  if (remaining.length > 0 || (leadsLeft ?? 0) > 0) {
    console.warn(`[E2E] WARNING: residuos users=${remaining.length} leads=${leadsLeft ?? 0}`);
  } else {
    console.log("[E2E] Verified: 0 test users/rows remaining");
  }

  removeLocalArtifacts();
}

export default globalTeardown;
