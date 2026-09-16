// Dev-only QA: start Vite on 5173, then node docs/visual/capture-fracture.mjs.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output='test-results/fracture-art';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1100},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto('http://127.0.0.1:5173/docs/visual/fracture-reference.html');
  await page.locator('body[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#ships article').count(),5);
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(node=>node.id));
  assert.equal(ids.length,new Set(ids).size);
  await page.locator('#ships').screenshot({path:`${output}/fleet.png`});
  for(const [name,mode] of [['dark',''],['light','light'],['gray','gray'],['silhouette','light silhouette']]){
    await page.selectOption('#inspection',mode);
    await page.screenshot({path:`${output}/${name}.png`,fullPage:true});
  }
  await page.selectOption('#inspection','');
  await page.locator('#exploration summary').click();
  await page.locator('#studies').screenshot({path:`${output}/silhouette-studies.png`});
  await page.locator('#exploration summary').click();
  for(const phase of ['approach','telegraph','active','recovery']){
    await page.selectOption('#phase',phase);
    for(const angle of ['0','90','180','270']){
      await page.selectOption('#angle',angle);
      await page.locator('#runtime').screenshot({path:`${output}/pixi-${phase}-${angle}.png`});
    }
  }
  await page.click('#defeat');
  await page.locator('#runtime').screenshot({path:`${output}/pixi-boss-defeat.png`});
  await page.click('#reset');
  await page.click('#motion');
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
  await page.click('#motion');
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
  // Production rendering, including the actual presentation scale and texture pipeline.
  for(const quality of ['low','high']){
    for(const drill of ['gunner','thorn','zigzag','miner','boss']){
      const query=drill==='boss'?'act=fracture&boss=1':`fracture-drill=${drill}`;
      await page.goto(`http://127.0.0.1:5173/?debug=1&${query}&quality=${quality}`);
      await page.locator('canvas').first().waitFor();
      await page.waitForTimeout(1800);
      await page.screenshot({path:`${output}/game-${drill}-${quality}.png`});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('Fracture art: five ships, unique IDs, four inspection modes, 16 Pixi poses, defeat/reset, 10 gameplay captures; no browser errors.');
} finally {await browser.close();}
