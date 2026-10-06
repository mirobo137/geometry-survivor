import type { CrazyGamesAudioService } from './CrazyGamesAudioService';
import type { CrazyGamesAdError, CrazyGamesSdk } from './CrazyGamesSdk';
import type { AdService, RewardedAdResult, RewardedPlacement } from '../Platform';

const DEFAULT_REWARDED_TIMEOUT_MS = 45_000;
const ADBLOCK_CHECK_TIMEOUT_MS = 1_500;
const UNAVAILABLE_AD_CODES = new Set(['unfilled', 'adblock', 'adCooldown', 'adsDisabledBasicLaunch']);

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => (
  new Promise((resolve) => {
    let settled = false;
    const timeout = globalThis.setTimeout(() => finish(fallback), timeoutMs);
    const finish = (value: T): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      resolve(value);
    };
    promise.then(finish, () => finish(fallback));
  })
);

const getErrorCode = (error: unknown): string | undefined => (
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as CrazyGamesAdError).code)
    : undefined
);

const mapAdError = (error: unknown): RewardedAdResult => (
  UNAVAILABLE_AD_CODES.has(getErrorCode(error) ?? '') ? 'unavailable' : 'error'
);

/** Adapts CrazyGames' callback-only v3 rewarded API to the shared promise port. */
export class CrazyGamesAdService implements AdService {
  private pending = false;
  private adblockCheck: Promise<boolean> | null = null;

  public constructor(
    private readonly getSdk: () => CrazyGamesSdk | null,
    private readonly audio: CrazyGamesAudioService,
    private readonly timeoutMs = DEFAULT_REWARDED_TIMEOUT_MS,
    private readonly allowPortalRewardedAds = false
  ) {}

  public async isRewardedAvailable(_placement: RewardedPlacement): Promise<boolean> {
    const sdk = this.getSupportedSdk();
    if (!sdk || this.pending) return false;

    if (typeof sdk.ad.hasAdblock === 'function') {
      this.adblockCheck ??= withTimeout(
        Promise.resolve().then(() => sdk.ad.hasAdblock?.() ?? false),
        ADBLOCK_CHECK_TIMEOUT_MS,
        false
      );
      if (await this.adblockCheck) return false;
    }
    return !this.pending && this.getSupportedSdk() === sdk;
  }

  public async showRewarded(_placement: RewardedPlacement): Promise<RewardedAdResult> {
    const sdk = this.getSupportedSdk();
    if (!sdk) return 'unavailable';
    if (this.pending) return 'error';

    this.pending = true;
    return new Promise((resolve) => {
      let settled = false;
      const timeout = globalThis.setTimeout(() => finish('error'), this.timeoutMs);
      const finish = (result: RewardedAdResult): void => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timeout);
        this.setAdMuted(false);
        this.pending = false;
        resolve(result);
      };

      try {
        const request = sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            if (!settled) this.setAdMuted(true);
          },
          // CrazyGames explicitly says rewarded callbacks are granted only
          // after this completion signal, never on request/adStarted.
          adFinished: () => finish('rewarded'),
          adError: (error) => finish(mapAdError(error))
        });
        if (request && typeof request.then === 'function') {
          void request.catch(() => finish('error'));
        }
      } catch {
        finish('error');
      }
    });
  }

  private getSupportedSdk(): CrazyGamesSdk | null {
    const sdk = this.getSdk();
    if (!sdk || (sdk.environment !== 'local' && sdk.environment !== 'crazygames')) return null;
    // Local SDK mode displays its demo overlay. Actual portal ads stay off
    // until CrazyGames enables them beyond Basic Launch.
    if (sdk.environment === 'crazygames' && !this.allowPortalRewardedAds) return null;
    return typeof sdk.ad.requestAd === 'function' ? sdk : null;
  }

  private setAdMuted(muted: boolean): void {
    try {
      this.audio.setAdMuted(muted);
    } catch {
      // Audio restoration must not prevent the ad request from settling.
    }
  }
}
