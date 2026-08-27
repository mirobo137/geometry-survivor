import { describe, expect, it } from 'vitest';
import {
  createDefaultSaveData,
  migrateSaveData,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  type StorageAdapter
} from './SaveStore';
import { LocalSaveStore } from '../local/LocalSaveStore';

class MemoryStorage implements StorageAdapter {
  public readonly values = new Map<string, string>();
  public failWrites = false;

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('quota');
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('LocalSaveStore', () => {
  it('returns safe defaults and round-trips a bounded versioned payload', () => {
    const storage = new MemoryStorage();
    const store = new LocalSaveStore(storage);
    const defaults = createDefaultSaveData();

    expect(store.load()).toEqual(defaults);
    expect(store.save({
      ...defaults,
      settings: { ...defaults.settings, sfxVolume: 0.35, quality: 'low' },
      best: { timeSeconds: 302.5, score: 8400 },
      tutorialSeen: true
    })).toBe(true);
    expect(storage.values.has(SAVE_STORAGE_KEY)).toBe(true);
    expect(store.load()).toEqual({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { ...defaults.settings, sfxVolume: 0.35, quality: 'low' },
      best: { timeSeconds: 302.5, score: 8400 },
      tutorialSeen: true
    });
  });

  it('migrates legacy values and clamps unsafe settings', () => {
    expect(migrateSaveData({
      bestTimeSeconds: -10,
      bestScore: 14,
      settings: { musicVolume: 4, sfxVolume: -1, quality: 'unknown' },
      tutorialSeen: true
    })).toEqual({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: {
        musicVolume: 1,
        sfxVolume: 0,
        muted: false,
        controlScheme: 'auto',
        quality: 'medium'
      },
      best: { timeSeconds: 0, score: 14 },
      tutorialSeen: true
    });
  });

  it('uses memory fallback when persistent storage rejects writes', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const store = new LocalSaveStore(storage);
    const data = { ...createDefaultSaveData(), tutorialSeen: true };

    expect(store.save(data)).toBe(true);
    expect(store.load()).toEqual(data);
  });

  it('ignores malformed and future schemas instead of throwing', () => {
    const storage = new MemoryStorage();
    storage.values.set(SAVE_STORAGE_KEY, '{broken');
    const store = new LocalSaveStore(storage);
    expect(store.load()).toEqual(createDefaultSaveData());

    storage.values.set(SAVE_STORAGE_KEY, JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION + 1 }));
    expect(store.load()).toEqual(createDefaultSaveData());
  });
});
