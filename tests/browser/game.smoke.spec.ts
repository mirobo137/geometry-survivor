import { expect, test, type Page } from '@playwright/test';
import { BACKGROUND_DEFINITIONS } from '../../src/content/visual/BackgroundDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../../src/content/visual/CannonSkinDefinitions';
import { PLAYER_SKIN_DEFINITIONS } from '../../src/content/visual/SkinDefinitions';
import { registerHomeChecks } from './home.checks';
import { registerMusicChecks } from './music.checks';
import { registerResourceChecks } from './resources.checks';
import { registerTetheredShipChecks } from './tethered.checks';
import { registerCatalogChecks } from './catalog.checks';
import { registerDailyWheelChecks } from './daily-wheel.checks';
import { registerLogbookChecks } from './logbook.checks';

registerHomeChecks();
registerMusicChecks();
registerResourceChecks();
registerTetheredShipChecks();
registerCatalogChecks();
registerDailyWheelChecks();
registerLogbookChecks();

test('equipa Manta Veil en PNG, conserva la selección y carga solo su nave y cañones', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const textures: string[] = [];
  page.on('response', response => {
    if (/\/(manta|tether-cannon)-[^/]+\.webp/.test(response.url()) && response.ok()) textures.push(response.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#boot-status')).toBeHidden();
  expect(textures.every(url => url.includes('tether-cannon'))).toBe(true);
  expect(textures.some(url => url.includes('/manta-'))).toBe(false);
  await page.locator('#start-skins').click();
  await page.locator('.skin-card[data-skin="manta"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Manta Veil');
  const mantaAlignment = await page.locator('#start-cosmetic-preview .tethered-preview').evaluate(element => {
    const outer = element.getBoundingClientRect();
    const craft = element.querySelector('.tethered-preview-craft')!.getBoundingClientRect();
    const hull = element.querySelector('.tethered-preview-ship')!.getBoundingClientRect();
    return { left: Math.abs(outer.left - craft.left), width: Math.abs(outer.width - craft.width), center: Math.abs(outer.left + outer.width / 2 - hull.left - hull.width / 2) };
  });
  expect(mantaAlignment.left).toBeLessThan(1);
  expect(mantaAlignment.width).toBeLessThan(1);
  expect(mantaAlignment.center).toBeLessThan(1);
  await expect.poll(() => page.locator('#start-cosmetic-preview img').evaluateAll(images =>
    images.length === 1 && (images[0] as HTMLImageElement).naturalWidth === 256
  )).toBe(true);
  await page.locator('#start-cosmetic-preview').screenshot({ path: testInfo.outputPath('manta-preview.png') });
  expect(new Set(textures).size).toBe(2);
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.skin-card[data-skin="manta"]')).toHaveClass(/is-selected/);
  await page.locator('#start-skins-back').click();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('manta-mobile.png') });
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(save.skins.selected).toBe('manta');
  expect(save.wallet.nova).toBe(0);
  expect(failures).toEqual([]);
});

for (const quality of ['low', 'high']) {
  test(`Manta conserva identidad y carga diferida en partida ${quality}`, async ({ page }, testInfo) => {
    const failures = captureRuntimeFailures(page);
    const imageReady = page.waitForResponse(response => /\/manta-[^/]+\.webp/.test(response.url()) && response.ok());
    await page.goto(`/?skin=manta&quality=${quality}&boss=1`);
    await imageReady;
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#debug-panel')).toContainText('boss: intro');
    await page.locator('#pause-toggle').click();
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath(`manta-${quality}-paused.png`) });
    expect(failures).toEqual([]);
  });
}

const RESIZE_MATRIX = [
  { width: 640, height: 360 },
  { width: 836, height: 470 },
  { width: 1031, height: 580 },
  { width: 821, height: 462 },
  { width: 907, height: 510 },
  { width: 1077, height: 606 },
  { width: 1216, height: 684 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
  { width: 800, height: 450 },
  { width: 1080, height: 607 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 412, height: 915 }
] as const;

test('carga las diez naves PNG y diez canones con boss en high', async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    const quality = 'high';
    const failures = captureRuntimeFailures(page);
    await page.route('**/*', route => route.continue());
    const smokeAssetResponses: string[] = [];
    const bloomAssetResponses: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('smoke-trail-') && response.ok()) smokeAssetResponses.push(response.url());
      if (response.url().includes('bloom-trail-') && response.ok()) bloomAssetResponses.push(response.url());
    });
    const skins = ['cyan', 'violet', 'amber', 'emerald', 'obsidian', 'nova', 'manta', 'spearhead', 'corsair', 'nautilus'];
    const backgrounds = ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field', 'silent-archive', 'lunar-fault', 'leviathan-wake'];
    const cannons = ['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead', 'gyre', 'razor'];
    for (let index = 0; index < skins.length; index += 1) {
      const shipAsset = skins[index] === 'spearhead' ? 'tether-ship-' : `${skins[index]}-`;
      const cannonAsset = cannons[index] === 'spearhead' ? 'tether-cannon-' : `${cannons[index]}-`;
      const shipReady = page.waitForResponse(response => response.url().includes(`/assets/${shipAsset}`) && response.ok());
      const cannonReady = page.waitForResponse(response => response.url().includes(`/assets/${cannonAsset}`) && response.ok());
      await page.goto(`/?boss=1&quality=${quality}&skin=${skins[index]}&background=${backgrounds[index % backgrounds.length]}&cannon=${cannons[index]}`);
      await Promise.all([shipReady, cannonReady]);
      await expect(page.locator('#boot-status')).toBeHidden();
      await expect(page.locator('#game-container canvas')).toBeVisible();
      await expect(page.locator('#debug-panel')).toContainText('boss: intro');
      await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath(`art-${quality}-${skins[index]}.png`) });
    }
    expect(smokeAssetResponses).toHaveLength(1);
    expect(bloomAssetResponses).toHaveLength(1);
    expect(failures).toEqual([]);
});

const captureRuntimeFailures = (page: Page): string[] => {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    // Chromium cancels a buffered HTML5 stream and later requests another byte range.
    // Keep real music errors (404/network/decode) and all other asset failures visible.
    if (request.resourceType() === 'media' && /\/general-theme[^/]*\.mp3$/.test(request.url())
      && request.failure()?.errorText === 'net::ERR_ABORTED') return;
    failures.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`response ${response.status()}: ${response.url()}`);
  });
  return failures;
};

