import { describe, expect, it, vi } from 'vitest';
import { DailyWheelService, type DailyWheelLock } from './DailyWheelService';
import { LocalSaveStore } from '../platform/local/LocalSaveStore';
import { createDefaultSaveData, MAX_NOVA, migrateSaveData, type StorageAdapter } from '../platform/save/SaveStore';
import { DAILY_WHEEL_PERIOD_MS } from '../content/retention/DailyWheelDefinitions';
import { getSeasonalReward, REWARD_WEEK_ANCHOR, REWARD_WEEK_MS } from '../content/retention/RewardCosmeticDefinitions';
import { ownsRewardCosmetic } from './RewardCosmeticOwnership';
import type { RewardedAdResult } from '../platform/Platform';

class Storage implements StorageAdapter {
  raw: string | null = null;
  writes = 0;
  failAt = Infinity;
  getItem(): string | null { return this.raw; }
  setItem(_key: string, value: string): void {
    if (++this.writes >= this.failAt) throw new Error('quota');
    this.raw = value;
  }
  removeItem(): void { this.raw = null; }
}
const lock: DailyWheelLock = work => work();
const setup = (sample = 0) => {
  const storage = new Storage();
  const store = new LocalSaveStore(storage);
  let time = Date.UTC(2026, 9, 5);
  const video = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
  const random = vi.fn(() => sample);
  const service = new DailyWheelService(store, video, lock, () => time, random);
  return { storage, store, service, video, random, advance: (ms: number) => { time += ms; } };
};

