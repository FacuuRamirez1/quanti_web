import { test, expect, type Page } from "@playwright/test";
import { e2e, loginAs, gotoAdmin, columnTexts, settled } from "./helpers";

function query(params: Record<string, string>): string {
  return `?${new URLSearchParams(params).toString()}`;
}

const names = (page: Page) => columnTexts(page, 0);

test.describe("Admin /admin — filtros (4.5/4.6)", () => {
  test.beforeEach(async ({ page }) => {
    await e2e.resetLeads();
    await loginAs(page, "admin");
  });

  test.afterEach(async () => {
    await e2e.cleanupAllE2E();
  });

  test("nombre parcial case-insensitive vía el formulario (solo columna nombre, no apellido)", async ({ page }) => {
    await e2e.seedLead({ nombre: "García", apellido: "López", tag: "garcia" });
    await e2e.seedLead({ nombre: "Martín", apellido: "García", tag: "martin" });
    await e2e.seedLead({ nombre: "Ana", apellido: "Martínez", tag: "ana" });

    await gotoAdmin(page);
    await page.fill("#filter-nombre", "GAR");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/\/admin\?nombre=GAR(&|$)/);
    await settled(page);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    expect(await names(page)).toEqual(["García"]);
    // El valor ingresado se conserva en el input
    await expect(page.locator("#filter-nombre")).toHaveValue("GAR");
  });

  test("Enter en un campo envía el formulario", async ({ page }) => {
    await e2e.seedLead({ nombre: "Sofía", tag: "sofia" });
    await e2e.seedLead({ nombre: "Pedro", tag: "pedro" });
    await gotoAdmin(page);
    await page.fill("#filter-nombre", "sof");
    await page.press("#filter-nombre", "Enter");
    await expect(page).toHaveURL(/nombre=sof/);
    await settled(page);
    expect(await names(page)).toEqual(["Sofía"]);
  });

  test("email parcial case-insensitive (acepta fragmentos que no son un email válido)", async ({ page }) => {
    await e2e.seedLead({ nombre: "Uno", tag: "martin" });
    await e2e.seedLead({ nombre: "Dos", tag: "otra" });
    await gotoAdmin(page);
    await page.fill("#filter-email", "MARTIN");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/email=MARTIN/);
    await settled(page);
    expect(await names(page)).toEqual(["Uno"]);
  });

  test("'%' se busca como literal (no como comodín)", async ({ page }) => {
    await e2e.seedLead({ nombre: "50%off", tag: "pct" });
    await e2e.seedLead({ nombre: "50xoff", tag: "nopct" });
    await e2e.seedLead({ nombre: "Otro", tag: "otro" });

    await gotoAdmin(page, query({ nombre: "50%" }));
    expect(await names(page)).toEqual(["50%off"]);
    await gotoAdmin(page, query({ nombre: "%" }));
    expect(await names(page)).toEqual(["50%off"]);
  });

  test("'_' se busca como literal (no como un carácter cualquiera)", async ({ page }) => {
    await e2e.seedLead({ nombre: "a_b", tag: "under" });
    await e2e.seedLead({ nombre: "axb", tag: "nounder" });

    await gotoAdmin(page, query({ nombre: "a_b" }));
    expect(await names(page)).toEqual(["a_b"]);
    await gotoAdmin(page, query({ nombre: "_" }));
    expect(await names(page)).toEqual(["a_b"]);
  });

  test("'_' literal también en el filtro de email", async ({ page }) => {
    await e2e.seedLead({ nombre: "ConGuion", tag: "under_score" });
    await e2e.seedLead({ nombre: "SinGuion", tag: "underXscore" });
    await gotoAdmin(page, query({ email: "under_score" }));
    expect(await names(page)).toEqual(["ConGuion"]);
  });

  test("'*' se busca como literal (PostgREST lo trata como comodín en ilike: se usa imatch)", async ({ page }) => {
    await e2e.seedLead({ nombre: "a*b", tag: "star" });
    await e2e.seedLead({ nombre: "axxb", tag: "nostar" });
    await e2e.seedLead({ nombre: "ab", tag: "nostar2" });

    await gotoAdmin(page, query({ nombre: "a*b" }));
    expect(await names(page)).toEqual(["a*b"]);
    await gotoAdmin(page, query({ nombre: "*" }));
    expect(await names(page)).toEqual(["a*b"]);
  });

  test("términos con metacaracteres de regex y '*' no rompen la consulta y matchean literal", async ({ page }) => {
    await e2e.seedLead({ nombre: "x(*)[y", tag: "regex" });
    await e2e.seedLead({ nombre: "xzy", tag: "noregex" });
    await gotoAdmin(page, query({ nombre: "x(*)[" }));
    await expect(page.getByRole("alert").filter({ hasText: "No pudimos cargar" })).toHaveCount(0);
    expect(await names(page)).toEqual(["x(*)[y"]);
    // Backslash y barra con '*': también literales
    await e2e.seedLead({ nombre: String.raw`p\q*|r`, tag: "regex2" });
    await gotoAdmin(page, query({ nombre: String.raw`p\q*|r` }));
    expect(await names(page)).toEqual([String.raw`p\q*|r`]);
  });

  test("rango de fechas UTC inclusivo en ambos bordes (from 00:00:00.000Z / to hasta 23:59:59.999Z)", async ({ page }) => {
    await e2e.seedLead({ nombre: "antes", tag: "antes", created_at: "2026-10-18T23:59:59.999Z" });
    await e2e.seedLead({ nombre: "inicio", tag: "inicio", created_at: "2026-10-19T00:00:00.000Z" });
    await e2e.seedLead({ nombre: "fin", tag: "fin", created_at: "2026-10-20T23:59:59.999Z" });
    await e2e.seedLead({ nombre: "despues", tag: "despues", created_at: "2026-10-21T00:00:00.000Z" });

    await gotoAdmin(page);
    await page.fill("#filter-from", "2026-10-19");
    await page.fill("#filter-to", "2026-10-20");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/from=2026-10-19&to=2026-10-20$/);
    await settled(page);
    expect(await names(page)).toEqual(["fin", "inicio"]);

    // Reenviar el formulario no corre las fechas (regresión: to se desplazaba un día por submit)
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/from=2026-10-19&to=2026-10-20$/);
    await settled(page);
    await expect(page.locator("#filter-to")).toHaveValue("2026-10-20");
    expect(await names(page)).toEqual(["fin", "inicio"]);

    // Solo from y solo to
    await gotoAdmin(page, query({ from: "2026-10-20" }));
    expect(await names(page)).toEqual(["despues", "fin"]);
    await gotoAdmin(page, query({ to: "2026-10-19" }));
    expect(await names(page)).toEqual(["inicio", "antes"]);
  });

  test("from == to devuelve ese día completo", async ({ page }) => {
    await e2e.seedLead({ nombre: "d00", tag: "d00", created_at: "2026-10-15T00:00:00.000Z" });
    await e2e.seedLead({ nombre: "d23", tag: "d23", created_at: "2026-10-15T23:59:59.999Z" });
    await e2e.seedLead({ nombre: "otro", tag: "otro", created_at: "2026-10-16T00:00:00.000Z" });
    await gotoAdmin(page, query({ from: "2026-10-15", to: "2026-10-15" }));
    expect(await names(page)).toEqual(["d23", "d00"]);
  });

  test("combinación AND de nombre + email + fecha", async ({ page }) => {
    await e2e.seedLead({ nombre: "Martín", tag: "martin", created_at: "2026-10-15T12:00:00.000Z" });
    await e2e.seedLead({ nombre: "Marta", tag: "marta", created_at: "2026-10-15T12:00:00.000Z" });
    await e2e.seedLead({ nombre: "Martina", tag: "martin2", created_at: "2026-10-01T12:00:00.000Z" });
    await e2e.seedLead({ nombre: "Ana", tag: "martin3", created_at: "2026-10-15T12:00:00.000Z" });

    // nombre "mar" AND email "martin" AND from 10-10 => solo Martín (Marta: email distinto; Martina: fecha; Ana: nombre)
    await gotoAdmin(page, query({ nombre: "mar", email: "martin", from: "2026-10-10" }));
    expect(await names(page)).toEqual(["Martín"]);

    // Con OR daría resultados: con AND, nombre y email contradictorios => sin resultados
    await gotoAdmin(page, query({ nombre: "Marta", email: "martin2" }));
    await expect(page.getByText("No hay resultados para los filtros aplicados")).toBeVisible();
  });

  test("filtros inválidos se ignoran sin romper la página; los válidos siguen aplicando", async ({ page }) => {
    await e2e.seedLead({ nombre: "García", tag: "g", created_at: "2026-10-15T12:00:00.000Z" });
    await e2e.seedLead({ nombre: "Pérez", tag: "p", created_at: "2026-10-15T12:00:00.000Z" });

    // from > to: ambos se descartan, lista completa, campos vacíos
    await gotoAdmin(page, query({ from: "2026-10-20", to: "2026-10-10" }));
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect(page.locator("#filter-from")).toHaveValue("");
    await expect(page.locator("#filter-to")).toHaveValue("");

    // fecha imposible / formato inválido
    for (const bad of ["2026-02-30", "abc", "2026-13-01", "31/12/2026"]) {
      await gotoAdmin(page, query({ from: bad }));
      await expect(page.locator("tbody tr")).toHaveCount(2);
    }

    // Un parámetro inválido no descarta a los válidos
    await gotoAdmin(page, query({ nombre: "Garc", from: "zzz", page: "abc" }));
    expect(await names(page)).toEqual(["García"]);

    // nombre de más de 100 caracteres se ignora
    await gotoAdmin(page, query({ nombre: "a".repeat(101) }));
    await expect(page.locator("tbody tr")).toHaveCount(2);

    // repetidos: se toma el primero
    await gotoAdmin(page, "?nombre=Garc&nombre=Pérez");
    expect(await names(page)).toEqual(["García"]);
  });

  test("entrada con sintaxis de PostgREST no inyecta filtros (sin error, sin resultados)", async ({ page }) => {
    await e2e.seedLead({ nombre: "Normal", tag: "n" });
    await gotoAdmin(page, query({ nombre: "x),email.ilike.%" }));
    await expect(page.getByText("No hay resultados para los filtros aplicados")).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "No pudimos cargar" })).toHaveCount(0);
  });

  test("sin resultados: mensaje, 'Limpiar filtros' vuelve a /admin con la lista completa", async ({ page }) => {
    await e2e.seedLeads(3, { namePrefix: "Persona" });
    await gotoAdmin(page, query({ nombre: "ZZZZZZZZ" }));

    await expect(page.getByText("No hay resultados para los filtros aplicados")).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
    const clearLinks = page.getByRole("link", { name: "Limpiar filtros" });
    await expect(clearLinks).toHaveCount(2); // formulario + estado vacío
    for (let i = 0; i < 2; i++) {
      await expect(clearLinks.nth(i)).toHaveAttribute("href", "/admin");
    }
    await clearLinks.last().click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator("tbody tr")).toHaveCount(3);
  });

  test("'Limpiar filtros' del formulario solo aparece con filtros activos", async ({ page }) => {
    await e2e.seedLead({ nombre: "Ana", tag: "ana" });
    await gotoAdmin(page);
    await expect(page.getByRole("link", { name: "Limpiar filtros" })).toHaveCount(0);
    await gotoAdmin(page, query({ nombre: "Ana" }));
    await expect(page.getByRole("link", { name: "Limpiar filtros" })).toHaveCount(1);
  });
});
