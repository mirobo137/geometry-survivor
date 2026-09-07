import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto((process.argv[2] ?? 'http://127.0.0.1:5173') + '/docs/visual/orbit-reference.html');
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/orbit-reference', { recursive: true });
  await page.screenshot({ path: 'test-results/orbit-reference/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: 'test-results/orbit-reference/mobile.png', fullPage: true });
  assert.equal(await page.locator('canvas').count(), 4);
  assert.deepEqual(errors, []);
  console.log('Four production-renderer orbit panels captured, desktop/mobile; no runtime errors.');
} finally {
  await browser.close();
}
