import {
  DAILY_WHEEL_SKIN, DAILY_WHEEL_MAX_CHANCE_PERCENT, dailyWheelAvailability, dailyWheelPrize, drawDailyWheelSlot,
  type DailyWheelKind, type DailyWheelReceipt, type DailyWheelResult, type DailyWheelSnapshot
} from '../content/retention/DailyWheelDefinitions';
import { MAX_NOVA, type SaveStore } from '../platform/save/SaveStore';
import type { RewardedAdResult } from '../platform/Platform';
import { getSeasonalReward } from '../content/retention/RewardCosmeticDefinitions';
import { ownsRewardCosmetic, unlockRewardCosmetic } from './RewardCosmeticOwnership';

export type DailyWheelLock = (work: () => Promise<DailyWheelResult>) => Promise<DailyWheelResult>;

/** Same-origin exclusivity across tabs. No financial/authoritative server claims. */
export const browserDailyWheelLock: DailyWheelLock = async work => {
  if (typeof navigator === 'undefined' || !navigator.locks) return { status: 'unavailable' };
  return navigator.locks.request('geometry-survivor:daily-wheel', { ifAvailable: true }, lock => (
    lock ? work() : { status: 'busy' as const }
  ));
};

export class DailyWheelService {
  private busy = false;
  private pending: DailyWheelReceipt | null = null;

  public constructor(
    private readonly store: SaveStore,
    private readonly requestVideo: () => Promise<RewardedAdResult>,
    private readonly lock: DailyWheelLock = browserDailyWheelLock,
    private readonly now: () => number = Date.now,
    private readonly random: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0x1_0000_0000
  ) {}

  public snapshot(): DailyWheelSnapshot {
    const data = this.store.load();
    const rewardId = this.pending?.rewardId ?? getSeasonalReward('daily-wheel', this.now()).id;
    return {
      rewardId, progress: data.dailyWheel, skinOwned: ownsRewardCosmetic(data, rewardId),
      walletNova: data.wallet.nova, pendingReward: this.pending !== null,
      supported: this.lock !== browserDailyWheelLock || (typeof navigator !== 'undefined' && !!navigator.locks)
    };
  }

  public async spin(kind: DailyWheelKind): Promise<DailyWheelResult> {
    if (this.busy) return { status: 'busy' };
    this.busy = true;
    try {
      return await this.lock(async () => {
        if (this.pending) return this.persistPending();
        const saved = this.store.load();
        const available = dailyWheelAvailability(saved.dailyWheel, this.now());
        const offeredRewardId = getSeasonalReward('daily-wheel', this.now()).id;
        if (available.clockAhead) {
          // Recover from a corrected device clock without locking the player
          // out for months or granting an immediate duplicate daily prize.
          const time = this.now();
          if (Number.isFinite(time) && time > 0 && time < 8_639_999_913_600_000) {
            if (!this.store.saveDurably?.({ ...saved, dailyWheel: {
              ...saved.dailyWheel, cycleStartedAtMs: time, videoClaimed: true
            } })) return { status: 'storage-error' };
          }
          return { status: 'clock-error' };
        }
        if (kind === 'free' && !available.free) return { status: 'cooldown' };
        if (kind === 'video' && !available.video) return { status: available.free ? 'free-first' : 'cooldown' };
        // Do not send the player through a video if storage is already unavailable.
        if (!this.store.saveDurably?.(saved)) return { status: 'storage-error' };
        const cycle = saved.dailyWheel.cycleStartedAtMs;
        if (kind === 'video') {
          const result = await this.requestVideo();
          if (result !== 'rewarded') return { status: result };
          const current = this.store.load().dailyWheel;
          if (current.cycleStartedAtMs !== cycle || current.videoClaimed) return { status: 'cooldown' };
        }
        const current = this.store.load();
        const time = this.now();
        if (dailyWheelAvailability(current.dailyWheel, time).clockAhead) return { status: 'clock-error' };
        const slot = drawDailyWheelSlot(this.random(), current.dailyWheel.chancePercent);
        const rewardId = offeredRewardId;
        const prize = dailyWheelPrize(slot, kind, ownsRewardCosmetic(current, rewardId), rewardId);
        this.pending = {
          id: crypto.randomUUID(), cycleStartedAtMs: kind === 'free' ? time : cycle,
          claimedAtMs: time, kind, slot, rewardId, ...prize
        };
        return this.persistPending();
      });
    } catch {
      return { status: 'error' };
    } finally {
      this.busy = false;
    }
  }

  private persistPending(): DailyWheelResult {
    const pending = this.pending!;
    const current = this.store.load();
    // A write may have succeeded even if the subsequent read threw.
    if (current.dailyWheel.lastReceipt?.id === pending.id) {
      this.pending = null;
      return { status: 'rewarded', receipt: current.dailyWheel.lastReceipt };
    }
    const superseded = pending.kind === 'free'
      ? current.dailyWheel.cycleStartedAtMs >= pending.cycleStartedAtMs
      : current.dailyWheel.cycleStartedAtMs !== pending.cycleStartedAtMs || current.dailyWheel.videoClaimed;
    if (superseded) { this.pending = null; return { status: 'cooldown' }; }
    const rewardId = pending.rewardId ?? pending.skin ?? DAILY_WHEEL_SKIN;
    const prize = dailyWheelPrize(pending.slot, pending.kind, ownsRewardCosmetic(current, rewardId), rewardId);
    const receipt: DailyWheelReceipt = { ...pending, skin: prize.skin, nova: Math.min(prize.nova, MAX_NOVA - current.wallet.nova) };
    const next = {
      ...(receipt.skin ? unlockRewardCosmetic(current, receipt.skin) : current),
      wallet: { nova: current.wallet.nova + receipt.nova },
      dailyWheel: {
        chancePercent: Math.min(DAILY_WHEEL_MAX_CHANCE_PERCENT, current.dailyWheel.chancePercent + 1),
        cycleStartedAtMs: receipt.cycleStartedAtMs,
        videoClaimed: receipt.kind === 'video', lastReceipt: receipt
      }
    };
    if (!this.store.saveDurably?.(next)) return { status: 'storage-error' };
    this.pending = null;
    return { status: 'rewarded', receipt };
  }
}
