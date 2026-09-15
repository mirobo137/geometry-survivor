import { expect, test, type Page } from '@playwright/test';
import { registerHomeChecks } from './home.checks';

registerHomeChecks();

test('equipa Manta híbrida gratis, conserva selección y carga una sola textura', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  const textures: string[] = [];
  page.on('response', response => {
    if (response.url().includes('manta-wing-') && response.ok()) textures.push(response.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#boot-status')).toBeHidden();
  expect(textures).toHaveLength(0);
  await page.locator('#start-skins').click();
  await page.locator('.skin-card[data-skin="manta"] button').click();
  await expect(page.locator('#start-skin-selected-name')).toHaveText('Manta Veil');
  await expect.poll(() => page.locator('#start-skin-preview img').evaluateAll(images =>
    images.length === 2 && images.every(image => (image as HTMLImageElement).naturalWidth === 256)
  )).toBe(true);
  await page.locator('#start-skin-preview').screenshot({ path: testInfo.outputPath('manta-preview.png') });
  expect(new Set(textures).size).toBe(1);
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
    const imageReady = page.waitForResponse(response => response.url().includes('manta-wing-') && response.ok());
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

for (const quality of ['low', 'high']) {
  test(`carga el arte de las siete familias cosmeticas y boss en ${quality}`, async ({ page }, testInfo) => {
    const failures = captureRuntimeFailures(page);
    const smokeAssetResponses: string[] = [];
    const bloomAssetResponses: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('projectile-smoke-puff-') && response.ok()) smokeAssetResponses.push(response.url());
      if (response.url().includes('bloom-trail-') && response.ok()) bloomAssetResponses.push(response.url());
    });
    const skins = ['cyan', 'violet', 'amber', 'emerald', 'obsidian', 'nova', 'manta'];
    const backgrounds = ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field'];
    const cannons = ['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom'];
    for (let index = 0; index < skins.length; index += 1) {
      await page.goto(`/?boss=1&quality=${quality}&skin=${skins[index]}&background=${backgrounds[index % backgrounds.length]}&cannon=${cannons[index]}`);
      await expect(page.locator('#boot-status')).toBeHidden();
      await expect(page.locator('#game-container canvas')).toBeVisible();
      await expect(page.locator('#debug-panel')).toContainText('boss: intro');
      await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath(`art-${quality}-${skins[index]}.png`) });
    }
    if (quality === 'high') expect(smokeAssetResponses).toHaveLength(1);
    else expect(smokeAssetResponses).toHaveLength(0);
    if (quality === 'high') expect(bloomAssetResponses).toHaveLength(1);
    else expect(bloomAssetResponses).toHaveLength(0);
    expect(failures).toEqual([]);
  });
}

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

const openFundedMenu = async (page: Page): Promise<string[]> => {
  const failures = captureRuntimeFailures(page);
  // The animation contract is covered by home.checks. Each focused menu
  // scenario gets isolated storage and its own test timeout budget.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('geometry-survivor:save', JSON.stringify({ schemaVersion: 5, wallet: { nova: 20000 } }));
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

test('compra y equipa skins desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);

  await page.locator('#start-skins').click();
  await expect(page.locator('#start-main-view')).toBeHidden();
  await expect(page.locator('#start-skins-view')).toBeVisible();
  await expect(page.locator('#start-player-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-skin-preview svg')).toBeVisible();
  await expect(page.locator('#start-skin-cards .skin-card')).toHaveCount(7);
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-locked/);
  await page.locator('.skin-card[data-skin="violet"] button').click();
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-skin-selected-name')).toHaveText('Eclipse Prism');
  // One locked purchase plus a second equipped cosmetic proves the locker
  // integration and persistence without rerendering every preview in CI.
  await page.locator('.skin-card[data-skin="nova"] button').click();
  await expect(page.locator('.skin-card[data-skin="nova"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-skin-selected-name')).toHaveText('Nova Warden');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.skins).toMatchObject({ selected: 'nova', unlocked: ['cyan', 'violet', 'nova'] });
  expect(saved.wallet.nova).toBeLessThan(20000);
  expect(failures).toEqual([]);
});

