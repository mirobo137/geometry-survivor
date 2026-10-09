import { expect, test, type Page } from '@playwright/test';
import { createDefaultSaveData } from '../../src/platform/save/SaveStore';

const seedWallet = async (page: Page, nova = 480, english = false): Promise<void> => {
  const data = { ...createDefaultSaveData(), wallet: { nova } };
  await page.addInitScript(({ data, english }) => {
    if (!localStorage.getItem('geometry-survivor:save')) localStorage.setItem('geometry-survivor:save', JSON.stringify(data));
    if (english) localStorage.setItem('geometry-survivor:language-preference', 'en');
  }, { data, english });
};

export const registerPurchaseChecks = (): void => {
  for (const [family, id, tab, saveKey] of [
    ['skin', 'cyan', 'player-skins', 'skins'],
    ['cannon', 'basic', 'cannon-skins', 'cannonSkins'],
    ['background', 'ion-storm', 'backgrounds', 'backgrounds']
  ] as const) {
    test(`compra con descuento del 25% en ${family}, cobra y persiste`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await seedWallet(page);
      await page.goto('/?ad=success&quality=low');
      await expect(page.locator('#boot-status')).toBeHidden();
      await page.locator('#start-skins').click();
      await page.locator(`#start-${tab}-tab`).click();
      const card = page.locator(`.${family}-card[data-${family}="${id}"]`);
      await expect(card.locator('.cosmetic-discount-badge')).toHaveText('OFERTA −25% · VIDEO + NOVA');
      if (!process.env.CI) await card.screenshot({ path: testInfo.outputPath(`offer-${family}.png`) });
      await card.locator('button').click();
      const quote = page.locator('#start-cosmetic-price-summary');
      await expect(quote).toContainText('600 NOVA');
      await expect(quote).toContainText('480 NOVA');
      await expect(quote).toContainText('120 NOVA');
      await expect(quote).toContainText('150 NOVA');
      await expect(quote).toContainText('450 NOVA');
      await expect(quote).toContainText('no la skin completa');
      const action = page.locator('#start-cosmetic-discount-action');
      await expect(action).toHaveText('Ver video y pagar · 450 NOVA');
      const bounds = await action.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { fits: rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight, height: rect.height };
      });
      expect(bounds.fits).toBe(true);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath(`discount-${family}.png`) });
      await action.click();
      await expect(page.locator('#start-cosmetic-status')).toContainText('Compra guardada');
      await expect(card).toHaveClass(/is-selected/);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
      expect(saved.wallet.nova).toBe(30);
      expect(saved[saveKey].selected).toBe(id);
      expect(saved[saveKey].unlocked).toContain(id);
      await page.reload();
      await expect(page.locator('#boot-status')).toBeHidden();
      const reloaded = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
      expect(reloaded.wallet.nova).toBe(30);
      expect(reloaded[saveKey].selected).toBe(id);
      expect(errors).toEqual([]);
    });
  }

  test('descuento de la skin de 9,600 NOVA cobra 7,200 y conserva el excedente', async ({ page }) => {
    await seedWallet(page, 8000);
    await page.goto('/?ad=success&quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="nautilus"] button').click();
    const quote = page.locator('#start-cosmetic-price-summary');
    for (const amount of ['9,600', '8,000', '1,600', '2,400', '7,200']) {
      await expect(quote).toContainText(amount + ' NOVA');
    }
    const action = page.locator('#start-cosmetic-discount-action');
    await expect(action).toHaveText('Ver video y pagar · 7,200 NOVA');
    await action.click();
    await expect(page.locator('#start-cosmetic-status')).toContainText('Compra guardada');
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
    expect(saved.wallet.nova).toBe(800);
    expect(saved.skins.selected).toBe('nautilus');
    expect(saved.skins.unlocked).toContain('nautilus');
  });

  for (const ad of ['dismissed', 'error', 'timeout'] as const) {
    test(`descuento ${ad} no cobra ni desbloquea`, async ({ page }) => {
      await seedWallet(page);
      await page.goto(`/?ad=${ad}&quality=low`);
      await expect(page.locator('#boot-status')).toBeHidden();
      await page.locator('#start-skins').click();
      await page.locator('.skin-card[data-skin="cyan"] button').click();
      await page.locator('#start-cosmetic-discount-action').click();
      await expect(page.locator('#start-cosmetic-status')).toContainText('No se cobró NOVA');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
      expect(saved.wallet.nova).toBe(480);
      expect(saved.skins.unlocked).not.toContain('cyan');
      await page.locator('#start-cosmetic-keep-saving').click();
      await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
    });
  }

  for (const [nova, ad] of [[449, 'success'], [600, 'success'], [480, 'unavailable']] as const) {
    test(`no ofrece descuento con saldo ${nova} y anuncio ${ad}`, async ({ page }) => {
      await seedWallet(page, nova);
      await page.goto(`/?ad=${ad}&quality=low`);
      await expect(page.locator('#boot-status')).toBeHidden();
      await page.locator('#start-skins').click();
      const card = page.locator('.skin-card[data-skin="cyan"]');
      await expect(card.locator('.cosmetic-discount-badge')).toBeHidden();
      await card.locator('button').click();
      await expect(page.locator('#start-cosmetic-discount-action')).toBeHidden();
      if (nova === 600) {
        await page.locator('#start-cosmetic-action').click();
        await expect(card).toHaveClass(/is-selected/);
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!).wallet.nova)).toBe(0);
      } else await expect(page.locator('#start-cosmetic-action')).toBeDisabled();
    });
  }

  test('descuento en inglés explica video y pago sin texto español', async ({ page }) => {
    await seedWallet(page, 480, true);
    await page.goto('/?ad=dismissed&quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="cyan"] button').click();
    await expect(page.locator('#start-cosmetic-price-summary')).toContainText('NOVA you will pay');
    await expect(page.locator('#start-cosmetic-discount-action')).toHaveText('Watch video and pay · 450 NOVA');
    await expect(page.locator('#start-cosmetic-price-summary')).toContainText('not the entire skin');
    await page.locator('#start-cosmetic-discount-action').click();
    await expect(page.locator('#start-cosmetic-status')).toContainText('No NOVA was charged');
  });

  for (const [width, height] of [[320, 568], [640, 360]] as const) {
    test(`modal de descuento conserva botones y scroll a ${width}x${height}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height });
      await seedWallet(page);
      await page.goto('/?ad=dismissed&quality=low');
      await expect(page.locator('#boot-status')).toBeHidden();
      await page.locator('#start-skins').click();
      await page.locator('.skin-card[data-skin="cyan"] button').click();
      for (const id of ['start-cosmetic-discount-action', 'start-cosmetic-keep-saving']) {
        const bounds = await page.locator(`#${id}`).evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { inside: rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
            height: rect.height, widthFits: element.scrollWidth <= element.clientWidth + 1 };
        });
        expect(bounds.inside).toBe(true);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.widthFits).toBe(true);
      }
      const shell = page.locator('.cosmetic-dialog-shell');
      await shell.evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect(await shell.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath(`discount-${width}.png`) });
      await page.locator('#start-cosmetic-keep-saving').click();
      await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
      await expect(page.locator('.skin-card[data-skin="cyan"] button')).toBeFocused();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!).wallet.nova)).toBe(480);
    });
  }
};
