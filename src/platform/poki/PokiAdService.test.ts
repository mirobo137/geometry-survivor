import { describe, expect, it, vi } from 'vitest';
import type { AudioService } from '../../audio/AudioService';
import type { PokiSdk } from './PokiSdk';
import { PokiAdService } from './PokiAdService';

const createAudio = () => ({
  configure: vi.fn(), unlock: vi.fn(async () => undefined), pause: vi.fn(), resume: vi.fn(),
  startMusic: vi.fn(), stopMusic: vi.fn(), playCue: vi.fn(), shutdown: vi.fn()
}) satisfies AudioService;

const createSdk = (rewardedBreak: PokiSdk['rewardedBreak']) => ({
  init: vi.fn(async () => undefined),
  gameLoadingFinished: vi.fn(),
  gameplayStart: vi.fn(),
  gameplayStop: vi.fn(),
  rewardedBreak
}) satisfies PokiSdk;

describe('PokiAdService', () => {
  it('pauses audio during an opted-in video and reports Poki success', async () => {
    const audio = createAudio();
    const sdk = createSdk(vi.fn(async (onStarted) => {
      onStarted?.();
      expect(audio.pause).toHaveBeenCalled();
      return true;
    }));
    const ads = new PokiAdService(() => sdk, audio);

    await expect(ads.isRewardedAvailable('daily-wheel-nova')).resolves.toBe(true);
    await expect(ads.showRewarded('daily-wheel-nova')).resolves.toBe('rewarded');
    expect(sdk.rewardedBreak).toHaveBeenCalledTimes(1);
    expect(audio.resume).toHaveBeenCalledTimes(1);
  });

  it('never grants a reward when Poki did not show/complete the rewarded video', async () => {
    const sdk = createSdk(vi.fn(async () => false));
    const ads = new PokiAdService(() => sdk, createAudio());
    await expect(ads.showRewarded('double-nova')).resolves.toBe('unavailable');
  });

  it('fails closed when unavailable, thrown, or timed out and restores audio', async () => {
    const audio = createAudio();
    const unavailable = new PokiAdService(() => null, audio, 20);
    await expect(unavailable.isRewardedAvailable('reroll')).resolves.toBe(false);
    await expect(unavailable.showRewarded('reroll')).resolves.toBe('unavailable');

    const throwing = new PokiAdService(() => createSdk(vi.fn(async () => { throw new Error('SDK failure'); })), audio, 20);
    await expect(throwing.showRewarded('reroll')).resolves.toBe('error');

    const timeout = new PokiAdService(() => createSdk(vi.fn(() => new Promise<boolean>(() => undefined))), audio, 5);
    await expect(timeout.showRewarded('reroll')).resolves.toBe('error');
    expect(audio.resume).toHaveBeenCalledTimes(2);
  });
});