const openGame = async (page: Page): Promise<string[]> => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect(page.locator('#start-play')).toBeVisible();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#run-transition')).toBeHidden();
  await expect(page.locator('#game-hud')).toBeVisible();
  return failures;
};

const openFundedMenu = async (page: Page): Promise<string[]> => {
  const failures = captureRuntimeFailures(page);
  // The animation contract is covered by home.checks. Each focused menu
  // scenario gets isolated storage and its own test timeout budget.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (localStorage.getItem('geometry-survivor:save') === null) {
      localStorage.setItem('geometry-survivor:save', JSON.stringify({
        schemaVersion: 8,
        wallet: { nova: 20000 },
        overdrive: { unlocked: true }
      }));
    }
  });
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect.poll(async () => page.locator('#debug-panel').textContent()).toContain('paused: menu');
  await expect(page.locator('#start-scene img')).toBeVisible();
  await expect(page.locator('#start-mark img')).toBeVisible();
  await expect(page.locator('#start-play')).toBeVisible();
  await expect(page.locator('#start-level')).toBeEnabled();
  await expect(page.locator('#start-skins')).toBeEnabled();
  return failures;
};

const purchaseFirstLaboratoryOffer = async (page: Page, verifyDismissal = true): Promise<string> => {
  const offeredNodes = page.locator('.lab-tree-node[data-tree-kind="permanent"][data-offered="true"]');
  let visibleIndex = await offeredNodes.evaluateAll(nodes => {
    const stage = document.querySelector('#start-lab-tree-stage')!.getBoundingClientRect();
    return nodes.findIndex(node => {
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return centerX >= stage.left && centerX <= stage.right && centerY >= stage.top && centerY <= stage.bottom;
    });
  });
  if (visibleIndex < 0) {
    const target = offeredNodes.first();
    const offset = await target.evaluate(node => {
      const stage = document.querySelector('#start-lab-tree-stage')!.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      return { x: stage.left + stage.width / 2 - (rect.left + rect.width / 2), y: stage.top + stage.height / 2 - (rect.top + rect.height / 2), startX: stage.left + stage.width / 2, startY: stage.top + stage.height / 2 };
    });
    await page.mouse.move(offset.startX, offset.startY);
    await page.mouse.down();
    await page.mouse.move(offset.startX + offset.x, offset.startY + offset.y, { steps: 8 });
    await page.mouse.up();
    visibleIndex = await offeredNodes.evaluateAll(nodes => {
      const stage = document.querySelector('#start-lab-tree-stage')!.getBoundingClientRect();
      return nodes.findIndex(node => {
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return centerX >= stage.left && centerX <= stage.right && centerY >= stage.top && centerY <= stage.bottom;
      });
    });
  }
  expect(visibleIndex).toBeGreaterThanOrEqual(0);
  const node = offeredNodes.nth(visibleIndex);
  const id = (await node.getAttribute('data-upgrade'))!;
  if (verifyDismissal) {
    await node.click();
    await expect(page.locator('#start-lab-node-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#start-lab-node-dialog')).toBeHidden();
    await node.click();
    await expect(page.locator('#start-lab-node-dialog')).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(page.locator('#start-lab-node-dialog')).toBeHidden();
  }
  await node.click();
  await expect(page.locator('#start-lab-node-dialog')).toBeVisible();
  await expect(page.locator('#start-lab-node-action')).toBeEnabled();
  await page.locator('#start-lab-node-action').click();
  await expect(page.locator('#start-lab-node-dialog')).toBeHidden();
  return id;
};

const panLaboratoryTowardVitality = async (page: Page): Promise<void> => {
  const stage = await page.locator('#start-lab-tree-stage').boundingBox();
  expect(stage).not.toBeNull();
  const x = stage!.x + stage!.width / 2;
  const y = stage!.y + stage!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - Math.min(420, stage!.width * 0.72), y);
  await page.mouse.up();
};

test('compra y equipa skins desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);

  await page.locator('#start-skins').click();
  await expect(page.locator('#start-main-view')).toBeHidden();
  await expect(page.locator('#start-skins-view')).toBeVisible();
  await expect(page.locator('#start-player-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('.skin-preview-stage')).toHaveCount(0);
  await expect(page.locator('#start-skin-cards .skin-card')).toHaveCount(PLAYER_SKIN_DEFINITIONS.length);
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-locked/);
  await page.locator('.skin-card[data-skin="violet"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Eclipse Prism');
  await expect(page.locator('#start-cosmetic-preview .tethered-preview-ship')).toBeVisible();
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-locked/);
  await page.locator('#start-cosmetic-close').click();
  await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
  await page.locator('.skin-card[data-skin="violet"] button').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
  await page.locator('.skin-card[data-skin="violet"] button').click();
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-selected/);
  // One locked purchase plus a second equipped cosmetic proves the locker
  // integration and persistence without rerendering every preview in CI.
  await page.locator('.skin-card[data-skin="nova"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Nova Warden');
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.skin-card[data-skin="nova"]')).toHaveClass(/is-selected/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.skins).toMatchObject({ selected: 'nova', unlocked: ['cyan', 'spearhead', 'violet', 'nova'] });
  expect(saved.wallet.nova).toBeLessThan(20000);
  await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'nova');
  expect(failures).toEqual([]);
});

test('compra y equipa canones desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);
  await page.locator('#start-skins').click();
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-player-skins-panel')).toBeHidden();
  await expect(page.locator('#start-cannon-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-cards .cannon-card')).toHaveCount(CANNON_SKIN_DEFINITIONS.length);
  expect(await page.locator('#start-cannon-cards .cannon-card-art').evaluateAll((artworks) =>
    artworks.every((artwork) => getComputedStyle(artwork).overflowX === 'hidden' && getComputedStyle(artwork).overflowY === 'hidden')
  )).toBe(true);
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-locked/);
  await page.locator('.cannon-card[data-cannon="curve"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Arc Needle');
  await expect(page.locator('#start-cosmetic-preview .cannon-preview svg image')).toHaveCount(6);
  await page.mouse.click(2, 2);
  await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-locked/);
  await page.locator('.cannon-card[data-cannon="curve"] button').click();
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-selected/);
  const consoleScroller = page.locator('#start-skins-view .console-body');
  await consoleScroller.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => consoleScroller.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.locator('.cannon-card[data-cannon="helix"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Helix Lance');
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.cannon-card[data-cannon="helix"]')).toHaveClass(/is-selected/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.cannonSkins).toMatchObject({ selected: 'helix', unlocked: ['basic', 'spearhead', 'curve', 'helix'] });
  expect(saved.wallet.nova).toBeLessThan(20000);
  expect(failures).toEqual([]);
});

