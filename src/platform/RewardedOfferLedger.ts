import type { RewardedAdResult, RewardedPlacement } from './Platform';

/**
 * Run-scoped idempotency for rewarded benefits. A failed request never burns
 * the offer, while a successful result is consumed exactly once.
 */
export class RewardedOfferLedger {
  private nextToken = 0;
  private readonly pending = new Map<RewardedPlacement, number>();
  private readonly consumed = new Set<RewardedPlacement>();

  public reset(): void {
    this.pending.clear();
    this.consumed.clear();
  }

  public canOffer(placement: RewardedPlacement): boolean {
    return !this.pending.has(placement) && !this.consumed.has(placement);
  }

  public begin(placement: RewardedPlacement): number | null {
    if (!this.canOffer(placement)) return null;
    const token = ++this.nextToken;
    this.pending.set(placement, token);
    return token;
  }

  public settle(placement: RewardedPlacement, token: number, result: RewardedAdResult): void {
    if (this.pending.get(placement) !== token) return;
    this.pending.delete(placement);
    if (result === 'rewarded') this.consumed.add(placement);
  }
}
