import { expect, test, type Page } from '@playwright/test';

const save = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{"wallet":{"nova":0}}'));
const open = async (page: Page, query = '') => {
  await page.goto('/?quality=low' + query);
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-daily-wheel').click();
  await expect(page.locator('#daily-wheel-dialog')).toBeVisible();
};
const seedRandom = (page: Page, gold = false, firstNova = false) => page.addInitScript(({ gold, firstNova }) => {
  const original = crypto.getRandomValues.bind(crypto);
  let calls = 0;
  crypto.getRandomValues = ((array: Uint32Array) => {
    if (array instanceof Uint32Array && array.length === 1) { array[0] = gold && !(firstNova && calls++ === 0) ? 0xffffffff : 0; return array; }
    return original(array);
  }) as typeof crypto.getRandomValues;
}, { gold, firstNova });

export const registerDailyWheelChecks = (): void => {
  test('ruleta diaria: once ranuras, diseño adaptable, guardado y probabilidad creciente', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedRandom(page);
    const viewports = testInfo.project.name === 'mobile'
      ? [{ width: 320, height: 640 }, { width: 390, height: 844 }]
      : [{ width: 844, height: 390 }, { width: 1280, height: 720 }];
    await open(page);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect(page.locator('.daily-wheel-slot')).toHaveCount(11);
      expect(await page.locator('#daily-wheel-dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await expect.poll(() => page.locator('#daily-wheel-dialog img').evaluateAll(images =>
        images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)
      )).toBe(true);
      await page.locator('#daily-wheel-free').scrollIntoViewIfNeeded();
      expect((await page.locator('#daily-wheel-free').boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await page.locator('#daily-wheel-dialog').evaluate(el => { el.scrollTop = 0; });
      if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath(`wheel-${viewport.width}.png`) });
    }
    await page.locator('#daily-wheel-free').click();
    await expect(page.locator('.daily-wheel-result')).toContainText('+40 NOVA');
    await expect(page.locator('#daily-wheel-free')).toBeDisabled();
    expect((await save(page)).wallet.nova).toBe(40);
    expect((await save(page)).dailyWheel.chancePercent).toBe(2);
    await expect(page.locator('#daily-wheel-dialog')).toContainText('Próximo giro: 2%');
    await page.locator('#daily-wheel-video').click();
    await expect.poll(async () => (await save(page)).dailyWheel.lastReceipt.kind).toBe('video');
    await expect(page.locator('.daily-wheel-result')).toContainText('+40 NOVA');
    await expect(page.locator('#daily-wheel-video')).toBeDisabled();
    expect((await save(page)).wallet.nova).toBe(80);
    expect((await save(page)).dailyWheel.chancePercent).toBe(3);
    await page.keyboard.press('Escape');
    await expect(page.locator('#daily-wheel-dialog')).toHaveCount(0);
    await expect(page.locator('#start-daily-wheel')).toBeFocused();
    await page.reload();
    await page.locator('#start-daily-wheel').click();
    await expect(page.locator('#daily-wheel-free')).toBeDisabled();
    await expect(page.locator('.daily-wheel-countdown')).toContainText('Próximo giro');
    await expect(page.locator('#daily-wheel-dialog')).toContainText('Próximo giro: 3%');
    expect((await save(page)).wallet.nova).toBe(80);
    expect(errors).toEqual([]);
  });

  test('ruleta diaria: skin exclusiva con video, animación saltable y selección en batalla', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await seedRandom(page, true, true);
    await open(page);
    await page.locator('#daily-wheel-free').click();
    await expect(page.locator('.daily-wheel-skip')).toBeVisible();
    await page.locator('.daily-wheel-skip').click();
    await expect(page.locator('.daily-wheel-result')).toContainText('+40 NOVA');
    await page.locator('#daily-wheel-video').click();
    await expect(page.locator('.daily-wheel-skip')).toBeVisible();
    // Ownership is durable BEFORE the animation ends or the dialog closes.
    const awarded = await save(page);
    expect(awarded.skins.unlocked).toContain('solstice');
    expect(awarded.dailyWheel.lastReceipt.kind).toBe('video');
    expect(awarded.dailyWheel.chancePercent).toBe(3);
    expect(awarded.skins.selected).not.toBe('solstice');
    await page.locator('.daily-wheel-skip').click();
    await expect(page.locator('.daily-wheel-result')).toContainText('Solstice Regent desbloqueada');
    if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath('wheel-exclusive.png') });
    await page.locator('.daily-wheel-equip').click();
    await page.locator('.daily-wheel-close').click();
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'solstice');
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-art-state', 'ready');
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="solstice"] button').click();
    await expect(page.locator('#start-cosmetic-action')).toHaveText('Equipada');
    await page.keyboard.press('Escape');
    await page.locator('#start-skins-back').click();
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await page.locator('[data-run-transition-skip]').click();
    await expect(page.locator('#game-hud')).toBeVisible();
    expect((await save(page)).skins.selected).toBe('solstice');
    expect(errors).toEqual([]);
  });

  test('ruleta diaria: no duplica entre pestañas ni consume un video cancelado', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedRandom(page);
    await open(page, '&ad=dismissed');
    await page.evaluate(() => {
      void navigator.locks.request('geometry-survivor:daily-wheel', () => new Promise<void>(resolve => {
        (window as unknown as { releaseWheelLock: () => void }).releaseWheelLock = resolve;
      }));
    });
    await expect.poll(() => page.evaluate(() => typeof (window as unknown as { releaseWheelLock: unknown }).releaseWheelLock)).toBe('function');
    const other = await context.newPage();
    await other.emulateMedia({ reducedMotion: 'reduce' });
    await seedRandom(other);
    await open(other);
    await other.locator('#daily-wheel-free').click();
    await expect(other.locator('.daily-wheel-message')).toContainText('Ya hay un giro');
    expect((await save(other)).wallet.nova).toBe(0);
    await page.evaluate(() => (window as unknown as { releaseWheelLock: () => void }).releaseWheelLock());
    await other.locator('#daily-wheel-free').click();
    await expect(other.locator('.daily-wheel-result')).toContainText('+40 NOVA');
    await expect(page.locator('#daily-wheel-free')).toBeDisabled();
    await page.locator('#daily-wheel-video').click();
    await expect(page.locator('.daily-wheel-message')).toContainText('El video no se completó');
    await expect(page.locator('#daily-wheel-video')).toBeEnabled();
    expect((await save(page)).dailyWheel.videoClaimed).toBe(false);
    expect((await save(page)).dailyWheel.chancePercent).toBe(2);
    expect((await save(page)).wallet.nova).toBe(40);
    await other.close();
    await page.locator('.daily-wheel-close').click();
    await page.locator('#start-skins').click();
    await page.locator('.skin-card[data-skin="solstice"] button').click();
    await expect(page.locator('#start-cosmetic-action')).toBeDisabled();
    await expect(page.locator('#start-cosmetic-action')).toContainText('ruleta diaria');
  });
};
