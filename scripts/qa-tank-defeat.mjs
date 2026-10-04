import { chromium, devices } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// An owned, isolated dev server: no changes/restarts to the user's Vite.
const out = 'test-results/tank-defeat';
await mkdir(out, { recursive: true });
const server = await createServer({ mode: 'development', server: { host: '127.0.0.1', port: 5184, strictPort: true } });
let browser;
const results = [];
try {
  await server.listen();
  browser = await chromium.launch();
  for (const entry of [
    { quality: 'high' }, { quality: 'medium' }, { quality: 'low' },
    { quality: 'high', mobile: true }, { quality: 'low', mobile: true },
    { quality: 'high', reduced: true }
  ]) {
    const context = await browser.newContext({ ...(entry.mobile ? devices['Pixel 5'] : { viewport: { width: 900, height: 900 } }),
      reducedMotion: entry.reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(`http://127.0.0.1:5184/docs/visual/tank-defeat.html?quality=${entry.quality}`);
    await page.waitForFunction(() => Boolean(window.__tankTrial));
    // This audit must exercise the PNGs, not silently pass with SVG fallbacks.
    await page.waitForFunction(() => {
      const t = window.__tankTrial;
      return t.enemyIds.every(id => {
        const texture = ['core-sentinel','orbital-warden','fracture-engine'].includes(id)
          ? t.view.enemyTextures.boss[id].flat : t.view.enemyTextures.ships[id].flat;
        return texture.source.resource instanceof HTMLImageElement;
      });
    });
    const families = await page.evaluate(() => window.__tankTrial.enemyIds);
    for (const family of families) {
      await page.setViewportSize(entry.mobile ? { width: 393, height: 851 } : { width: 900, height: 900 });
      await page.evaluate(id => window.__tankTrial.select(id), family);
      const isBoss = ['core-sentinel','orbital-warden','fracture-engine'].includes(family);
      const before = await page.evaluate(() => { const t = window.__tankTrial;t.freeze();t.reset();return {inspect:t.inspect(),pose:{...t.pose()}}; });
      assert.equal(before.inspect.bodySprites, 1);
      assert.equal(before.inspect.raster, true);
      assert.equal(before.inspect.textureSize, isBoss ? 112 : 64);
      assert.equal(before.inspect.physicalSize, isBoss ? 168 : 96);
      const capacity = entry.reduced || entry.quality === 'low' ? 0 : isBoss ? 1 : entry.quality === 'high' ? 18 : 12;
      assert.equal(before.inspect.capacity, capacity);
      assert.equal(before.inspect.totalSprites, isBoss ? (entry.quality === 'low' ? 1 : 4) : capacity * 4);
      if (entry.reduced || entry.quality === 'low') {
        const later = await page.evaluate(() => {const t=window.__tankTrial;t.advance(0.1);return {...t.pose()};});
        assert.deepEqual(later, before.pose, 'Low/reduced-motion animated the body decoratively');
      }
      await page.locator('#kill').click();
      const start = await page.evaluate(() => window.__tankTrial.inspect());
      assert.equal(start.active, capacity ? 1 : 0);
      if (capacity) {
        assert.equal(start.root.rotation, before.pose.rotation);
        assert.equal(start.root.scaleX, before.pose.scaleX);
        assert.equal(start.root.scaleY, before.pose.scaleY);
        assert.equal(start.root.alpha, before.pose.alpha);
        assert(start.pieces.every(piece => piece.source === before.inspect.bodySource));
        assert.equal(start.pieces.reduce((area, piece) => area + piece.frame.width * piece.frame.height, 0), before.inspect.bodySize ** 2);
      }
      await page.waitForTimeout(20);
      assert.deepEqual(await page.evaluate(() => window.__tankTrial.inspect()), start, 'Pause changed a defeat');
      await page.evaluate(() => window.__tankTrial.advance(0.025));
      const compressed = await page.evaluate(() => window.__tankTrial.inspect());
      if (capacity) assert(compressed.root.scaleX < start.root.scaleX);
      if (entry.quality === 'high' && !entry.mobile && !entry.reduced && ['tank','core-sentinel'].includes(family)) {
        await page.locator('#preview').screenshot({ path: `${out}/${family}-high-flash.png` });
      }
      await page.evaluate(() => { window.__tankTrial.advance(0.1);window.__tankTrial.advance(0.045); });
      const middle = await page.evaluate(() => window.__tankTrial.inspect());
      if (capacity) {
        assert(middle.pieces[0].x < start.pieces[0].x);
        assert.notEqual(middle.pieces[0].tint, 0xffffff);
        assert(middle.root.alpha < start.root.alpha);
      }
      const name = `${family}-${entry.quality}${entry.mobile ? '-mobile' : ''}${entry.reduced ? '-reduced' : ''}`;
      await page.locator('#preview').screenshot({ path: `${out}/${name}-rupture.png` });
      await page.setViewportSize(entry.mobile ? { width: 844, height: 390 } : { width: 640, height: 480 });
      assert.deepEqual(await page.evaluate(() => window.__tankTrial.inspect()), middle, 'Resize changed presentation state');
      await page.evaluate(() => {for(let i=0;i<5;i++)window.__tankTrial.advance(0.1);});
      const expired = await page.evaluate(() => window.__tankTrial.inspect());
      assert.equal(expired.active, 0);assert.equal(expired.bursts, 0);assert.equal(expired.particles, 0);
      const cycles = await page.evaluate(({family,isBoss}) => {
        const t=window.__tankTrial;
        for(let i=0;i<60;i++){t.reset();t.kill();for(let j=0;j<5;j++)t.advance(0.1);}
        t.reset();t.kill(0,t.tank.generation-1);const stale=t.inspect();
        t.view.reset();for(let i=0;i<50;i++){
          if(isBoss)t.view.playBossDefeat(320,160,family,t.tank.radius);
          else t.view.playEnemyDefeat(320,160,family);
        }
        const saturated=t.inspect();
        t.reset();t.kill();const beforeStageReset=t.inspect();
        t.view.reset(true);const stageReset=t.inspect();
        for(let j=0;j<5;j++)t.advance(0.1);const stageExpired=t.inspect();
        t.view.reset();return {stale,saturated,beforeStageReset,stageReset,stageExpired,cleared:t.inspect()};
      }, {family,isBoss});
      if(capacity && !isBoss) assert.equal(cycles.stale.root.rotation, 0, 'A stale identity used the previous pose');
      assert.equal(cycles.saturated.active, capacity);
      assert.equal(cycles.stageReset.active, cycles.beforeStageReset.active);
      assert.deepEqual(cycles.stageReset.root, cycles.beforeStageReset.root, 'Stage reset discarded the last boss death');
      assert.deepEqual(cycles.stageReset.pieces, cycles.beforeStageReset.pieces);
      assert.equal(cycles.stageExpired.active, 0);
      assert.equal(cycles.stageExpired.bursts, 0);
      assert.equal(cycles.cleared.active, 0);
      assert.equal(cycles.cleared.totalSprites, before.inspect.totalSprites);
      assert.deepEqual(errors, []);
      results.push({ entry, family, before, start, middle, expired, cycles, errors });
    }
    console.log(`Completed ${families.length} families: ${JSON.stringify(entry)}`);
    await context.close();
  }
  await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
  console.log(`${results.length} enemy/boss cases passed; screenshots/report: ${out}`);
} finally {
  await browser?.close();
  await server.close();
}
