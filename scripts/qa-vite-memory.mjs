import { createServer, resolveConfig } from 'vite';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

// Bounded diagnostic: one Vite, one browser, sequential platform builds.
// Original watcher mode is only allowed on the updated runtime, never Node 22.14.
const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--watch='))?.split('=')[1] ?? 'fixed';
const seconds = Number(args.find(arg => arg.startsWith('--seconds='))?.split('=')[1] ?? 60);
if (!['original', 'fixed', 'off'].includes(mode) || !Number.isFinite(seconds) || seconds < 30 || seconds > 600) {
  throw new Error('Use --watch=original|fixed|off --seconds=30..600 [--builds]');
}
if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Update to Node 24 LTS before running this probe.');
const root = resolve(import.meta.dirname, '..');
const samples = [];
const events = [];
const errors = [];
let server;
let browser;
let buildChild;
let timer;
let phase = 'boot';
let failure;
const started = Date.now();
const sample = () => {
  const memory = process.memoryUsage();
  const watched = server?.watcher.getWatched() ?? {};
  const row = { elapsedSeconds: Number(((Date.now() - started) / 1000).toFixed(1)), phase,
    ...Object.fromEntries(Object.entries(memory).map(([key, value]) => [key + 'MiB', Number((value / 1048576).toFixed(2))])),
    watchedDirectories: Object.keys(watched).length,
    watchedEntries: Object.values(watched).reduce((sum, entries) => sum + entries.length, 0) };
  samples.push(row);
  console.log(JSON.stringify(row));
  if (memory.rss > 768 * 1048576) throw new Error('Safety stop: Vite RSS exceeded 768 MiB.');
};
const build = target => new Promise((done, reject) => {
  buildChild = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', target],
    { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const limit = setTimeout(() => buildChild?.kill(), 60_000);
  buildChild.stdout.on('data', () => {});
  buildChild.stderr.on('data', chunk => process.stderr.write(chunk));
  buildChild.once('error', error => { clearTimeout(limit); reject(error); });
  buildChild.once('exit', code => { clearTimeout(limit); buildChild = undefined;
    code === 0 ? done() : reject(new Error(`Build ${target} exited ${code}`)); });
});
try {
  const config = await resolveConfig({ root, server: { host: '127.0.0.1', port: 5175, strictPort: true } }, 'serve');
  // Override after resolution: config merging appends arrays and skips null.
  if (mode === 'original') config.server.watch.ignored = [];
  if (mode === 'off') config.server.watch = null;
  server = await createServer(config);
  server.watcher.on('all', (kind, file) => { if (events.length < 1000) events.push({ kind, file, phase }); });
  await server.listen();
  if (mode === 'off' && server.config.server.watch !== null) throw new Error('Watcher-off config was not applied.');
  sample();
  timer = setInterval(() => { try { sample(); } catch (error) {
    failure = error; clearInterval(timer); buildChild?.kill(); void browser?.close(); void server?.close();
  } }, 5000);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5175/?quality=low');
  await page.locator('#boot-status').waitFor({ state: 'hidden', timeout: 30_000 });
  phase = 'idle-before-builds';
  await delay(seconds * 500);
  if (failure) throw failure;
  if (mode === 'fixed' && !Object.keys(server.watcher.getWatched()).some(directory => directory.replaceAll('\\', '/').startsWith(root.replaceAll('\\', '/') + '/src/'))) {
    throw new Error('Fixed watcher no longer watches real source directories.');
  }
  if (args.includes('--builds')) {
    for (const target of ['development', 'poki', 'crazygames']) {
      phase = 'build-' + target;
      await build(target);
      sample();
    }
  }
  phase = 'idle-after-builds';
  await delay(seconds * 500);
  if (failure) throw failure;
  await page.locator('#start-play').waitFor({ state: 'visible', timeout: 10_000 });
  sample();
  if (errors.length) throw new Error(errors.join('\n'));
  if (mode === 'fixed' && events.some(event => /[\\/]dist[\\/]/.test(event.file))) {
    throw new Error('Generated platform output reached the fixed watcher.');
  }
  if (mode === 'off' && samples.some(row => row.watchedEntries !== 0)) {
    throw new Error('Watcher-off comparison still watches files.');
  }
  // Playwright clears test-results at startup; keep independent observations.
  const output = resolve(root, '.tmp/vite-memory');
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, mode + '.json'), JSON.stringify({ mode, node: process.version, uv: process.versions.uv,
    pid: process.pid, seconds, samples, events, errors }, null, 2));
} finally {
  clearInterval(timer);
  buildChild?.kill();
  await browser?.close();
  await server?.close();
}
