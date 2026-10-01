import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const out = 'test-results/arsenal';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__arsenalQaApp = app; }; });
const freezeImage = async (page, id) => page.waitForFunction(id => {
  const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
  const visit = node => {
    if (visible(node) && node.alpha > 0.2 && node.texture?.width > 1
      && node.texture?.source?.resource?.src?.includes('/' + id + '-')) return true;
    return (node.children ?? []).some(visit);
  };
  const app = globalThis.__arsenalQaApp;
  const ready = app && visit(app.stage);
  if (ready) document.querySelector('#pause-toggle')?.click();
  return ready;
}, id, { timeout: 20000 });
const cases = [
  ['projectile', 'weapon-path=projectile'],
  ['orbit', 'weapon-path=orbit'],
  ['chain', 'weapon-path=chain'],
  ['boomerang', 'weapon-path=boomerang'],
  ['pulse-ring', 'weapon=pulse-ring'],
  ['magnetic-charge', 'weapon=magnetic-charge']
];
const failures = [];
try {
  for (const [id, query] of cases) {
    const page = await context.newPage();
    const errors = [], pngs = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().includes('/' + id + '-') && response.url().includes('.png') && response.status() === 200) pngs.add(response.url());
    });
    await page.goto('http://127.0.0.1:4173/?' + query + '&debug=1&quality=low');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    // Cards can pause a real-run path before the first cast; choose the next rank.
    for (let i = 0; i < 180 && !pngs.size; i++) {
      if (await page.locator('#level-up').isVisible()) await page.locator('#level-up-options button').first().click();
      await page.waitForTimeout(100);
    }
    if (!pngs.size) errors.push('No PNG for ' + id);
    await freezeImage(page, id);
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    await page.locator('#game-container canvas').screenshot({ path: out + '/base-' + id + '.png' });
    console.log(JSON.stringify({ base: id, pngs: pngs.size, errors }));
    failures.push(...errors);
    await page.close();
  }

  {
    const page = await context.newPage();
    const errors = [], pngs = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().includes('/recharging-shield-') && response.status() === 200) pngs.add(response.url());
    });
    await page.goto('http://127.0.0.1:4173/?card=recharging-shield&debug=1&quality=low');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.locator('#level-up-options [data-upgrade-id="recharging_shield"]').click();
    for (let i = 0; i < 80 && !pngs.size; i++) await page.waitForTimeout(100);
    if (!pngs.size) errors.push('Shield not loaded after acquisition');
    await freezeImage(page, 'recharging-shield');
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    await page.locator('#game-container canvas').screenshot({ path: out + '/shield-low.png' });
    await page.addStyleTag({ content: '#pause-overlay { visibility: visible !important; }' });
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#pause-menu').click();
    await page.locator('#start-screen').waitFor({ state: 'visible' });
    await page.locator('#start-play').click();
    await page.locator('#start-screen').waitFor({ state: 'hidden' });
    await page.waitForTimeout(1500);
    if (!await page.locator('#game-hud').isVisible()) errors.push('Could not restart from menu');
    await page.locator('#game-container canvas').screenshot({ path: out + '/after-menu.png' });
    console.log(JSON.stringify({ shieldAndMenu: true, errors }));
    failures.push(...errors);
    await page.close();
  }

  // Failure must leave real gameplay and fallback intact for every evolution.
  for (const id of ['rail-lance', 'pulse-volley', 'solar-crown', 'graviton-halo', 'closed-circuit',
    'thunderhead', 'twin-comet', 'singularity-return', 'echo-shock', 'compression-wave', 'event-horizon', 'polar-collapse']) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/*.png', route => route.abort());
    await page.goto('http://127.0.0.1:4173/?evolution=' + id + '&scenario=mass&debug=1&quality=low');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForTimeout(1800);
    if (!await page.locator('#game-hud').isVisible()) errors.push('Gameplay unavailable');
    console.log(JSON.stringify({ fallback: id, errors }));
    failures.push(...errors);
    await page.close();
  }
} finally { await browser.close(); }
if (failures.length) process.exitCode = 1;
