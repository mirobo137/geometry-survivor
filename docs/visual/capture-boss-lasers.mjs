import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto((process.argv[2] ?? 'http://127.0.0.1:5173') + '/docs/visual/boss-laser-reference.html');
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/boss-laser-reference', { recursive: true });
  await page.screenshot({ path: 'test-results/boss-laser-reference/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: 'test-results/boss-laser-reference/mobile.png', fullPage: true });
  assert.equal(await page.locator('canvas').count(), 5);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto((process.argv[2] ?? 'http://127.0.0.1:5173') + '/?boss=1&quality=low&debug=1');
  await page.waitForFunction(
    () => document.querySelector('#debug-panel')?.textContent?.includes('boss: ring-active'),
    undefined,
    { timeout: 15000 }
  );
  await page.screenshot({ path: 'test-results/boss-laser-reference/gameplay-ring-low.png' });
  assert.deepEqual(errors, []);
  console.log('Five production-renderer boss panels and active ring gameplay captured; no runtime errors.');
} finally {
  await browser.close();
}
