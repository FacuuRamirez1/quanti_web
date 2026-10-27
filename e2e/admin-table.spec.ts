import { test, expect } from "@playwright/test";
import { e2e, loginAs, gotoAdmin, columnTexts } from "./helpers";

test.describe("Admin /admin — tabla de leads (4.3/4.4)", () => {
  test.beforeEach(async ({ page }) => {
    await e2e.resetLeads();
    await loginAs(page, "admin");
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("columnas en orden, <caption> y scope=col", async ({ page }) => {
    await e2e.seedLead({ nombre: "Ana" });
    await gotoAdmin(page);
    await expect(page.locator("thead th")).toHaveText([
      "Nombre",
      "Apellido",
      "Email",
      "Fecha",
      "Versión políticas",
      "Consentimiento",
    ]);
    await expect(page.locator("thead th[scope='col']")).toHaveCount(6);
    await expect(page.locator("table caption")).toHaveCount(1);
  });

  test("cada fila muestra nombre, apellido, email, versión y consentimiento sembrados", async ({ page }) => {
    const lead = await e2e.seedLead({
      nombre: "Lucía",
      apellido: "Fernández",
      tag: "datos",
      politicas_version: "2026-10-v3",
      consent_at: "2026-10-14T09:05:00.000Z",
      created_at: "2026-10-14T09:05:00.000Z",
    });
    await gotoAdmin(page);
    const cells = page.locator("tbody tr").first().locator("td");
    await expect(cells).toHaveCount(6);
    await expect(cells.nth(0)).toHaveText("Lucía");
    await expect(cells.nth(1)).toHaveText("Fernández");
    await expect(cells.nth(2)).toHaveText(lead.email);
    await expect(cells.nth(4)).toHaveText("2026-10-v3");
    await expect(cells.nth(5)).toHaveText("14/10/26, 9:05 a. m. UTC");
  });

  test("orden created_at DESC; con timestamps empatados desempata por id DESC", async ({ page }) => {
    const oldest = await e2e.seedLead({ tag: "viejo", created_at: "2026-10-10T10:00:00.000Z" });
    const tied = [];
    for (let i = 0; i < 3; i++) {
      tied.push(await e2e.seedLead({ tag: `empate${i}`, created_at: "2026-10-12T10:00:00.000Z" }));
    }
    const newest = await e2e.seedLead({ tag: "nuevo", created_at: "2026-10-14T10:00:00.000Z" });

    const tiedByIdDesc = [...tied].sort((a, b) => b.id - a.id).map((l) => l.email);
    // Sanidad del escenario: el orden de inserción (id ascendente) NO coincide con el esperado.
    expect(tiedByIdDesc[0]).toBe(tied[2].email);

    await gotoAdmin(page);
    expect(await columnTexts(page, 2)).toEqual([newest.email, ...tiedByIdDesc, oldest.email]);
  });

  test("<time datetime> ISO UTC y texto es-AR con sufijo UTC (independiente de la zona del navegador)", async ({ page }) => {
    await e2e.seedLead({ tag: "borde1", created_at: "2026-10-15T23:59:59.000Z" });
    await e2e.seedLead({ tag: "borde2", created_at: "2026-10-16T00:00:00.000Z" });
    await gotoAdmin(page);

    const times = page.locator("tbody tr td:nth-child(4) time");
    await expect(times).toHaveCount(2);
    // Orden DESC: primero 2026-10-16T00:00Z, después 2026-10-15T23:59:59Z
    await expect(times.nth(0)).toHaveAttribute("datetime", "2026-10-16T00:00:00.000Z");
    await expect(times.nth(0)).toHaveText("16/10/26, 12:00 a. m. UTC");
    await expect(times.nth(1)).toHaveAttribute("datetime", "2026-10-15T23:59:59.000Z");
    await expect(times.nth(1)).toHaveText("15/10/26, 11:59 p. m. UTC");
  });

  test("consent_at con offset -03:00 se muestra normalizado a UTC", async ({ page }) => {
    await e2e.seedLead({ tag: "offset", consent_at: "2026-10-15T20:30:00-03:00" });
    await gotoAdmin(page);
    const consent = page.locator("tbody tr td:nth-child(6) time");
    await expect(consent).toHaveAttribute("datetime", "2026-10-15T23:30:00.000Z");
    await expect(consent).toHaveText("15/10/26, 11:30 p. m. UTC");
  });

  test("politicas_version y consent_at nulos muestran 'Sin registro' (sin <time> en consentimiento)", async ({ page }) => {
    await e2e.seedLead({ nombre: "SinConsent", tag: "nulos", politicas_version: null, consent_at: null });
    await gotoAdmin(page);
    const cells = page.locator("tbody tr").first().locator("td");
    await expect(cells.nth(4)).toHaveText("Sin registro");
    await expect(cells.nth(5)).toHaveText("Sin registro");
    await expect(cells.nth(5).locator("time")).toHaveCount(0);
    // La fecha de alta sí existe siempre
    await expect(cells.nth(3).locator("time")).toHaveCount(1);
  });

  test("el contenido de usuario se escapa (no se interpreta HTML)", async ({ page }) => {
    await e2e.seedLead({ nombre: "<b>negrita</b>", apellido: "<img src=x onerror=alert(1)>", tag: "xss" });
    await gotoAdmin(page);
    const cells = page.locator("tbody tr").first().locator("td");
    await expect(cells.nth(0)).toHaveText("<b>negrita</b>");
    await expect(cells.nth(1)).toHaveText("<img src=x onerror=alert(1)>");
    await expect(page.locator("tbody b, tbody img")).toHaveCount(0);
  });
});
