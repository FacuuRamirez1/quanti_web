import { test, expect } from "@playwright/test";
import { e2e, loginAs } from "./helpers";

const SECRET_NAME = "NombreSecretoE2E";

test.describe("Admin /admin — autorización (4.1/4.2)", () => {
  let secretEmail = "";

  test.beforeEach(async () => {
    await e2e.resetLeads();
    const lead = await e2e.seedLead({ nombre: SECRET_NAME, apellido: "Reservado", tag: "secreto" });
    secretEmail = lead.email;
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("anónimo: /admin redirige a /admin/login?next=%2Fadmin y no filtra leads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acceso de administración");
    const html = await page.content();
    expect(html).not.toContain(SECRET_NAME);
    expect(html).not.toContain(secretEmail);
  });

  test("anónimo: la petición HTTP directa a /admin es un redirect sin contenido de leads", async ({ request }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/admin/login?next=%2Fadmin");
    const body = await res.text();
    expect(body).not.toContain(SECRET_NAME);
  });

  test("autenticado sin rol: 403 'Acceso denegado' sin tabla ni datos de leads", async ({ page }) => {
    await loginAs(page, "norole");
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acceso denegado");
    await expect(page.getByText("No tenés permiso para ver esta sección")).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
    await expect(page.locator("form[method='GET']")).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toContain(SECRET_NAME);
    expect(html).not.toContain(secretEmail);
  });

  for (const role of ["admin", "superadmin"] as const) {
    test(`${role}: ve la tabla con las 6 columnas y el lead sembrado`, async ({ page }) => {
      await loginAs(page, role);
      const res = await page.goto("/admin");
      expect(res?.status()).toBe(200);
      await expect(page.locator("table")).toBeVisible();
      await expect(page.locator("thead th")).toHaveText([
        "Nombre",
        "Apellido",
        "Email",
        "Fecha",
        "Versión políticas",
        "Consentimiento",
      ]);
      const row = page.locator("tbody tr", { hasText: SECRET_NAME });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(secretEmail);
    });
  }
});
