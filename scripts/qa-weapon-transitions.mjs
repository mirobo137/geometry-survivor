import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Read-only Pixi inspection; freezing uses the real pause UI, not simulation hooks.
const out = 'test-results/arsenal';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const quality of ['low', 'high']) {
    const context = await browser.newContext(quality === 'low' ? devices['Pixel 5'] : { viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => { globalThis.__PIXI_APP_INIT__ = app => { globalThis.__transitionApp = app; }; });
    for (const [id, phase] of [['thunderhead', 'burst'], ['singularity-return', 'split'], ['echo-shock', 'recovery']]) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ' ' + response.url()); });
      await page.goto('http://127.0.0.1:4173/?evolution=' + id + '&scenario=mass&debug=1&quality=' + quality);
      await page.locator('#game-hud').waitFor({ state: 'visible' });
      if (id === 'singularity-return') {
        // Real input checks that the split follows its cast, not the moving player.
        await page.keyboard.down('d');
        await page.waitForTimeout(200);
        await page.keyboard.up('d');
      }
      await page.waitForFunction(({ id }) => {
        const nodes = [];
        const visit = node => { nodes.push(node); for (const child of node.children ?? []) visit(child); };
        if (!globalThis.__transitionApp) return false;
        visit(globalThis.__transitionApp.stage);
        const visible = node => { for (let p = node; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
        const art = (stem, minAlpha = 0.1) => nodes.find(n => visible(n) && n.alpha > minAlpha && n.texture?.width > 1
          && n.texture?.source?.resource?.src?.includes('/' + stem + '-'));
        const echo = art('echo-shock', 0.2);
        const fork = art('singularity-split', 0.4);
        const shards = nodes.filter(n => visible(n) && n.texture?.width > 1
          && n.texture?.source?.resource?.src?.includes('/singularity-shard-'));
        const ready = id === 'thunderhead' ? art('thunderhead-burst', 0.5)
          : id === 'singularity-return' ? fork && shards.length === 6
          : echo && echo.width < 80 && echo.alpha < 0.6;
        if (ready) document.querySelector('#pause-toggle')?.click();
        return Boolean(ready);
      }, { id }, { timeout: 25000 });
      const rendered = await page.evaluate(() => {
        const nodes = [];
        const visible = n => { for (let p = n; p; p = p.parent) if (!p.visible || p.alpha <= 0) return false; return true; };
        const visit = n => {
          const src = n.texture?.source?.resource?.src;
          if (visible(n) && src?.includes('.png')) nodes.push({ label: n.label, image: src.split('/').at(-1), x: n.x, y: n.y, width: n.width, alpha: n.alpha });
          for (const child of n.children ?? []) visit(child);
        };
        visit(globalThis.__transitionApp.stage);
        return nodes;
      });
      if (rendered.some(n => n.image.includes('magnetic-charge-detonation'))) errors.push('Reused magnetic burst');
      await page.addStyleTag({ content: '#debug-panel, #pause-overlay { visibility: hidden !important; }' });
      await page.locator('#game-container canvas').screenshot({ path: `${out}/${id}-${phase}-${quality}.png` });
      console.log(JSON.stringify({ id, phase, quality, rendered, errors }));
      if (errors.length) process.exitCode = 1;
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
