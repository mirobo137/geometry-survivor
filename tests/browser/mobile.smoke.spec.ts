import { expect, test, type Page } from '@playwright/test';
import { BACKGROUND_DEFINITIONS } from '../../src/content/visual/BackgroundDefinitions';
import { registerHomeChecks } from './home.checks';
import { registerResourceChecks } from './resources.checks';
import { registerTetheredShipChecks } from './tethered.checks';

registerHomeChecks({ includeDesktopViewport: false });
registerResourceChecks();
registerTetheredShipChecks();

test('la entrada premium cabe en movil y deja iniciar sin esperar', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await page.locator('#start-play').click();
  await expect(page.locator('#run-transition')).toHaveAttribute('data-variant', 'premium');
  await expect(page.locator('[data-run-transition-name]')).toHaveText('RADIAL');
  const skipButton = page.locator('[data-run-transition-skip]');
  await expect(skipButton).toBeVisible();
  const skip = await skipButton.boundingBox();
  const viewport = page.viewportSize();
  expect(skip).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(skip!.x).toBeGreaterThanOrEqual(0);
  expect(skip!.y).toBeGreaterThanOrEqual(0);
  expect(skip!.x + skip!.width).toBeLessThanOrEqual(viewport!.width);
  expect(skip!.y + skip!.height).toBeLessThanOrEqual(viewport!.height);
  await skipButton.click();
  await expect(page.locator('#run-transition')).toBeHidden();
  await expect(page.locator('#pause-toggle')).toBeVisible();
  // The intro expires on its own. A diagnostic screenshot before this click
  // can outlast it on a slow renderer; capture only after the skip is verified.
  if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath('run-start-mobile.png') });
  expect(failures).toEqual([]);
});

test('joystick opcional persiste y se cancela en pausa, cambio y rotación', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-settings-toggle').click();
  await page.locator('#start-control-scheme').selectOption('joystick');
  await page.reload();
  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-control-scheme')).toHaveValue('joystick');
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#run-transition')).toBeHidden();
  const gesture = async (type: string, x: number, y: number) => page.evaluate(({ type, x, y }) => {
    document.querySelector('#game-container')!.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 71, pointerType: 'touch',
      clientX: x, clientY: y, button: 0
    }));
  }, { type, x, y });
  const before = await getPlayerX(page);
  await gesture('pointerdown', 100, 660);
  await gesture('pointermove', 152, 660);
  await expect(page.locator('.touch-joystick')).toBeVisible();
  await expect.poll(() => getPlayerX(page)).toBeGreaterThan(before + 8);
  await page.screenshot({ path: testInfo.outputPath('joystick-portrait.png') });
  await page.locator('#pause-toggle').click();
  await expect(page.locator('.touch-joystick')).toBeHidden();
  await page.locator('#pause-settings-toggle').click();
  await expect(page.locator('#pause-control-scheme')).toHaveValue('joystick');
  await page.locator('#pause-control-scheme').selectOption('touch');
  await page.locator('#pause-resume').click();
  await gesture('pointerdown', 200, 400);
  await expect(page.locator('.touch-joystick')).toBeHidden();
  await gesture('pointerup', 200, 400);
  await page.locator('#pause-toggle').click();
  await page.locator('#pause-settings-toggle').click();
  await page.locator('#pause-control-scheme').selectOption('joystick');
  await page.locator('#pause-resume').click();
  await gesture('pointerdown', 100, 660);
  await gesture('pointermove', 152, 660);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.touch-joystick')).toBeHidden();
  await gesture('pointerdown', 120, 290);
  await gesture('pointermove', 150, 290);
  await expect(page.locator('.touch-joystick')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('joystick-landscape.png') });
  await gesture('pointercancel', 150, 290);
  await expect(page.locator('.touch-joystick')).toBeHidden();
  expect(failures).toEqual([]);
});

