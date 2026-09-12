import { describe, expect, it } from 'vitest';
import {
  createDefaultSaveData,
  migrateSaveData,
  mergeBestRun,
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
  it('round-trips the free Nacre background without changing wallet or other unlocks', () => {
    const store = new LocalSaveStore(new MemoryStorage());
    const defaults = createDefaultSaveData();
    store.save({ ...defaults, backgrounds: { selected: 'nacre-orbit', unlocked: ['deep-space', 'nacre-orbit'] } });
    expect(store.load().backgrounds.selected).toBe('nacre-orbit');
    expect(store.load().wallet.nova).toBe(0);
    expect(store.load().skins).toEqual(defaults.skins);
  });
  it('returns safe defaults and round-trips a bounded versioned payload', () => {
    const storage = new MemoryStorage();
    const store = new LocalSaveStore(storage);
    const defaults = createDefaultSaveData();

    expect(store.load()).toEqual(defaults);
    expect(store.save({
      ...defaults,
      settings: { ...defaults.settings, sfxVolume: 0.35, quality: 'low' },
      best: { timeSeconds: 302.5, score: 8400 },
      tutorialSeen: true,
      skins: defaults.skins,
      cannonSkins: defaults.cannonSkins,
      backgrounds: defaults.backgrounds,
      wallet: { nova: 425 },
      metaUpgrades: { levels: { weapon_damage: 2 } },
      unlockedActs: ['radial']
    })).toBe(true);
    expect(storage.values.has(SAVE_STORAGE_KEY)).toBe(true);
    expect(store.load()).toEqual({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { ...defaults.settings, sfxVolume: 0.35, quality: 'low' },
      best: { timeSeconds: 302.5, score: 8400 },
      tutorialSeen: true,
      skins: defaults.skins,
      cannonSkins: defaults.cannonSkins,
      backgrounds: defaults.backgrounds,
      wallet: { nova: 425 },
      metaUpgrades: { levels: { weapon_damage: 2 } },
      unlockedActs: ['radial']
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
      tutorialSeen: true,
      skins: { selected: 'cyan', unlocked: ['cyan'] },
      cannonSkins: { selected: 'basic', unlocked: ['basic'] },
      backgrounds: { selected: 'deep-space', unlocked: ['deep-space'] },
      wallet: { nova: 0 },
      metaUpgrades: { levels: {} },
      unlockedActs: ['radial']
    });
  });

  it('conserva el nuevo esquema de arrastre relativo para dedos gruesos', () => {
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { controlScheme: 'relative-touch' }
    }).settings.controlScheme).toBe('relative-touch');
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { controlScheme: 'unknown' }
    }).settings.controlScheme).toBe('auto');
  });

  it('migrates campaign unlocks with Radial always available and no unknown acts', () => {
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      unlockedActs: ['angular', 'angular', 'unknown', 'radial']
    }).unlockedActs).toEqual(['radial', 'angular']);
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      unlockedActs: ['unknown']
    }).unlockedActs).toEqual(['radial']);
  });

  it('normalizes skin ownership and never equips a locked or unknown skin', () => {
    expect(migrateSaveData({
      schemaVersion: 1,
      skins: { selected: 'violet', unlocked: ['violet', 'violet', 'unknown'] }
    }).skins).toEqual({ selected: 'violet', unlocked: ['cyan', 'violet'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      skins: { selected: 'violet', unlocked: [] }
    }).skins).toEqual({ selected: 'cyan', unlocked: ['cyan'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      cannonSkins: { selected: 'rainbow', unlocked: ['rainbow', 'rainbow', 'unknown'] }
    }).cannonSkins).toEqual({ selected: 'rainbow', unlocked: ['basic', 'rainbow'] });
    expect(migrateSaveData({
      schemaVersion: 3,
      backgrounds: { selected: 'crystal-field', unlocked: ['crystal-field', 'crystal-field', 'unknown'] }
    }).backgrounds).toEqual({ selected: 'crystal-field', unlocked: ['deep-space', 'crystal-field'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      backgrounds: { selected: 'unknown', unlocked: [] }
    }).backgrounds).toEqual({ selected: 'deep-space', unlocked: ['deep-space'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      wallet: { nova: 12_345.9 },
      metaUpgrades: { levels: { weapon_damage: 99, weapon_cadence: -2, unknown: 4 } }
    })).toMatchObject({
      wallet: { nova: 12_345 },
      metaUpgrades: { levels: { weapon_damage: 5 } }
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

  it('merges a run result without allowing negative or lower best values', () => {
    expect(mergeBestRun(
      { timeSeconds: 120, score: 20 },
      { timeSeconds: 90, score: 31 }
    )).toEqual({ timeSeconds: 120, score: 31 });
    expect(mergeBestRun(
      { timeSeconds: 0, score: 0 },
      { timeSeconds: -10, score: -4 }
    )).toEqual({ timeSeconds: 0, score: 0 });
  });
});
