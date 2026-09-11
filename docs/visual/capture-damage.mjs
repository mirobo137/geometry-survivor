import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.argv[2] ?? 'http://127.0.0.1:5173';
  await page.goto(base + '/docs/visual/damage-reference.html');
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/damage-reference', { recursive: true });
  await page.screenshot({ path: 'test-results/damage-reference/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/damage-reference/mobile.png', fullPage: true });
  assert.equal(await page.locator('canvas').count(), 6);
  await page.locator('#play').click();
  await page.waitForTimeout(1400);
  await page.locator('#play').click();
  await page.goto(base + '/?boss=1&quality=low');
  await page.locator('#boot-status').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => {
    const health = Number(document.querySelector('#hud-health')?.textContent?.match(/HP (\d+)/)?.[1]);
    return health > 0 && health < 100;
  });
  await page.screenshot({ path: 'test-results/damage-reference/gameplay-low.png' });
  assert.deepEqual(errors, []);
  console.log('Six real FX panels, animation and Low boss scene: no runtime errors.');
} finally { await browser.close(); }
