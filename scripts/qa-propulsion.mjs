import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from 'vite';
import assert from 'node:assert/strict';

// Owns its preview/browser. Run after Playwright (which clears test-results).
const out = 'test-results/propulsion';
await mkdir(out, { recursive: true });
const server = await preview({ mode: 'development', preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
const results = [];
let browser;
const inspect = () => {
  const visit = (node, label) => node.label === label ? node : (node.children ?? []).map(child => visit(child, label)).find(Boolean);
  const app = globalThis.__propulsionApp;
  const root = visit(app.stage, 'player-propulsion');
  const ship = visit(app.stage, 'tether-ship');
  const center = root.parent.toGlobal({ x: 0, y: 0 });
  return { count: root.children.length, visible: root.visible,
    bytes: root.children[0].texture.source.resource.byteLength,
    sources: new Set(root.children.map(node => node.texture.source)).size,
    pose: root.children.map(node => ({ x: node.x, y: node.y, width: node.width, height: node.height, alpha: node.alpha, visible: node.visible })),
    center: { x: center.x, y: center.y }, ship: { width: ship.width, height: ship.height },
    facing: root.parent.rotation };
};
try {
  browser = await chromium.launch();
  const cases = [
    ...['spearhead', 'cyan', 'violet', 'amber', 'emerald', 'obsidian', 'nova', 'manta', 'corsair', 'nautilus'].map(skin => ({ skin, quality: 'high' })),
    { skin: 'nova', quality: 'low', mobile: true },
    { skin: 'manta', quality: 'medium', mobile: true },
    { skin: 'spearhead', quality: 'high', reduced: true },
    { skin: 'nova', quality: 'low', stress: true, mobile: true },
    { skin: 'nova', quality: 'high', stress: true }
  ];
  for (const entry of cases) {
    const context = await browser.newContext({ ...(entry.mobile ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } }),
      reducedMotion: entry.reduced ? 'reduce' : 'no-preference' });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__propulsionApp = app; }; });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4173/?act=radial&skin=${entry.skin}&cannon=spearhead&quality=${entry.quality}&debug=1${entry.stress ? '&stress=1' : ''}`);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => {
      const visit = node => node.label === 'raster-player-skin' && node.visible || (node.children ?? []).some(visit);
      return globalThis.__propulsionApp && visit(globalThis.__propulsionApp.stage);
    });
    if (entry.stress) await page.waitForFunction(() => document.querySelector('#debug-panel').textContent.includes('projectiles: 300/300'));
    await page.keyboard.down('d');
    await page.waitForTimeout(550);
    await page.locator('#pause-toggle').click();
    await page.keyboard.up('d');
    const before = await page.evaluate(inspect);
    assert(before.visible, 'Moving ship must show propulsion');
    assert.equal(before.count, entry.reduced || entry.quality === 'low' ? 3 : entry.quality === 'medium' ? 6 : 9);
    assert.equal(before.bytes, 8192);
    assert.equal(before.sources, 1);
    assert.equal(before.ship.width, 56);
    assert.equal(before.ship.height, 64);
    await page.waitForTimeout(200);
    assert.deepEqual((await page.evaluate(inspect)).pose, before.pose, 'Paused engine changed');
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    const name = `${entry.skin}-${entry.quality}${entry.mobile ? '-mobile' : ''}${entry.reduced ? '-reduced' : ''}${entry.stress ? '-stress' : ''}`;
    await page.screenshot({ path: `${out}/${name}.png` });
    const size = page.viewportSize();
    await page.screenshot({ path: `${out}/${name}-detail.png`, clip: {
      x: Math.max(0, Math.min(size.width - 200, before.center.x - 100)),
      y: Math.max(0, Math.min(size.height - 160, before.center.y - 80)), width: 200, height: 160
    } });
    let comparison;
    if (entry.stress) comparison = await page.evaluate(() => {
      const app = globalThis.__propulsionApp;
      const visit = node => node.label === 'player-propulsion' ? node : (node.children ?? []).map(visit).find(Boolean);
      const root = visit(app.stage);
      app.ticker.stop();
      const gl = app.renderer.gl;
      const rendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let draws = 0;
      const methods = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'];
      const originals = methods.map(name => gl[name]);
      methods.forEach((name, i) => { gl[name] = function(...args) { draws++; return originals[i].apply(this, args); }; });
      const sample = visible => {
        root.visible = visible;
        for (let i = 0; i < 5; i++) { app.render(); gl.finish(); }
        const times = [], calls = [];
        for (let i = 0; i < 40; i++) {
          draws = 0;
          const start = performance.now();
          app.render(); gl.finish();
          times.push(performance.now() - start); calls.push(draws);
        }
        times.sort((a, b) => a - b);
        return { medianRenderAndFinishMs: times[20], p95Ms: times[38], minDrawCalls: Math.min(...calls), maxDrawCalls: Math.max(...calls) };
      };
      try { return { renderer: gl.getParameter(rendererInfo ? rendererInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        without: sample(false), with: sample(true), note: 'Same paused stress scene; includes gl.finish, not gameplay FPS or physical mobile GPU.' }; }
      finally { methods.forEach((name, i) => { gl[name] = originals[i]; }); root.visible = true; app.ticker.start(); }
    });
    await page.addStyleTag({ content: '#pause-overlay { visibility: visible !important; }' });
    await page.locator('#pause-resume').click();
    await page.waitForTimeout(950);
    assert.equal((await page.evaluate(inspect)).visible, false, 'Engine must fade after stopping');
    assert.equal((await page.evaluate(inspect)).count, before.count);
    assert.deepEqual(errors, []);
    results.push({ ...entry, before, comparison, errors });
    console.log(JSON.stringify({ ...entry, count: before.count, comparison, errors }));
    await context.close();
  }
} finally {
  await browser?.close();
  server.httpServer.closeAllConnections();
  await new Promise(resolve => server.httpServer.close(resolve));
  await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
}
