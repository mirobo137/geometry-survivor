import { expect, test } from '@playwright/test';

export const registerHomeChecks = (options: { includeDesktopViewport?: boolean } = {}): void => {
  const viewports = options.includeDesktopViewport === false
    ? [[320, 568], [390, 844], [640, 360]] as const
    : [[320, 568], [390, 844], [640, 360], [1280, 720]] as const;
  for (const [width, height] of viewports)
  test(`consolas premium sin solaparse a ${width}x${height}`, async ({ page }, testInfo) => {
    // Three complete catalog-growth passes are expensive under CI software
    // rendering; preserve the layout assertions without racing the global 60s.
    if (width === 1280) test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 8, wallet: { nova: 20_000 }, overdrive: { unlocked: true }
    })));
    await page.goto('/?ad=success');
    await expect(page.locator('#start-screen')).toBeVisible();
      await page.setViewportSize({ width, height });
      for (const [trigger, view, collection, card] of [
        ['skins', 'skins', '#start-skin-cards', '.skin-card'],
        ['meta', 'meta', '#start-meta-cards', '.lab-tree-node'],
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
        if (view === 'meta') {
          const treeStage = page.locator('#start-lab-tree-stage');
          await expect(treeStage).toBeVisible();
          await treeStage.scrollIntoViewIfNeeded();
          await expect(page.locator('.lab-tree-node[data-tree-kind="permanent"][data-offered="true"]')).toHaveCount(3);
          await expect(page.locator('.lab-tree-node[data-tree-kind="permanent"][data-rank="2"]')).toHaveCount(0);
          await expect(page.locator('.lab-tree-group-label')).toHaveCount(3);
          const rootRows = await page.locator('.lab-tree-node[data-tree-kind="permanent"][data-rank="1"]').evaluateAll(nodes => nodes.map(node => ({ x: node.getAttribute('data-world-x'), y: node.getAttribute('data-world-y') })));
          expect(rootRows).toHaveLength(11);
          expect(new Set(rootRows.map(point => point.x)).size).toBe(1);
          expect(new Set(rootRows.map(point => point.y)).size).toBe(11);
          const adRootX = await page.locator('#start-lab-vitality-core').evaluate(element => element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2);
          const stageBounds = await treeStage.boundingBox();
          expect(stageBounds).not.toBeNull();
          expect(adRootX).toBeGreaterThan(stageBounds!.x + stageBounds!.width);
          // The detailed zoom, touch-size and pan interactions are already
          // exercised at compact desktop and mobile viewports. At 1280x720
          // retain the full console/layout and growth checks above, without
          // repeating the costly Pixi/WebGL interaction sequence.
          if (width === 1280) {
            await page.locator('#start-meta-back').click();
            continue;
          }
          const initialZoom = await page.locator('#start-lab-zoom-value').textContent();
          await page.locator('#start-lab-zoom-in').click();
          expect(await page.locator('#start-lab-zoom-value').textContent()).not.toBe(initialZoom);
          await page.locator('#start-lab-zoom-reset').click();
          expect(await page.locator('#start-lab-zoom-value').textContent()).toBe(initialZoom);
          for (let step = 0; step < 5; step++) {
            const zoomOut = page.locator('#start-lab-zoom-out');
            if (await zoomOut.isDisabled()) break;
            await zoomOut.click();
          }
          const smallestTouchNode = await page.locator('.lab-tree-node[data-tree-kind="permanent"]').first().boundingBox();
          expect(smallestTouchNode).not.toBeNull();
          expect(smallestTouchNode!.width).toBeGreaterThanOrEqual(44);
          expect(smallestTouchNode!.height).toBeGreaterThanOrEqual(44);
          await page.locator('#start-lab-zoom-reset').click();
          const initialTransform = await page.locator('#start-lab-tree-world').evaluate(element => getComputedStyle(element).transform);
          const stageBox = await treeStage.boundingBox();
          expect(stageBox).not.toBeNull();
          await page.mouse.move(stageBox!.x + stageBox!.width / 2, stageBox!.y + stageBox!.height / 2);
          await page.mouse.down();
          await page.mouse.move(stageBox!.x + stageBox!.width / 2 + 38, stageBox!.y + stageBox!.height / 2 + 17);
          await page.mouse.up();
          expect(await page.locator('#start-lab-tree-world').evaluate(element => getComputedStyle(element).transform)).not.toBe(initialTransform);
          await page.locator('#start-lab-zoom-reset').click();
          await page.locator('#start-meta-back').click();
          continue;
        }
        // Future catalog growth and long labels must remain in normal flow.
        await page.locator(collection!).evaluate((element, selector) => {
          const source = element.querySelector(selector)!;
          for (let index = 0; index < 12; index++) {
            const clone = source.cloneNode(true) as HTMLElement;
            clone.removeAttribute('id');
            clone.dataset.layoutProbe = 'true';
            clone.querySelector('strong, h4')!.textContent = 'Nombre largo de una futura mejora o colección';
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
  test('cubre la carga desde HTML y entrega el menú sin textos recortados', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 8, overdrive: { unlocked: true }
    })));
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
        // Craft and two optional desktop cloud surfaces are bounded; the
        // environment and viewport-sized exterior must stay static.
        const limit = target.matches('.home-mark-image, .home-exterior-cloud') ? 340 : 12;
        return { bounded: bounds.width <= limit && bounds.height <= limit,
          decorative: target.matches('.home-mark-image, .home-ambient-light, .home-exterior-cloud') };
      }));
    const motionCount = await page.evaluate(() => matchMedia('(min-width: 52rem) and (min-height: 32rem)').matches
      && document.querySelector('#start-screen')?.getAttribute('data-quality') !== 'low' ? 7 : 5);
    expect(await activeSurfaces()).toEqual(Array.from({ length: motionCount }, () => ({ bounded: true, decorative: true })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(activeSurfaces).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const [trigger, section] of [['skins', 'skins'], ['meta', 'meta'], ['level', 'act']]) {
      await page.locator(`#start-${trigger}`).click();
      expect(await page.locator('.home-ambient-light').first().evaluate((node) => node.getAnimations().length)).toBe(0);
      await expect.poll(activeSurfaces).toEqual([]);
      await page.locator(`#start-${section}-back`).click();
      await expect.poll(activeSurfaces).toHaveLength(motionCount);
    }
    // Boot/motion/navigation and the four-size matrix must not share one 60s
    // budget on a software-rendered CI runner. Keep a real start in this case;
    // the independent responsive case below also starts after rotating.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('adapta portada y controles al rotar sin textos recortados', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // This case checks static layout, not animation. Reduce motion BEFORE boot
    // and keep it reduced through every resize and native button click.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 8, overdrive: { unlocked: true }
    })));
    await page.goto('/');
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeVisible();
    // Both compositions, a short landscape and two narrow portraits. Finish
    // in portrait so the mobile project also starts a run after a real rotation.
    for (const [width, height] of [[320, 640], [640, 360], [1280, 720], [390, 844]]) {
      await test.step(`portada y ajustes a ${width}x${height}`, async () => {
        await page.setViewportSize({ width: width!, height: height! });
        // Art direction follows the stacked layout, while both views reuse
        // the same selected resource. In particular, portrait isn't a PC crop.
        await expect.poll(() => page.locator('.home-scene-image').evaluate((node) => {
          const image = node as HTMLImageElement;
          const exterior = document.querySelector<HTMLImageElement>('.home-exterior-image')!;
          const portrait = matchMedia('(max-width: 599px), (max-width: 831px) and (min-height: 541px)').matches;
          return image.complete && image.naturalWidth > 0 && exterior.complete && exterior.naturalWidth > 0
            && image.currentSrc === exterior.currentSrc
            && image.currentSrc.includes('sanctuary-portrait') === portrait;
        })).toBe(true);
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
        expect(await page.locator('#start-main-view').evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      });
    }
    await page.locator('#start-play').click();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#game-hud')).toBeVisible();
    expect(errors).toEqual([]);
  });
};
