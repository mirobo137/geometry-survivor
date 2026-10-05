import { expect, test } from '@playwright/test';

export const registerCatalogChecks = (): void => {
  test('presenta diez cosméticos por familia, compra las siete novedades y conserva el catálogo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      if (!localStorage.getItem('geometry-survivor:save')) localStorage.setItem('geometry-survivor:save',
        JSON.stringify({ schemaVersion: 8, wallet: { nova: 30_000 } }));
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    const groups = [
      { tab: '#start-player-skins-tab', cards: '.skin-card', data: 'skin', ids: ['corsair', 'nautilus'] },
      { tab: '#start-cannon-skins-tab', cards: '.cannon-card', data: 'cannon', ids: ['gyre', 'razor'] },
      { tab: '#start-backgrounds-tab', cards: '.background-card', data: 'background', ids: ['silent-archive', 'lunar-fault', 'leviathan-wake'] }
    ];
    for (const group of groups) {
      await page.locator(group.tab).click();
      await expect(page.locator(group.cards)).toHaveCount(group.data === 'skin' ? 12 : 10);
      for (const id of group.ids) {
        await page.locator(`${group.cards}[data-${group.data}="${id}"] button`).click();
        await expect(page.locator('#start-cosmetic-action')).toBeEnabled();
        if (group.data === 'background') {
          await expect(page.locator('#start-cosmetic-preview .cosmetic-background-current')).toHaveCount(4);
          const background = await page.locator('#start-cosmetic-preview .background-preview').evaluate(el => getComputedStyle(el).backgroundImage);
          expect(background).toContain(id + '-preview-');
        }
        await page.locator('#start-cosmetic-action').click();
      }
    }
    await page.locator('#start-skins-back').click();
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'nautilus');
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-art-state', 'ready');
    expect(await page.locator('.home-mark-image').evaluate(image => (image as HTMLImageElement).currentSrc)).toContain('nautilus-');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
    expect(saved.skins.selected).toBe('nautilus');
    expect(saved.skins.unlocked).toEqual(expect.arrayContaining(['cyan', 'corsair', 'nautilus']));
    expect(saved.cannonSkins.selected).toBe('razor');
    expect(saved.cannonSkins.unlocked).toEqual(expect.arrayContaining(['basic', 'gyre', 'razor']));
    expect(saved.backgrounds.selected).toBe('leviathan-wake');
    expect(saved.backgrounds.unlocked).toEqual(expect.arrayContaining(['deep-space', 'silent-archive', 'lunar-fault']));
    expect(saved.wallet.nova).toBe(9000);
    expect(errors).toEqual([]);
  });
};
