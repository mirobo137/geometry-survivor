import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = 'test-results/arsenal';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evolutions = ['rail-lance', 'pulse-volley', 'solar-crown', 'graviton-halo',
  'closed-circuit', 'thunderhead', 'twin-comet', 'singularity-return',
  'echo-shock', 'compression-wave', 'event-horizon', 'polar-collapse'];
const results = [];
const requested = process.argv.slice(2);
try {
  for (const quality of ['low', 'high']) {
    const context = await browser.newContext(quality === 'low' ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    // Pixi's existing devtools hook: read-only inspection, no production globals.
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__arsenalQaApp = app; }; });
    for (const id of evolutions) {
      if (requested.length && !requested.includes(id)) continue;
      const page = await context.newPage();
      const errors = [];
      const pngs = new Set();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.url().includes('.png') && /\/(rail-lance|pulse-volley|solar-crown|graviton-halo|closed-circuit|thunderhead|twin-comet|singularity-return|echo-shock|compression-wave|event-horizon|polar-collapse)-/.test(response.url())) {
          if (response.status() !== 200) errors.push('HTTP ' + response.status());
          pngs.add(response.url().split('/').at(-1));
        }
      });
      await page.goto('http://127.0.0.1:4173/?evolution=' + id + '&scenario=mass&debug=1&quality=' + quality);
      await page.locator('#boot-status').waitFor({ state: 'hidden' });
      await page.locator('#game-hud').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.querySelector('#debug-panel')?.textContent?.includes('enemies: 56/250'));
      // Observe a full cast after all lazy PNGs have loaded, without altering simulation.
      for (let i = 0; i < 80 && !pngs.size; i++) await page.waitForTimeout(100);
      if (!pngs.size) errors.push('Missing recipe PNG: ' + id);
      await page.waitForFunction(id => {
        const nodes = [];
        const visit = node => { nodes.push(node); for (const child of node.children ?? []) visit(child); };
        const app = globalThis.__arsenalQaApp;
        if (!app) return false;
        visit(app.stage);
        const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
        const ready = nodes.some(node => visible(node) && node.texture?.width > 1
          && node.texture?.source?.resource?.src?.includes('/' + id + '-')
          && (!['echo-shock', 'compression-wave'].includes(id) || node.width > 240)
          && node.alpha > (id === 'echo-shock' || id === 'compression-wave' ? 0.6 : 0.3));
        // Freeze through the real UI handler in the same frame as the reading.
        // A later automation click can miss a short wave; no simulation mutation.
        if (ready) document.querySelector('#pause-toggle')?.click();
        return ready;
      }, id, { timeout: 20000 });
      const rendered = await page.evaluate(() => {
        const nodes = [];
        const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
        const visit = node => {
          if (visible(node) && node.texture?.source?.resource?.src?.includes('.png'))
            nodes.push({ label: node.label, alpha: node.alpha, width: node.width, height: node.height,
              image: node.texture.source.resource.src.split('/').at(-1) });
          for (const child of node.children ?? []) visit(child);
        };
        visit(globalThis.__arsenalQaApp.stage);
        return nodes;
      });
      if (!rendered.some(node => node.image.includes(id + '-'))) errors.push('Recipe not rendered');
      await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
      await page.locator('#game-container canvas').screenshot({ path: out + '/' + id + '-' + quality + '.png' });
      results.push({ id, quality, pngs: [...pngs], rendered, errors });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
if (results.some(result => result.errors.length)) process.exitCode = 1;
