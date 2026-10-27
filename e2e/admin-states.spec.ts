import { test, expect } from "@playwright/test";
import { e2e, loginAs, gotoAdmin } from "./helpers";

// El route announcer de Next.js también usa role=alert (vacío): se filtra por contenido.
const errorAlert = (page: import("@playwright/test").Page) =>
  page.getByRole("alert").filter({ hasText: "No pudimos cargar los leads" });

test.describe("Admin /admin — estados (4.11)", () => {
  test.beforeEach(async ({ page }) => {
    await e2e.resetLeads();
    await loginAs(page, "admin");
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("sin leads y sin filtros: estado vacío (no 'sin resultados'), sin tabla ni 'Limpiar filtros'", async ({ page }) => {
    await gotoAdmin(page);
    await expect(page.getByRole("heading", { name: "Todavía no hay leads registrados" })).toBeVisible();
    await expect(page.getByText("No hay resultados para los filtros aplicados")).toHaveCount(0);
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Limpiar filtros" })).toHaveCount(0);
    await expect(errorAlert(page)).toHaveCount(0);
  });

  test("sin leads, página > 1 sin filtros: sigue siendo estado vacío (la página sola no es un filtro)", async ({ page }) => {
    await gotoAdmin(page, "?page=3");
    await expect(page.getByRole("heading", { name: "Todavía no hay leads registrados" })).toBeVisible();
    await expect(page.getByText("Esta página no existe")).toHaveCount(0);
    await expect(errorAlert(page)).toHaveCount(0);
  });

  test("hay leads pero los filtros no matchean: 'sin resultados' (no estado vacío) con 'Limpiar filtros'", async ({ page }) => {
    await e2e.seedLeads(5);
    await gotoAdmin(page, "?nombre=ZZZZZZZZZZ");
    await expect(page.getByRole("heading", { name: "No hay resultados para los filtros aplicados" })).toBeVisible();
    await expect(page.getByText("Todavía no hay leads registrados")).toHaveCount(0);
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Limpiar filtros" }).last()).toHaveAttribute("href", "/admin");
  });

  test("un NUL en el filtro se ignora como inválido (sin error ni filtrado fantasma)", async ({ page }) => {
    // No hay forma segura de forzar un error de Supabase real contra la base viva sin tocar RLS/auth
    // (CRITICAL). El cableado error -> alert se prueba con la capa de datos doblada (page.test.tsx).
    // Acá se verifica que un NUL (que antes se descartaba por PostgREST y devolvía TODO) se ignora como filtro inválido.
    await e2e.seedLeads(3);
    const res = await page.goto("/admin?nombre=%00");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Panel de administración" })).toBeVisible();
    await expect(errorAlert(page)).toHaveCount(0);
    await expect(page.locator("#filter-nombre")).toHaveValue("");
    await expect(page.locator("tbody tr")).toHaveCount(3);
  });

  test("loading: el skeleton con aria-busy se transmite en la respuesta y desaparece al terminar", async ({ page }) => {
    await e2e.seedLeads(3);
    // La respuesta HTML en streaming incluye el fallback de loading.tsx (aria-busy) además del contenido final.
    const res = await page.request.get("/admin");
    expect(res.status()).toBe(200);
    const raw = await res.text();
    expect(raw).toContain('aria-busy="true"');
    expect(raw).toContain("Cargando leads");

    // Ya renderizado en el navegador: sin skeleton y con la tabla real
    await gotoAdmin(page);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(page.locator("tbody tr")).toHaveCount(3);
  });
});
