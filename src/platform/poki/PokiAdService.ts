import type { AudioService } from '../../audio/AudioService';
import type { AdService, RewardedAdResult, RewardedPlacement } from '../Platform';
import type { PokiSdk } from './PokiSdk';

const DEFAULT_REWARDED_TIMEOUT_MS = 45_000;

const awaitWithTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => (
  new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => reject(new Error('Poki rewarded ad timed out')), timeoutMs);
    promise.then(
      (value) => { globalThis.clearTimeout(timeout); resolve(value); },
      (error: unknown) => { globalThis.clearTimeout(timeout); reject(error); }
    );
  })
);

/** Bridges explicit in-game reward choices to Poki's rewardedBreak contract. */
export class PokiAdService implements AdService {
  private pending = false;

  public constructor(
    private readonly getSdk: () => PokiSdk | null,
    private readonly audio: AudioService,
    private readonly timeoutMs = DEFAULT_REWARDED_TIMEOUT_MS
  ) {}

  public async isRewardedAvailable(_placement: RewardedPlacement): Promise<boolean> {
    return !this.pending && typeof this.getSdk()?.rewardedBreak === 'function';
  }

  public async showRewarded(_placement: RewardedPlacement): Promise<RewardedAdResult> {
    const sdk = this.getSdk();
    if (!sdk || typeof sdk.rewardedBreak !== 'function') return 'unavailable';
    if (this.pending) return 'error';

    this.pending = true;
    try {
      // Every current reward placement already opens over a paused run or menu.
      // Pause audio as well, while leaving the SDK's own ad UI outside our DOM lock.
      this.audio.pause();
      const watched = await awaitWithTimeout(
        sdk.rewardedBreak(() => {
          // Poki may not invoke its optional start hook for every ad.
          this.audio.pause();
        }),
        this.timeoutMs
      );
      return watched ? 'rewarded' : 'unavailable';
    } catch {
      return 'error';
    } finally {
      try {
        this.audio.resume();
      } catch {
        // Audio recovery is best-effort and must not strand the reward request.
      }
      this.pending = false;
    }
  }
}
