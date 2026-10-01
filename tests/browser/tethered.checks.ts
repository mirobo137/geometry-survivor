import { expect, test, type Page } from '@playwright/test';

// Read-only scene inspection through Pixi's existing devtools init hook.
const readArt = (page: Page) => page.evaluate(() => {
  type Node = {
    label?: string; visible: boolean; rotation: number; x: number; y: number;
    height: number; children: Node[]; texture?: { width: number; source?: { resource?: { src?: string } } };
  };
  const host = window as unknown as { __tetherSmokeApp?: { stage: Node } };
  let root: Node | undefined;
  const visit = (node: Node): void => {
    if (node.label === 'tethered-ship-prototype') root = node;
    for (const child of node.children ?? []) visit(child);
  };
  if (host.__tetherSmokeApp) visit(host.__tetherSmokeApp.stage);
  if (!root) return null;
  const left = root.children[2];
  const right = root.children[3];
  return { visible: root.visible, parts: root.children.length,
    shipWidth: root.children[1].texture?.width,
    leftSource: left.texture?.source?.resource?.src,
    rightSource: right.texture?.source?.resource?.src,
    left: [left.x, left.y, left.rotation], ship: [root.children[1].y, root.children[1].height] };
});

export const registerTetheredShipChecks = (): void => {
  test('Ivory Spear se equipa gratis en skins y persiste sin URL de prototipo', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const host = window as unknown as { __PIXI_APP_INIT__?: (app: unknown) => void; __tetherSmokeApp?: unknown };
      host.__PIXI_APP_INIT__ = app => { host.__tetherSmokeApp = app; };
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    const card = page.locator('.skin-card[data-skin="spearhead"]');
    await expect(card).toContainText('GRATIS');
    await card.locator('button').click();
    await expect(page.locator('#start-cosmetic-title')).toHaveText('Ivory Spear');
    await expect(page.locator('#start-cosmetic-preview img')).toHaveCount(3);
    await expect.poll(() => page.locator('#start-cosmetic-preview img').evaluateAll(images => images.every(node => {
      const image = node as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    }))).toBe(true);
    const layout = await page.locator('#start-cosmetic-preview').evaluate(element => {
      const box = element.getBoundingClientRect();
      return [...element.querySelectorAll('img')].every(image => {
        const bounds = image.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && bounds.left >= box.left - 1 && bounds.right <= box.right + 1;
      });
    });
    expect(layout).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('ivory-spear-modal.png') });
    await page.locator('#start-cosmetic-action').click();
    await expect(card).toHaveClass(/is-selected/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
    expect(saved.skins.selected).toBe('spearhead');
    expect(saved.skins.unlocked).toContain('spearhead');
    expect(saved.wallet.nova).toBe(0);
    expect(saved.cannonSkins.selected).toBe('basic');
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await expect(card).toHaveClass(/is-selected/);
    // Switching away restores the original cosmetics, then re-equipping reuses the raster view.
    await page.locator('.skin-card[data-skin="cyan"] button').click();
    await page.locator('#start-cosmetic-action').click();
    expect((await readArt(page))?.visible).toBe(false);
    await card.locator('button').click();
    await page.locator('#start-cosmetic-action').click();
    await page.locator('#start-skins-back').click();
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect.poll(async () => (await readArt(page))?.visible).toBe(true);
    expect((await readArt(page))?.parts).toBe(5);
    await page.locator('#pause-toggle').click();
    await page.screenshot({ path: testInfo.outputPath('ivory-spear-game.png') });
    expect(errors).toEqual([]);
  });
  test('prueba de nave vinculada carga dos PNG y conserva pausa, resize y reinicio', async ({ page }, testInfo) => {
    const errors: string[] = [];
    const images = new Set<string>();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (/tether-(ship|cannon)-.*\.png/.test(response.url())) {
        images.add(response.url());
        if (!response.ok()) errors.push(`HTTP ${response.status()}`);
      }
    });
    await page.addInitScript(() => {
      const host = window as unknown as { __PIXI_APP_INIT__?: (app: unknown) => void; __tetherSmokeApp?: unknown };
      host.__PIXI_APP_INIT__ = app => { host.__tetherSmokeApp = app; };
    });
    const quality = testInfo.project.name === 'mobile' ? 'low' : 'high';
    await page.goto(`/?ship-preview=tether&act=radial&skin=cyan&cannon=basic&quality=${quality}`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect.poll(async () => (await readArt(page))?.shipWidth).toBe(256);
    await page.locator('#pause-toggle').click();
    const before = await readArt(page);
    expect(before).toMatchObject({ visible: true, parts: 5 });
    expect(before!.leftSource).toEqual(before!.rightSource);
    expect(images.size).toBe(2);
    // Poll twice across animation frames: a stopped simulation must freeze art too.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const paused = await readArt(page);
    expect(paused!.left).toEqual(before!.left);
    expect(paused!.ship).toEqual(before!.ship);
    await page.setViewportSize({ width: 800, height: 450 });
    await expect(page.locator('#pause-resume')).toBeVisible();
    await page.locator('#pause-restart').click();
    await expect(page.locator('#pause-overlay')).toBeHidden();
    await expect.poll(async () => (await readArt(page))?.visible).toBe(true);
    expect(images.size).toBe(2);
    expect(errors).toEqual([]);
  });
};
