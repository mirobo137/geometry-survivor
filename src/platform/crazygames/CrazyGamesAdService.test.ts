import { describe, expect, it, vi } from 'vitest';
import type { AudioService } from '../../audio/AudioService';
import type { RewardedAdResult } from '../Platform';
import { CrazyGamesAdService } from './CrazyGamesAdService';
import { CrazyGamesAudioService } from './CrazyGamesAudioService';
import type { CrazyGamesAdCallbacks, CrazyGamesSdk } from './CrazyGamesSdk';

const createAudio = () => ({
  configure: vi.fn(), unlock: vi.fn(async () => undefined), pause: vi.fn(), resume: vi.fn(),
  startMusic: vi.fn(), stopMusic: vi.fn(), playCue: vi.fn(), shutdown: vi.fn()
}) satisfies AudioService;

const createSdk = (
  requestAd: CrazyGamesSdk['ad']['requestAd'] = vi.fn(),
  options: { environment?: CrazyGamesSdk['environment']; hasAdblock?: () => Promise<boolean> } = { environment: 'local' }
) => ({
  init: vi.fn(async () => undefined),
  environment: options.environment ?? 'crazygames',
  game: { gameplayStart: vi.fn(), gameplayStop: vi.fn() },
  ad: { requestAd: vi.fn(requestAd), hasAdblock: options.hasAdblock ?? vi.fn(async () => false) }
}) satisfies CrazyGamesSdk;

