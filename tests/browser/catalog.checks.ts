import { expect, test } from '@playwright/test';

export const registerCatalogChecks = (): void => {
  test('equipa la colección completa en los catálogos normales sin escribir el guardado de prueba', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?debug=1&reward-catalog=1&quality=' + (testInfo.project.name === 'desktop' ? 'high' : 'low'));
    await expect(page.locator('#boot-status')).toBeHidden();
    const savedBefore = await page.evaluate(() => localStorage.getItem('geometry-survivor:save'));
    const groups = [
      { tab: '#start-player-skins-tab', cards: '.skin-card', data: 'skin', id: 'riftwake-strider' },
      { tab: '#start-cannon-skins-tab', cards: '.cannon-card', data: 'cannon', id: 'jade-serpent' },
      { tab: '#start-backgrounds-tab', cards: '.background-card', data: 'background', id: 'ember-remnant' }
    ];
    for (const group of groups) {
      await page.locator(group.tab).click();
      await expect(page.locator(group.cards)).toHaveCount(20);
      await page.locator(`${group.cards}[data-${group.data}="${group.id}"] button`).click();
      await expect(page.locator('#start-cosmetic-action')).toHaveText(/^Equipar (nave|disparo|fondo)$/);
      if (group.data === 'cannon') {
        const image = page.locator('#start-cosmetic-preview .cannon-preview-head-art').first();
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('href', /jade-serpent-head/);
      }
      await page.screenshot({ path: testInfo.outputPath('reward-' + group.data + '.png') });
      await page.locator('#start-cosmetic-action').click();
      await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
    }
    await page.locator('#start-skins-back').click();
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'riftwake-strider');
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: testInfo.outputPath('reward-battle.png') });
    expect(await page.evaluate(() => localStorage.getItem('geometry-survivor:save'))).toBe(savedBefore);
    expect(errors).toEqual([]);
  });

  test('redirige las recompensas actuales y bloquea las de otra temporada sin venderlas por NOVA', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="asterion"] button').click();
    await expect(page.locator('#start-cosmetic-action')).toHaveText('Ir a Retos y Bitácora');
    await page.locator('#start-cosmetic-action').click();
    await expect(page.locator('#start-retention-view')).toBeVisible();
    await page.locator('#start-retention-back').click();
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="solstice"] button').click();
    await page.locator('#start-cosmetic-action').click();
    await expect(page.locator('#daily-wheel-dialog')).toBeVisible();
    await page.locator('.daily-wheel-close').click();
    await page.locator('#start-skins').click();
    await page.locator('#start-cannon-skins-tab').click();
    await page.locator('.cannon-card[data-cannon="frostbite"] button').click();
    await expect(page.locator('#start-cosmetic-action')).toHaveText('Fuera de temporada');
    await expect(page.locator('#start-cosmetic-action')).toBeDisabled();
    await page.locator('#start-cosmetic-close').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
    expect(saved.cannonSkins?.unlocked ?? []).not.toContain('frostbite');
  });

  for (const reward of [
    { week: 5, id: 'frostbite', name: 'Frostbite', family: 'cannonSkins', tab: '#start-cannon-skins-tab', card: '.cannon-card', data: 'cannon' },
    { week: 10, id: 'frozen-meridian', name: 'Frozen Meridian', family: 'backgrounds', tab: '#start-backgrounds-tab', card: '.background-card', data: 'background' }
  ] as const) test('ruleta de temporada concede y equipa ' + reward.id, async ({ page }) => {
    await page.clock.setFixedTime(new Date(Date.UTC(2026, 9, 5, 12) + reward.week*7*86400000));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      const original = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = ((array: Uint32Array) => {
        if (array instanceof Uint32Array && array.length === 1) { array[0] = 0xffffffff; return array; }
        return original(array);
      }) as typeof crypto.getRandomValues;
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-daily-wheel').click();
    await expect(page.locator('.daily-wheel-prize h3')).toHaveText(reward.name);
    await page.locator('#daily-wheel-free').click();
    await expect(page.locator('.daily-wheel-result')).toContainText(reward.name + ' desbloqueada');
    await page.locator('.daily-wheel-equip').click();
    await page.locator('.daily-wheel-close').click();
    await page.locator('#start-skins').click();
    await page.locator(reward.tab).click();
    await page.locator(`${reward.card}[data-${reward.data}="${reward.id}"] button`).click();
    await expect(page.locator('#start-cosmetic-action')).toHaveText('Equipado');
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
    expect(save[reward.family].selected).toBe(reward.id);
    expect(save[reward.family].unlocked).toContain(reward.id);
  });

  test('presenta veinte cosméticos por familia, compra las siete novedades y conserva el catálogo', async ({ page }) => {
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
      await expect(page.locator(group.cards)).toHaveCount(20);
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
