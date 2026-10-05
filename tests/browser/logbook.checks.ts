import { expect, test, type Page } from '@playwright/test';

const readSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
const open = async (page: Page) => {
  await page.goto('/?quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-retention').click();
  await expect(page.locator('#start-retention-view')).toBeVisible();
};
const seed = (page: Page) => page.addInitScript(() => {
  if (localStorage.getItem('geometry-survivor:save')) return;
  localStorage.setItem('geometry-survivor:save', JSON.stringify({ schemaVersion: 13, wallet: { nova: 250 }, retention: {
    objectiveCycles: {
      'first-flight': { claimed: 0, value: 1 }, 'radial-clear': { claimed: 0, value: 1 }, 'core-hunter': { claimed: 0, value: 1 }
    }
  } }));
});

export const registerLogbookChecks = (): void => {
  test('bitácora: cobra manualmente, renueva generales y retira objetivos de campaña', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await seed(page);
    await open(page);
    const first = page.locator('[data-objective="first-flight"]');
    await expect(first).toContainText('COBRAR +50 NOVA');
    expect((await readSave(page)).wallet.nova).toBe(250); // Opening never pays.
    await first.click();
    await expect(first).toContainText('Rango 2');
    await expect(first).toContainText('0 / 2');
    await expect(first).toContainText('+63 NOVA');
    expect((await readSave(page)).wallet.nova).toBe(300);
    await first.click(); // Tracks an incomplete round, cannot pay again.
    expect((await readSave(page)).wallet.nova).toBe(300);
    await page.locator('[data-objective="radial-clear"]').click();
    await expect(page.locator('[data-objective="radial-clear"]')).toHaveCount(0);
    await page.locator('[data-objective="core-hunter"]').click();
    await expect(page.locator('[data-objective="core-hunter"]')).toHaveCount(0);
    expect((await readSave(page)).wallet.nova).toBe(475);
    await page.locator('#start-retention-back').click();
    await page.locator('#start-retention').click();
    await expect(first).toContainText('Rango 2');
    expect(await page.locator('#start-retention-body').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (!process.env.CI) await page.screenshot({ path: info.outputPath('logbook-rank-2.png') });
    await page.reload();
    await page.locator('#start-retention').click();
    await expect(first).toContainText('0 / 2');
    await expect(page.locator('[data-objective="radial-clear"]')).toHaveCount(0);
    expect((await readSave(page)).wallet.nova).toBe(475);
    expect(errors).toEqual([]);
  });

  test('bitácora: conserva el cobro pendiente tras error de almacenamiento y excluye otra pestaña', async ({ page, context }) => {
    await seed(page);
    await open(page);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if ((window as unknown as { failClaim: boolean }).failClaim && key === 'geometry-survivor:save') throw new Error('quota');
        return original.call(this, key, value);
      };
      (window as unknown as { failClaim: boolean }).failClaim = true;
    });
    await page.locator('[data-objective="first-flight"]').click();
    await expect(page.locator('.retention-claim-message')).toContainText('sigue pendiente');
    expect((await readSave(page)).wallet.nova).toBe(250);
    await expect(page.locator('[data-objective="first-flight"]')).toContainText('COBRAR');
    await page.evaluate(() => { (window as unknown as { failClaim: boolean }).failClaim = false; });
    const other = await context.newPage();
    await open(other);
    await other.locator('[data-objective="first-flight"]').click();
    await expect(other.locator('[data-objective="first-flight"]')).toContainText('Rango 2');
    await page.locator('[data-objective="first-flight"]').click(); // Stale ready button rechecks durable save.
    await expect(page.locator('[data-objective="first-flight"]')).toContainText('Rango 2');
    expect((await readSave(page)).wallet.nova).toBe(300);
    await other.close();
  });
};
