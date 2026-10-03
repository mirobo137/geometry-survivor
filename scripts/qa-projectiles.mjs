import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from 'vite';

// Run against the built local preview. Read-only Pixi devtools inspection;
// pause through the real UI, never change health, cadence or projectile state.
const base = 'http://127.0.0.1:4173';
const out = 'test-results/projectiles';
await mkdir(out, { recursive: true });
const server = await preview({ mode: 'development', preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
const results = [];
const stressOnly = process.argv.includes('--stress-only');
const skins = ['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead'];
const snapshot = () => {
  const host = globalThis.__projectileQaApp;
  if (!host) return null;
  const nodes = [];
  const visit = node => { nodes.push(node); for (const child of node.children ?? []) visit(child); };
  visit(host.stage);
  const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
  const heads = nodes.filter(node => node.label === 'projectile-head');
  const trails = nodes.find(node => node.label === 'player-projectile-trails');
  const guns = nodes.find(node => node.label === 'raster-player-skin')?.children.slice(2, 4);
  return {
    renderer: host.renderer?.gl ? (() => {
      const gl = host.renderer.gl;
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    })() : String(host.renderer?.type),
    heads: heads.length, glows: nodes.filter(node => node.label === 'projectile-glow').length,
    visibleHeads: heads.filter(visible).map(node => ({ width: node.width, height: node.height,
      textureWidth: node.texture?.width, textureHeight: node.texture?.height,
      source: node.texture?.source?.resource?.src?.split('/').at(-1) })),
    trailPool: trails?.children.length ?? 0,
    visibleTrails: (trails?.children ?? []).filter(visible).map(node => ({ frameX: node.texture?.frame.x,
      sourceWidth: node.texture?.source.width, sourceHeight: node.texture?.source.height })),
    guns: guns?.map(node => ({ width: node.width, height: node.height, anchorY: node.anchor.y }))
  };
};
try {
  browser = await chromium.launch();
  for (const quality of stressOnly ? [] : ['low', 'high']) {
    const context = await browser.newContext(quality === 'low' ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__projectileQaApp = app; }; });
    for (const skin of skins) {
      const page = await context.newPage();
      const errors = [], pngs = new Set();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.url().includes('.png')) {
          if (!response.ok()) errors.push(`HTTP ${response.status()} ${response.url()}`);
          pngs.add(response.url().split('/').at(-1));
        }
      });
      await page.goto(`${base}/?weapon-path=projectile&debug=1&quality=${quality}&cannon=${skin}`);
      await page.locator('#boot-status').waitFor({ state: 'hidden' });
      // Wait for visible material (not merely an HTTP request) and freeze in its frame.
      await page.waitForFunction(({ quality }) => {
        const visit = node => {
          if (node.label === 'projectile-head' && node.visible && node.texture?.width === 96) return true;
          return (node.children ?? []).some(visit);
        };
        const trailReady = node => {
          if (node.label === 'player-projectile-trails') return node.visible
            && node.children.some(child => child.visible && child.texture?.source.height === 32 && !(child.texture.source.resource instanceof Uint8Array));
          return (node.children ?? []).some(trailReady);
        };
        const app = globalThis.__projectileQaApp;
        const ready = app && visit(app.stage) && (quality === 'low' || trailReady(app.stage));
        if (ready) document.querySelector('#pause-toggle')?.click();
        return ready;
      }, { quality }, { timeout: 20_000 });
      const state = await page.evaluate(snapshot);
      if (state.heads !== 300 || state.trailPool !== (quality === 'low' ? 0 : 480)) errors.push('Pool grew or changed');
      if (!state.visibleHeads.length || state.visibleHeads.some(head => head.textureWidth !== 96 || head.textureHeight !== 48 || !head.source.includes(`${skin}-head-`))) errors.push('Wrong bullet material');
      if (state.guns?.some(gun => Math.abs(gun.width - 24) > 0.01 || Math.abs(gun.height - 31.2) > 0.01 || gun.anchorY !== 0.08)) errors.push('Cannon frame or muzzle pivot changed');
      if (quality === 'low' && [...pngs].some(name => skins.some(id => name.includes(`${id}-trail-`)))) errors.push('Low downloaded an invisible trail');
      await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
      await page.locator('#game-container canvas').screenshot({ path: `${out}/${skin}-${quality}.png` });
      results.push({ skin, quality, state, pngs: [...pngs], errors });
      console.log(JSON.stringify({ skin, quality, heads: state.heads, trailPool: state.trailPool, visible: state.visibleHeads.length, errors }));
      await page.close();
    }
    await context.close();
  }
  for (const quality of ['low', 'high']) {
    const context = await browser.newContext(quality === 'low' ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__projectileQaApp = app; }; });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/?act=radial&stress=1&debug=1&profile=1&quality=${quality}&cannon=helix`);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#debug-panel')?.textContent?.includes('projectiles: 300/300'));
    const first = await page.evaluate(snapshot);
    const session = await context.newCDPSession(page);
    await session.send('Performance.enable');
    const retainedHeap = async () => {
      await session.send('HeapProfiler.collectGarbage');
      const { metrics } = await session.send('Performance.getMetrics');
      return metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value;
    };
    const heapBefore = await retainedHeap();
    await page.waitForTimeout(5000);
    const last = await page.evaluate(snapshot);
    const heapAfter = await retainedHeap();
    const profile = await page.locator('#debug-panel').textContent();
    if (first.heads !== last.heads || first.trailPool !== last.trailPool || last.heads !== 300) errors.push('Stress grew the projectile pool');
    if (last.visibleHeads.length !== 300 || last.visibleHeads.some(head => head.textureWidth !== 96)) errors.push('Stress missing PNG head');
    if (last.visibleTrails.length !== (quality === 'low' ? 0 : 480)) errors.push('Stress trail budget changed');
    await page.locator('#pause-toggle').click();
    await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
    await page.locator('#game-container canvas').screenshot({ path: `${out}/stress-${quality}.png` });
    results.push({ stress: true, quality, heads: last.heads, visibleHeads: last.visibleHeads.length,
      trailPool: last.trailPool, visibleTrails: last.visibleTrails.length, renderer: last.renderer, heapBefore, heapAfter, profile, errors });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
} finally {
  await browser?.close();
  server.httpServer.closeAllConnections();
  await new Promise(resolve => server.httpServer.close(resolve));
}
await writeFile(`${out}/${stressOnly ? 'stress-report' : 'report'}.json`, JSON.stringify(results, null, 2));
if (results.some(result => result.errors.length)) process.exitCode = 1;
