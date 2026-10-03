import { expect, test, type Page } from '@playwright/test';

// Observe real browser audio nodes, not a new production/debug API or mock track.
const installMusicAudit = (page: Page) => page.addInitScript(() => {
  const host = window as unknown as { musicAudit: { nodes: HTMLAudioElement[]; contexts: AudioContext[]; decodes: number } };
  host.musicAudit = { nodes: [], contexts: [], decodes: 0 };
  const AudioOriginal = window.Audio;
  window.Audio = new Proxy(AudioOriginal, { construct(target, args) {
    const node = Reflect.construct(target, args) as HTMLAudioElement;
    host.musicAudit.nodes.push(node);
    return node;
  } });
  const ContextOriginal = window.AudioContext;
  window.AudioContext = new Proxy(ContextOriginal, { construct(target, args) {
    const context = Reflect.construct(target, args) as AudioContext;
    host.musicAudit.contexts.push(context);
    const decode = context.decodeAudioData.bind(context);
    context.decodeAudioData = (...parameters: Parameters<AudioContext['decodeAudioData']>) => {
      host.musicAudit.decodes++;
      return decode(...parameters);
    };
    return context;
  } });
});

const readMusic = (page: Page) => page.evaluate(() => {
  const audit = (window as unknown as { musicAudit: { nodes: HTMLAudioElement[]; contexts: AudioContext[]; decodes: number } }).musicAudit;
  const tracks = audit.nodes.filter(node => node.src.includes('general-theme'));
  return { contexts: audit.contexts.length, liveContexts: audit.contexts.filter(context => context.state !== 'closed').length,
    decodes: audit.decodes, tracks: tracks.map(node => ({
    index: audit.nodes.indexOf(node), volume: node.volume, paused: node.paused,
    time: node.currentTime, duration: node.duration, src: node.currentSrc || node.src
  })) };
});

export const registerMusicChecks = (): void => {
  test('música general conserva una pista y mezcla menú 70% / partida 35% con pausa y retorno', async ({ page }) => {
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('general-theme')) requests.push(request.url()); });
    await installMusicAudit(page);
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    expect(requests).toHaveLength(0);
    expect((await readMusic(page)).contexts).toBe(0);
    await page.locator('#start-settings-toggle').click();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(false);
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.time ?? 0).toBeGreaterThan(0);
    const menu = await readMusic(page);
    expect(menu.tracks).toHaveLength(1);
    expect(menu.tracks[0].volume).toBeCloseTo(0.7, 2);
    expect(menu.tracks[0].duration).toBeGreaterThan(359);
    // Howler may close/recreate its initial context once for its sample-rate fix.
    expect(menu.contexts).toBeGreaterThanOrEqual(1);
    expect(menu.contexts).toBeLessThanOrEqual(2);
    expect(menu.liveContexts).toBe(1);
    expect(menu.decodes).toBe(0); // Long music never uses decodeAudioData.
    await page.locator('#start-settings-toggle').click();
    await page.locator('#start-play').click();
    await page.locator('[data-run-transition-skip]').click();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.volume).toBeCloseTo(0.35, 2);
    expect((await readMusic(page)).tracks[0].time).toBeGreaterThan(menu.tracks[0].time);
    await page.locator('#pause-toggle').click();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(true);
    const pausedTime = (await readMusic(page)).tracks[0].time;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(300);
    expect((await readMusic(page)).tracks[0].time).toBeCloseTo(pausedTime, 1);
    await page.locator('#pause-menu').click();
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(false);
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.volume).toBeCloseTo(0.7, 2);
    expect((await readMusic(page)).tracks[0].index).toBe(menu.tracks[0].index);
    expect((await readMusic(page)).tracks[0].time).toBeGreaterThanOrEqual(pausedTime);

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(true);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(false);
    await page.locator('#start-settings-toggle').click();
    await page.locator('#start-music').evaluate((element) => {
      (element as HTMLInputElement).value = '50';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.volume).toBeCloseTo(0.35, 2);
    await page.locator('#start-muted').check();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(true);
    await page.locator('#start-muted').uncheck();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(false);
    expect((await readMusic(page)).tracks[0].volume).toBeCloseTo(0.35, 2);
    await page.locator('#start-settings-toggle').click();
    await page.locator('#start-play').click();
    await expect.poll(async () => (await readMusic(page)).tracks[0]?.volume).toBeCloseTo(0.175, 2);
    const final = await readMusic(page);
    expect(final.tracks).toHaveLength(1);
    expect(final.tracks[0].index).toBe(menu.tracks[0].index);
    expect(final.contexts).toBe(menu.contexts);
    expect(final.liveContexts).toBe(1);
    expect(final.decodes).toBe(0);
    expect(new Set(requests).size).toBe(1);
    expect(errors).toEqual([]);
  });

  test('música fallida o tardía no bloquea controles ni suena sobre una partida pausada', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await installMusicAudit(page);
    let aborted = false;
    await page.route(/general-theme[^/]*\.mp3$/, async route => {
      await route.abort();
      aborted = true;
    });
    await page.goto('/?quality=low');
    await expect(page.locator('#boot-status')).toBeHidden();
    await page.locator('#start-settings-toggle').click();
    await expect(page.locator('#start-settings')).toBeVisible();
    await expect.poll(() => aborted).toBe(true);
    await expect.poll(async () => (await readMusic(page)).tracks.length).toBe(0);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const pending: Promise<void>[] = [];
    await page.route(/general-theme[^/]*\.mp3$/, route => {
      const load = gate.then(() => route.continue()).catch(() => {});
      pending.push(load);
      return load;
    });
    try {
      await page.locator('#start-settings-toggle').click();
      await page.locator('#start-play').click();
      await page.locator('[data-run-transition-skip]').click();
      await page.locator('#pause-toggle').click();
      await expect(page.locator('#pause-overlay')).toBeVisible();
      release();
      await Promise.all(pending);
      await expect.poll(async () => (await readMusic(page)).tracks[0]?.duration ?? 0).toBeGreaterThan(359);
      await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(true);
      await page.locator('#pause-resume').click();
      await expect.poll(async () => (await readMusic(page)).tracks[0]?.paused).toBe(false);
      await expect.poll(async () => (await readMusic(page)).tracks[0]?.volume).toBeCloseTo(0.35, 2);
      expect((await readMusic(page)).tracks).toHaveLength(1);
      expect(errors).toEqual([]);
    } finally { release(); }
  });
};
