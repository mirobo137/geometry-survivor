import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = process.argv[2] ?? 'http://127.0.0.1:5173';
  await page.goto(base + '/docs/visual/arena-reference.html');
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/arena-reference', { recursive: true });
  await page.screenshot({ path: 'test-results/arena-reference/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/arena-reference/mobile.png', fullPage: true });
  await page.locator('#play').click();
  await page.waitForTimeout(1800);
  await page.locator('#play').click();
  await page.screenshot({ path: 'test-results/arena-reference/morph.png', fullPage: true });
  const cpu = await page.evaluate(async () => {
    const { ArenaView } = await import('/src/presentation/pixi/ArenaView.ts');
    const { ArenaModel } = await import('/src/simulation/ArenaModel.ts');
    const view = new ArenaView();
    const model = new ArenaModel();
    const measure = (morph) => {
      const times = [];
      for (let i = 0; i < 180; i++) {
        const state = morph ? { ...model.state, shapeFrom: 'circle', shapeTo: 'hexagon', morphProgress: (i % 60) / 59 } : model.state;
        const start = performance.now();
        view.update(1 / 60); view.render(state);
        times.push(performance.now() - start);
      }
      times.sort((a,b) => a-b);
      return { medianMs: times[90], p95Ms: times[171] };
    };
    const results = { stable: measure(false), morph: measure(true) };
    view.root.destroy({ children: true });
    return results;
  });
  console.log('CPU update/render only, headless desktop; excludes GPU submission:', JSON.stringify(cpu));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(base + '/?boss=1&quality=low');
  await page.waitForFunction(() => document.querySelector('#debug-panel')?.textContent?.includes('laser: active'), undefined, { timeout: 15000 });
  await page.screenshot({ path: 'test-results/arena-reference/gameplay-low.png' });
  assert.deepEqual(errors, []);
  console.log('Arena reference: desktop, portrait, morph, Low boss captured; no page errors.');
} finally { await browser.close(); }
