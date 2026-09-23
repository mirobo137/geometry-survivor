import { expect, test } from '@playwright/test';

export const registerHomeChecks = (): void => {
  for (const [width, height] of [[320, 568], [390, 844], [640, 360], [1280, 720]] as const) {
  test(`consolas premium sin solaparse a ${width}x${height}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?ad=success');
    await expect(page.locator('#start-screen')).toBeVisible();
      await page.setViewportSize({ width, height });
      for (const [trigger, view, collection, card] of [
        ['skins', 'skins', '#start-skin-cards', '.skin-card'],
        ['meta', 'meta', '#start-meta-cards', '.meta-upgrade-card'],
        ['level', 'act', '.act-options', '.act-card-button']
      ]) {
        await page.locator(`#start-${trigger}`).click();
        const screen = page.locator(`#start-${view}-view`);
        await expect(screen).toBeVisible();
        if (view === 'skins') {
          await expect(page.locator('#start-cosmetic-rewarded-button')).toBeHidden();
          await page.locator('#start-cosmetic-rewarded summary').click();
          await expect(page.locator('#start-cosmetic-rewarded-button')).toBeVisible();
        }
        const bounds = await screen.evaluate(element => {
          const body = element.querySelector<HTMLElement>('.console-body')!;
          const header = element.querySelector('.console-header')!.getBoundingClientRect();
          const rect = body.getBoundingClientRect();
          return { height: rect.height, inViewport: rect.bottom <= innerHeight && rect.left >= 0
            && rect.right <= innerWidth, separated: rect.top >= header.bottom,
            overflow: body.scrollWidth > body.clientWidth + 1 };
        });
        expect(bounds.inViewport).toBe(true);
        expect(bounds.separated).toBe(true);
        expect(bounds.overflow).toBe(false);
        expect(bounds.height).toBeGreaterThan(80);
        if (!process.env.CI && (width === 390 || width === 1280)) {
          await page.screenshot({ path: testInfo.outputPath(`${view}-${width}.png`) });
        }
        // Future catalog growth and long labels must remain in normal flow.
        await page.locator(collection!).evaluate((element, selector) => {
          const source = element.querySelector(selector)!;
          for (let index = 0; index < 12; index++) {
            const clone = source.cloneNode(true) as HTMLElement;
            clone.removeAttribute('id');
            clone.dataset.layoutProbe = 'true';
            clone.querySelector('strong')!.textContent = 'Nombre largo de una futura mejora o colección';
            element.append(clone);
          }
        }, card!);
        const body = screen.locator('.console-body');
        await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
        expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        expect(await body.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
        const overlaps = await page.locator(collection!).evaluate(element => {
          const rects = [...element.children].map(child => child.getBoundingClientRect());
          return rects.some((a, index) => rects.slice(index + 1).some(b =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
        });
        expect(overlaps).toBe(false);
        await page.locator('[data-layout-probe]').evaluateAll(nodes => nodes.forEach(node => node.remove()));
        if (view === 'skins') {
          for (const tab of ['cannon-skins', 'backgrounds', 'player-skins']) {
            await page.locator(`#start-${tab}-tab`).click();
            await expect(body).toHaveJSProperty('scrollTop', 0);
            expect(await body.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
            await expect(page.locator('#start-cosmetic-rewarded-button')).toBeHidden();
            if (!process.env.CI && (width === 390 || width === 1280)) {
              await page.screenshot({ path: testInfo.outputPath(`${tab}-${width}.png`) });
            }
          }
        }
        await page.locator(`#start-${view}-back`).click();
      }
    expect(errors).toEqual([]);
  });
  }

  test('cubre la carga desde HTML y entrega el menú sin textos recortados', async ({ page }) => {
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
    } finally {
      releaseEntry();
    }
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#game-hud')).toBeHidden();
    const mark = page.locator('.home-mark-image');
    await expect.poll(() => page.locator('.home-scene-image').evaluate((node) =>
      (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await expect.poll(() => mark.evaluate((node) =>
      (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const initialTransform = await mark.evaluate((node) => getComputedStyle(node).transform);
    await expect.poll(() => mark.evaluate((node) => getComputedStyle(node).transform)).not.toBe(initialTransform);
    const activeSurfaces = () => page.locator('#start-screen').evaluate((screen) =>
      screen.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').map((animation) => {
        const target = (animation.effect as KeyframeEffect).target as Element;
        const bounds = target.getBoundingClientRect();
        return { small: bounds.width < 210 && bounds.height < 210,
          decorative: target.matches('.home-mark-image, .home-ambient-light') };
      }));
    expect(await activeSurfaces()).toEqual(Array.from({ length: 5 }, () => ({ small: true, decorative: true })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(activeSurfaces).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const section of ['skins', 'meta']) {
      await page.locator(`#start-${section}`).click();
      expect(await page.locator('.home-ambient-light').first().evaluate((node) => node.getAnimations().length)).toBe(0);
      await page.locator(`#start-${section}-back`).click();
      await expect.poll(activeSurfaces).toHaveLength(5);
    }
    // Motion was asserted above. Freeze it while exercising every responsive
    // button so CI never waits for a moving target during scroll/click.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [width, height] of [[320, 640], [390, 844], [640, 360], [1280, 720]]) {
      await page.setViewportSize({ width: width!, height: height! });
      const buttonLayout = await page.locator('.start-actions button').evaluateAll((nodes) => (
        nodes.map((node) => {
          const bounds = node.getBoundingClientRect();
          const text = document.createRange();
          text.selectNodeContents(node);
          return node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1
            && bounds.width >= 44 && bounds.height >= 44
            && [...text.getClientRects()].every((rect) => rect.left >= bounds.left && rect.right <= bounds.right + 1);
        })
      ));
      expect(buttonLayout).toHaveLength(5);
      expect(buttonLayout.every(Boolean)).toBe(true);
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