test('compra y equipa canones desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);
  await page.locator('#start-skins').click();
  await page.locator('#start-cannon-skins-tab').click();
  await expect(page.locator('#start-player-skins-panel')).toBeHidden();
  await expect(page.locator('#start-cannon-skins-panel')).toBeVisible();
  await expect(page.locator('#start-cannon-preview svg')).toBeVisible();
  await expect(page.locator('#start-cannon-preview .cannon-preview-shot')).toHaveCount(2);
  await expect(page.locator('#start-cannon-cards .cannon-card')).toHaveCount(7);
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-locked/);
  await page.locator('.cannon-card[data-cannon="curve"] button').click();
  await expect(page.locator('.cannon-card[data-cannon="curve"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-cannon-selected-name')).toHaveText('Arc Needle');
  await page.locator('.cannon-card[data-cannon="helix"] button').click();
  await expect(page.locator('.cannon-card[data-cannon="helix"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-cannon-selected-name')).toHaveText('Helix Lance');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.cannonSkins).toMatchObject({ selected: 'helix', unlocked: ['basic', 'curve', 'helix'] });
  expect(saved.wallet.nova).toBeLessThan(20000);
  expect(failures).toEqual([]);
});

test('compra y equipa fondos desde el menu y conserva la seleccion', async ({ page }) => {
  const failures = await openFundedMenu(page);
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-cannon-skins-panel')).toBeHidden();
  await expect(page.locator('#start-backgrounds-panel')).toBeVisible();
  await expect(page.locator('#start-background-preview')).toBeVisible();
  await expect(page.locator('#start-background-cards .background-card')).toHaveCount(6);
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-locked/);
  await page.locator('.background-card[data-background="ion-storm"] button').click();
  await expect(page.locator('.background-card[data-background="ion-storm"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-background-selected-name')).toHaveText('Tormenta iónica');
  await page.locator('.background-card[data-background="crystal-field"] button').click();
  await expect(page.locator('.background-card[data-background="crystal-field"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-background-selected-name')).toHaveText('Campo cristal');
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
  await expect(page.locator('#start-meta-cards .meta-upgrade-card')).toHaveCount(2);
  await page.locator('.meta-upgrade-card[data-upgrade="weapon_damage"] .meta-upgrade-buy').click();
  await expect(page.locator('.meta-upgrade-card[data-upgrade="weapon_damage"] .meta-upgrade-level')).toHaveText('NIVEL 1/5');
  await page.locator('#start-meta-back').click();
  await expect(page.locator('#start-meta-view')).toBeHidden();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.metaUpgrades.levels.weapon_damage).toBe(1);
  expect(saved.wallet.nova).toBeLessThan(20000);
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
  await expect(card).toHaveClass(/is-selected/);
  await page.reload();
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-background-preview')).toHaveAttribute('data-background', 'nacre-orbit');
  const vesper = page.locator('.background-card[data-background="vesper-bloom"]');
  await expect(vesper).not.toHaveClass(/is-locked/);
  await expect(vesper).toContainText('GRATIS');
  await vesper.locator('button').click();
  await expect(vesper).toHaveClass(/is-selected/);
  await page.reload();
  await page.locator('#start-skins').click();
  await page.locator('#start-backgrounds-tab').click();
  await expect(page.locator('#start-background-preview')).toHaveAttribute('data-background', 'vesper-bloom');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('geometry-survivor:save') ?? '{}'));
  expect(saved.wallet.nova).toBe(0);
  expect(saved.backgrounds.selected).toBe('vesper-bloom');
  expect(saved.backgrounds.unlocked).toEqual(['deep-space', 'nacre-orbit', 'vesper-bloom']);
  await page.locator('#start-skins-back').click();
  await page.locator('#start-play').click();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  expect(failures).toEqual([]);
});

