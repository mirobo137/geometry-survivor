import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.argv[2] ?? 'http://127.0.0.1:5173';
  await page.goto(base + '/docs/visual/angular-reference.html');
  await page.locator('body[data-ready=true]').waitFor();
  await mkdir('test-results/angular-reference', { recursive: true });
  await page.screenshot({path:'test-results/angular-reference/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/angular-reference/portrait.png',fullPage:true});
  for (const kind of ['charger','orbiter','splitter','angular']) {
    await page.setViewportSize({width:1280,height:720});
    await page.goto(base + '/?' + kind + '=1&debug=1&quality=low');
    await page.waitForFunction(k => document.querySelector('#debug-panel')?.textContent?.includes(k + ':'),kind,{timeout:20000});
    if (kind === 'splitter') {
      await page.waitForFunction(() => document.querySelector('#debug-panel')?.textContent?.includes('depth 1'), null, {timeout:20000});
    }
    await page.screenshot({path:'test-results/angular-reference/'+kind+'-low.png'});
  }
  assert.deepEqual(errors,[]);
  console.log('Production panels, portrait and four Low drills captured without runtime errors.');
} finally { await browser.close(); }
