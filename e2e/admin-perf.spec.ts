import { test, expect } from "@playwright/test";
import { e2e, loginAs } from "./helpers";

/**
 * 5.3: medición de carga de /admin con datos sembrados. Mide navegación -> tabla visible
 * (mediana de 5 cargas). Presupuesto holgado a propósito (el objetivo es detectar una
 * regresión grosa, no cronometrar la red); correr contra `next start` para cifras de producción.
 */
const BUDGET_MS = Number(process.env.E2E_ADMIN_LOAD_BUDGET_MS ?? 4000);

test.describe("Admin /admin — carga con datos (5.3)", () => {
  test.beforeEach(async () => {
    await e2e.resetLeads();
    await e2e.seedLeads(45, { namePrefix: "Perf", tag: "perf" });
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("navegación -> tabla visible: mediana dentro del presupuesto", async ({ page }) => {
    await loginAs(page, "admin");
    // Calentamiento (compilación/caché en dev)
    await page.goto("/admin");
    await expect(page.locator("tbody tr")).toHaveCount(20);

    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now();
      await page.goto("/admin");
      await expect(page.locator("tbody tr")).toHaveCount(20);
      samples.push(Date.now() - t0);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    console.log(`[perf] /admin 45 leads (20 filas) samples=${samples.join(",")}ms median=${median}ms budget=${BUDGET_MS}ms`);
    expect(median).toBeLessThan(BUDGET_MS);
  });
});
