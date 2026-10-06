import { describe, expect, it, vi } from 'vitest';
import type { PokiSdk } from './PokiSdk';
import { PokiPlatformLifecycle } from './PokiPlatformLifecycle';

const createSdk = () => ({
  init: vi.fn(async () => undefined),
  gameLoadingFinished: vi.fn(),
  gameplayStart: vi.fn(),
  gameplayStop: vi.fn(),
  rewardedBreak: vi.fn(async () => true)
}) satisfies PokiSdk;

const flushSdkInit = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('PokiPlatformLifecycle', () => {
  it('reports loading once and sends only real, ordered gameplay transitions', async () => {
    const sdk = createSdk();
    const lifecycle = new PokiPlatformLifecycle(async () => sdk);

    await lifecycle.init();
    lifecycle.onGameStart();
    await flushSdkInit();
    expect(sdk.gameLoadingFinished).not.toHaveBeenCalled();
    expect(sdk.gameplayStart).not.toHaveBeenCalled();

    lifecycle.onGameReady();
    lifecycle.onGameReady();
    lifecycle.onGameStart();
    lifecycle.onGamePause();
    lifecycle.onGamePause();
    lifecycle.onGameResume();
    lifecycle.onGameOver();

    expect(sdk.gameLoadingFinished).toHaveBeenCalledTimes(1);
    expect(sdk.gameplayStart).toHaveBeenCalledTimes(2);
    expect(sdk.gameplayStop).toHaveBeenCalledTimes(2);
  });

  it('continues without throwing when the SDK is missing or init rejects', async () => {
    const missing = new PokiPlatformLifecycle(async () => null);
    await expect(missing.init()).resolves.toBeUndefined();
    missing.onGameReady();
    missing.onGameStart();
    missing.onGamePause();

    const sdk = createSdk();
    sdk.init.mockRejectedValueOnce(new Error('blocked by browser'));
    const rejected = new PokiPlatformLifecycle(async () => sdk);
    await expect(rejected.init()).resolves.toBeUndefined();
    await flushSdkInit();
    rejected.onGameReady();
    rejected.onGameStart();
    expect(sdk.gameLoadingFinished).not.toHaveBeenCalled();
  });
});
