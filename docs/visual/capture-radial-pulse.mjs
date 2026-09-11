import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.argv[2] ?? 'http://127.0.0.1:5173';
  await page.goto(`${base}/docs/visual/radial-pulse-reference.html`);
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/radial-pulse-reference', { recursive: true });
  await page.screenshot({ path: 'test-results/radial-pulse-reference/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/radial-pulse-reference/mobile.png', fullPage: true });
  await page.locator('#play').click();
  await page.waitForTimeout(900);
  await page.locator('#play').click();
  await page.screenshot({ path: 'test-results/radial-pulse-reference/animated.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Radial pulse reference: desktop, portrait and animated captures; no page errors.');
} finally {
  await browser.close();
}
