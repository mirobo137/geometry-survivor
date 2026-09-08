import { expect, test } from '@playwright/test';

export const registerHomeChecks = (): void => {
  test('cubre la carga desde HTML y entrega el menú sin textos recortados', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let releaseEntry!: () => void;
    const entryGate = new Promise<void>((resolve) => { releaseEntry = resolve; });
    await page.route(/\/assets\/index-[^/]+\.js$/, async (route) => {
      await entryGate;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'commit' });
    try {
      await expect(page.locator('#boot-status')).toBeVisible();
      await expect(page.locator('#start-screen')).toBeHidden();
      expect(await page.evaluate(() => {
        const cover = document.querySelector('#boot-status')!;
        const bounds = cover.getBoundingClientRect();
        return bounds.x === 0 && bounds.y === 0 && bounds.width === innerWidth && bounds.height === innerHeight
          && cover.contains(document.elementFromPoint(innerWidth / 2, innerHeight / 2));
      })).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('loading.png') });
    } finally {
      releaseEntry();
    }
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#game-hud')).toBeHidden();
    for (const [width, height] of [[320, 640], [390, 844], [640, 360], [1280, 720]]) {
      await page.setViewportSize({ width: width!, height: height! });
      const buttons = page.locator('.start-actions button');
      for (const button of await buttons.all()) {
        await button.scrollIntoViewIfNeeded();
        expect(await button.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const text = document.createRange();
          text.selectNodeContents(node);
          return node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1
            && bounds.width >= 44 && bounds.height >= 44
            && [...text.getClientRects()].every((rect) => rect.left >= bounds.left && rect.right <= bounds.right + 1);
        })).toBe(true);
      }
      await page.locator('#start-play').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`) });
      await page.locator('#start-settings-toggle').click();
      await expect(page.locator('#start-settings')).toBeVisible();
      await page.locator('#start-settings-toggle').click();
      await expect(page.locator('#start-settings')).toBeHidden();
      await expect(page.locator('#start-play')).toBeVisible();
    }
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    expect(errors).toEqual([]);
  });
};
