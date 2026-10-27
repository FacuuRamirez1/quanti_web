import { test, expect, type APIResponse } from "@playwright/test";
import { e2e, loginAs, gotoAdmin } from "./helpers";

const EXPORT_PATHS = ["/admin/export", "/admin/leads/export", "/api/leads/export", "/api/export"];
const FORBIDDEN_CONTROL = /export|descarg|download|csv|excel|xls/i;

function expectNoAttachment(res: APIResponse, label: string) {
  const disposition = res.headers()["content-disposition"] ?? "";
  expect(disposition, `${label}: content-disposition`).not.toMatch(/attachment/i);
  const type = res.headers()["content-type"] ?? "";
  expect(type, `${label}: content-type`).not.toMatch(/csv|excel|spreadsheet|octet-stream/i);
}

test.describe("Admin /admin — sin exportación de leads (4.9/4.10, R5)", () => {
  test.beforeEach(async () => {
    await e2e.resetLeads();
    await e2e.seedLeads(25);
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("la UI de /admin no ofrece controles de exportar/descargar/CSV/Excel (con datos, filtros, página 2 y sin resultados)", async ({ page }) => {
    await loginAs(page, "admin");
    for (const query of ["", "?page=2", "?nombre=Lead", "?nombre=ZZZZ"]) {
      await gotoAdmin(page, query);
      const clickable = page.locator("a, button, [role='button'], [role='link'], input[type='submit']");
      const labels = await clickable.evaluateAll((els) =>
        els.map((el) => `${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""}`.trim()),
      );
      expect(labels.length, `hay controles en /admin${query}`).toBeGreaterThan(0);
      for (const label of labels) {
        expect(label, `/admin${query}: control "${label}"`).not.toMatch(FORBIDDEN_CONTROL);
      }
      await expect(page.locator("a[download], [download]")).toHaveCount(0);
      await expect(page.locator("a[href*='export' i], a[href*='csv' i], a[href*='download' i], a[href*='xls' i]")).toHaveCount(0);
      await expect(page.locator("form[action*='export' i], form[action*='download' i]")).toHaveCount(0);
      // El único formulario es el de filtros: GET a /admin
      const forms = page.locator("form[method='GET'][action='/admin']");
      await expect(forms).toHaveCount(1);
    }
  });

  test("rutas de exportación inexistentes: GET y POST responden 404/405 sin attachment (admin autenticado)", async ({ page }) => {
    await loginAs(page, "admin");
    for (const route of EXPORT_PATHS) {
      for (const method of ["get", "post"] as const) {
        const res = await page.request[method](route, { maxRedirects: 0 });
        expect([404, 405], `${method.toUpperCase()} ${route} -> ${res.status()}`).toContain(res.status());
        expectNoAttachment(res, `${method.toUpperCase()} ${route}`);
      }
    }
  });

  test("anónimo: tampoco hay descarga posible (redirect a login o 404/405, nunca 200/attachment)", async ({ request }) => {
    for (const route of EXPORT_PATHS) {
      for (const method of ["get", "post"] as const) {
        const res = await request[method](route, { maxRedirects: 0 });
        expect(res.status(), `${method.toUpperCase()} ${route}`).not.toBe(200);
        expect([307, 308, 401, 403, 404, 405], `${method.toUpperCase()} ${route} -> ${res.status()}`).toContain(res.status());
        expectNoAttachment(res, `${method.toUpperCase()} ${route}`);
        // Sin cuerpo de leads
        expect(await res.text()).not.toContain(e2e.prefix);
      }
    }
  });
});
