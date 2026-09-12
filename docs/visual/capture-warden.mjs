import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1100,height:1500}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.argv[2]??'http://127.0.0.1:5173')+'/docs/visual/warden-reference.html');
 await page.locator('body[data-ready=true]').waitFor();
 await mkdir('test-results/warden-reference',{recursive:true});
 await page.screenshot({path:'test-results/warden-reference/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'test-results/warden-reference/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Warden production renderer captured: desktop/mobile, Low/High, dark/light.');
} finally {await browser.close();}
