import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { e2e, loginAs, gotoAdmin, columnTexts, settled, type TestRole } from "./helpers";

const ROLES: TestRole[] = ["admin", "superadmin"];
const PAGINATION = 'nav[aria-label="Paginación de leads"]';

/** Presiona Tab hasta que `target` tenga el foco (solo teclado). Falla si no lo alcanza. */
async function tabTo(page: Page, target: Locator, maxTabs = 60): Promise<number> {
  for (let i = 1; i <= maxTabs; i++) {
    await page.keyboard.press("Tab");
    const focused = await target.evaluate((el) => el === document.activeElement).catch(() => false);
    if (focused) return i;
  }
  throw new Error(`El elemento no se alcanzó con Tab en ${maxTabs} pulsaciones`);
}

/**
 * Indicador de foco visible: outline real (estilo != none, ancho > 0, color no transparente)
 * o una capa de box-shadow con color opaco y extensión real. Ojo: Tailwind deja un box-shadow
 * "vacío" (rgba(0,0,0,0) 0 0 0 0) en todos los elementos; eso NO cuenta como indicador.
 */
async function focusIndicator(target: Locator): Promise<{ outline: boolean; shadow: boolean; raw: string }> {
  return target.evaluate((el) => {
    const cs = getComputedStyle(el);
    const alphaOf = (color: string): number => {
      const m = color.match(/rgba?\(([^)]+)\)/);
      if (!m) return color === "transparent" ? 0 : 1;
      const parts = m[1].split(/[,\s/]+/).filter(Boolean);
      return parts.length >= 4 ? parseFloat(parts[3]) : 1;
    };
    const outline =
      cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 && alphaOf(cs.outlineColor) > 0;
    // Separar capas por comas fuera de paréntesis
    const layers: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of cs.boxShadow) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        layers.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) layers.push(cur.trim());
    const shadow = layers.some((layer) => {
      if (layer === "none" || layer === "") return false;
      const color = layer.match(/rgba?\([^)]*\)/)?.[0] ?? "";
      const nums = layer.replace(/rgba?\([^)]*\)/, "").match(/-?\d+(\.\d+)?px/g) ?? [];
      const extent = nums.some((n) => parseFloat(n) !== 0);
      return alphaOf(color) > 0 && extent;
    });
    return { outline, shadow, raw: cs.boxShadow };
  });
}

async function expectVisibleFocus(target: Locator, label: string): Promise<void> {
  const ind = await focusIndicator(target);
  expect(ind.outline || ind.shadow, `${label}: sin indicador de foco visible (${JSON.stringify(ind)})`).toBe(true);
}

for (const role of ROLES) {
  test.describe(`Admin accesibilidad (5.1) — ${role}`, () => {
    test.beforeEach(async ({ page }) => {
      await e2e.resetLeads();
      // 45 leads => 3 páginas de 20: la tabla Y la paginación se renderizan.
      await e2e.seedLeads(45, { namePrefix: "Lead", tag: "a11y" });
      await loginAs(page, role);
      await gotoAdmin(page);
    });

    test.afterEach(async () => {
      await e2e.cleanupAllE2E();
    });

    test("axe wcag2a/wcag2aa: 0 violaciones critical/serious con tabla y paginación renderizadas", async ({ page }) => {
      // Precondición: lo que se escanea realmente existe
      await expect(page.locator("tbody tr")).toHaveCount(20);
      await expect(page.locator(PAGINATION)).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

      // El contraste (>= 4.5:1) se evaluó de verdad (no quedó como "incomplete"/omitido)
      expect(results.passes.map((r) => r.id)).toContain("color-contrast");
      expect(results.passes.map((r) => r.id)).toContain("th-has-data-cells");

      const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      const detail = blocking
        .map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)
        .join("\n");
      expect(blocking, detail).toEqual([]);
    });

    test("tabla: <caption> con texto y todos los th con scope=col", async ({ page }) => {
      const caption = page.locator("table > caption");
      await expect(caption).toHaveCount(1);
      await expect(caption).toHaveText(/Leads registrados \(20 en esta página\)/);

      const ths = page.locator("table thead th");
      await expect(ths).toHaveCount(6);
      const scopes = await ths.evaluateAll((els) => els.map((el) => el.getAttribute("scope")));
      expect(scopes).toEqual(["col", "col", "col", "col", "col", "col"]);
      // Ningún th suelto fuera del thead sin scope
      const withoutScope = await page.locator("table th:not([scope])").count();
      expect(withoutScope).toBe(0);
    });

    test("solo teclado: Tab alcanza filtros, Filtrar y paginación, cada uno con foco visible", async ({ page }) => {
      const stops: Array<[string, Locator]> = [
        ["input Nombre", page.locator("#filter-nombre")],
        ["input Email", page.locator("#filter-email")],
        ["input Desde", page.locator("#filter-from")],
        ["input Hasta", page.locator("#filter-to")],
        ["botón Filtrar", page.getByRole("button", { name: "Filtrar" })],
        ["link Siguiente", page.locator(`${PAGINATION} a[rel="next"]`)],
      ];
      let lastTabs = 0;
      for (const [label, loc] of stops) {
        // Nota: los date inputs tienen sub-campos internos que consumen Tabs; tabTo tolera varios.
        lastTabs = await tabTo(page, loc, 80);
        expect(lastTabs, label).toBeGreaterThan(0);
        await expect(loc, label).toBeFocused();
        await expectVisibleFocus(loc, label);
      }
    });

    test("Enter en un input de filtro aplica el filtro (URL y resultados cambian)", async ({ page }) => {
      await e2e.seedLead({ nombre: "Zoilo", tag: "zoilo" });
      await gotoAdmin(page);
      const before = await page.locator("tbody tr").count();

      await tabTo(page, page.locator("#filter-nombre"));
      await page.keyboard.type("zoi");
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/admin\?nombre=zoi(&|$)/);
      await settled(page);
      expect(await columnTexts(page, 0)).toEqual(["Zoilo"]);
      expect(before).toBeGreaterThan(1);
    });

    test("paginación operable solo con teclado: Tab hasta Siguiente + Enter => página 2; luego Anterior + Enter => página 1", async ({ page }) => {
      const next = page.locator(`${PAGINATION} a[rel="next"]`);
      await tabTo(page, next, 80);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/admin\?page=2$/);
      await settled(page);
      await expect(page.locator(`${PAGINATION} [aria-current="page"]`)).toHaveText("Página 2 de 3");
      // Lead0..Lead19 en pág 1; la 2 empieza en Lead20
      expect((await columnTexts(page, 0))[0]).toBe("Lead20");

      const prev = page.locator(`${PAGINATION} a[rel="prev"]`);
      await tabTo(page, prev, 80);
      await expectVisibleFocus(prev, "link Anterior");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/admin$/);
      await settled(page);
      expect((await columnTexts(page, 0))[0]).toBe("Lead0");
    });
  });
}
