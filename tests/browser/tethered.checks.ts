import { expect, test, type Page } from '@playwright/test';

// Read-only scene inspection through Pixi's existing devtools init hook.
export const readRasterPlayerArt = (page: Page) => page.evaluate(() => {
  type Node = {
    label?: string; visible: boolean; rotation: number; x: number; y: number;
    height: number; children: Node[]; texture?: { width: number; source?: { resource?: { src?: string } } };
  };
  const host = window as unknown as { __tetherSmokeApp?: { stage: Node } };
  let root: Node | undefined;
  const visit = (node: Node): void => {
    if (node.label === 'raster-player-skin') root = node;
    for (const child of node.children ?? []) visit(child);
  };
  if (host.__tetherSmokeApp) visit(host.__tetherSmokeApp.stage);
  if (!root) return null;
  const left = root.children[2];
  const right = root.children[3];
  return { visible: root.visible, parts: root.children.length,
    shipWidth: root.children[1].texture?.width,
    shipSource: root.children[1].texture?.source?.resource?.src,
    leftSource: left.texture?.source?.resource?.src,
    rightSource: right.texture?.source?.resource?.src,
    left: [left.x, left.y, left.rotation], ship: [root.children[1].y, root.children[1].height] };
});

export const registerTetheredShipChecks = (): void => {
  test('previews separados conservan proporción y encuadre al cambiar de tamaño', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    // Cover the full matrix across projects without duplicating expensive UI traversal.
    const viewports = testInfo.project.name === 'mobile'
      ? [{ width: 320, height: 568 }, { width: 390, height: 844 }]
      : [{ width: 800, height: 450 }, { width: 1280, height: 720 }];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.locator('#start-player-skins-tab').click();
      const cards = await page.locator('.skin-card-art').evaluateAll(artworks => artworks.map(artwork => {
        const image = artwork.querySelector('img')!;
        const frame = artwork.getBoundingClientRect();
        const hull = image.getBoundingClientRect();
        return { images: artwork.querySelectorAll('img').length, ratio: hull.width / hull.height,
          inside: hull.left >= frame.left - 1 && hull.right <= frame.right + 1
            && hull.top >= frame.top - 1 && hull.bottom <= frame.bottom + 1 };
      }));
      expect(cards).toHaveLength(10);
      for (const card of cards) {
        expect(card.images).toBe(1);
        expect(card.ratio).toBeCloseTo(56 / 64, 2);
        expect(card.inside).toBe(true);
      }
      await page.locator('.skin-card[data-skin="manta"] button').click();
      const preview = page.locator('#start-cosmetic-preview');
      await expect(preview.locator('img')).toHaveCount(1);
      await expect(preview.locator('svg, .tethered-preview-gun')).toHaveCount(0);
      await expect.poll(() => preview.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(256);
      const layout = await preview.evaluate(element => {
        const frame = element.getBoundingClientRect();
        const hull = element.querySelector('img')!.getBoundingClientRect();
        return { ratio: hull.width / hull.height,
          center: Math.abs(frame.left + frame.width / 2 - hull.left - hull.width / 2),
          inside: hull.left >= frame.left && hull.right <= frame.right
            && hull.top >= frame.top && hull.bottom <= frame.bottom };
      });
      expect(layout.ratio).toBeCloseTo(56 / 64, 2);
      expect(layout.center).toBeLessThan(1);
      expect(layout.inside).toBe(true);
      if (!process.env.CI && viewport.width === 390) await preview.screenshot({ path: testInfo.outputPath('ship-only.png') });
      await page.locator('#start-cosmetic-close').click();
      await page.locator('#start-cannon-skins-tab').click();
      await expect(page.locator('.cannon-card-art svg image')).toHaveCount(30);
      const thumbnails = await page.locator('.cannon-card-art').evaluateAll(artworks => artworks.map(artwork => {
        const frame = artwork.getBoundingClientRect();
        const cannon = artwork.querySelector('.cannon-preview-module')!.getBoundingClientRect();
        const shot = artwork.querySelector('.cannon-preview-projectile')!.getBoundingClientRect();
        return { images: artwork.querySelectorAll('image').length,
          shots: artwork.querySelectorAll('.cannon-preview-projectile').length,
          ratio: cannon.width / cannon.height,
          firesRight: shot.left + shot.width / 2 > cannon.left + cannon.width / 2,
          inside: [cannon, shot].every(box => box.left >= frame.left - 1 && box.right <= frame.right + 1
            && box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1) };
      }));
      for (const thumbnail of thumbnails) {
        expect(thumbnail.images).toBe(3);
        expect(thumbnail.shots).toBe(1);
        expect(thumbnail.ratio).toBeCloseTo(26 / 20, 2);
        expect(thumbnail.firesRight).toBe(true);
        expect(thumbnail.inside).toBe(true);
      }
      if (!process.env.CI && (viewport.width === 390 || viewport.width === 1280)) {
        await page.screenshot({ path: testInfo.outputPath('horizontal-cannon-cards.png') });
      }
      await page.locator('.cannon-card[data-cannon="curve"] button').click();
      await expect(preview.locator('svg image')).toHaveCount(6);
      const cannons = await preview.locator('.cannon-preview-module').evaluateAll(images => images.map(image => {
        const box = image.getBoundingClientRect();
        return { url: image.getAttribute('href'), ratio: box.width / box.height };
      }));
      for (const cannon of cannons) {
        expect(cannon.url).toContain('curve');
        expect(cannon.ratio).toBeCloseTo(20 / 26, 2);
      }
      await expect(preview.locator('.cannon-preview-cables')).toHaveCount(0);
      expect(await preview.evaluate(element => {
        const frame = element.getBoundingClientRect();
        return [...element.querySelectorAll('.cannon-preview-projectile')].every(projectile => {
          const box = projectile.getBoundingClientRect();
          return box.left >= frame.left && box.right <= frame.right
            && box.top >= frame.top && box.bottom <= frame.bottom;
        });
      })).toBe(true);
      if (!process.env.CI && viewport.width === 390) await preview.screenshot({ path: testInfo.outputPath('cannons-only.png') });
      await page.locator('#start-cosmetic-close').click();
    }
    expect(errors).toEqual([]);
  });
  test('Ivory Spear se equipa gratis en skins y persiste sin URL de prototipo', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
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
    await expect(page.locator('#start-cosmetic-preview img')).toHaveCount(1);
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
    await page.locator('#start-cosmetic-close').click();
    const cyanCard = page.locator('.skin-card[data-skin="cyan"]');
    await cyanCard.locator('button').click();
    await page.locator('#start-cosmetic-action').click();
    await expect(cyanCard).toHaveClass(/is-selected/);
    await card.locator('button').click();
    await expect(page.locator('#start-cosmetic-action')).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('ivory-spear-modal.png') });
    await page.locator('#start-cosmetic-action').click();
    await expect(card).toHaveClass(/is-selected/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!));
    expect(saved.skins.selected).toBe('spearhead');
    expect(saved.skins.unlocked).toContain('spearhead');
    expect(saved.wallet.nova).toBe(0);
    expect(saved.cannonSkins.selected).toBe('spearhead');
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-skins').click();
    await expect(card).toHaveClass(/is-selected/);
    // Switching between skins swaps the loaded ship while keeping the shared raster compositor.
    await page.locator('.skin-card[data-skin="cyan"] button').click();
    await page.locator('#start-cosmetic-action').click();
    await expect.poll(async () => readRasterPlayerArt(page)).toMatchObject({ visible: true });
    const cyanArt = await readRasterPlayerArt(page);
    expect(cyanArt?.visible).toBe(true);
    expect(cyanArt?.shipSource).toContain('/cyan-');
    await card.locator('button').click();
    await page.locator('#start-cosmetic-action').click();
    await page.locator('#start-skins-back').click();
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
    await page.locator('[data-run-transition-skip]').click();
    await expect(page.locator('#run-transition')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    await expect.poll(async () => (await readRasterPlayerArt(page))?.visible).toBe(true);
    expect((await readRasterPlayerArt(page))?.parts).toBe(5);
    await page.locator('#pause-toggle').click();
    await page.screenshot({ path: testInfo.outputPath('ivory-spear-game.png') });
    const combatShip = (await readRasterPlayerArt(page))?.shipSource;
    await page.locator('#pause-menu').click();
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'spearhead');
    await expect(page.locator('.home-mark-image')).toHaveAttribute('data-art-state', 'ready');
    expect(await page.locator('.home-mark-image').evaluate(image => (image as HTMLImageElement).currentSrc)).toBe(combatShip);
    expect(errors).toEqual([]);
  });
  test('prueba de nave vinculada carga dos PNG y conserva pausa, resize y reinicio', async ({ page }, testInfo) => {
    const errors: string[] = [];
    const images = new Set<string>();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (/(tether-ship|tether-cannon)-.*\.png/.test(response.url())) {
        images.add(response.url());
        if (!response.ok()) errors.push(`HTTP ${response.status()}`);
      }
    });
    await page.addInitScript(() => {
      const host = window as unknown as { __PIXI_APP_INIT__?: (app: unknown) => void; __tetherSmokeApp?: unknown };
      host.__PIXI_APP_INIT__ = app => { host.__tetherSmokeApp = app; };
    });
    const quality = testInfo.project.name === 'mobile' ? 'low' : 'high';
    await page.goto(`/?ship-preview=tether&act=radial&skin=cyan&cannon=spearhead&quality=${quality}`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect.poll(async () => (await readRasterPlayerArt(page))?.shipWidth).toBe(256);
    await page.locator('#pause-toggle').click();
    const before = await readRasterPlayerArt(page);
    expect(before).toMatchObject({ visible: true, parts: 5 });
    expect(before!.leftSource).toEqual(before!.rightSource);
    expect(images.size).toBe(2);
    // Poll twice across animation frames: a stopped simulation must freeze art too.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const paused = await readRasterPlayerArt(page);
    expect(paused!.left).toEqual(before!.left);
    expect(paused!.ship).toEqual(before!.ship);
    await page.setViewportSize({ width: 800, height: 450 });
    await expect(page.locator('#pause-resume')).toBeVisible();
    await page.locator('#pause-restart').click();
    await expect(page.locator('#pause-overlay')).toBeHidden();
    await expect.poll(async () => (await readRasterPlayerArt(page))?.visible).toBe(true);
    expect(images.size).toBe(2);
    expect(errors).toEqual([]);
  });
};