test('compra y equipa fondos desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-backgrounds-panel')).toBeVisible();
  await expect(page.locator('.skin-preview-stage')).toHaveCount(0);
  const backgroundCards = page.locator('#start-background-cards .background-card');
  await expect(backgroundCards).toHaveCount(BACKGROUND_DEFINITIONS.length);
  expect(await backgroundCards.evaluateAll(cards => cards.map(card => card.getAttribute('data-background'))))
    .toEqual(BACKGROUND_DEFINITIONS.map(background => background.id));
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-locked/);
  await page.locator('.background-card[data-background="ion-storm"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Tormenta iónica');
  await expect(page.locator('#start-cosmetic-preview .background-preview')).toHaveAttribute('data-background', 'ion-storm');
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-selected/);
  await page.locator('.background-card[data-background="crystal-field"] button').click();
  await expect(page.locator('#start-cosmetic-title')).toHaveText('Campo cristal');
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.background-card[data-background="crystal-field"]')).toHaveClass(/is-selected/);
  await page.locator('#start-skins-back').click();
  await expect(page.locator('#start-skins-view')).toBeHidden();
  await expect(page.locator('#start-main-view')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.backgrounds).toMatchObject({ selected: 'crystal-field', unlocked: ['deep-space', 'ion-storm', 'crystal-field'] });
  expect(saved.wallet.nova).toBeLessThan(20000);
  expect(failures).toEqual([]);
});

test('compra una mejora permanente y vuelve al menu', async ({ page }) => {
  const failures = await openFundedMenu(page);

  await page.locator('#start-meta').click();
  await expect(page.locator('#start-meta-view')).toBeVisible();
  await expect(page.locator('.lab-tree-node[data-tree-kind="permanent"][data-offered="true"]')).toHaveCount(3);
  await expect(page.locator('.lab-tree-node[data-tree-kind="permanent"][data-rank="2"]')).toHaveCount(0);
  const chosenUpgrade = await purchaseFirstLaboratoryOffer(page);
  await expect(page.locator(`.lab-tree-node[data-upgrade="${chosenUpgrade}"][data-rank="2"]`)).toHaveCount(1);
  await expect(page.locator(`.lab-tree-node[data-upgrade="${chosenUpgrade}"][data-rank="3"]`)).toHaveCount(0);
  await page.locator('#start-meta-back').click();
  await expect(page.locator('#start-meta-view')).toBeHidden();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.laboratory.levels[chosenUpgrade]).toBe(1);
  expect(saved.wallet.nova).toBeLessThan(20000);
  await page.reload();
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-meta').click();
  await expect(page.locator('.lab-tree-node[data-tree-kind="permanent"][data-offered="true"]')).toHaveCount(3);
  const savedAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(savedAfterReload.laboratory.levels[chosenUpgrade]).toBe(1);
  expect(failures).toEqual([]);
});

test('presenta el menu inicial y conserva la configuracion antes de jugar', async ({ page }) => {
  const failures = await openFundedMenu(page);
  // Keep the return-to-settings regression without repeating all purchases.
  await page.locator('#start-skins').click();
  await page.locator('#start-skins-back').click();
  await page.locator('#start-meta').click();
  await page.locator('#start-meta-back').click();

  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-settings')).toBeVisible();
  const settings = page.locator('#start-settings');
  const expandedSettingsHeight = await settings.evaluate((element) => element.getBoundingClientRect().height);
  expect(expandedSettingsHeight).toBeGreaterThan(40);
  await page.locator('#start-settings-toggle').click();
  await expect(settings).toBeHidden();
  expect(await settings.evaluate((element) => element.getBoundingClientRect().height)).toBe(0);
  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-settings')).toBeVisible();
  await page.locator('#start-music').fill('45');
  await page.locator('#start-sfx').fill('65');
  await expect(page.locator('#start-music-value')).toHaveText('45%');
  await expect(page.locator('#start-sfx-value')).toHaveText('65%');
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#game-hud')).toBeVisible();

  const saved = await page.evaluate(() => localStorage.getItem('geometry-survivor:save'));
  expect(saved).not.toBeNull();
  expect(JSON.parse(saved ?? '{}').settings).toMatchObject({ musicVolume: 0.45, sfxVolume: 0.65 });
  expect(failures).toEqual([]);
});

test('equipa gratis Nacre y Vesper con cartera vacia y conserva el fondo al recargar', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/');
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  const card = page.locator('.background-card[data-background="nacre-orbit"]');
  await expect(card).not.toHaveClass(/is-locked/);
  await expect(card).toContainText('GRATIS');
  await card.locator('button').click();
  await expect(page.locator('#start-cosmetic-action')).toContainText('gratis');
  await page.locator('#start-cosmetic-action').click();
  await expect(card).toHaveClass(/is-selected/);
  await page.reload();
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('.background-card[data-background="nacre-orbit"]')).toHaveClass(/is-selected/);
  const vesper = page.locator('.background-card[data-background="vesper-bloom"]');
  await expect(vesper).not.toHaveClass(/is-locked/);
  await expect(vesper).toContainText('GRATIS');
  await vesper.locator('button').click();
  await page.locator('#start-cosmetic-action').click();
  await expect(vesper).toHaveClass(/is-selected/);
  await page.reload();
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('.background-card[data-background="vesper-bloom"]')).toHaveClass(/is-selected/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.wallet.nova).toBe(0);
  expect(saved.backgrounds.selected).toBe('vesper-bloom');
  expect(saved.backgrounds.unlocked).toEqual(['deep-space', 'nacre-orbit', 'vesper-bloom']);
  await page.locator('#start-skins-back').click();
  await page.locator('#start-play').click();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  expect(failures).toEqual([]);
});

test('muestra el gating de actos y entra a Angular con build limpia cuando esta desbloqueado', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 6,
      unlockedActs: ['radial', 'angular']
    }));
  });
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-level').click();
  await expect(page.locator('#start-act-view')).toBeVisible();
  await expect(page.locator('#start-overdrive')).toBeVisible();
  await expect(page.locator('#start-overdrive')).toBeDisabled();
  await expect(page.locator('#start-act-angular')).toBeEnabled();
  await page.locator('#start-act-angular').click();
  await expect(page.locator('#start-act-angular')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-act-status')).toContainText('Acto II');
  await page.locator('#start-act-back').click();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-entry-view')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
  await expect(page.locator('#run-transition')).toContainText('ANGULAR');
  await expect(page.locator('#pause-toggle')).toBeHidden();
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#run-transition')).toBeHidden();
  await expect(page.locator('#pause-toggle')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: angular-act');
  expect(failures).toEqual([]);
});

