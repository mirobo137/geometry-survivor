import { describe, expect, it, vi } from 'vitest';
import type { AudioService } from '../../audio/AudioService';
import { CrazyGamesAudioService } from './CrazyGamesAudioService';
import type { CrazyGamesSdk } from './CrazyGamesSdk';
import { CrazyGamesPlatformLifecycle } from './CrazyGamesPlatformLifecycle';

const createAudio = () => ({
  configure: vi.fn(), unlock: vi.fn(async () => undefined), pause: vi.fn(), resume: vi.fn(),
  startMusic: vi.fn(), stopMusic: vi.fn(), playCue: vi.fn(), shutdown: vi.fn()
}) satisfies AudioService;

const createSdk = (environment: CrazyGamesSdk['environment'] = 'crazygames') => {
  const events: string[] = [];
  const settingsListeners: Array<(settings: { muteAudio?: boolean }) => void> = [];
  const sdk = {
    init: vi.fn(async () => { events.push('init'); }),
    environment,
    game: {
      settings: { muteAudio: true },
      loadingStart: vi.fn(() => events.push('loadingStart')),
      loadingStop: vi.fn(() => events.push('loadingStop')),
      gameplayStart: vi.fn(() => events.push('gameplayStart')),
      gameplayStop: vi.fn(() => events.push('gameplayStop')),
      addSettingsChangeListener: vi.fn((listener: (settings: { muteAudio?: boolean }) => void) => {
        settingsListeners.push(listener);
      })
    },
    ad: {
      requestAd: vi.fn(),
      hasAdblock: vi.fn(async () => false)
    }
  } satisfies CrazyGamesSdk;
  return { sdk, events, settingsListeners };
};

const flushSdkInit = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('CrazyGamesPlatformLifecycle', () => {
  it('initializes the real v3 uninitialized environment before reporting buffered events', async () => {
    const { sdk, events } = createSdk();
    let initialized = false;
    Object.defineProperty(sdk, 'environment', { get: () => initialized ? 'crazygames' : 'uninitialized' });
    sdk.init.mockImplementation(async () => { events.push('init'); initialized = true; });
    const lifecycle = new CrazyGamesPlatformLifecycle(new CrazyGamesAudioService(createAudio()), async () => sdk);
    lifecycle.onGameReady();
    lifecycle.onGameStart();
    await lifecycle.init();
    await flushSdkInit();
    expect(events).toEqual(['init', 'loadingStart', 'loadingStop', 'gameplayStart']);
    expect(lifecycle.getSdk()).toBe(sdk);
  });

  it('buffers idempotent loading/gameplay transitions until SDK init and app readiness', async () => {
    const { sdk, events } = createSdk();
    const underlyingAudio = createAudio();
    const audio = new CrazyGamesAudioService(underlyingAudio);
    const lifecycle = new CrazyGamesPlatformLifecycle(audio, async () => sdk);

    await lifecycle.init();
    lifecycle.onGameStart();
    await flushSdkInit();
    expect(events).toEqual(['init', 'loadingStart']);

    lifecycle.onGameReady();
    lifecycle.onGameReady();
    lifecycle.onGameStart();
    lifecycle.onGamePause();
    lifecycle.onGamePause();
    lifecycle.onGameResume();
    lifecycle.onGameOver();

    expect(events).toEqual([
      'init', 'loadingStart', 'loadingStop', 'gameplayStart', 'gameplayStop',
      'gameplayStart', 'gameplayStop'
    ]);
    expect(sdk.game.loadingStart).toHaveBeenCalledTimes(1);
    expect(sdk.game.loadingStop).toHaveBeenCalledTimes(1);
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 1, sfxVolume: 1, muted: true });
  });

  it('applies later portal mute settings without overriding player audio settings', async () => {
    const { sdk, settingsListeners } = createSdk();
    const underlyingAudio = createAudio();
    const audio = new CrazyGamesAudioService(underlyingAudio);
    audio.configure({ musicVolume: 0.4, sfxVolume: 0.7, muted: false });
    const lifecycle = new CrazyGamesPlatformLifecycle(audio, async () => sdk);

    await lifecycle.init();
    await flushSdkInit();
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 0.4, sfxVolume: 0.7, muted: true });

    settingsListeners[0]?.({ muteAudio: false });
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 0.4, sfxVolume: 0.7, muted: false });
    audio.configure({ musicVolume: 0.4, sfxVolume: 0.7, muted: true });
    settingsListeners[0]?.({ muteAudio: false });
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 0.4, sfxVolume: 0.7, muted: true });
  });

  it('skips disabled domains and fails open when the SDK is missing or init fails', async () => {
    const disabled = createSdk('disabled');
    const disabledLifecycle = new CrazyGamesPlatformLifecycle(
      new CrazyGamesAudioService(createAudio()), async () => disabled.sdk
    );
    await disabledLifecycle.init();
    await flushSdkInit();
    expect(disabled.sdk.init).toHaveBeenCalledOnce();
    expect(disabled.events).toEqual(['init']);
    expect(disabledLifecycle.getSdk()).toBeNull();

    const missing = new CrazyGamesPlatformLifecycle(new CrazyGamesAudioService(createAudio()), async () => null);
    await expect(missing.init()).resolves.toBeUndefined();
    missing.onGameReady();
    missing.onGameStart();

    const rejected = createSdk();
    rejected.sdk.init.mockRejectedValueOnce(new Error('blocked/failed SDK init'));
    const rejectedLifecycle = new CrazyGamesPlatformLifecycle(
      new CrazyGamesAudioService(createAudio()), async () => rejected.sdk
    );
    await expect(rejectedLifecycle.init()).resolves.toBeUndefined();
    await flushSdkInit();
    rejectedLifecycle.onGameReady();
    rejectedLifecycle.onGameStart();
    expect(rejected.sdk.init).toHaveBeenCalledTimes(1);
    expect(rejected.events).toEqual([]);
  });

  it('does not await an SDK loader that never returns', async () => {
    const lifecycle = new CrazyGamesPlatformLifecycle(
      new CrazyGamesAudioService(createAudio()), () => new Promise(() => undefined)
    );
    await expect(lifecycle.init()).resolves.toBeUndefined();
  });

  it('drops a timed-out SDK init and leaves the game lifecycle operational', async () => {
    const { sdk } = createSdk();
    sdk.init.mockImplementation(() => new Promise(() => undefined));
    const lifecycle = new CrazyGamesPlatformLifecycle(
      new CrazyGamesAudioService(createAudio()), async () => sdk, 5
    );

    await lifecycle.init();
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 10));
    lifecycle.onGameReady();
    lifecycle.onGameStart();
    expect(lifecycle.getSdk()).toBeNull();
    expect(sdk.game.loadingStart).not.toHaveBeenCalled();
  });
});
