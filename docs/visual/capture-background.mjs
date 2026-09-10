import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1180,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
 const base=process.argv[2]??'http://127.0.0.1:5173';
 await mkdir('test-results/background-reference',{recursive:true});
 await page.goto(base+'/docs/visual/background-reference.html');
 await page.locator('body[data-ready=true]').waitFor();
 await page.screenshot({path:'test-results/background-reference/reference.png',fullPage:true});
 await page.goto(base+'/');
 await page.locator('#start-skins').click();await page.locator('#start-backgrounds-tab').click();
 await page.locator('.background-card[data-background="nacre-orbit"] button').click();
 await page.locator('.background-card[data-background="vesper-bloom"] button').click();
 await page.screenshot({path:'test-results/background-reference/locker.png'});
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('geometry-survivor:save')));
 assert.equal(save.wallet.nova,0);assert.equal(save.backgrounds.selected,'vesper-bloom');
 for(const [quality,w,h] of [['low',1280,720],['high',390,844]]){
   await page.setViewportSize({width:w,height:h});
   await page.goto(base+'/?boss=1&quality='+quality);
   await page.waitForFunction(()=>document.querySelector('#debug-panel')?.textContent?.includes('laser: active'),undefined,{timeout:15000});
   // Hide only the developer overlay for artistic inspection of the actual canvas.
   await page.locator('#debug-panel').evaluate(el=>{el.style.visibility='hidden';});
   await page.screenshot({path:`test-results/background-reference/boss-${quality}.png`});
 }
 assert.deepEqual(errors,[]);
 console.log('Nacre + Vesper: reference, free locker, Low desktop and High portrait Vesper boss captured; no runtime/HTTP errors.');
} finally {await browser.close();}
