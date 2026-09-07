import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1180, height: 1100 } });
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto((process.argv[2] ?? 'http://127.0.0.1:5173') + '/docs/visual/laser-reference.html');
 await page.locator('body[data-ready=true]').waitFor();
 await mkdir('test-results/laser-reference', { recursive: true });
 await page.screenshot({ path: 'test-results/laser-reference/desktop.png', fullPage: true });
 await page.setViewportSize({ width: 390, height: 1000 });
 await page.screenshot({ path: 'test-results/laser-reference/mobile.png', fullPage: true });
 assert.equal(await page.locator('canvas').count(), 6);
 await page.setViewportSize({ width: 1280, height: 720 });
 await page.goto((process.argv[2] ?? 'http://127.0.0.1:5173') + '/?boss=1&quality=low');
 await page.waitForFunction(() => document.querySelector('#debug-panel')?.textContent?.includes('laser: active'), undefined, { timeout: 15000 });
 await page.screenshot({ path: 'test-results/laser-reference/gameplay-low.png' });
 assert.deepEqual(errors, []);
 console.log('Six production-renderer panels and active Low gameplay captured; no runtime errors.');
} finally { await browser.close(); }
