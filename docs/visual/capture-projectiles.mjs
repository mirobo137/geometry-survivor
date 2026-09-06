import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('test-results/projectiles', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 880 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/docs/visual/projectile-reference.html');
  await page.locator('canvas').waitFor();
  await page.screenshot({ path: 'test-results/projectiles/dark.png', fullPage: true });
  await page.click('#theme');
  await page.screenshot({ path: 'test-results/projectiles/light.png', fullPage: true });
  await page.click('#quality');
  await page.screenshot({ path: 'test-results/projectiles/low.png', fullPage: true });
  await page.click('#motion');
  await page.waitForTimeout(300);
  await page.click('#motion');
  for (const cannon of ['curve', 'helix']) {
    for (const quality of ['low', 'high']) {
      await page.goto(`http://127.0.0.1:5173/?boss=1&skin=nova&cannon=${cannon}&quality=${quality}`);
      await page.locator('#game-container canvas').waitFor();
      await page.waitForFunction(() => /projectiles: [1-9]/.test(document.querySelector('#debug-panel')?.textContent ?? ''), null, { timeout: 5_000 });
      await page.screenshot({ path: `test-results/projectiles/game-${cannon}-${quality}.png` });
    }
  }
  assert.deepEqual(errors, []);
  console.log('Projectile gallery and game Curve/Helix Low/High: no runtime errors. Captures in test-results/projectiles.');
} finally { await browser.close(); }