const captureRuntimeFailures = (page: Page): string[] => {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => failures.push(`requestfailed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`response ${response.status()}: ${response.url()}`);
  });
  return failures;
};

const getPlayerX = async (page: Page): Promise<number> => {
  const debugText = await page.locator('#debug-panel').textContent();
  const match = debugText?.match(/player: (-?[\d.]+),/);
  if (!match) throw new Error(`No se encontró la posición del jugador: ${debugText}`);
  return Number(match[1]);
};

test('permite desplazarse por el locker de skins en portrait', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1&quality=medium');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-skins').click();
  await expect(page.locator('#start-skins-view')).toBeVisible();
  await expect(page.locator('#start-player-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('.skin-preview-stage')).toHaveCount(0);
  await page.locator('.skin-card[data-skin="cyan"] button').click();
  await expect(page.locator('#start-cosmetic-dialog')).toBeVisible();

  const lockerMotion = await page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('#start-screen');
    const panel = document.querySelector<HTMLElement>('.start-screen-panel');
    const scene = document.querySelector<HTMLElement>('.start-scene');
    const preview = document.querySelector<HTMLElement>('#start-cosmetic-preview .tethered-preview');
    const previewCraft = document.querySelector<HTMLElement>('#start-cosmetic-preview .tethered-preview-craft');
    const cardPreview = document.querySelector<HTMLElement>('.skin-card-art .tethered-preview');
    const cardCraft = document.querySelector<HTMLElement>('.skin-card-art .tethered-preview-craft');
    if (!screen || !panel || !scene || !preview || !previewCraft || !cardPreview || !cardCraft) {
      throw new Error('Faltan capas del locker');
    }
    return {
      mode: screen.classList.contains('is-skins-mode'),
      panel: getComputedStyle(panel).animationName,
      panelInner: getComputedStyle(panel, '::before').animationName,
      sceneAtmosphere: getComputedStyle(scene, '::before').animationName,
      preview: getComputedStyle(preview).animationName,
      previewAnimated: preview.classList.contains('is-animated'),
      previewCraft: getComputedStyle(previewCraft).animationName,
      previewImages: [...preview.querySelectorAll('img')].map(image => (image as HTMLImageElement).naturalWidth),
      cardPreviewStatic: cardPreview.classList.contains('is-static'),
      cardCraft: getComputedStyle(cardCraft).animationName,
      cardImages: cardPreview.querySelectorAll('img').length
    };
  });
  expect(lockerMotion).toEqual({
    mode: true,
    panel: 'none',
    panelInner: 'none',
    sceneAtmosphere: 'none',
    preview: 'none',
    previewAnimated: true,
    previewCraft: 'tethered-preview-float',
    previewImages: [256],
    cardPreviewStatic: true,
    cardCraft: 'none',
    cardImages: 1
  });
  const modalBounds = await page.locator('#start-cosmetic-dialog').evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
  });
  expect(modalBounds).toBe(true);
  await expect(page.locator('#start-cosmetic-action')).toBeVisible();
  if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath('cosmetic-nave-portrait.png') });
  await page.locator('#start-cosmetic-close').click();
  await expect(page.locator('#start-cosmetic-preview')).toBeEmpty();

  const scrollMetrics = await page.locator('#start-skins-view .console-body').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
  await page.locator('#start-skins-view .console-body').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(async () => page.locator('#start-skins-view .console-body').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator('.start-screen-panel')).toHaveJSProperty('scrollTop', 0);
  await expect(page.locator('#start-skins-back')).toBeVisible();
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-player-skins-panel')).toBeHidden();
  await expect(page.locator('#start-cannon-skins-panel')).toBeVisible();
  await page.locator('.cannon-card[data-cannon="basic"] button').click();
  await expect(page.locator('#start-cosmetic-preview .cannon-preview svg')).toBeVisible();
  await page.locator('#start-cosmetic-close').click();
  await expect(page.locator('#start-cannon-cards .cannon-card')).toHaveCount(8);
  const cannonScrollMetrics = await page.locator('#start-skins-view .console-body').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  }));
  expect(cannonScrollMetrics.scrollHeight).toBeGreaterThan(cannonScrollMetrics.clientHeight);
  await page.locator('#start-skins-view .console-body').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(async () => page.locator('#start-skins-view .console-body').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.locator('#start-player-skins-tab').click();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-player-skins-panel')).toBeVisible();
  await expect(page.locator('#start-skin-cards')).toBeVisible();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-player-skins-panel')).toBeHidden();
  await expect(page.locator('#start-backgrounds-panel')).toBeVisible();
  const backgroundCards = page.locator('#start-background-cards .background-card');
  await expect(backgroundCards).toHaveCount(BACKGROUND_DEFINITIONS.length);
  expect(await backgroundCards.evaluateAll(cards => cards.map(card => card.getAttribute('data-background'))))
    .toEqual(BACKGROUND_DEFINITIONS.map(background => background.id));
  await page.locator('.background-card[data-background="vesper-bloom"] button').click();
  const backgroundPreview = page.locator('#start-cosmetic-preview .background-preview');
  await expect(backgroundPreview).toHaveAttribute('data-background', 'vesper-bloom');
  expect(await backgroundPreview.evaluate(element => getComputedStyle(element).animationName)).toBe('cosmetic-plate-drift');
  const currents = page.locator('#start-cosmetic-preview .cosmetic-background-current');
  await expect(currents).toHaveCount(4);
  expect(await currents.evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName)))
    .toEqual(Array(4).fill('cosmetic-current-drift'));
  expect(await currents.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundImage)))
    .toEqual([
      expect.stringContaining('tidal-veil-current-a'),
      expect.stringContaining('tidal-veil-current-b'),
      expect.stringContaining('tidal-veil-current-a'),
      expect.stringContaining('tidal-veil-current-b')
    ]);
  if (!process.env.CI) await page.screenshot({ path: testInfo.outputPath('cosmetic-fondo-portrait.png') });
  await page.locator('#start-cosmetic-close').click();
  const backgroundScrollMetrics = await page.locator('#start-skins-view .console-body').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  }));
  expect(backgroundScrollMetrics.scrollHeight).toBeGreaterThan(backgroundScrollMetrics.clientHeight);
  await page.locator('#start-skins-view .console-body').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(async () => page.locator('#start-skins-view .console-body').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('.background-card[data-background="ion-storm"] button').click();
  await expect(page.locator('#start-cosmetic-action')).toBeDisabled();
  await expect(page.locator('#start-cosmetic-status')).toContainText('Faltan');
  await page.touchscreen.tap(3, 3);
  await expect(page.locator('#start-cosmetic-dialog')).toBeHidden();
  await page.locator('.background-card[data-background="nacre-orbit"] button').click();
  expect(await page.locator('#start-cosmetic-dialog').evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
  })).toBe(true);
  await page.locator('#start-cosmetic-action').click();
  await expect(page.locator('.background-card[data-background="nacre-orbit"]')).toHaveClass(/is-selected/);
  expect(failures).toEqual([]);
});

test('mantiene estática la vista previa de fondo en calidad low', async ({ page }) => {
  await page.goto('/?quality=low');
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await page.locator('.background-card[data-background="deep-space"] button').click();
  await expect(page.locator('#start-cosmetic-dialog')).toBeVisible();
  expect(await page.locator('#start-cosmetic-preview .background-preview').evaluate(element =>
    getComputedStyle(element).animationName)).toBe('none');
  expect(await page.locator('#start-cosmetic-preview .cosmetic-background-current').first().evaluate(element =>
    getComputedStyle(element).animationName)).toBe('none');
});

test('mantiene centrada y sin deformación la nave PNG de Manta en móvil', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?quality=medium');
  await page.locator('#start-skins').click();
  await page.locator('.skin-card[data-skin="manta"] button').click();
  await expect.poll(() => page.locator('#start-cosmetic-preview img').evaluateAll(images => images.map(image => (image as HTMLImageElement).naturalWidth)))
    .toEqual([256]);
  const alignment = await page.locator('#start-cosmetic-preview .tethered-preview').evaluate(element => {
    const frame = element.getBoundingClientRect();
    const craft = element.querySelector('.tethered-preview-craft')!.getBoundingClientRect();
    const hull = element.querySelector('.tethered-preview-ship')!.getBoundingClientRect();
    return {
      x: Math.abs(frame.x - craft.x), width: Math.abs(frame.width - craft.width),
      center: Math.abs(frame.x + frame.width / 2 - hull.x - hull.width / 2),
      ratio: hull.width / hull.height
    };
  });
  expect(alignment.x).toBeLessThan(1);
  expect(alignment.width).toBeLessThan(1);
  expect(alignment.center).toBeLessThan(1);
  expect(alignment.ratio).toBeCloseTo(56 / 64, 2);
  if (!process.env.CI) await page.locator('#start-cosmetic-preview').screenshot({ path: testInfo.outputPath('manta-modal-mobile.png') });
});

test('mantiene el control touch en portrait móvil', async ({ page }) => {
  test.setTimeout(20_000);
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-control-scheme option')).toHaveCount(2);
  await page.locator('#start-control-scheme').selectOption('joystick');
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await page.locator('[data-run-transition-skip]').click();
  await expect(page.locator('#run-transition')).toBeHidden();

  const canvas = page.locator('#game-container canvas');
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error('El canvas móvil no tiene dimensiones visibles');
  expect(canvasBox.height).toBeGreaterThan(canvasBox.width);
  const startX = await getPlayerX(page);

  // Dispatch the same Pointer Events that a touch drag produces. This keeps
  // the test deterministic while the Pixel 5 project supplies hasTouch/isMobile.
  await page.evaluate(({ startX, startY, endX, endY }) => {
    const surface = document.querySelector<HTMLElement>('#game-container');
    if (!surface) throw new Error('No se encontró la superficie de juego');
    const pointerInit = (clientX: number, clientY: number): PointerEventInit => ({
      bubbles: true,
      cancelable: true,
      pointerId: 42,
      pointerType: 'touch',
      isPrimary: true,
      clientX,
      clientY
    });
    surface.dispatchEvent(new PointerEvent('pointerdown', pointerInit(startX, startY)));
    surface.dispatchEvent(new PointerEvent('pointermove', pointerInit(endX, endY)));
  }, {
    startX: canvasBox.x + canvasBox.width * 0.5,
    startY: canvasBox.y + canvasBox.height * 0.5,
    endX: canvasBox.x + canvasBox.width * 0.78,
    endY: canvasBox.y + canvasBox.height * 0.5
  });

  await expect.poll(async () => getPlayerX(page)).toBeGreaterThan(startX + 8);
  await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>('#game-container');
    if (!surface) throw new Error('No se encontró la superficie de juego');
    surface.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: 42,
      pointerType: 'touch',
      isPrimary: true
    }));
  });
  await expect(page.locator('#pause-toggle')).toBeVisible();
  await page.locator('#pause-toggle').click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.locator('#pause-settings-toggle').click();
  await expect(page.locator('#pause-control-scheme option')).toHaveCount(2);
  await expect(page.locator('#pause-control-scheme')).toHaveValue('joystick');
  await page.locator('#pause-control-scheme').selectOption('touch');
  await page.locator('#pause-music').fill('40');
  await expect(page.locator('#pause-music-value')).toHaveText('40%');
  await page.locator('#pause-resume').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
  expect(failures).toEqual([]);
});
