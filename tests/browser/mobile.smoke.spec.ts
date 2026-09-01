import { expect, test, type Page } from '@playwright/test';

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

test('permite desplazarse por el locker de skins en portrait', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-skins').click();
  await expect(page.locator('#start-skins-view')).toBeVisible();

  const lockerMotion = await page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('#start-screen');
    const panel = document.querySelector<HTMLElement>('.start-screen-panel');
    const scene = document.querySelector<HTMLElement>('.start-scene');
    const preview = document.querySelector<SVGElement>('.skin-preview svg');
    const previewCore = document.querySelector<SVGElement>('.skin-preview svg .skin-art-core');
    const cardSignature = document.querySelector<SVGElement>('.skin-card-art svg .skin-art-orbit');
    if (!screen || !panel || !scene || !preview || !previewCore || !cardSignature) throw new Error('Faltan capas del locker');
    return {
      mode: screen.classList.contains('is-skins-mode'),
      panel: getComputedStyle(panel).animationName,
      panelInner: getComputedStyle(panel, '::before').animationName,
      sceneAtmosphere: getComputedStyle(scene, '::before').animationName,
      preview: getComputedStyle(preview).animationName,
      previewCore: getComputedStyle(previewCore).animationName,
      cardArt: getComputedStyle(cardSignature).animationName
    };
  });
  expect(lockerMotion).toEqual({
    mode: true,
    panel: 'none',
    panelInner: 'none',
    sceneAtmosphere: 'none',
    preview: 'skin-preview-float-mobile',
    previewCore: 'skin-art-core-mobile',
    cardArt: 'none'
  });

  const scrollMetrics = await page.locator('#start-skin-cards').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
  await page.locator('#start-skin-cards').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(async () => page.locator('#start-skin-cards').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator('.start-screen-panel')).toHaveJSProperty('scrollTop', 0);
  await expect(page.locator('#start-skins-back')).toBeVisible();
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-cannon-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-preview svg')).toBeVisible();
  await expect(page.locator('#start-cannon-cards .cannon-card')).toHaveCount(4);
  const cannonScrollMetrics = await page.locator('#start-cannon-cards').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  }));
  expect(cannonScrollMetrics.scrollHeight).toBeGreaterThan(cannonScrollMetrics.clientHeight);
  await page.locator('#start-cannon-cards').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(async () => page.locator('#start-cannon-cards').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.locator('#start-player-skins-tab').click();
  await expect(page.locator('#start-skin-preview')).toBeVisible();
  expect(failures).toEqual([]);
});

test('mantiene el control touch en portrait móvil', async ({ page }) => {
  test.setTimeout(20_000);
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();

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
  await page.locator('#pause-music').fill('40');
  await expect(page.locator('#pause-music-value')).toHaveText('40%');
  await page.locator('#pause-resume').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
  expect(failures).toEqual([]);
});
