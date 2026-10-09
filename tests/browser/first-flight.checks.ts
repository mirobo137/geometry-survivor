import { expect, test, type Page } from '@playwright/test';

/** Older smoke scenarios deliberately choose the regular menu, without seeding progress. */
export const skipFirstFlightOnBoot = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const skip = document.querySelector<HTMLButtonElement>('#start-screen.is-first-flight:not([hidden]) #first-flight-skip');
      if (skip) { skip.click(); observer.disconnect(); }
      else if (document.querySelector<HTMLElement>('#boot-status')?.hidden) observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  });
};

export const registerFirstFlightChecks = (): void => {
  test('primer vuelo: guía, controles y menú habitual después de empezar o saltar', async ({ browser }, testInfo) => {
    // Separate fresh context: the regular-menu smoke fixtures do not apply.
    const context = await browser.newContext({ locale: 'es-MX', viewport: { width: 390, height: 844 },
      isMobile: testInfo.project.name === 'mobile', hasTouch: testInfo.project.name === 'mobile' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto('http://127.0.0.1:4173/');
      await expect(page.locator('#first-flight-intro')).toBeVisible();
      await expect(page.locator('#start-skins')).toBeHidden();
      await expect(page.locator('#start-retention')).toBeHidden();
      for (const [width, height] of [[320, 568], [640, 360], [1280, 720]]) {
        await page.setViewportSize({ width, height });
        const play = page.locator('#start-play');
        const rect = await play.boundingBox();
        expect(rect!.x).toBeGreaterThanOrEqual(0);
        expect(rect!.y + rect!.height).toBeLessThanOrEqual(height + 1);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: testInfo.outputPath('first-flight-welcome.png') });
      await page.locator('#start-settings-toggle').click();
      await expect(page.locator('#start-settings')).toBeVisible();
      await page.locator('#start-settings-close').click();
      await page.locator('#start-play').click();
      await expect(page.locator('.first-flight-guide')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.first-flight-guide')).toContainText('disparan automáticamente');
      await page.screenshot({ path: testInfo.outputPath('first-flight-guide.png') });
      await page.keyboard.down('d');
      await page.waitForTimeout(250);
      await page.keyboard.up('d');
      await expect(page.locator('.first-flight-guide')).toContainText('ganar experiencia automáticamente', { timeout: 10_000 });
      await expect(page.locator('.first-flight-card-hint')).toBeVisible({ timeout: 35_000 });
      await page.screenshot({ path: testInfo.outputPath('first-flight-first-card.png') });
      await page.locator('#level-up .upgrade-card').first().click();
      await expect(page.locator('.first-flight-card-hint')).toBeHidden();
      await expect(page.locator('.first-flight-guide')).toBeHidden();
      await page.reload();
      await expect(page.locator('#start-skins')).toBeVisible();
      await expect(page.locator('#first-flight-intro')).toBeHidden();
      await page.evaluate(() => localStorage.removeItem('geometry-survivor:save'));
      await page.reload();
      await expect(page.locator('#first-flight-intro')).toBeVisible();
      await page.locator('#first-flight-skip').click();
      await expect(page.locator('#start-skins')).toBeVisible();
      await page.reload();
      await expect(page.locator('#first-flight-intro')).toBeHidden();
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });

  test('primer vuelo: traducción inglesa y perfil anterior con progreso', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    try {
      await page.goto('http://127.0.0.1:4173/');
      await expect(page.locator('#start-play')).toContainText('Play Act I');
      await expect(page.locator('#first-flight-intro')).toContainText('Your weapons fire automatically.');
      await page.evaluate(() => localStorage.setItem('geometry-survivor:save', JSON.stringify({
        schemaVersion: 15, tutorialSeen: false, best: { timeSeconds: 10, score: 1 }
      })));
      await page.reload();
      await expect(page.locator('#first-flight-intro')).toBeHidden();
      await expect(page.locator('#start-skins')).toBeVisible();
    } finally { await context.close(); }
  });
};