test('habilita vitalidad solo tras tres compras NOVA y persiste el rango del anuncio', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('geometry-survivor:save', JSON.stringify({
    schemaVersion: 8,
    wallet: { nova: 20_000 },
    overdrive: { unlocked: true }
  })));
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-meta').click();
  const vitalityNode = page.locator('.lab-tree-node[data-tree-kind="vitality"][data-rank="1"]');
  await expect(vitalityNode).toHaveAttribute('data-offered', 'false');
  await panLaboratoryTowardVitality(page);
  await expect(vitalityNode).toBeVisible();
  await vitalityNode.click();
  await expect(page.locator('#start-lab-node-action')).toBeDisabled();
  await expect(page.locator('#start-lab-node-status')).toContainText('3 mejoras');
  await page.locator('#start-lab-node-close').click();
  for (let purchase = 0; purchase < 3; purchase += 1) {
    await purchaseFirstLaboratoryOffer(page, false);
  }
  const afterPurchases = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(afterPurchases.laboratory.purchasesSinceVitalityAd).toBe(3);
  await panLaboratoryTowardVitality(page);
  const availableVitalityNode = page.locator('.lab-tree-node[data-tree-kind="vitality"][data-rank="1"]');
  await availableVitalityNode.click();
  await expect(page.locator('#start-lab-node-action')).toBeEnabled();
  await page.locator('#start-lab-node-action').click();
  await expect(page.locator('#start-lab-node-dialog')).toBeHidden({ timeout: 5_000 });
  const afterReward = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(afterReward.laboratory.vitalityAdRank).toBe(1);
  expect(afterReward.laboratory.purchasesSinceVitalityAd).toBe(0);
});

test('mantiene el Laboratorio bloqueado hasta desbloquear Overdrive', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-meta')).toBeDisabled();
  await expect(page.locator('#start-meta')).toHaveAttribute('aria-label', /vence el Acto III/);
});

test('ofrece Overdrive dentro de la seleccion de actos cuando esta desbloqueado', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 7,
      unlockedActs: ['radial', 'angular', 'fracture'],
      overdrive: { unlocked: true }
    }));
  });
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-level').click();
  await expect(page.locator('#start-act-view')).toBeVisible();
  await expect(page.locator('#start-overdrive')).toBeVisible();
  await expect(page.locator('#start-overdrive')).toBeEnabled();
  await page.evaluate(() => { (window as unknown as { menuIdentity: string }).menuIdentity = 'same-document'; });
  await page.locator('#start-overdrive').click();
  await expect(page.locator('#start-overdrive')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-overdrive')).toBeEnabled();
  await expect(page.locator('#start-act-radial')).not.toHaveClass(/is-selected/);
  await expect(page.locator('#start-act-status')).toContainText('Infinito');
  await expect(page.locator('#start-act-play')).toHaveText('INICIAR INFINITO');
  await page.locator('#start-act-angular').click();
  await expect(page.locator('#start-overdrive')).not.toHaveClass(/is-selected/);
  await page.locator('#start-overdrive').click();
  await page.locator('#start-act-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
  await expect(page.locator('#run-transition')).toContainText('OVERDRIVE');
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#game-hud')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: overdrive-stage-1');
  expect(await page.evaluate(() => (window as unknown as { menuIdentity: string }).menuIdentity)).toBe('same-document');
  await page.locator('#pause-toggle').click();
  await expect(page.locator('#pause-withdraw')).toBeVisible();
  await expect(page.locator('#pause-withdraw')).toContainText('Retirarse y cobrar');
  await page.locator('#pause-menu').click();
  await page.locator('#start-level').click();
  await expect(page.locator('#start-overdrive')).toBeEnabled();
  await expect(page.locator('#start-overdrive')).toHaveClass(/is-selected/);
  await page.locator('#start-act-angular').click();
  await page.locator('#start-act-play').click();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#debug-panel')).toContainText('mode: angular-act');
  expect(failures).toEqual([]);
});

test('recuerda la ultima ruta al recargar y al jugar directo desde el menu', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('geometry-survivor:save')) localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 8, unlockedActs: ['radial', 'angular', 'fracture'], overdrive: { unlocked: true }
    }));
  });
  await page.goto('/?debug=1&quality=low');
  // Unit tests cover all four persisted IDs. Keep CI's WebGL smoke focused
  // on the two distinct flows: a non-default campaign act and Overdrive.
  for (const route of ['angular', 'overdrive']) {
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-level').click();
    const selector = route === 'overdrive' ? '#start-overdrive' : `#start-act-${route}`;
    await page.locator(selector).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save')!).lastSelectedRoute)).toBe(route);
    await page.locator('#start-act-back').click();
    await page.reload();
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-play-route')).toHaveText(route === 'overdrive' ? 'Infinito · Overdrive' : 'Acto II · Angular');
    // The persisted menu caption identifies the route selected before reload.
    // Start one real run per route so this WebGL smoke doesn't repeat the
    // expensive Overdrive stage initialization without adding route coverage.
    await page.locator('#start-play').click();
    await expect(page.locator('#run-transition')).toHaveAttribute('data-route', route);
    await page.locator('[data-run-transition-skip]').click();
    await expect(page.locator('#pause-toggle')).toBeVisible();
    await page.locator('#pause-toggle').click();
    await page.locator('#pause-menu').click();
  }
  expect(failures).toEqual([]);
});

test('al continuar del Acto III anuncia Overdrive con la entrada breve', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 7,
      unlockedActs: ['radial', 'angular', 'fracture'],
      overdrive: { unlocked: true }
    }));
  });
  await page.goto('/?mode=overdrive&autostart=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'basic');
  await expect(page.locator('#run-transition')).toContainText('OVERDRIVE');
  await page.screenshot({ path: testInfo.outputPath('run-intro-basic-desktop.png') });
  await expect(page.locator('#run-transition')).toBeHidden({ timeout: 5_000 });
  await expect(page.locator('#pause-toggle')).toBeVisible();
});

test('muestra y conserva el reporte local de linea base con ?baseline=1', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?baseline=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#baseline-panel')).toBeVisible();
  await expect(page.locator('#baseline-count')).toHaveText('0/10 runs');
  await expect(page.locator('#debug-panel')).toContainText('baseline: 0/10');

  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect.poll(async () => page.locator('#baseline-output').textContent())
    .toContain('Run en curso: si');
  expect(failures).toEqual([]);
});

