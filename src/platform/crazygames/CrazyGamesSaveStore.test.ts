import { describe, expect, it, vi } from 'vitest';
import { createDefaultSaveData, SAVE_STORAGE_KEY, type StorageAdapter } from '../save/SaveStore';
import { CrazyGamesSaveStore, CRAZYGAMES_SAVE_MIGRATION_KEY } from './CrazyGamesSaveStore';

class MemoryStorage implements StorageAdapter {
  public readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('CrazyGamesSaveStore', () => {
  it('migrates an existing local save once, only when SDK.data has no save', () => {
    const local = new MemoryStorage();
    const portal = new MemoryStorage();
    const legacy = { ...createDefaultSaveData(), wallet: { nova: 321 } };
    local.setItem(SAVE_STORAGE_KEY, JSON.stringify(legacy));

    const firstSession = new CrazyGamesSaveStore();
    expect(firstSession.prepare(portal, local)).toBe(true);
    expect(firstSession.load().wallet.nova).toBe(321);
    expect(JSON.parse(portal.getItem(SAVE_STORAGE_KEY) ?? 'null').wallet.nova).toBe(321);
    expect(portal.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY)).toBe('v1');

    local.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...legacy, wallet: { nova: 999 } }));
    const nextSession = new CrazyGamesSaveStore();
    expect(nextSession.prepare(portal, local)).toBe(true);
    expect(nextSession.load().wallet.nova).toBe(321);
  });

  it('prefers an existing portal save and never consults stale browser data', () => {
    const portal = new MemoryStorage();
    const remote = { ...createDefaultSaveData(), wallet: { nova: 456 } };
    portal.setItem(SAVE_STORAGE_KEY, JSON.stringify(remote));
    const local: StorageAdapter = {
      getItem: vi.fn(() => { throw new Error('must not read local'); }),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };

    const store = new CrazyGamesSaveStore();
    expect(store.prepare(portal, local)).toBe(true);
    expect(store.load().wallet.nova).toBe(456);
    expect(local.getItem).not.toHaveBeenCalled();
  });

  it('does not resurrect a stale local save after the user clears a portal profile', () => {
    const portal = new MemoryStorage();
    const local = new MemoryStorage();
    portal.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...createDefaultSaveData(), wallet: { nova: 456 } }));
    local.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...createDefaultSaveData(), wallet: { nova: 999 } }));

    const current = new CrazyGamesSaveStore();
    expect(current.prepare(portal, local)).toBe(true);
    expect(portal.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY)).toBe('v1');
    current.clear();

    const afterClear = new CrazyGamesSaveStore();
    expect(afterClear.prepare(portal, local)).toBe(true);
    expect(afterClear.load().wallet.nova).toBe(0);
    expect(portal.getItem(SAVE_STORAGE_KEY)).toBeNull();
  });

  it('keeps malformed or future portal saves read-only instead of overwriting with defaults', () => {
    for (const raw of ['{broken', JSON.stringify({ schemaVersion: 99, wallet: { nova: 900 } })]) {
      const portal = new MemoryStorage();
      const local = new MemoryStorage();
      portal.setItem(SAVE_STORAGE_KEY, raw);
      local.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...createDefaultSaveData(), wallet: { nova: 700 } }));

      const store = new CrazyGamesSaveStore();
      expect(store.prepare(portal, local)).toBe(false);
      expect(store.load().wallet.nova).toBe(0);
      expect(store.save({ ...createDefaultSaveData(), wallet: { nova: 12 } })).toBe(true);
      expect(portal.getItem(SAVE_STORAGE_KEY)).toBe(raw);
      expect(local.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    }
  });

  it('falls back to session memory when SDK.data cannot be read without touching local storage', () => {
    const portal = new MemoryStorage();
    const getItem = vi.fn(() => { throw new Error('dataModuleDisabled'); });
    const data: StorageAdapter = {
      getItem,
      setItem: (key, value) => portal.setItem(key, value),
      removeItem: key => portal.removeItem(key)
    };
    const local = new MemoryStorage();
    local.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...createDefaultSaveData(), wallet: { nova: 84 } }));

    const store = new CrazyGamesSaveStore();
    expect(store.prepare(data, local)).toBe(false);
    expect(store.load().wallet.nova).toBe(0);
    expect(store.save({ ...createDefaultSaveData(), wallet: { nova: 16 } })).toBe(true);
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(local.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    expect(portal.values.size).toBe(0);
  });

  it('does not enable SDK writes if a legacy migration cannot be verified', () => {
    const portal = new MemoryStorage();
    const setItem = vi.fn((key: string, value: string) => {
      if (key === SAVE_STORAGE_KEY) throw new Error('dataLimitExceeded');
      portal.setItem(key, value);
    });
    const data: StorageAdapter = {
      getItem: key => portal.getItem(key),
      setItem,
      removeItem: key => portal.removeItem(key)
    };
    const local = new MemoryStorage();
    local.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...createDefaultSaveData(), wallet: { nova: 23 } }));

    const store = new CrazyGamesSaveStore();
    expect(store.prepare(data, local)).toBe(false);
    expect(portal.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(portal.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY)).toBeNull();
    expect(local.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
  });

  it('retains the initial save if SDK reads fail later in the same session', () => {
    const portal = new MemoryStorage();
    const remote = { ...createDefaultSaveData(), wallet: { nova: 654 } };
    portal.setItem(SAVE_STORAGE_KEY, JSON.stringify(remote));
    let readsFail = false;
    const data = {
      getItem: (key: string) => {
        if (readsFail) throw new Error('transient SDK read failure');
        return portal.getItem(key);
      },
      setItem: (key: string, value: string) => portal.setItem(key, value),
      removeItem: (key: string) => portal.removeItem(key)
    } satisfies StorageAdapter;

    const store = new CrazyGamesSaveStore();
    expect(store.prepare(data, null)).toBe(true);
    readsFail = true;
    expect(store.load().wallet.nova).toBe(654);
    expect(store.save({ ...remote, wallet: { nova: 1 } })).toBe(true);
    expect(store.saveDurably({ ...remote, wallet: { nova: 1 } })).toBe(false);
    expect(portal.getItem(SAVE_STORAGE_KEY)).toContain('654');
  });

  it('keeps new progress in the session when a later SDK write fails', () => {
    const portal = new MemoryStorage();
    const remote = { ...createDefaultSaveData(), wallet: { nova: 654 } };
    portal.setItem(SAVE_STORAGE_KEY, JSON.stringify(remote));
    let writesFail = false;
    const data: StorageAdapter = {
      getItem: key => portal.getItem(key),
      setItem: (key, value) => {
        if (writesFail) throw new Error('dataLimitExceeded');
        portal.setItem(key, value);
      },
      removeItem: key => portal.removeItem(key)
    };

    const store = new CrazyGamesSaveStore();
    expect(store.prepare(data, null)).toBe(true);
    writesFail = true;
    expect(store.save({ ...remote, wallet: { nova: 42 } })).toBe(true);
    expect(store.load().wallet.nova).toBe(42);
    expect(portal.getItem(SAVE_STORAGE_KEY)).toContain('654');
  });

  it('starts a new portal profile when neither portal nor browser has a save', () => {
    const portal = new MemoryStorage();
    const store = new CrazyGamesSaveStore();

    expect(store.prepare(portal, new MemoryStorage())).toBe(true);
    expect(store.load().wallet.nova).toBe(0);
    expect(portal.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY)).toBe('v1');
    expect(store.save({ ...createDefaultSaveData(), wallet: { nova: 5 } })).toBe(true);
    expect(JSON.parse(portal.getItem(SAVE_STORAGE_KEY) ?? 'null').wallet.nova).toBe(5);
  });
});
