import { claimRetentionObjective, type RetentionObjectiveId, type RetentionClaimResult } from '../content/retention/RetentionDefinitions';
import { MAX_NOVA, type SaveStore } from '../platform/save/SaveStore';

export type RetentionClaimLock = (work: () => Promise<RetentionClaimResult>) => Promise<RetentionClaimResult | null>;
const browserLock: RetentionClaimLock = async work => {
  if (typeof navigator === 'undefined' || !navigator.locks) return null;
  return navigator.locks.request('geometry-survivor:logbook-claim', { ifAvailable: true }, lock => lock ? work() : null);
};

/** Manual payment only, with a bounded offer and one durable wallet transaction. */
export class RetentionObjectiveService {
  private busy = false;
  constructor(private readonly store: SaveStore, private readonly lock: RetentionClaimLock = browserLock) {}
  snapshot() {
    const saved = this.store.load();
    return { progress: saved.retention, walletNova: saved.wallet.nova };
  }

  async claim(id: RetentionObjectiveId): Promise<RetentionClaimResult> {
    const snapshot = (status: RetentionClaimResult['status']): RetentionClaimResult => {
      const saved = this.store.load();
      return { status, progress: saved.retention, walletNova: saved.wallet.nova };
    };
    if (this.busy) return snapshot('busy');
    if (this.lock === browserLock && (typeof navigator === 'undefined' || !navigator.locks)) return snapshot('unavailable');
    this.busy = true;
    try {
      const result = await this.lock(async () => {
        const saved = this.store.load();
        const claim = claimRetentionObjective(saved.retention, id);
        if (!claim) return snapshot('not-ready');
        if (saved.wallet.nova + claim.rewardNova > MAX_NOVA) return snapshot('wallet-full');
        const candidate = { ...saved, wallet: { nova: saved.wallet.nova + claim.rewardNova }, retention: claim.progress };
        if (!this.store.saveDurably?.(candidate)) return snapshot('storage-error');
        return snapshot('claimed');
      });
      return result ?? snapshot('busy');
    } catch {
      return snapshot('storage-error');
    } finally { this.busy = false; }
  }
}