test('ofrece un desbloqueo cosmetico rewarded y lo persiste', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?ad=success');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-skins').click();
  const offer = page.locator('#start-cosmetic-rewarded');
  await expect(offer).toBeVisible();
  await expect(page.locator('#start-cosmetic-rewarded-name')).toHaveText('Eclipse Prism');
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-cosmetic-rewarded-name')).toHaveText('Arc Needle');
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-cosmetic-rewarded-name')).toContainText('Tormenta');
  await page.locator('#start-player-skins-tab').click();
  await expect(page.locator('#start-cosmetic-rewarded-name')).toHaveText('Eclipse Prism');
  await page.locator('#start-cosmetic-rewarded summary').click();
  await page.locator('#start-cosmetic-rewarded-button').click();
  await expect(page.locator('#start-cosmetic-rewarded-button')).toHaveText('Anuncio en curso');
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-selected/, { timeout: 5_000 });
  await expect(offer).toContainText('desbloqueado y equipado');
  await expect(page.locator('#start-cosmetic-rewarded-button')).toBeHidden();

  const saved = await page.evaluate(() => localStorage.getItem('geometry-survivor:save'));
  expect(JSON.parse(saved ?? '{}').skins).toMatchObject({ selected: 'violet', unlocked: ['cyan', 'spearhead', 'violet'] });
  await expect(page.locator('.home-mark-image')).toHaveAttribute('data-skin', 'violet');
  expect(failures).toEqual([]);
});

test('oculta la oferta cosmetica cuando el adaptador local no tiene inventario', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?ad=unavailable');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-skins').click();
  await expect(page.locator('#start-cosmetic-rewarded')).toBeHidden();
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-locked/);
  expect(failures).toEqual([]);
});

const getPlayerPosition = async (page: Page): Promise<{ x: number; y: number }> => {
  const debugText = await page.locator('#debug-panel').textContent();
  const match = debugText?.match(/player: (-?[\d.]+), (-?[\d.]+)/);
  if (!match) throw new Error(`No se encontró la posición del jugador en debug: ${debugText}`);
  return { x: Number(match[1]), y: Number(match[2]) };
};

test('carga, acepta input, pausa y mantiene el canvas durante resize', async ({ page }) => {
  const failures = await openGame(page);
  const canvas = page.locator('#game-container canvas');
  await expect(page.locator('#debug-panel')).toBeVisible();

  const keyboardStart = await getPlayerPosition(page);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await getPlayerPosition(page)).x).toBeGreaterThan(keyboardStart.x + 8);
  await page.keyboard.up('ArrowRight');

  const pointerStart = await getPlayerPosition(page);
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error('El canvas no tiene dimensiones visibles');
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width * 0.75, canvasBox.y + canvasBox.height * 0.5);
  await expect.poll(async () => (await getPlayerPosition(page)).x).toBeGreaterThan(pointerStart.x + 8);
  await page.mouse.up();

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.locator('#pause-resume').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();

  for (const viewport of RESIZE_MATRIX) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const box = await canvas.boundingBox();
      return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
    }).toEqual(viewport);
    await expect(page.locator('#boot-status')).toBeHidden();
  }

  expect(failures).toEqual([]);
});

test('pausa manualmente y persiste los ajustes de audio', async ({ page }) => {
  const failures = await openGame(page);
  await expect(page.locator('#pause-toggle')).toBeVisible();
  await expect(page.locator('#pause-toggle svg')).toBeVisible();
  await page.locator('#pause-toggle').click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await expect(page.locator('#pause-withdraw')).toBeHidden();
  await expect(page.locator('#pause-toggle')).toBeHidden();
  await expect(page.locator('#pause-overlay')).toHaveAttribute('aria-describedby', 'pause-message');
  await expect(page.locator('#pause-panel-frame svg')).toBeVisible();
  await expect(page.locator('#pause-overlay button:not([hidden]) svg')).toHaveCount(4);
  const pauseLayout = await page.locator('#pause-overlay').evaluate((overlay) => {
    const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('button:not([hidden])')];
    const panel = overlay.querySelector<HTMLElement>('.pause-panel');
    return {
      buttonsHaveTouchTarget: buttons.every((button) => {
        const box = button.getBoundingClientRect();
        return box.width >= 44 && box.height >= 44;
      }),
      panelFitsViewport: panel !== null && panel.getBoundingClientRect().right <= window.innerWidth + 1
    };
  });
  expect(pauseLayout).toEqual({ buttonsHaveTouchTarget: true, panelFitsViewport: true });
  const pauseIds = await page.locator('#pause-overlay').evaluate((overlay) => {
    const ids = [...overlay.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id);
    return { ids, unique: new Set(ids).size === ids.length };
  });
  expect(pauseIds.unique).toBe(true);

  await page.locator('#pause-settings-toggle').click();
  await expect(page.locator('#pause-settings-toggle svg')).toBeVisible();
  await expect(page.locator('#pause-settings .pause-setting-icon svg')).toHaveCount(4);
  await page.locator('#pause-music').fill('35');
  await page.locator('#pause-sfx').fill('55');
  await page.locator('#pause-muted').check();
  await expect(page.locator('#pause-music-value')).toHaveText('35%');
  await expect(page.locator('#pause-sfx-value')).toHaveText('55%');

  const saved = await page.evaluate(() => localStorage.getItem('geometry-survivor:save'));
  expect(saved).not.toBeNull();
  expect(JSON.parse(saved ?? '{}').settings).toMatchObject({ musicVolume: 0.35, sfxVolume: 0.55, muted: true });

  await page.locator('#pause-resume').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
  await page.reload();
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-play').click();
  await expect(page.locator('#pause-toggle')).toBeVisible();
  await page.locator('#pause-toggle').click();
  await page.locator('#pause-settings-toggle').click();
  await expect(page.locator('#pause-music')).toHaveValue('35');
  await expect(page.locator('#pause-sfx')).toHaveValue('55');
  await expect(page.locator('#pause-muted')).toBeChecked();
  await page.locator('#pause-restart').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
  await expect(page.locator('#pause-toggle')).toBeVisible();
  expect(failures).toEqual([]);
});

