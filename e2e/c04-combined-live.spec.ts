import { test, expect } from "@playwright/test";
import { supabase, loginAs, settled } from "./helpers";

/**
 * C-05 6.1 / C-04 6.1: sesion live combinada. Registra un lead real desde la landing,
 * lo verifica en la tabla de /admin con sesion admin real y lo borra con service_role.
 * Solo toca filas con email `verify-lead-<epoch>@quanti-test.local`.
 */
test.describe("C-04 + C-05 combinada (live)", () => {
  const email = process.env.E2E_VERIFY_EMAIL_OVERRIDE ?? `verify-lead-${Date.now()}@quanti-test.local`;

  test.afterEach(async () => {
    await supabase.from("posibles_clientes").delete().eq("email", email);
  });

  test("lead registrado en / aparece en /admin con version y consentimiento", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="nombre"]', "Verificacion");
    await page.fill('input[name="apellido"]', "Live");
    await page.fill('input[name="email"]', email);
    await page.check('input[name="acepta_politicas"]');
    await page.click('button[type="submit"]:has-text("Notificarme")');
    await expect(page.getByText("¡Te avisaremos del lanzamiento!")).toBeVisible({ timeout: 20_000 });

    // Persistencia (service_role)
    const { data: row, error } = await supabase
      .from("posibles_clientes")
      .select("id, politicas_version, consent_at")
      .eq("email", email)
      .single();
    expect(error).toBeNull();
    expect(row?.politicas_version).toBe("v1.0");
    expect(row?.consent_at).toBeTruthy();

    // UI /admin con sesion admin real
    await loginAs(page, "admin");
    await settled(page);
    const tr = page.locator("tbody tr", { hasText: email });
    await expect(tr).toHaveCount(1);
    const cells = (await tr.locator("td").allTextContents()).map((t) => t.trim());
    expect(cells[0]).toBe("Verificacion");
    expect(cells[1]).toBe("Live");
    expect(cells[2]).toBe(email);
    expect(cells[3]).not.toBe("");
    expect(cells[4]).toBe("v1.0");
    expect(cells[5]).toMatch(/\d/);
    console.log(`[C05-6.1] fila UI id=${row?.id}: ${JSON.stringify(cells)}`);

    // Borrado y tabla limpia
    const del = await supabase.from("posibles_clientes").delete().eq("id", row!.id);
    expect(del.error).toBeNull();
    await page.reload();
    await settled(page);
    await expect(page.locator("tbody tr", { hasText: email })).toHaveCount(0);
  });
});
