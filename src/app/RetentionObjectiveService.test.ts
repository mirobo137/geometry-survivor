import { describe, expect, it } from 'vitest';
import { RetentionObjectiveService, type RetentionClaimLock } from './RetentionObjectiveService';
import { LocalSaveStore } from '../platform/local/LocalSaveStore';
import { createDefaultSaveData, MAX_NOVA, migrateSaveData, type StorageAdapter } from '../platform/save/SaveStore';
import { recordRetentionRun, getRetentionObjectiveProgress } from '../content/retention/RetentionDefinitions';

class Storage implements StorageAdapter {
  raw: string | null = null;
  fail = false;
  getItem() { return this.raw; }
  setItem(_key: string, value: string) { if (this.fail) throw new Error('quota'); this.raw = value; }
  removeItem() { this.raw = null; }
}
const lock: RetentionClaimLock = work => work();
const setup = () => {
  const storage = new Storage();
  const store = new LocalSaveStore(storage);
  const base = createDefaultSaveData();
  const completed = recordRetentionRun(base.retention, { outcome: 'victory', kills: 100, elapsedSeconds: 300,
    route: 'radial', overdriveStages: 0, bossDefeats: { 'core-sentinel': 1 } });
  store.save({ ...base, retention: completed.progress });
  return { storage, store, service: new RetentionObjectiveService(store, lock) };
};
describe('manual logbook rewards', () => {
  it('leaves the wallet unchanged until claimed and persists next rank without a second payment', async () => {
    const { service, store, storage } = setup();
    expect(store.load().wallet.nova).toBe(0);
    expect((await service.claim('first-flight')).status).toBe('claimed');
    expect(store.load().wallet.nova).toBe(50);
    const reloaded = new RetentionObjectiveService(new LocalSaveStore(storage), lock);
    expect((await reloaded.claim('first-flight')).status).toBe('not-ready');
    expect(getRetentionObjectiveProgress(reloaded.snapshot().progress, 'first-flight').rank).toBe(2);
    expect(store.load().wallet.nova).toBe(50);
  });
  it('keeps a prize pending on quota failure and retries exactly once', async () => {
    const { service, store, storage } = setup();
    storage.fail = true;
    expect((await service.claim('hundred-kills')).status).toBe('storage-error');
    expect(store.load().wallet.nova).toBe(0);
    expect(getRetentionObjectiveProgress(store.load().retention, 'hundred-kills').completed).toBe(true);
    storage.fail = false;
    expect((await service.claim('hundred-kills')).status).toBe('claimed');
    expect((await service.claim('hundred-kills')).status).toBe('not-ready');
    expect(store.load().wallet.nova).toBe(50);
  });
  it('does not consume an offer if there is no room for its complete reward', async () => {
    const { service, store } = setup();
    store.save({ ...store.load(), wallet: { nova: MAX_NOVA - 1 } });
    expect((await service.claim('first-flight')).status).toBe('wallet-full');
    expect(getRetentionObjectiveProgress(store.load().retention, 'first-flight').completed).toBe(true);
  });
  it('rejects double clicks and shared-lock concurrent claims from two tabs', async () => {
    const { store, storage } = setup();
    let busy = false;
    const shared: RetentionClaimLock = async work => {
      if (busy) return null;
      busy = true;
      try { return await work(); } finally { busy = false; }
    };
    const a = new RetentionObjectiveService(store, shared);
    const b = new RetentionObjectiveService(new LocalSaveStore(storage), shared);
    const outcomes = await Promise.all([a.claim('first-flight'), b.claim('first-flight'), a.claim('first-flight')]);
    expect(outcomes.map(result => result.status).sort()).toEqual(['busy', 'busy', 'claimed']);
    expect(store.load().wallet.nova).toBe(50);
  });
  it('migrates paid schema 12 goals without re-paying, preserving daily wheel and weekly claims', () => {
    const base = createDefaultSaveData();
    const migrated = migrateSaveData({ ...base, schemaVersion: 12, wallet: { nova: 999 }, dailyWheel: { ...base.dailyWheel, chancePercent: 14 },
      retention: { ...base.retention, runsCompleted: 50, totalKills: 900,
        completedObjectiveIds: ['first-flight', 'radial-clear'], weeklyClaimIds: ['rf1-20261005-core-duel'] } });
    expect(migrated.wallet.nova).toBe(999);
    expect(migrated.dailyWheel.chancePercent).toBe(14);
    expect(migrated.retention.weeklyClaimIds).toHaveLength(1);
    expect(getRetentionObjectiveProgress(migrated.retention, 'first-flight')).toMatchObject({ rank: 2, value: 0, completed: false });
    expect(getRetentionObjectiveProgress(migrated.retention, 'radial-clear').retired).toBe(true);
    expect(getRetentionObjectiveProgress(migrated.retention, 'hundred-kills').completed).toBe(true);
  });
});