test('abre y resuelve un level-up con reroll en gameplay normal', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 8,
      overdrive: { unlocked: true },
      laboratory: {
        levels: { global_damage: 5, weapon_damage_projectile: 5, weapon_cadence: 5 },
        currentOfferIds: [], deferredOffers: [], history: [],
        purchasesSinceVitalityAd: 0, vitalityAdRank: 0, offerStep: 0
      }
    }));
  });
  const failures = await openGame(page);
  const levelUp = page.locator('#level-up');
  const gameOver = page.locator('#game-over');
  const movementKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

  for (let index = 0; index < 45 && !(await levelUp.isVisible()) && !(await gameOver.isVisible()); index += 1) {
    const key = movementKeys[index % movementKeys.length];
    await page.keyboard.down(key);
    await page.waitForTimeout(1_000);
    await page.keyboard.up(key);
  }

  // Keep moving while combat generates XP: standing still during the old
  // post-loop wait let enemies defeat the player before the 8 XP threshold.
  await expect(gameOver).toBeHidden({ timeout: 1_000 });
  await expect(levelUp).toBeVisible({ timeout: 5_000 });
  const choices = page.locator('#level-up-options button');
  await expect(choices).toHaveCount(3);
  const initialChoiceIds = await choices.evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-upgrade-id')));
  const reroll = page.locator('#level-up-reroll');
  await expect(reroll).toBeVisible();
  await reroll.click();
  await expect(reroll).toBeHidden({ timeout: 5_000 });
  const rerolledChoiceIds = await choices.evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-upgrade-id')));
  expect(rerolledChoiceIds).toHaveLength(3);
  expect(rerolledChoiceIds.some((id) => initialChoiceIds.includes(id))).toBe(false);
  await choices.first().click();
  await expect(choices.first()).toHaveClass(/is-selected/);
  await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(levelUp).toBeHidden();

  expect(failures).toEqual([]);
});

test('presenta el compositor de campaña y la pantalla de objetivo post-evolución', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1&campaign=evolved&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeHidden();
  const levelUp = page.locator('#level-up');
  const choices = levelUp.locator('#level-up-options button');
  await expect(levelUp).toBeVisible({ timeout: 10_000 });
  await expect(choices).toHaveCount(3);
  const initialArt = levelUp.locator('.upgrade-card-art img');
  await expect(initialArt).toHaveCount(3);
  const initialDimensions = await initialArt.evaluateAll(images => Promise.all(images.map(async image => {
    await (image as HTMLImageElement).decode();
    return [(image as HTMLImageElement).naturalWidth, (image as HTMLImageElement).naturalHeight];
  })));
  expect(initialDimensions).toEqual([[768, 384], [768, 384], [768, 384]]);
  await expect(levelUp.locator('[data-upgrade-id="universal_weapon_mastery"]')).toBeVisible();
  await expect(levelUp).toHaveAttribute('data-offer-kind', 'standard');

  await levelUp.locator('[data-upgrade-id="universal_weapon_mastery"]').click();
  await expect(levelUp).toBeVisible();
  await expect(levelUp).toHaveAttribute('data-offer-kind', 'mastery-target');
  await expect(choices).toHaveCount(3);
  const cardKinds = await choices.evaluateAll((buttons) => buttons.map((button) => button.dataset.cardKind));
  expect(cardKinds.every((kind) => kind === 'mastery')).toBe(true);
  const evolvedArt = levelUp.locator('.upgrade-card-art img');
  await expect(evolvedArt).toHaveCount(3);
  const evolvedLabels = await evolvedArt.evaluateAll(images => Promise.all(images.map(async image => {
    await (image as HTMLImageElement).decode();
    return image.closest('button')?.querySelector('.upgrade-card-art-label')?.textContent?.trim();
  })));
  expect(evolvedLabels.sort()).toEqual([
    'FULGOR · ÓRBITA',
    'PRECISIÓN · PERFORACIÓN',
    'RED · CIRCUITO CERRADO'
  ].sort());
  await choices.first().click();
  await expect(levelUp).toBeHidden({ timeout: 5_000 });
  expect(failures).toEqual([]);
});

test('ilustra y deja elegir las cartas de escudo, vampirismo y armadura', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  for (const card of [
    { id: 'recharging_shield', art: 'recharging-shield' },
    { id: 'vampiric_core', art: 'vampiric-core' },
    { id: 'hardened_shell', art: 'hardened-shell' }
  ]) {
    await page.goto(`/?card=${card.id.replaceAll('_', '-')}&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    const levelUp = page.locator('#level-up');
    await expect(levelUp).toBeVisible({ timeout: 10_000 });
    const choice = page.locator(`#level-up-options button[data-upgrade-id="${card.id}"]`);
    await expect(choice).toBeVisible();
    const art = choice.locator('.upgrade-card-art img');
    await expect(art).toHaveCount(1);
    const loaded = await art.evaluate(async (image, { expectedArt }) => {
      await (image as HTMLImageElement).decode();
      return (image as HTMLImageElement).naturalWidth === 768
        && (image as HTMLImageElement).naturalHeight === 384
        && (image as HTMLImageElement).currentSrc.includes(expectedArt);
    }, { expectedArt: card.art });
    expect(loaded).toBe(true);
    await choice.click();
    await expect(levelUp).toBeHidden({ timeout: 5_000 });
  }
  expect(failures).toEqual([]);
});