describe('CrazyGamesAdService', () => {
  it('grants only after adFinished and mutes audio only while an ad is active', async () => {
    const underlyingAudio = createAudio();
    const audio = new CrazyGamesAudioService(underlyingAudio);
    audio.configure({ musicVolume: 0.5, sfxVolume: 0.8, muted: false });
    let callbacks: CrazyGamesAdCallbacks | undefined;
    const sdk = createSdk((_type, supplied) => { callbacks = supplied; });
    const ads = new CrazyGamesAdService(() => sdk, audio);

    const result = ads.showRewarded('double-nova');
    expect(underlyingAudio.configure).not.toHaveBeenLastCalledWith({ musicVolume: 0.5, sfxVolume: 0.8, muted: true });
    callbacks?.adStarted?.();
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 0.5, sfxVolume: 0.8, muted: true });
    expect(sdk.ad.requestAd).toHaveBeenCalledWith('rewarded', expect.any(Object));
    callbacks?.adFinished?.();
    callbacks?.adFinished?.();
    callbacks?.adError?.({ code: 'unfilled', message: 'No ad available' });

    await expect(result).resolves.toBe('rewarded');
    expect(underlyingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 0.5, sfxVolume: 0.8, muted: false });
  });

  it.each([
    ['unfilled', 'unavailable'],
    ['adblock', 'unavailable'],
    ['adCooldown', 'unavailable'],
    ['adsDisabledBasicLaunch', 'unavailable'],
    ['other', 'error']
  ] as const)('does not grant on CrazyGames ad error %s', async (code, expected) => {
    const sdk = createSdk((_type, callbacks) => callbacks.adError?.({ code }));
    const ads = new CrazyGamesAdService(() => sdk, new CrazyGamesAudioService(createAudio()));
    await expect(ads.showRewarded('daily-wheel-nova')).resolves.toBe(expected satisfies RewardedAdResult);
  });

  it('checks SDK/adblock availability and skips unsupported environments', async () => {
    const blocked = createSdk(vi.fn(), { environment: 'local', hasAdblock: vi.fn(async () => true) });
    const blockedAds = new CrazyGamesAdService(() => blocked, new CrazyGamesAudioService(createAudio()));
    await expect(blockedAds.isRewardedAvailable('reroll')).resolves.toBe(false);
    expect(blocked.ad.requestAd).not.toHaveBeenCalled();

    const disabled = createSdk(vi.fn(), { environment: 'disabled' });
    const disabledAds = new CrazyGamesAdService(() => disabled, new CrazyGamesAudioService(createAudio()));
    await expect(disabledAds.isRewardedAvailable('reroll')).resolves.toBe(false);
    await expect(disabledAds.showRewarded('reroll')).resolves.toBe('unavailable');
  });

  it('keeps real portal rewarded offers gated until CrazyGames enables Full Launch ads', async () => {
    const portalSdk = createSdk(vi.fn(), { environment: 'crazygames' });
    const portalAds = new CrazyGamesAdService(() => portalSdk, new CrazyGamesAudioService(createAudio()));
    await expect(portalAds.isRewardedAvailable('daily-wheel-nova')).resolves.toBe(false);
    await expect(portalAds.showRewarded('daily-wheel-nova')).resolves.toBe('unavailable');
    expect(portalSdk.ad.requestAd).not.toHaveBeenCalled();

    const enabledPortalAds = new CrazyGamesAdService(
      () => portalSdk, new CrazyGamesAudioService(createAudio()), undefined, true
    );
    await expect(enabledPortalAds.isRewardedAvailable('daily-wheel-nova')).resolves.toBe(true);

    const localSdk = createSdk(vi.fn(), { environment: 'local' });
    const localDemoAds = new CrazyGamesAdService(() => localSdk, new CrazyGamesAudioService(createAudio()));
    await expect(localDemoAds.isRewardedAvailable('daily-wheel-nova')).resolves.toBe(true);
  });

  it('fails open when the SDK throws and does not let a timed-out late callback grant a reward', async () => {
    const throwing = createSdk(() => { throw new Error('request failed'); });
    const throwingAds = new CrazyGamesAdService(() => throwing, new CrazyGamesAudioService(createAudio()), 10);
    await expect(throwingAds.showRewarded('reroll')).resolves.toBe('error');

    let callbacks: CrazyGamesAdCallbacks | undefined;
    const pendingAudio = createAudio();
    const pendingAds = new CrazyGamesAdService(
      () => createSdk((_type, supplied) => { callbacks = supplied; }),
      new CrazyGamesAudioService(pendingAudio),
      5
    );
    const outcome = pendingAds.showRewarded('revive');
    callbacks?.adStarted?.();
    await expect(outcome).resolves.toBe('error');
    callbacks?.adStarted?.();
    callbacks?.adFinished?.();
    expect(pendingAudio.configure).toHaveBeenLastCalledWith({ musicVolume: 1, sfxVolume: 1, muted: false });
  });

  it('prevents overlapping rewarded requests', async () => {
    let callbacks: CrazyGamesAdCallbacks | undefined;
    const sdk = createSdk((_type, supplied) => { callbacks = supplied; });
    const ads = new CrazyGamesAdService(() => sdk, new CrazyGamesAudioService(createAudio()), 100);
    const first = ads.showRewarded('revive');
    await expect(ads.showRewarded('revive')).resolves.toBe('error');
    callbacks?.adFinished?.();
    await expect(first).resolves.toBe('rewarded');
  });
});

describe('CrazyGamesAudioService', () => {
  it('combines player mute, portal mute, and ad mute independently', () => {
    const delegate = createAudio();
    const audio = new CrazyGamesAudioService(delegate);
    audio.configure({ musicVolume: 0.3, sfxVolume: 0.6, muted: false });
    audio.setPortalMuted(true);
    audio.setAdMuted(true);
    audio.setPortalMuted(false);
    expect(delegate.configure).toHaveBeenLastCalledWith({ musicVolume: 0.3, sfxVolume: 0.6, muted: true });
    audio.setAdMuted(false);
    expect(delegate.configure).toHaveBeenLastCalledWith({ musicVolume: 0.3, sfxVolume: 0.6, muted: false });
    audio.configure({ musicVolume: 0.3, sfxVolume: 0.6, muted: true });
    audio.setPortalMuted(false);
    expect(delegate.configure).toHaveBeenLastCalledWith({ musicVolume: 0.3, sfxVolume: 0.6, muted: true });
  });
});