test('muestra el gating de actos y permite seleccionar Angular cuando esta desbloqueado', async ({ page }) => {
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
  await expect(page.locator('#start-act-angular')).toBeEnabled();
  await page.locator('#start-act-angular').click();
  await expect(page.locator('#start-act-angular')).toHaveClass(/is-selected/);
  await expect(page.locator('#start-act-status')).toContainText('Acto II');
  await page.locator('#start-act-back').click();
  await page.locator('#start-play').click();
  await expect(page.locator('#start-entry-view')).toBeVisible();
  await page.locator('[data-start-calibration="projectile"]').click();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#debug-panel')).toContainText('mode: angular-act');
  expect(failures).toEqual([]);
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
  await page.locator('#start-cosmetic-rewarded-button').click();
  await expect(page.locator('#start-cosmetic-rewarded-button')).toHaveText('Anuncio en curso');
  await expect(page.locator('.skin-card[data-skin="violet"]')).toHaveClass(/is-selected/, { timeout: 5_000 });
  await expect(offer).toContainText('desbloqueado y equipado');
  await expect(page.locator('#start-cosmetic-rewarded-button')).toBeHidden();

  const saved = await page.evaluate(() => localStorage.getItem('geometry-survivor:save'));
  expect(JSON.parse(saved ?? '{}').skins).toMatchObject({ selected: 'violet', unlocked: ['cyan', 'violet'] });
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
  await expect(page.locator('#pause-toggle')).toBeHidden();
  await expect(page.locator('#pause-overlay')).toHaveAttribute('aria-describedby', 'pause-message');
  await expect(page.locator('#pause-panel-frame svg')).toBeVisible();
  await expect(page.locator('#pause-overlay button svg')).toHaveCount(4);
  const pauseLayout = await page.locator('#pause-overlay').evaluate((overlay) => {
    const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('button')];
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

test('ofrece la ruta real de Projectile rango por rango', async ({ page }) => {
  test.setTimeout(35_000);
  const failures = captureRuntimeFailures(page);
  await page.goto('/?weapon-path=projectile&debug=1&quality=low');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#start-screen')).toBeHidden();
  await expect(page.locator('#debug-panel')).toContainText('mode: weapon-path-projectile');
  await expect(page.locator('#debug-panel')).toContainText('rank 1/6');

  const levelUp = page.locator('#level-up');
  const movementKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
  for (let index = 0; index < 24 && !(await levelUp.isVisible()); index += 1) {
    const key = movementKeys[index % movementKeys.length];
    await page.keyboard.down(key);
    await page.waitForTimeout(450);
    await page.keyboard.up(key);
  }

  await expect(levelUp).toBeVisible({ timeout: 20_000 });
  await expect(levelUp.locator('#level-up-options button')).toHaveCount(1);
  await expect(levelUp.locator('#level-up-options button')).toHaveAttribute('data-upgrade-id', 'projectile_rank_2');
  await levelUp.locator('#level-up-options button').click();
  await expect(levelUp).toBeHidden({ timeout: 5_000 });
  await expect(page.locator('#debug-panel')).toContainText('rank 2/6');
  expect(failures).toEqual([]);
});

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

test('expone cada familia de evoluciones como una decision de dos cartas', async ({ page }) => {
  test.setTimeout(60_000);
  const failures = captureRuntimeFailures(page);
  const levelUp = page.locator('#level-up');
  const choices = page.locator('#level-up-options button');

  for (const drill of WEAPON_EVOLUTION_DRILLS) {
    await page.goto(`/?evolution=${drill.query}&debug=1&quality=low`);
    await expect(page.locator('#boot-status')).toBeHidden();
    await expect(page.locator('#start-screen')).toBeHidden();
    await expect(levelUp).toBeVisible({ timeout: 10_000 });
    await expect(levelUp).toHaveAttribute('data-offer-kind', 'evolution');
    await expect(choices).toHaveCount(2);
    await expect(page.locator('#level-up-reroll')).toBeHidden();
    expect(await choices.evaluateAll((buttons) => buttons.map((button) => button.dataset.upgradeId))).toEqual(drill.ids);
    await choices.first().click();
    await expect(levelUp).toBeHidden({ timeout: 5_000 });
  }

  expect(failures).toEqual([]);
});

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

test('carga el drill del arma Magnetic Charge con atracción remota y banda premium', async ({ page }, testInfo) => {
  const failures = captureRuntimeFailures(page);
  await page.goto('/?weapon=magnetic-charge&debug=1&quality=high');
  await expect(page.locator('#boot-status')).toBeHidden();
  await expect(page.locator('#game-container canvas')).toBeVisible();
  await expect(page.locator('#debug-panel')).toContainText('mode: magnetic-charge-drill');
  await expect(page.locator('#debug-panel')).toContainText('enemies: 8/250');
  await expect.poll(() => page.locator('#debug-panel').textContent(), { timeout: 8_000 })
    .toMatch(/magnetic: detonate \|/);
  await page.locator('#pause-toggle').evaluate((button: HTMLElement) => button.click());
  await page.locator('#game-container canvas').screenshot({ path: testInfo.outputPath('magnetic-charge-weapon-high.png') });
  expect(failures).toEqual([]);
});

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