for (const weaponCard of [
  { query: 'pulse-ring', id: 'pulse_ring' },
  { query: 'magnetic-charge', id: 'magnetic_charge' }
] as const) {
  test(`permite probar la carta ${weaponCard.query} dentro de una run real`, async ({ page }) => {
    const failures = captureRuntimeFailures(page);
    await page.goto(`/?card=${weaponCard.query}&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#game-container canvas')).toBeVisible();
    await expect(page.locator('#start-screen')).toBeHidden();

    const levelUp = page.locator('#level-up');
    await expect(levelUp).toBeVisible({ timeout: 10_000 });
    const card = page.locator(`#level-up-options button[data-upgrade-id="${weaponCard.id}"]`);
    await expect(card).toBeVisible();
    await card.click();
    await expect(levelUp).toBeHidden({ timeout: 5_000 });
    await expect(page.locator('#game-hud')).toBeVisible();

    expect(failures).toEqual([]);
  });
}

for (const weaponPath of [
  { query: 'projectile', label: 'projectile' },
  { query: 'orbit', label: 'orbit' },
  { query: 'chain', label: 'chain' },
  { query: 'boomerang', label: 'boomerang' },
  { query: 'pulse-ring', label: 'pulse_ring' },
  { query: 'magnetic-charge', label: 'magnetic_charge' }
] as const) {
  test(`expone el primer rango de la ruta ${weaponPath.query}`, async ({ page }) => {
    test.setTimeout(120_000);
    const failures = captureRuntimeFailures(page);
    await page.goto(`/?weapon-path=${weaponPath.query}&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#debug-panel')).toContainText(`mode: weapon-path-${weaponPath.label}`);
    await expect(page.locator('#debug-panel')).toContainText('rank 1/6');

    const levelUp = page.locator('#level-up');
    const movementKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    for (let index = 0; index < 30 && !(await levelUp.isVisible()); index += 1) {
      const key = movementKeys[index % movementKeys.length];
      await page.keyboard.down(key);
      await page.waitForTimeout(400);
      await page.keyboard.up(key);
    }
    await expect(levelUp).toBeVisible({ timeout: 25_000 });
    await expect(levelUp.locator('#level-up-options button')).toHaveCount(1);
    await expect(levelUp.locator('#level-up-options button')).toHaveAttribute(
      'data-upgrade-id', `${weaponPath.label}_rank_2`
    );
    await levelUp.locator('#level-up-options button').click();
    await expect(levelUp).toBeHidden({ timeout: 5_000 });
    await expect(page.locator('#debug-panel')).toContainText('rank 2/6');
    expect(failures).toEqual([]);
  });
}

const WEAPON_EVOLUTION_DRILLS = [
  { query: 'rail-lance', ids: ['rail_lance', 'pulse_volley'] },
  { query: 'pulse-volley', ids: ['rail_lance', 'pulse_volley'] },
  { query: 'solar-crown', ids: ['solar_crown', 'graviton_halo'] },
  { query: 'graviton-halo', ids: ['solar_crown', 'graviton_halo'] },
  { query: 'closed-circuit', ids: ['closed_circuit', 'thunderhead'] },
  { query: 'thunderhead', ids: ['closed_circuit', 'thunderhead'] },
  { query: 'twin-comet', ids: ['twin_comet', 'singularity_return'] },
  { query: 'singularity-return', ids: ['twin_comet', 'singularity_return'] },
  { query: 'echo-shock', ids: ['echo_shock', 'compression_wave'] },
  { query: 'compression-wave', ids: ['echo_shock', 'compression_wave'] },
  { query: 'event-horizon', ids: ['event_horizon', 'polar_collapse'] },
  { query: 'polar-collapse', ids: ['event_horizon', 'polar_collapse'] }
] as const;

for (let index = 0; index < WEAPON_EVOLUTION_DRILLS.length; index += 2) {
  const familyDrills = WEAPON_EVOLUTION_DRILLS.slice(index, index + 2);
  test(`expone evoluciones ${familyDrills[0].ids.join(' / ')} como dos cartas`, async ({ page }) => {
    const failures = captureRuntimeFailures(page);
    const levelUp = page.locator('#level-up');
    const choices = page.locator('#level-up-options button');

    for (const drill of familyDrills) {
      await page.goto(`/?evolution=${drill.query}&debug=1&quality=low`);
      await expect(page.locator('#boot-status')).toBeHidden();
      await expect(page.locator('#start-screen')).toBeHidden();
      await expect(levelUp).toBeVisible({ timeout: 10_000 });
      await expect(levelUp).toHaveAttribute('data-offer-kind', 'evolution');
      await expect(choices).toHaveCount(2);
      await expect(page.locator('#level-up-reroll')).toBeHidden();
      expect(await choices.evaluateAll((buttons) => buttons.map((button) => button.dataset.upgradeId))).toEqual(drill.ids);
      const art = choices.locator('.upgrade-card-art img');
      await expect(art).toHaveCount(2);
      const decodedArt = await art.evaluateAll(images => Promise.all(images.map(async image => {
        await (image as HTMLImageElement).decode();
        return [(image as HTMLImageElement).naturalWidth, (image as HTMLImageElement).naturalHeight];
      })));
      expect(decodedArt).toEqual([[768, 384], [768, 384]]);
      await choices.first().click();
      await expect(levelUp).toBeHidden({ timeout: 5_000 });
    }

    expect(failures).toEqual([]);
  });
}

test('permite probar cada evolucion aplicada contra un objetivo o una masa', async ({ page }) => {
  test.setTimeout(120_000);
  const failures = captureRuntimeFailures(page);
  const debugPanel = page.locator('#debug-panel');

  for (const drill of WEAPON_EVOLUTION_DRILLS) {
    await page.goto(`/?evolution=${drill.query}&scenario=single&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#level-up')).toBeHidden();
    await expect.poll(async () => debugPanel.textContent(), { timeout: 5_000 })
      .toMatch(new RegExp(`mode: evolution-single[\\s\\S]*enemies: 1/250[\\s\\S]*evolution: ${drill.query.replaceAll('-', '_')}`));

    await page.goto(`/?evolution=${drill.query}&scenario=mass&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(page.locator('#level-up')).toBeHidden();
    await expect.poll(async () => debugPanel.textContent(), { timeout: 5_000 })
      .toMatch(new RegExp(`mode: evolution-mass[\\s\\S]*enemies: 56/250[\\s\\S]*evolution: ${drill.query.replaceAll('-', '_')}`));
  }

  expect(failures).toEqual([]);
});

test('permite probar el boss desde el atajo de desarrollo', async ({ page }) => {
  test.setTimeout(20_000);
  const failures = captureRuntimeFailures(page);
  await page.goto('/?boss=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toBeVisible();
  await expect.poll(async () => {
    const debugText = await page.locator('#debug-panel').textContent();
    return debugText?.match(/boss: (?!inactive)([^\n]+)/)?.[1] ?? '';
  }).toMatch(/intro|sweep-telegraph|sweep-active|ring-telegraph|ring-active|recovery/);
  await expect.poll(async () => page.locator('#debug-panel').textContent(), { timeout: 8_000 })
    .toMatch(/boss: (sweep-telegraph|sweep-active)/);
  await expect.poll(async () => page.locator('#debug-panel').textContent(), { timeout: 8_000 })
    .toMatch(/boss: (ring-telegraph|ring-active)/);

  expect(failures).toEqual([]);
});

test('carga el drill del Pulse Ring y expone la abertura durante el ataque', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?pulse=1&debug=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: pulse-ring-drill');
  await expect.poll(() => page.locator('#debug-panel').textContent()).toContain('pulse: active');
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('pulse-ring-low.png') });
  expect(failures).toEqual([]);
});

test('carga el drill del arma Pulse Ring con blancos de prueba y vista premium', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?weapon=pulse-ring&debug=1&quality=high');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: pulse-ring-weapon-drill');
  await expect(page.locator('#debug-panel')).toContainText('enemies: 7/250');
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 20_000, intervals: [50] })
    .toMatch(/pulse: active/);
  await page.locator('#pause-toggle').evaluate((button: HTMLElement) => button.click());
  await page.locator('#game-container canvas').screenshot({
    path: testInfo.outputPath('pulse-ring-weapon-high.png'),
    style: '#pause-overlay { visibility: hidden !important; }'
  });
  expect(failures).toEqual([]);
});

for (const quality of ['low', 'high'] as const) {
  test(`carga el ciclo PNG completo de Magnetic Charge en ${quality}`, async ({ page }, testInfo) => {
    const failures = captureRuntimeFailures(page);
    const magneticImageResponses = new Set<string>();
    const magneticBaseAssets = [
      'magnetic-singularity-core',
      'magnetic-charge-field',
      'magnetic-charge-travel',
      'magnetic-charge-detonation'
    ];
    page.on('response', response => {
      if (response.ok() && magneticBaseAssets.some(asset => response.url().includes(asset))) {
        magneticImageResponses.add(response.url());
      }
    });
    await page.goto(`/?weapon=magnetic-charge&debug=1&quality=${quality}`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#game-container canvas')).toBeVisible();
    await expect(page.locator('#debug-panel')).toContainText('mode: magnetic-charge-drill');
    await expect(page.locator('#debug-panel')).toContainText('enemies: 8/250');
    await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 8_000 })
      .toMatch(/magnetic: detonate \|/);
    await expect.poll(() => magneticImageResponses.size, { timeout: 8_000 }).toBe(4);
    await page.locator('#pause-toggle').evaluate((button: HTMLElement) => button.click());
    await page.locator('#game-container canvas').screenshot({
      path: testInfo.outputPath(`magnetic-charge-weapon-${quality}.png`),
      style: '#pause-overlay { visibility: hidden !important; } #debug-panel { visibility: hidden !important; }'
    });
    expect(failures).toEqual([]);
  });
}

test('carga el drill Angular y mantiene el sector activo acotado', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?angular=1&debug=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: angular-sweep-drill');
  await expect.poll(() => page.locator('#debug-panel').textContent()).toContain('angular: active');
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('angular-sweep-low.png') });
  expect(failures).toEqual([]);
});

test('carga el drill del Orbiter y muestra una ruta local durante el compromiso', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?orbiter=1&debug=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: orbiter-drill');
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 12_000 })
    .toMatch(/orbiter: (telegraph|commit)/);
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('orbiter-local-route-low.png') });
  expect(failures).toEqual([]);
});

for (const quality of ['low', 'high']) {
  test(`carga el drill Prism Weaver y mantiene su ataque anclado al enemigo ${quality}`, async ({ page }, testInfo) => {
    const failures = captureRuntimeFailures(page);
    await page.goto(`/?prism=1&debug=1&quality=${quality}`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#game-container canvas')).toBeVisible();
    await expect(page.locator('#debug-panel')).toContainText('mode: prism-weaver-drill');
    await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 12_000 })
      .toMatch(/prism: (telegraph|active)/);
    await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath(`prism-weaver-${quality}.png`) });
    expect(failures).toEqual([]);
  });
}

test('recorre la familia de ataques premium de Orbital Warden', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?warden=1&debug=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: warden-drill');
  await expect.poll(() => page.locator('#debug-panel').textContent()).toContain('boss:');
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 15_000 })
    .toMatch(/boss: charge-/);
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 15_000 })
    .toMatch(/boss: curve-/);
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 15_000 })
    .toMatch(/boss: replicas-/);
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('orbital-warden-low.png') });
  expect(failures).toEqual([]);
});

test('carga el Acto III Fracture con arena activa y entrada limpia', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1&act=fracture&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: fracture-act');
  await expect(page.locator('#debug-panel')).toContainText('arena: 270.0 | octagon');
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('fracture-opening-low.png') });
  expect(failures).toEqual([]);
});

test('expone el Fracture Engine desde su atajo y ejecuta sus patrones authored', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1&act=fracture&boss=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: fracture-act');
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 12_000 })
    .toMatch(/boss: (intro|battery-)/);
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 12_000 })
    .toMatch(/boss: (spikes-|zigzag-|mines-)/);
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('fracture-engine-low.png') });
  expect(failures).toEqual([]);
});

test('abre el escenario reproducible de Overdrive y conserva su perfil de tramo', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1&mode=overdrive&od-stage=4&seed=305441741&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: overdrive-stage-4');
  await expect(page.locator('#debug-panel')).toContainText('arena: 270.0 | hexagon');
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('overdrive-stage-4-low.png') });
  expect(failures).toEqual([]);
});

for (const [query, mode] of [
  ['gunner', 'fracture-drill'],
  ['thorn', 'fracture-drill'],
  ['zigzag', 'fracture-drill'],
  ['miner', 'fracture-drill']
] as const) {
  test(`carga el drill Fracture ${query}`, async ({ page }) => {
    const failures = captureRuntimeFailures(page);
    await page.goto(`/?debug=1&fracture-drill=${query}&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#game-container canvas')).toBeVisible();
    await expect(page.locator('#debug-panel')).toContainText(`mode: ${mode}`);
    await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 12_000 })
      .toMatch(/fracture: /);
    expect(failures).toEqual([]);
  });
}

test('pausa y reanuda tras perder y recuperar el contexto WebGL', async ({ page }) => {
  const failures = await openGame(page);
  const contextState = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-container canvas');
    if (!canvas) throw new Error('No se encontró el canvas');
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(contextState).toBe(true);
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-container canvas');
    if (!canvas) throw new Error('No se encontró el canvas');
    canvas.dispatchEvent(new Event('webglcontextrestored'));
  });
  await expect(page.locator('#pause-message')).toContainText('recuperó');
  await page.locator('#pause-resume').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();

  expect(failures).toEqual([]);
});

test('mantiene almacenamiento local disponible tras recargar', async ({ page }) => {
  const failures = await openGame(page);
  const key = 'geometry-survivor:browser-smoke';
  await page.evaluate(([storageKey, value]) => localStorage.setItem(storageKey, value), [key, 'ok']);
  await page.reload();
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).resolves.toBe('ok');

  expect(failures).toEqual([]);
});
