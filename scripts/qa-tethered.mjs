import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const out = 'test-results/tethered';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const inspect = () => {
  const nodes = [];
  const visit = node => { nodes.push(node); for (const c of node.children ?? []) visit(c); };
  visit(globalThis.__tetherQaApp.stage);
  const root = nodes.find(n => n.label === 'raster-player-skin');
  const part = label => root.children.find(n => n.label === label);
  const global = node => { const p = node.toGlobal({ x: 0, y: 0 }); return { x: p.x, y: p.y }; };
  return root && {
    visible: root.visible, count: root.children.length,
    fallbackVisible: root.parent.children[6].visible && root.parent.children[4].visible,
    facing: root.parent.rotation,
    ship: { y: part('tether-ship').y, height: Math.round(part('tether-ship').height * 1e5) / 1e5 },
    left: { local: { x: part('tether-cannon-left').x, y: part('tether-cannon-left').y }, global: global(part('tether-cannon-left')),
      aim: part('tether-cannon-left').rotation + root.parent.rotation,
      source: part('tether-cannon-left').texture.source.resource?.src },
    rightSource: part('tether-cannon-right').texture.source.resource?.src,
    center: global(root),
    bounds: { x: root.getBounds().x, y: root.getBounds().y, width: root.getBounds().width, height: root.getBounds().height }
  };
};
try {
  for (const mobile of [false, true]) for (const quality of ['low', 'high']) {
    const context = await browser.newContext(mobile ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => {
      globalThis.__PIXI_APP_INIT__ = app => { globalThis.__tetherQaApp = app; };
    });
    const page = await context.newPage();
    const errors = [];
    const pngs = new Set();
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {
      if (/tether-(ship|cannon)-.*\.png/.test(r.url())) {
        pngs.add(r.url().split('/').at(-1));
        if (!r.ok()) errors.push('HTTP ' + r.status());
      }
    });
    await page.goto('http://127.0.0.1:4173/?ship-preview=tether&act=radial&cannon=spearhead&skin=cyan&debug=1&quality=' + quality);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => {
      let ready = false;
      const visit = n => { if (n.label === 'tether-ship' && n.texture?.width === 256) ready = true; for (const c of n.children ?? []) visit(c); };
      if (globalThis.__tetherQaApp) visit(globalThis.__tetherQaApp.stage);
      return ready;
    });
    await page.keyboard.down('a');
    await page.waitForTimeout(350);
    await page.keyboard.up('a');
    await page.waitForTimeout(700);
    await page.locator('#pause-toggle').click();
    const before = await page.evaluate(inspect);
    assert(before, 'Raster player compositor was not found');
    assert(before.visible && before.count === 5);
    assert.equal(before.left.source, before.rightSource);
    assert.equal(pngs.size, 2);
    await page.waitForTimeout(250);
    const paused = await page.evaluate(inspect);
    assert.deepEqual(paused.left, before.left, 'pause changed cannon aim/position');
    assert.deepEqual(paused.center, before.center, 'pause moved ship');
    assert.deepEqual(paused.ship, before.ship, 'pause changed ship');
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    await page.screenshot({ path: `${out}/${mobile ? 'mobile' : 'desktop'}-${quality}.png` });
    const canvas = await page.locator('#game-container canvas').boundingBox();
    const center = before.center;
    const zoom = await page.screenshot({ clip: { x: Math.max(0, center.x - 75), y: Math.max(0, center.y - 75), width: 150, height: 150 } });
    await writeFile(`${out}/${mobile ? 'mobile' : 'desktop'}-${quality}-detail.png`, zoom);
    assert(canvas && before.bounds.width > 15 && before.bounds.height > 15);
    await page.addStyleTag({ content: '#pause-overlay { visibility: visible !important; }' });
    await page.setViewportSize(mobile ? { width: 844, height: 390 } : { width: 640, height: 360 });
    await page.locator('#pause-resume').click();
    await page.waitForTimeout(300);
    const resized = await page.evaluate(inspect);
    assert(resized.visible);
    await page.locator('#pause-toggle').click();
    await page.locator('#pause-restart').click();
    await page.waitForTimeout(200);
    assert((await page.evaluate(inspect)).visible);
    assert.equal(pngs.size, 2, 'restart duplicated texture requests');
    assert.deepEqual(errors, []);
    results.push({ mobile, quality, pngs: [...pngs], before, resized, errors });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
  // Ordinary skins also use PNG now. A failed equipped asset keeps vector hull/guns.
  for (const failure of [false, true]) {
    const context = await browser.newContext();
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__tetherQaApp = app; }; });
    const page = await context.newPage();
    const pngs = [];
    page.on('request', r => { if (/(cyan|tether-ship|tether-cannon)-.*\.png/.test(r.url())) pngs.push(r.url()); });
    if (failure) await page.route('**/tether-cannon-*.png', r => r.abort());
    await page.goto('http://127.0.0.1:4173/?act=radial&skin=cyan&cannon=spearhead' + (failure ? '&ship-preview=tether' : ''));
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForTimeout(350);
    if (!failure) {
      await page.waitForFunction(() => {
        const visit = n => n.label === 'raster-player-skin' && n.visible
          || (n.children ?? []).some(visit);
        return globalThis.__tetherQaApp && visit(globalThis.__tetherQaApp.stage);
      });
      const ordinary = await page.evaluate(inspect);
      assert(ordinary?.visible, 'Ordinary ship did not load its PNG compositor');
      assert.match(ordinary.left.source, /tether-cannon-/);
      assert.equal(pngs.length, 2);
    }
    else {
      const failed = await page.evaluate(inspect);
      assert(failed, 'Raster fallback compositor was not found');
      assert.equal(failed.visible, false);
      assert.equal(failed.fallbackVisible, true);
    }
    console.log(JSON.stringify({ ordinary: !failure, loadFailure: failure, requests: pngs.length }));
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
