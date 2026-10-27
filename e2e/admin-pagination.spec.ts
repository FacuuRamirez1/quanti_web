import { test, expect, type Page } from "@playwright/test";
import { e2e, loginAs, gotoAdmin, columnTexts } from "./helpers";

const names = (page: Page) => columnTexts(page, 0);
const emails = (page: Page) => columnTexts(page, 2);
const pageLabel = (page: Page) => page.locator('nav[aria-label="Paginación de leads"] [aria-current="page"]');
const expectedNames = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => `Lead${from + i}`);

test.describe("Admin /admin — paginación (4.7/4.8)", () => {
  test.beforeEach(async ({ page }) => {
    await e2e.resetLeads();
    await loginAs(page, "admin");
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("45 leads: página 1 y 2 sin solape, 20 por página, 'Página X de 3' y total en la 3", async ({ page }) => {
    await e2e.seedLeads(45); // Lead0 (más nuevo) ... Lead44

    await gotoAdmin(page);
    expect(await names(page)).toEqual(expectedNames(0, 20));
    await expect(pageLabel(page)).toHaveText("Página 1 de 3");
    const p1 = await emails(page);

    await gotoAdmin(page, "?page=2");
    expect(await names(page)).toEqual(expectedNames(20, 40));
    await expect(pageLabel(page)).toHaveText("Página 2 de 3");
    const p2 = await emails(page);

    await gotoAdmin(page, "?page=3");
    expect(await names(page)).toEqual(expectedNames(40, 45));
    await expect(pageLabel(page)).toHaveText("Página 3 de 3");
    const p3 = await emails(page);

    const all = [...p1, ...p2, ...p3];
    expect(new Set(all).size).toBe(45);
  });

  test("límite 20/21: 20 leads caben en una página; 21 generan página 2 con 1 fila", async ({ page }) => {
    await e2e.seedLeads(20);
    await gotoAdmin(page);
    await expect(page.locator("tbody tr")).toHaveCount(20);
    await expect(page.locator('a[rel="next"]')).toHaveCount(0);
    await gotoAdmin(page, "?page=2");
    await expect(page.getByText("Esta página no existe")).toBeVisible();

    await e2e.seedLead({ nombre: "Veintiuno", created_at: "2020-01-01T00:00:00.000Z" });
    await gotoAdmin(page, "?page=2");
    expect(await names(page)).toEqual(["Veintiuno"]);
    await expect(pageLabel(page)).toHaveText("Página 2 de 2");
  });

  test("timestamps empatados: ninguna fila se repite ni se pierde entre páginas (desempate por id)", async ({ page }) => {
    const seeded = await e2e.seedLeads(25, { stepMs: 0, namePrefix: "Empate" });
    await gotoAdmin(page);
    const p1 = await emails(page);
    await gotoAdmin(page, "?page=2");
    const p2 = await emails(page);
    expect(p1).toHaveLength(20);
    expect(p2).toHaveLength(5);
    expect(new Set([...p1, ...p2])).toEqual(new Set(seeded.map((s) => s.email)));
    // id DESC dentro del empate
    const idsDesc = [...seeded].sort((a, b) => b.id - a.id).map((s) => s.email);
    expect([...p1, ...p2]).toEqual(idsDesc);
  });

  test("anterior/siguiente deshabilitados en los bordes: sin href, sin foco (y habilitados en el medio)", async ({ page }) => {
    await e2e.seedLeads(45);
    const nav = page.locator('nav[aria-label="Paginación de leads"]');

    await gotoAdmin(page);
    const prevDisabled = nav.locator('[aria-disabled="true"]', { hasText: "Anterior" });
    await expect(prevDisabled).toHaveCount(1);
    await expect(prevDisabled).not.toHaveAttribute("href", /.*/);
    await expect(prevDisabled).not.toHaveAttribute("tabindex", /.*/);
    await expect(nav.getByRole("link", { name: /Anterior/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /Siguiente/ })).toHaveCount(1);
    // Recorrido con Tab: el control deshabilitado nunca recibe foco
    const tabbed: string[] = [];
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      tabbed.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          // body/html = el foco volvió al documento (no es un control)
          return el && el !== document.body && el !== document.documentElement ? (el.textContent ?? "").trim() : "";
        }),
      );
    }
    expect(tabbed.some((t) => t.includes("Siguiente"))).toBe(true);
    expect(tabbed.some((t) => t.includes("Anterior"))).toBe(false);

    await gotoAdmin(page, "?page=2");
    await expect(nav.getByRole("link", { name: /Anterior/ })).toHaveCount(1);
    await expect(nav.getByRole("link", { name: /Siguiente/ })).toHaveCount(1);

    await gotoAdmin(page, "?page=3");
    const nextDisabled = nav.locator('[aria-disabled="true"]', { hasText: "Siguiente" });
    await expect(nextDisabled).toHaveCount(1);
    await expect(nextDisabled).not.toHaveAttribute("href", /.*/);
    await expect(nextDisabled).not.toHaveAttribute("tabindex", /.*/);
    await expect(nav.getByRole("link", { name: /Siguiente/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /Anterior/ })).toHaveCount(1);
  });

  test("los filtros activos se preservan al paginar (siguiente y anterior)", async ({ page }) => {
    await e2e.seedLeads(45); // Lead0..44
    await e2e.seedLeads(3, { namePrefix: "Otro", tag: "otro", baseTime: "2026-09-01T00:00:00.000Z" });

    await gotoAdmin(page, "?nombre=lead&from=2026-09-30&to=2026-10-01");
    await expect(pageLabel(page)).toHaveText("Página 1 de 3");

    await page.getByRole("link", { name: /Siguiente/ }).click();
    await expect(page).toHaveURL(/\/admin\?nombre=lead&from=2026-09-30&to=2026-10-01&page=2$/);
    await expect(pageLabel(page)).toHaveText("Página 2 de 3");
    expect(await names(page)).toEqual(expectedNames(20, 40));

    await page.getByRole("link", { name: /Anterior/ }).click();
    await expect(page).toHaveURL(/\/admin\?nombre=lead&from=2026-09-30&to=2026-10-01$/);
    await expect(pageLabel(page)).toHaveText("Página 1 de 3");
    // Los campos del formulario conservan los filtros en la página 2 también
    await gotoAdmin(page, "?nombre=lead&page=2");
    await expect(page.locator("#filter-nombre")).toHaveValue("lead");
  });

  test("page inválida cae a la página 1 (sin error, sin redirigir)", async ({ page }) => {
    await e2e.seedLeads(45);
    for (const bad of ["0", "-3", "abc", "1.5", "1001", "2abc", "", "1e2"]) {
      const res = await page.goto(`/admin?page=${encodeURIComponent(bad)}`);
      expect(res?.status(), `page=${bad}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: "Panel de administración" })).toBeVisible();
      expect(await names(page), `page=${bad}`).toEqual(expectedNames(0, 20));
      await expect(pageLabel(page)).toHaveText("Página 1 de 3");
    }
  });

  test("página fuera de rango: aviso y enlace a la página 1 que preserva los filtros", async ({ page }) => {
    await e2e.seedLeads(45);
    await e2e.seedLead({ nombre: "Ajeno", tag: "ajeno", created_at: "2020-01-01T00:00:00.000Z" });

    // Con filtros
    await gotoAdmin(page, "?nombre=lead&from=2026-09-30&page=9");
    await expect(page.getByText("Esta página no existe")).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
    const link = page.getByRole("link", { name: "Ir a la primera página" });
    await expect(link).toHaveAttribute("href", "/admin?nombre=lead&from=2026-09-30");
    await link.click();
    await expect(page).toHaveURL(/\/admin\?nombre=lead&from=2026-09-30$/);
    await expect(pageLabel(page)).toHaveText("Página 1 de 3");
    expect(await names(page)).toEqual(expectedNames(0, 20));

    // Sin filtros: 46 leads => 3 páginas; página 4 está fuera de rango
    await gotoAdmin(page, "?page=4");
    await expect(page.getByText("Esta página no existe")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a la primera página" })).toHaveAttribute("href", "/admin");
    // y la página 3 existe (6 filas: 5 + Ajeno)
    await gotoAdmin(page, "?page=3");
    await expect(page.locator("tbody tr")).toHaveCount(6);
  });
});
