import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = 'test-results/transitions';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir(output, { recursive: true });
try {
  await page.goto(`${base}/docs/visual/transitions-reference.html`);
  await page.locator('#run-transition:not([hidden])').waitFor();
  const scenarios = [
    ['radial', 'premium', 'high', 1280, 720],
    ['angular', 'premium', 'high', 1280, 720],
    ['fracture', 'premium', 'high', 1280, 720],
    ['overdrive', 'premium', 'high', 1280, 720],
    ['overdrive', 'premium', 'low', 320, 568],
    ['angular', 'premium', 'medium', 390, 844],
    ['fracture', 'premium', 'high', 640, 360],
    ['overdrive', 'stage', 'high', 390, 844],
    ['angular', 'basic', 'high', 1280, 720]
  ];
  const reports = [];
  for (const [route, variant, quality, width, height] of scenarios) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.body.classList.remove('hide-controls'));
    await page.selectOption('#route', route);
    await page.selectOption('#variant', variant);
    await page.selectOption('#quality', quality);
    await page.click('#replay');
    await page.locator('#run-transition:not([hidden])').waitFor();
    await page.evaluate(() => {
      document.body.classList.add('hide-controls');
      for (const animation of document.querySelector('#run-transition').getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = Number(animation.effect.getTiming().duration) * .5;
      }
    });
    const report = await page.evaluate(() => {
      const root = document.querySelector('#run-transition');
      const rect = el => { const r = el.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height }; };
      return {
        title: rect(root.querySelector('[data-run-transition-name]')),
        copy: rect(root.querySelector('.run-transition-copy')),
        skip: root.querySelector('button').hidden ? null : rect(root.querySelector('button')),
        animations: root.getAnimations({ subtree:true }).length,
        svgNodes: root.querySelectorAll('svg *').length
      };
    });
    for (const r of [report.title, report.copy, report.skip].filter(Boolean)) {
      if (r.x < -1 || r.y < -1 || r.x+r.width > width+1 || r.y+r.height > height+1) throw Error(`Overflow ${route}/${width}: ${JSON.stringify(r)}`);
    }
    if (report.skip && report.copy.x < report.skip.x + report.skip.width
      && report.copy.x + report.copy.width > report.skip.x
      && report.copy.y < report.skip.y + report.skip.height
      && report.copy.y + report.copy.height > report.skip.y) throw Error(`Skip overlaps title ${width}`);
    await page.screenshot({ path: `${output}/${route}-${variant}-${quality}-${width}.png` });
    reports.push({ route, variant, quality, width, ...report });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.body.classList.remove('hide-controls'));
  await page.selectOption('#variant', 'premium');
  await page.click('#replay');
  await page.locator('#run-transition:not([hidden])').waitFor();
  const reduced = await page.locator('#run-transition').evaluate(el => el.getAnimations({ subtree: true }).length);
  if (reduced !== 0) throw Error('Reduced motion still animates');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const timing = [];
  for (const preset of ['high', 'low']) {
    await page.selectOption('#quality', preset);
    await page.click('#replay');
    const sample = await page.evaluate(() => new Promise(resolve => {
      const frames = [];
      let first = 0, previous = 0;
      const sampleFrame = now => {
        if (!first) first = now;
        if (previous) frames.push(now - previous);
        previous = now;
        if (now - first < 2800) requestAnimationFrame(sampleFrame);
        else {
          frames.sort((a,b) => a-b);
          resolve({ samples:frames.length, p95Ms:frames[Math.floor(frames.length*.95)], maxMs:frames.at(-1) });
        }
      };
      requestAnimationFrame(sampleFrame);
    }));
    timing.push({ preset, ...sample });
  }
  if (errors.length) throw Error(errors.join('\n'));
  // DOM reference timing in headless Chromium, not game FPS or physical-mobile evidence.
  console.log(JSON.stringify({ reports, reducedMotionAnimations: reduced, referenceTiming: timing, errors }, null, 2));
} finally {
  await browser.close();
}
