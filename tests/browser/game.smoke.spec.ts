import { expect, test, type Page } from '@playwright/test';

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

const openGame = async (page: Page): Promise<string[]> => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect(page.locator('#start-play')).toBeVisible();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#game-hud')).toBeVisible();
  return failures;
};

test('presenta el menu inicial y conserva la configuracion antes de jugar', async ({ page }) => {
  const failures = captureRuntimeFailures(page);
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({ schemaVersion: 5, wallet: { nova: 10000 } }));
  });
  await page.goto('/?debug=1');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeVisible();
  await expect.poll(async () => page.locator('#debug-panel').textContent()).toContain('paused: menu');
  await expect(page.locator('#start-scene svg')).toBeVisible();
  await expect(page.locator('#start-mark svg')).toBeVisible();
  await expect(page.locator('#start-play')).toBeVisible();
  await expect(page.locator('#start-level')).toHaveAttribute('disabled', '');
  await expect(page.locator('#start-skins')).toBeEnabled();

  await page.locator('#start-skins').click();
  await expect(page.locator('#start-main-view')).toBeHidden();
  await expect(page.locator('#start-skins-view')).toBeVisible();
  await expect(page.locator('#start-player-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-skin-preview svg')).toBeVisible();
  await expect(page.locator('#start-skin-cards .skin-card')).toHaveCount(4);
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-locked/);
  await page.locator('.skin-card[data-skin="violet"] button').click();
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-skin-selected-name')).toHaveText('Eclipse Prism');
  for (const skin of ['cyan', 'violet', 'amber', 'emerald']) {
    await page.locator(`.skin-card[data-skin="${skin}"] button`).click();
    await expect(page.locator(`.skin-card[data-skin="${skin}"]`)).toHaveClass(/is-selected/);
  }
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-player-skins-panel')).toBeHidden();
  await expect(page.locator('#start-cannon-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-preview svg')).toBeVisible();
  await expect(page.locator('#start-cannon-preview .cannon-preview-shot')).toHaveCount(2);
  await expect(page.locator('#start-cannon-cards .cannon-card')).toHaveCount(4);
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-locked/);
  await page.locator('.cannon-card[data-cannon="curve"] button').click();
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-cannon-selected-name')).toHaveText('Arc Needle');
  for (const cannon of ['basic', 'curve', 'smoke', 'rainbow']) {
    await page.locator(`.cannon-card[data-cannon="${cannon}"] button`).click();
    await expect(page.locator(`.cannon-card[data-cannon="${cannon}"]`)).toHaveClass(/is-selected/);
  }
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-backgrounds-panel')).toBeVisible();
  await expect(page.locator('#start-background-preview')).toBeVisible();
  await expect(page.locator('#start-background-cards .background-card')).toHaveCount(4);
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-locked/);
  await page.locator('.background-card[data-background="ion-storm"] button').click();
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-background-selected-name')).toHaveText('Tormenta iónica');
  for (const background of ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field']) {
    await page.locator(`.background-card[data-background="${background}"] button`).click();
    await expect(page.locator(`.background-card[data-background="${background}"]`)).toHaveClass(/is-selected/);
  }
  await page.locator('#start-skins-back').click();
  await expect(page.locator('#start-skins-view')).toBeHidden();
  await expect(page.locator('#start-main-view')).toBeVisible();

  await page.locator('#start-meta').click();
  await expect(page.locator('#start-meta-view')).toBeVisible();
  await expect(page.locator('#start-meta-cards .meta-upgrade-card')).toHaveCount(2);
  await page.locator('.meta-upgrade-card[data-upgrade="weapon_damage"] .meta-upgrade-buy').click();
  await expect(page.locator('.meta-upgrade-card[data-upgrade="weapon_damage"] .meta-upgrade-level')).toHaveText('NIVEL 1/5');
  await page.locator('#start-meta-back').click();
  await expect(page.locator('#start-meta-view')).toBeHidden();

  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-settings')).toBeVisible();
  const expandedPanelHeight = await page.locator('.start-screen-panel').evaluate((element) => element.getBoundingClientRect().height);
  await page.locator('#start-settings-toggle').click();
  await expect(page.locator('#start-settings')).toBeHidden();
  const collapsedPanelHeight = await page.locator('.start-screen-panel').evaluate((element) => element.getBoundingClientRect().height);
  expect(collapsedPanelHeight).toBeLessThan(expandedPanelHeight - 40);
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
  expect(JSON.parse(saved ?? '{}').skins).toMatchObject({ selected: 'emerald', unlocked: ['cyan', 'violet', 'amber', 'emerald'] });
  expect(JSON.parse(saved ?? '{}').cannonSkins).toMatchObject({ selected: 'rainbow', unlocked: ['basic', 'curve', 'smoke', 'rainbow'] });
  expect(JSON.parse(saved ?? '{}').backgrounds).toMatchObject({ selected: 'crystal-field', unlocked: ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field'] });
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
  await expect(page.locator('#pause-toggle')).toBeHidden();

  await page.locator('#pause-settings-toggle').click();
  await expect(page.locator('#pause-settings-toggle svg')).toBeVisible();
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

test('abre y resuelve un level-up en gameplay normal', async ({ page }) => {
  test.setTimeout(45_000);
  const failures = await openGame(page);
  const levelUp = page.locator('#level-up');
  const movementKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

  for (let index = 0; index < 20 && !(await levelUp.isVisible()); index += 1) {
    const key = movementKeys[index % movementKeys.length];
    await page.keyboard.down(key);
    await page.waitForTimeout(600);
    await page.keyboard.up(key);
  }

  await expect(levelUp).toBeVisible({ timeout: 20_000 });
  const choices = page.locator('#level-up-options button');
  await expect(choices).toHaveCount(3);
  await choices.first().click();
  await expect(choices.first()).toHaveClass(/is-selected/);
  await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(levelUp).toBeHidden();

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