describe('DailyWheelService', () => {
  it('saves a single free prize before returning and survives reloads without re-awarding it', async () => {
    const { service, store, storage, video } = setup();
    expect((await service.spin('free')).status).toBe('rewarded');
    expect(store.load().wallet.nova).toBe(40);
    expect(store.load().dailyWheel.lastReceipt?.nova).toBe(40);
    expect(store.load().dailyWheel.chancePercent).toBe(2);
    expect((await service.spin('free')).status).toBe('cooldown');
    const fresh = new DailyWheelService(new LocalSaveStore(storage), video, lock, () => Date.UTC(2026, 9, 5) + 1, () => 0.999);
    expect((await fresh.spin('free')).status).toBe('cooldown');
    expect(fresh.snapshot().progress.chancePercent).toBe(2);
    expect(store.load().wallet.nova).toBe(40);
  });
  it('unlocks the exclusive without auto-equipping, then substitutes 500 NOVA on future gold slots', async () => {
    const { service, store, advance } = setup(0.999);
    const selected = store.load().skins.selected;
    const first = await service.spin('free');
    expect(first).toMatchObject({ status: 'rewarded', receipt: { skin: 'solstice', nova: 0 } });
    expect(store.load().skins.selected).toBe(selected);
    advance(DAILY_WHEEL_PERIOD_MS);
    expect(await service.spin('free')).toMatchObject({ status: 'rewarded', receipt: { skin: null, nova: 500 } });
    expect(store.load().skins.unlocked.filter(id => id === 'solstice')).toHaveLength(1);
  });
  it.each(['dismissed', 'error', 'unavailable'] as const)('does not consume an extra or award NOVA for %s video', async status => {
    const { service, store, video, random } = setup();
    await service.spin('free');
    video.mockResolvedValue(status);
    expect(await service.spin('video')).toEqual({ status });
    expect(store.load().dailyWheel.videoClaimed).toBe(false);
    expect(store.load().dailyWheel.chancePercent).toBe(2);
    expect(store.load().wallet.nova).toBe(40);
    expect(random).toHaveBeenCalledTimes(1);
  });
  it('requires a free spin and successful video, then can grant the exclusive on the extra', async () => {
    const { service, store, video, random, advance } = setup();
    expect((await service.spin('video')).status).toBe('free-first');
    await service.spin('free');
    random.mockReturnValue(0.999);
    expect(await service.spin('video')).toMatchObject({ status: 'rewarded', receipt: { nova: 0, skin: 'solstice' } });
    expect((await service.spin('video')).status).toBe('cooldown');
    expect(video).toHaveBeenCalledTimes(1);
    expect(store.load().skins.unlocked).toContain('solstice');
    expect(store.load().dailyWheel.chancePercent).toBe(3);
    advance(DAILY_WHEEL_PERIOD_MS);
    expect((await service.spin('video')).status).toBe('free-first');
    await service.spin('free');
    expect(store.load().dailyWheel.videoClaimed).toBe(false);
    expect(store.load().dailyWheel.chancePercent).toBe(4);
  });
  it('retries the same pre-drawn video reward after a storage failure without replaying the video', async () => {
    const { service, store, storage, video, random } = setup();
    await service.spin('free');
    storage.failAt = storage.writes + 2; // Preflight succeeds, prize write fails.
    expect((await service.spin('video')).status).toBe('storage-error');
    expect(service.snapshot().pendingReward).toBe(true);
    expect(store.load().dailyWheel.chancePercent).toBe(2);
    expect(store.load().wallet.nova).toBe(40);
    storage.failAt = Infinity;
    expect(await service.spin('free')).toMatchObject({ status: 'rewarded', receipt: { kind: 'video', nova: 40 } });
    expect(store.load().wallet.nova).toBe(80);
    expect(store.load().dailyWheel.chancePercent).toBe(3);
    expect(video).toHaveBeenCalledTimes(1);
    expect(random).toHaveBeenCalledTimes(2);
  });
  it('fails closed before the video if durable storage is blocked', async () => {
    const { service, storage, video } = setup();
    storage.failAt = 1;
    expect((await service.spin('free')).status).toBe('storage-error');
    expect(video).not.toHaveBeenCalled();
  });
  it('prevents parallel spins across two service instances sharing a browser lock', async () => {
    const { storage, store } = setup();
    let busy = false;
    const shared: DailyWheelLock = async work => {
      if (busy) return { status: 'busy' };
      busy = true;
      try { return await work(); } finally { busy = false; }
    };
    const a = new DailyWheelService(store, async () => 'rewarded', shared, () => 1_800_000_000_000, () => 0);
    const b = new DailyWheelService(new LocalSaveStore(storage), async () => 'rewarded', shared, () => 1_800_000_000_000, () => 0);
    const results = await Promise.all([a.spin('free'), b.spin('free'), a.spin('free')]);
    expect(results.map(result => result.status).sort()).toEqual(['busy', 'busy', 'rewarded']);
    expect(store.load().wallet.nova).toBe(40);
  });
  it('recovers a future clock with a bounded 24h wait and no additional prize', async () => {
    const { service, store, advance } = setup();
    const base = createDefaultSaveData();
    store.save({ ...base, dailyWheel: { chancePercent: 15, cycleStartedAtMs: 1_900_000_000_000, videoClaimed: false, lastReceipt: null } });
    expect((await service.spin('free')).status).toBe('clock-error');
    expect(store.load().dailyWheel.cycleStartedAtMs).toBe(Date.UTC(2026, 9, 5));
    expect(store.load().dailyWheel.videoClaimed).toBe(true);
    expect(store.load().wallet.nova).toBe(0);
    expect(store.load().dailyWheel.chancePercent).toBe(15);
    advance(DAILY_WHEEL_PERIOD_MS);
    expect((await service.spin('free')).status).toBe('rewarded');
  });
  it('caps the wallet and migrates version 10 without losing existing progression', async () => {
    const { service, store } = setup(0.999);
    const old = { ...createDefaultSaveData(), schemaVersion: 10, wallet: { nova: MAX_NOVA - 2 }, skins: { selected: 'cyan', unlocked: ['cyan', 'solstice'] } };
    const migrated = migrateSaveData(old);
    expect(migrated.wallet.nova).toBe(MAX_NOVA - 2);
    expect(migrated.dailyWheel.cycleStartedAtMs).toBe(0);
    store.save(migrated);
    expect(await service.spin('free')).toMatchObject({ status: 'rewarded', receipt: { nova: 2 } });
    expect(store.load().wallet.nova).toBe(MAX_NOVA);
  });
  it('shares increasing odds between both spins and caps them permanently at 20%', async () => {
    const { service, store, random, advance } = setup(0.985);
    expect(await service.spin('free')).toMatchObject({ receipt: { skin: null } }); // 1% misses.
    expect(await service.spin('video')).toMatchObject({ receipt: { skin: 'solstice' } }); // 2% wins.
    random.mockReturnValue(0);
    for (let day = 0; day < 15; day++) {
      advance(DAILY_WHEEL_PERIOD_MS);
      await service.spin('free');
      await service.spin('video');
    }
    expect(store.load().dailyWheel.chancePercent).toBe(20);
  });
  it('awards, persists and substitutes duplicates for every seasonal family on both kinds of spin', async () => {
    for (const kind of ['free', 'video'] as const) {
      for (let week = 0; week < 15; week++) {
        const store = new LocalSaveStore(new Storage());
        let time = REWARD_WEEK_ANCHOR + week*REWARD_WEEK_MS;
        const reward = getSeasonalReward('daily-wheel', time);
        let sample = kind === 'video' ? 0 : 0.999;
        const service = new DailyWheelService(store, async () => 'rewarded', lock, () => time, () => sample);
        if (kind === 'video') { await service.spin('free'); sample = 0.999; }
        expect(await service.spin(kind)).toMatchObject({ status: 'rewarded', receipt: { skin: reward.id, rewardId: reward.id, nova: 0 } });
        expect(ownsRewardCosmetic(store.load(), reward.id)).toBe(true);
        expect(store.load().dailyWheel.lastReceipt?.skin).toBe(reward.id);
        time += DAILY_WHEEL_PERIOD_MS;
        expect(await service.spin('free')).toMatchObject({ receipt: { skin: null, nova: 500 } });
      }
    }
  });
  it('keeps the offered cosmetic when a video and a pending save cross a weekly boundary', async () => {
    const storage = new Storage();
    const store = new LocalSaveStore(storage);
    let time = REWARD_WEEK_ANCHOR + REWARD_WEEK_MS - 60_000;
    const offered = getSeasonalReward('daily-wheel', time);
    let sample = 0;
    const service = new DailyWheelService(store, async () => { time += 120_000; return 'rewarded'; }, lock, () => time, () => sample);
    await service.spin('free');
    sample = 0.999;
    storage.failAt = storage.writes + 2;
    expect(await service.spin('video')).toEqual({ status: 'storage-error' });
    expect(service.snapshot().rewardId).toBe(offered.id);
    storage.failAt = Infinity;
    expect(await service.spin('free')).toMatchObject({ receipt: { skin: offered.id, rewardId: offered.id, kind: 'video' } });
    expect(ownsRewardCosmetic(store.load(), offered.id)).toBe(true);
    expect(ownsRewardCosmetic(store.load(), getSeasonalReward('daily-wheel', time).id)).toBe(false);
  });
  it('migrates schema 11 preserving the active cycle, prizes and wallet', () => {
    const base = createDefaultSaveData();
    const migrated = migrateSaveData({ ...base, schemaVersion: 11, wallet: { nova: 700 }, dailyWheel: {
      cycleStartedAtMs: 1_800_000_000_000, videoClaimed: true, lastReceipt: {
        id: 'old-video', kind: 'video', slot: 10, skin: null, nova: 500,
        cycleStartedAtMs: 1_800_000_000_000, claimedAtMs: 1_800_000_000_001
      }
    } });
    expect(migrated.dailyWheel).toMatchObject({ chancePercent: 1, videoClaimed: true, lastReceipt: { id: 'old-video', nova: 500 } });
    expect(migrated.wallet.nova).toBe(700);
    expect(migrated.schemaVersion).toBe(13);
  });
});
