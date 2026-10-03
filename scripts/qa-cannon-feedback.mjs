import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from 'vite';
import assert from 'node:assert/strict';

// Uses the existing Pixi devtools hook and real pause/restart UI. Owns preview/browser.
// Run after the local build and Playwright, which clears test-results.
const baseline = process.argv.includes('--baseline');
const vaporOnly = process.argv.includes('--vapor-only');
const out = `test-results/${vaporOnly ? 'cannon-vapor' : 'cannon-feedback'}${baseline ? '-before' : ''}`;
await mkdir(out, { recursive: true });
const server = await preview({ mode: 'development', preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
const results = [];
let browser;
const snapshot = () => {
  const visit = (node, label) => node.label === label ? node : (node.children ?? []).map(child => visit(child, label)).find(Boolean);
  const app = globalThis.__cannonQaApp;
  const ship = visit(app.stage, 'raster-player-skin');
  const feedback = visit(app.stage, 'cannon-feedback');
  const nodes = feedback?.children ?? [];
  const center = ship.parent.toGlobal({ x: 0, y: 0 });
  return { count: nodes.length, bytes: nodes[0]?.texture.source.resource.byteLength,
    sources: new Set(nodes.map(node => node.texture.source)).size,
    pose: nodes.map(node => ({ label: node.label, x: node.x, y: node.y, width: node.width,
      height: node.height, rotation: node.rotation, alpha: node.alpha, visible: node.visible })),
    guns: ship.children.slice(2, 4).map(node => ({ x: node.x, y: node.y, width: node.width, height: node.height, rotation: node.rotation })),
    center: { x: center.x, y: center.y }, hullRotation: ship.parent.rotation };
};
try {
  browser = await chromium.launch();
  const skins = vaporOnly ? ['smoke'] : baseline ? ['spearhead'] : ['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead', 'gyre', 'razor'];
  const cases = skins.flatMap(skin => [{ skin, quality: 'high' }, { skin, quality: 'low', mobile: true }]);
  if (!baseline && !vaporOnly) cases.push({ skin: 'bloom', quality: 'medium', mobile: true },
    { skin: 'spearhead', quality: 'high', reduced: true },
    { skin: 'helix', quality: 'low', mobile: true, stress: true }, { skin: 'bloom', quality: 'high', stress: true });
  for (const entry of cases) {
    const context = await browser.newContext({ ...(entry.mobile ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } }),
      reducedMotion: entry.reduced ? 'reduce' : 'no-preference' });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__cannonQaApp = app; }; });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const query = entry.stress ? 'act=radial&stress=1' : 'weapon-path=projectile';
    await page.goto(`http://127.0.0.1:4173/?${query}&skin=spearhead&cannon=${entry.skin}&quality=${entry.quality}&debug=1`);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => {
      const visit = node => node.label === 'raster-player-skin' && node.visible || (node.children ?? []).some(visit);
      return globalThis.__cannonQaApp && visit(globalThis.__cannonQaApp.stage);
    });
    if (entry.stress) await page.waitForFunction(() => document.querySelector('#debug-panel').textContent.includes('projectiles: 300/300'));
    if (!entry.stress) { await page.keyboard.down('d'); await page.waitForTimeout(150); }
    // Freeze on a real shot, avoiding a screenshot after the short flash has faded.
    await page.waitForFunction(baseline => {
      const visit = (node, label) => node.label === label ? node : (node.children ?? []).map(child => visit(child, label)).find(Boolean);
      const app = globalThis.__cannonQaApp;
      const ship = visit(app.stage, 'raster-player-skin');
      const feedback = baseline ? ship.parent.children[10] : visit(app.stage, 'cannon-feedback');
      const ready = baseline ? feedback?.visible : feedback?.children.some(node => node.label.startsWith('cannon-flare-') && node.visible && node.alpha > 0.35);
      if (ready) document.querySelector('#pause-toggle').click();
      return ready;
    }, baseline, { timeout: 20_000 });
    await page.keyboard.up('d');
    const before = await page.evaluate(snapshot);
    if (!baseline) {
      assert.equal(before.count, entry.reduced ? 2 : entry.quality === 'low' ? 4 : entry.quality === 'medium' ? 8 : 12);
      assert.equal(before.bytes, 16384); assert.equal(before.sources, 1);
      assert(before.pose.some(node => node.label.startsWith('cannon-flare-') && node.visible));
      await page.waitForTimeout(200);
      assert.deepEqual((await page.evaluate(snapshot)).pose, before.pose, 'Pause changed discharge');
      assert.deepEqual((await page.evaluate(snapshot)).guns, before.guns, 'Pause changed cannon recoil');
    }
    assert(before.guns.every(gun => Math.abs(gun.width - (baseline ? 24 : 30)) < 0.01 && Math.abs(gun.height - (baseline ? 31.2 : 39)) < 0.01));
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    const name = `${entry.skin}-${entry.quality}${entry.mobile ? '-mobile' : ''}${entry.reduced ? '-reduced' : ''}${entry.stress ? '-stress' : ''}`;
    await page.screenshot({ path: `${out}/${name}.png` });
    const size = page.viewportSize();
    await page.screenshot({ path: `${out}/${name}-detail.png`, clip: {
      x: Math.max(0, Math.min(size.width - 220, before.center.x - 110)),
      y: Math.max(0, Math.min(size.height - 180, before.center.y - 90)), width: 220, height: 180
    } });
    let draws;
    if (entry.stress) draws = await page.evaluate(() => {
      const app = globalThis.__cannonQaApp;
      const visit = node => node.label === 'cannon-feedback' ? node : (node.children ?? []).map(visit).find(Boolean);
      const root = visit(app.stage), gl = app.renderer.gl;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const methods = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'];
      const originals = methods.map(name => gl[name]);
      let calls = 0;
      app.ticker.stop();
      methods.forEach((name, i) => { gl[name] = function(...args) { calls++; return originals[i].apply(this, args); }; });
      const sample = visible => { root.visible = visible; app.render(); calls = 0; app.render(); return calls; };
      try { return { without: sample(false), with: sample(true), renderer: gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }; }
      finally { methods.forEach((name, i) => { gl[name] = originals[i]; }); root.visible = true; app.ticker.start(); }
    });
    if (!baseline && !entry.stress && !entry.reduced) {
      await page.addStyleTag({ content: '#pause-overlay { visibility: visible !important; }' });
      await page.locator('#pause-resume').click();
      if (entry.skin === 'smoke') {
        await page.waitForFunction(() => {
          const visit = node => node.label === 'cannon-feedback' ? node : (node.children ?? []).map(visit).find(Boolean);
          const root = visit(globalThis.__cannonQaApp.stage);
          const ready = root.children.some(node => node.label.startsWith('cannon-vapor-') && node.visible && node.alpha > 0.12)
            && root.children.filter(node => node.label.startsWith('cannon-flare-')).every(node => !node.visible);
          if (ready) document.querySelector('#pause-toggle').click();
          return ready;
        });
        await page.addStyleTag({ content: '#pause-overlay { visibility: hidden !important; }' });
        await page.screenshot({ path: `${out}/${name}-vapor.png` });
        const vaporState = await page.evaluate(snapshot);
        const vaporSize = page.viewportSize();
        await page.screenshot({ path: `${out}/${name}-vapor-detail.png`, clip: {
          x: Math.max(0, Math.min(vaporSize.width - 220, vaporState.center.x - 110)),
          y: Math.max(0, Math.min(vaporSize.height - 180, vaporState.center.y - 90)), width: 220, height: 180
        } });
        await page.addStyleTag({ content: '#pause-overlay { visibility: visible !important; }' });
        await page.locator('#pause-resume').click();
      }
      await page.waitForTimeout(500);
      await page.locator('#pause-toggle').click();
      await page.setViewportSize({ width: 800, height: 450 });
      await page.locator('#pause-restart').click();
      await page.waitForFunction(() => {
        const visit = node => node.label === 'raster-player-skin' && node.visible || (node.children ?? []).some(visit);
        return visit(globalThis.__cannonQaApp.stage);
      });
      assert.equal((await page.evaluate(snapshot)).count, before.count);
    }
    assert.deepEqual(errors, []);
    results.push({ ...entry, before, draws, errors });
    console.log(JSON.stringify({ ...entry, count: before.count, draws, errors }));
    await context.close();
  }
} finally {
  await browser?.close();
  server.httpServer.closeAllConnections();
  await new Promise(resolve => server.httpServer.close(resolve));
  await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
}
