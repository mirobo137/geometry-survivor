import { expect, test } from '@playwright/test';

export const registerResourceChecks = (): void => {
  test('RES-01 prepara arte visible con red lenta sin precargar catálogo y respeta descarga inicial', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => { requests.push(request.url()); });
    await page.route(/\.(png|webp)(\?|$)/, async route => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      await route.continue().catch(() => {});
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    for (const selector of ['.home-scene-image', '.home-exterior-image', '.home-mark-image']) {
      await expect(page.locator(selector)).toHaveAttribute('data-art-state', 'ready');
    }
    expect(requests.some(url => /act-angular|act-fracture|act-overdrive|singularity-shard|polar-collapse/.test(url))).toBe(false);
    const downloaded = await page.evaluate(() => performance.getEntriesByType('resource')
      .reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).decodedBodySize, 0));
    // Conservative: preview sends uncompressed bodies. Passing <=5 MB here is
    // stronger than the plan's compressed initial limit, not a portal bandwidth measurement.
    expect(downloaded).toBeGreaterThan(0);
    expect(downloaded).toBeLessThanOrEqual(5_000_000);
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
  });

  test('RES-01/03 un fallo de imágenes mantiene menú y modal operables', async ({ page }) => {
    await page.route(/\.(png|webp)(\?|$)/, route => route.abort());
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('.home-scene-image')).toHaveAttribute('data-art-state', 'fallback');
    await page.locator('#start-skins').click();
    const opener = page.locator('.skin-card[data-skin="spearhead"] button');
    await opener.click();
    await expect(page.locator('#start-cosmetic-dialog')).toBeVisible();
    await page.locator('#start-cosmetic-close').click();
    await expect(opener).toBeFocused();
    await page.locator('#start-skins-back').click();
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
  });

  test('RES-01 rotar durante carga entrega la composición vigente y un timeout no bloquea jugar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.route(/\.(png|webp)(\?|$)/, async route => {
      await new Promise(resolve => setTimeout(resolve, 900));
      await route.continue().catch(() => {});
    });
    await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-scene-image')).toBeAttached();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('.home-scene-image')).toHaveAttribute('data-art-state', 'ready');
    expect(await page.locator('.home-scene-image').evaluate(node => (node as HTMLImageElement).currentSrc))
      .toContain('sanctuary-portrait');
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(/\.(png|webp)(\?|$)/, async route => {
      await gate;
      await route.continue().catch(() => {});
    });
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('#boot-status')).toBeHidden({ timeout: 7000 });
      await expect(page.locator('.home-scene-image')).toHaveAttribute('data-art-state', 'fallback');
      await page.locator('#start-play').click();
      await expect(page.locator('#start-screen')).toBeHidden();
    } finally { release(); }
  });

  test('RES-05 recupera contexto suspendido desde gesto sin reanudar gameplay pausado', async ({ page }) => {
    await page.addInitScript(() => {
      const Original = window.AudioContext;
      window.AudioContext = new Proxy(Original, { construct(target, args) {
        const context = Reflect.construct(target, args);
        (window as unknown as { auditContext: AudioContext }).auditContext = context;
        return context;
      } });
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await page.locator('#start-skins-back').click();
    await page.locator('#start-skins').click();
    await page.evaluate(async () => { await (window as unknown as { auditContext: AudioContext }).auditContext.suspend(); });
    await page.locator('#start-skins-back').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { auditContext: AudioContext }).auditContext.state)).toBe('running');
    await page.locator('#start-play').click();
    await page.locator('[data-run-transition-skip]').click();
    await page.locator('#pause-toggle').click();
    await page.evaluate(async () => { await (window as unknown as { auditContext: AudioContext }).auditContext.suspend(); });
    await page.locator('#pause-menu').click();
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#game-hud')).toBeHidden();
    await expect.poll(() => page.evaluate(() => (window as unknown as { auditContext: AudioContext }).auditContext.state)).toBe('running');
  });
};
