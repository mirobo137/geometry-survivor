import type { AdService, RewardedAdResult, RewardedPlacement } from './Platform';

/**
 * Protects platform adapters from overlapping requests and makes the reward
 * boundary deterministic for the app layer. A failed or dismissed request can
 * be retried; the app decides whether a successful placement is one-use.
 */
export class RewardedAdController {
  private nextToken = 0;
  private pendingToken: number | null = null;

  public constructor(private readonly service: AdService) {}

  public get isPending(): boolean {
    return this.pendingToken !== null;
  }

  public async isAvailable(placement: RewardedPlacement): Promise<boolean> {
    if (this.isPending) return false;
    try {
      return await this.service.isRewardedAvailable(placement);
    } catch {
      return false;
    }
  }

  public async request(placement: RewardedPlacement): Promise<RewardedAdResult> {
    if (this.isPending) return 'error';
    const token = ++this.nextToken;
    this.pendingToken = token;
    try {
      if (!(await this.service.isRewardedAvailable(placement))) return 'unavailable';
      const result = await this.service.showRewarded(placement);
      // The token is cleared only in finally. A platform callback that tries
      // to resolve this request again cannot create another app request.
      return result;
    } catch {
      return 'error';
    } finally {
      if (this.pendingToken === token) this.pendingToken = null;
    }
  }
}
