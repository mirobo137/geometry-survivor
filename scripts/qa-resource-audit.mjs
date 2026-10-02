// Read-only browser diagnostic. No game hooks or production changes required.
// Run after building dist/local; reports are ignored by Git.
import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'test-results/resource-audit');
const audioOnly = process.argv.includes('--audio-only');
const combatOnly = process.argv.includes('--combat-only');
const reportPath = resolve(output, audioOnly ? 'audio-report.json' : combatOnly ? 'combat-report.json' : 'report.json');
const report = { node: process.version, schemaVersion: 2, scenarios: [], errors: [] };
let server;
let browser;
const started = Date.now();
const stamp = () => Date.now() - started;
const inspectImages = page => page.evaluate(() => [...document.images]
  .filter(img => img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0)
  .map(img => ({ src: (img.currentSrc || img.src).split('/').pop(),
    ready: img.complete && img.naturalWidth > 0, width: img.naturalWidth })));

async function newPage(viewport, slowImages = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    globalThis.__PIXI_APP_INIT__ = app => { globalThis.__resourceAuditApp = app; };
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) window.AudioContext = new Proxy(AudioContextClass, {
      construct(target, args) {
        const context = Reflect.construct(target, args);
        globalThis.__resourceAuditAudioContext = context;
        return context;
      }
    });
    localStorage.setItem('geometry-survivor:save', JSON.stringify({
      schemaVersion: 9, wallet: { nova: 20000 }, overdrive: { unlocked: true },
      unlockedActs: ['radial', 'angular', 'fracture']
    }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on('request', request => {
    if (/\.(png|webp)(\?|$)/.test(request.url())) requests.push({
      asset: request.url().split('/').pop(), elapsedMs: stamp()
    });
  });
  if (slowImages) await page.route(/\.(png|webp)(\?|$)/, async route => {
    await delay(2000);
    await route.continue().catch(() => {});
  });
  page.on('dialog', dialog => dialog.accept());
  return { context, page, errors, requests };
}

async function memory(page, session, label) {
  // Comparing post-GC retained heap reduces false positives from transient allocations.
  await session.send('HeapProfiler.collectGarbage');
  const metrics = await session.send('Performance.getMetrics');
  const dom = await session.send('Memory.getDOMCounters');
  const heap = metrics.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value;
  const scene = await page.evaluate(() => {
    const app = globalThis.__resourceAuditApp;
    let nodes = 0;
    const textures = new Set();
    const visit = node => {
      nodes++;
      if (node.texture?.source) textures.add(node.texture.source);
      for (const child of node.children ?? []) visit(child);
    };
    if (app?.stage) visit(app.stage);
    return { sceneNodes: nodes, textureSourcesInScene: textures.size,
      rgbaBaseBytesInScene: [...textures].reduce((sum, source) =>
        sum + (source.pixelWidth ?? source.width ?? 0) * (source.pixelHeight ?? source.height ?? 0) * 4, 0) };
  });
  const row = { label, elapsedMs: stamp(), heapMiB: Number((heap / 1048576).toFixed(3)), ...dom, ...scene,
    gameplaySeconds: await page.locator('#hud-time').textContent(),
    levelUpVisible: await page.locator('#level-up').isVisible(),
    gameOverVisible: await page.locator('#game-over').isVisible() };
  console.log(JSON.stringify(row));
  return row;
}

try {
  await mkdir(output, { recursive: true });
  server = await preview({ root, mode: 'development', preview: {
    host: '127.0.0.1', port: 4175, strictPort: true, open: false
  } });
  browser = await chromium.launch();
  for (const viewport of audioOnly || combatOnly ? [] : [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const { context, page, errors, requests } = await newPage(viewport, true);
    const row = { kind: 'cold-delayed-images', viewport, delayMsPerImage: 2000, samples: [], requests, errors };
    await page.goto('http://127.0.0.1:4175/?quality=low');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    row.samples.push({ phase: 'boot-hidden', elapsedMs: stamp(), images: await inspectImages(page) });
    await page.screenshot({ path: resolve(output, `boot-${viewport.width}.png`) });
    await delay(2300);
    await page.locator('#start-skins').click();
    row.samples.push({ phase: 'skins-open', elapsedMs: stamp(), images: await inspectImages(page) });
    await delay(2300);
    row.samples.push({ phase: 'skins-settled', elapsedMs: stamp(), images: await inspectImages(page) });
    await page.locator('#start-skins-back').click();
    await page.locator('#start-level').click();
    row.samples.push({ phase: 'acts-open', elapsedMs: stamp(), images: await inspectImages(page) });
    await delay(2300);
    row.samples.push({ phase: 'acts-settled', elapsedMs: stamp(), images: await inspectImages(page) });
    await page.screenshot({ path: resolve(output, `acts-${viewport.width}.png`) });
    report.scenarios.push(row);
    await context.close();
  }

  if (!audioOnly && !combatOnly) {
    const { context, page, errors, requests } = await newPage({ width: 1280, height: 720 });
    const session = await context.newCDPSession(page);
    await session.send('Performance.enable');
    await page.goto('http://127.0.0.1:4175/?quality=high');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await delay(1500);
    const samples = [];
    const row = { kind: 'retained-memory', menuPasses: 20, runRestarts: 10, samples, errors, requests };
    samples.push(await memory(page, session, 'initial-menu'));
    for (let pass = 1; pass <= 20; pass++) {
      await page.locator('#start-skins').click();
      for (const tab of ['cannon-skins', 'backgrounds', 'player-skins'])
        await page.locator(`#start-${tab}-tab`).click();
      await page.locator('#start-skins-back').click();
      await page.locator('#start-level').click();
      await page.locator('#start-act-back').click();
      await page.locator('#start-meta').click();
      await page.locator('#start-meta-back').click();
      if ([1, 5, 10, 20].includes(pass)) {
        await delay(250);
        samples.push(await memory(page, session, `menu-${pass}`));
      }
    }
    for (let pass = 1; pass <= 10; pass++) {
      await page.locator('#start-play').click();
      await page.locator('#start-screen').waitFor({ state: 'hidden' });
      await delay(500);
      await page.locator('#pause-toggle').click();
      await page.locator('#pause-menu').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      if ([1, 5, 10].includes(pass)) samples.push(await memory(page, session, `run-${pass}`));
    }
    report.scenarios.push(row);
    await context.close();
  }

  for (const quality of audioOnly ? [] : ['low', 'high']) {
    const { context, page, errors, requests } = await newPage({ width: 390, height: 844 });
    const session = await context.newCDPSession(page);
    await session.send('Performance.enable');
    await page.goto(`http://127.0.0.1:4175/?mode=overdrive&od-build=six-evolved&debug=1&profile=1&quality=${quality}`);
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    const samples = [];
    // Context-loss/background are covered by the smoke suite; this is a bounded
    // six-weapon observation, not a physical mobile performance certification.
    for (const seconds of [5, 15, 30, 60]) {
      const until = Date.now() + (seconds - (samples.at(-1)?.scenarioSeconds ?? 0)) * 1000;
      while (Date.now() < until) {
        if (await page.locator('#level-up').isVisible()) {
          const card = page.locator('#level-up-options button:not(:disabled)').first();
          if (await card.count()) await card.click();
        }
        await delay(500);
      }
      samples.push({ ...(await memory(page, session, `six-weapons-${quality}-${seconds}s`)), scenarioSeconds: seconds });
    }
    report.scenarios.push({ kind: 'six-weapons', quality, samples, requests, errors,
      finalUi: await page.locator('#debug-panel').textContent() });
    await context.close();
  }
  {
    const { context, page, errors } = await newPage({ width: 1280, height: 720 });
    await page.goto('http://127.0.0.1:4175/?quality=low');
    await page.locator('#boot-status').waitFor({ state: 'hidden' });
    await page.locator('#start-skins').click();
    // Allow Howler's one-time scratch-buffer unlock listener to finish and
    // detach; the first gesture constructs it after the capture phase.
    await page.locator('#start-skins-back').click();
    await delay(500);
    await page.locator('#start-skins').click();
    await delay(500);
    const before = await page.evaluate(() => globalThis.__resourceAuditAudioContext?.state ?? 'absent');
    await page.evaluate(async () => { await globalThis.__resourceAuditAudioContext?.suspend(); });
    const suspended = await page.evaluate(() => globalThis.__resourceAuditAudioContext?.state ?? 'absent');
    await page.locator('#start-skins-back').click();
    await delay(500);
    const afterGesture = await page.evaluate(() => globalThis.__resourceAuditAudioContext?.state ?? 'absent');
    report.scenarios.push({ kind: 'audio-suspended-gesture', before, suspended, afterGesture, errors });
    console.log(JSON.stringify({ kind: 'audio-suspended-gesture', before, suspended, afterGesture, errors }));
    await context.close();
  }
} catch (error) {
  report.errors.push(error.stack ?? String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(resolve => server?.httpServer ? server.httpServer.close(resolve) : resolve());
  report.elapsedMs = stamp();
  await writeFile(reportPath, JSON.stringify(report, null, 2));
}
for (const row of report.scenarios) if (row.errors?.length) process.exitCode = 1;
console.log(JSON.stringify({ report: reportPath, scenarios: report.scenarios.length,
  errors: [...report.errors, ...report.scenarios.flatMap(row => row.errors ?? [])] }));
