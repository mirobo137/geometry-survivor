import { chromium, devices } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Read-only Pixi inspection. Own and close preview/browser; never touch user Vite.
const out = 'test-results/catalog-ten';
await mkdir(out, { recursive: true });
const server = await preview({ mode: 'development', preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
const results = [];
const inspect = () => {
  const app = globalThis.__catalogApp;
  const nodes = [];
  const visit = node => { nodes.push(node); for (const child of node.children ?? []) visit(child); };
  visit(app.stage);
  const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
  const art = node => node.texture?.source?.resource?.src ?? '';
  const painted = nodes.filter(node => visible(node) && art(node).includes('/assets/') && node.texture?.width === 1254);
  const currents = nodes.filter(node => visible(node) && art(node).includes('tidal-veil-current-'));
  const player = nodes.find(node => node.label === 'raster-player-skin');
  const jets = nodes.find(node => node.label === 'player-propulsion');
  const feedback = nodes.find(node => node.label === 'cannon-feedback');
  return {
    plates: painted.map(node => ({ source: art(node), x: node.x, y: node.y, scale: node.scale.x })),
    currents: currents.map(node => ({ x: node.x, y: node.y, tint: node.tint, source: art(node) })),
    ship: art(player.children[1]), guns: player.children.slice(2, 4).map(art),
    center: player.toGlobal({ x: 0, y: 0 }),
    engines: { count: jets.children.length, visible: jets.children.filter(visible).length },
    feedback: feedback.children.length,
    heads: nodes.filter(node => node.label === 'projectile-head').length,
    trails: nodes.find(node => node.label === 'player-projectile-trails')?.children.length ?? 0
  };
};
try {
  browser = await chromium.launch();
  for (const quality of ['low', 'high']) for (const [index, background] of ['silent-archive', 'lunar-fault', 'leviathan-wake'].entries()) {
    const skin = index === 1 ? 'nautilus' : 'corsair';
    const cannon = index === 1 ? 'razor' : 'gyre';
    const context = await browser.newContext(quality === 'low' ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__catalogApp = app; }; });
    const page = await context.newPage();
    const errors = [], requests = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().includes('/assets/')) {
        requests.add(response.url());
        if (!response.ok()) errors.push('HTTP ' + response.status() + ' ' + response.url());
      }
    });
    await page.goto(`http://127.0.0.1:4173/?weapon-path=projectile&debug=1&quality=${quality}&skin=${skin}&cannon=${cannon}&background=${background}`);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForFunction(background => {
      const visit = node => node.visible && node.texture?.width === 1254
        && node.texture?.source?.resource?.src?.includes(background + '-')
        || (node.children ?? []).some(visit);
      return globalThis.__catalogApp && visit(globalThis.__catalogApp.stage);
    }, background);
    await page.waitForFunction(() => {
      const visit = node => node.label === 'projectile-head' && node.visible && node.texture?.width === 96 || (node.children ?? []).some(visit);
      return visit(globalThis.__catalogApp.stage);
    });
    const before = await page.evaluate(inspect);
    await page.waitForTimeout(500);
    const after = await page.evaluate(inspect);
    assert.equal(after.plates.length, 1);
    assert(after.plates[0].source.includes(background + '-'));
    assert.equal(after.currents.length, 4);
    assert.equal(new Set(after.currents.map(current => current.source)).size, 2);
    const moved = after.currents.some((current, i) => Math.abs(current.x - before.currents[i].x) + Math.abs(current.y - before.currents[i].y) > .01);
    assert.equal(moved, quality === 'high', 'Wrong smoke motion tier');
    assert.equal(after.heads, 300);
    assert.equal(after.trails, quality === 'low' ? 0 : 480);
    assert.equal(after.engines.count, quality === 'low' ? 3 : 9);
    assert.equal(after.feedback, quality === 'low' ? 4 : 12);
    assert(after.ship.includes(skin + '-'));
    assert(after.guns.every(url => url.includes(cannon + '-')));
    const unwanted = [...requests].filter(url => ['silent-archive', 'lunar-fault', 'leviathan-wake'].some(id => id !== background && url.includes(id + '-') && !url.includes('-preview-')));
    assert.equal(unwanted.length, 0, 'Loaded an unselected combat plate');
    await page.locator('#pause-toggle').click();
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility:hidden !important; }' });
    await page.screenshot({ path: `${out}/${background}-${quality}.png` });
    const size = page.viewportSize();
    await page.screenshot({ path: `${out}/${skin}-${cannon}-${quality}-detail.png`, clip: {
      x: Math.max(0, Math.min(size.width - 180, after.center.x - 90)),
      y: Math.max(0, Math.min(size.height - 180, after.center.y - 90)), width: 180, height: 180
    } });
    assert.deepEqual(errors, []);
    results.push({ background, quality, skin, cannon, before, after, errors });
    console.log(JSON.stringify({ background, quality, currents: after.currents.length, moved, errors }));
    await context.close();
  }
} finally {
  await browser?.close();
  server.httpServer.closeAllConnections();
  await new Promise(resolve => server.httpServer.close(resolve));
  await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
}
