import { describe, expect, it } from 'vitest';
import {
  createDefaultSaveData,
  migrateSaveData,
  mergeBestRun,
  mergeOverdriveRecord,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  unlockOverdrive,
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
  it('round-trips the new ship, cannon and background IDs without changing legacy ownership', () => {
    const store = new LocalSaveStore(new MemoryStorage());
    const base = createDefaultSaveData();
    for (const selected of ['corsair', 'nautilus'] as const) {
      store.save({ ...base, skins: { selected, unlocked: [...base.skins.unlocked, 'corsair', 'nautilus'] },
        cannonSkins: { selected: 'gyre', unlocked: [...base.cannonSkins.unlocked, 'gyre', 'razor'] },
        backgrounds: { selected: 'leviathan-wake', unlocked: [...base.backgrounds.unlocked, 'silent-archive', 'lunar-fault', 'leviathan-wake'] } });
      const restored = store.load();
      expect(restored.skins.selected).toBe(selected);
      expect(restored.skins.unlocked).toEqual(expect.arrayContaining([...base.skins.unlocked]));
      expect(restored.cannonSkins.selected).toBe('gyre');
      expect(restored.cannonSkins.unlocked).toContain('razor');
      expect(restored.backgrounds.selected).toBe('leviathan-wake');
      expect(restored.backgrounds.unlocked).toEqual(expect.arrayContaining(['silent-archive', 'lunar-fault']));
    }
  });
  it('persists the free Ivory Spear skin without spending Nova or changing cannon choice', () => {
    const store = new LocalSaveStore(new MemoryStorage());
    const defaults = createDefaultSaveData();
    store.save({ ...defaults, wallet: { nova: 425 },
      skins: { selected: 'spearhead', unlocked: ['cyan', 'manta', 'spearhead'] } });
    expect(store.load().skins).toEqual({ selected: 'spearhead', unlocked: ['cyan', 'spearhead', 'manta'] });
    expect(store.load().wallet.nova).toBe(425);
    expect(store.load().cannonSkins).toEqual(defaults.cannonSkins);
  });
  it('round-trips the free Nacre background without changing wallet or other unlocks', () => {
    const store = new LocalSaveStore(new MemoryStorage());
    const defaults = createDefaultSaveData();
    store.save({ ...defaults, backgrounds: { selected: 'nacre-orbit', unlocked: ['deep-space', 'nacre-orbit'] } });
    expect(store.load().backgrounds.selected).toBe('nacre-orbit');
    expect(store.load().wallet.nova).toBe(0);
    expect(store.load().skins).toEqual(defaults.skins);
  });

  it('migrates schema 9 without discarding campaign data and starts the new logbook empty', () => {
    const migrated = migrateSaveData({
      schemaVersion: 9,
      best: { timeSeconds: 321, score: 9_876 },
      skins: { selected: 'manta', unlocked: ['cyan', 'spearhead', 'manta'] },
      wallet: { nova: 1_234 },
      overdrive: { unlocked: true, bestTotalTimeSeconds: 800, maxStages: 8, bestKills: 900 },
      lastSelectedRoute: 'overdrive'
    });

    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.best).toEqual({ timeSeconds: 321, score: 9_876 });
    expect(migrated.skins).toEqual({ selected: 'manta', unlocked: ['cyan', 'spearhead', 'manta'] });
    expect(migrated.wallet.nova).toBe(1_234);
    expect(migrated.overdrive.unlocked).toBe(true);
    expect(migrated.lastSelectedRoute).toBe('overdrive');
    expect(migrated.retention.runsCompleted).toBe(0);
    expect(migrated.retention.completedObjectiveIds).toEqual([]);
  });

  it('persists bounded retention progress and confirms prize writes by reading them back', () => {
    const storage = new MemoryStorage();
    const store = new LocalSaveStore(storage);
    const defaults = createDefaultSaveData();
    const awarded = {
      ...defaults,
      wallet: { nova: 250 },
      skins: { selected: defaults.skins.selected, unlocked: [...defaults.skins.unlocked, 'asterion' as const] },
      retention: {
        ...defaults.retention,
        runsCompleted: 10,
        completedObjectiveIds: ['first-flight', 'ten-flights'] as const,
        weeklyClaimIds: ['rf1-20261005-core-duel']
      }
    };

    expect(store.saveDurably(awarded)).toBe(true);
    expect(store.load()).toMatchObject({
      wallet: { nova: 250 },
      skins: { unlocked: expect.arrayContaining(['asterion']) },
      retention: {
        runsCompleted: 10,
        completedObjectiveIds: ['first-flight', 'ten-flights'],
        weeklyClaimIds: ['rf1-20261005-core-duel']
      }
    });

    storage.failWrites = true;
    expect(store.saveDurably({ ...awarded, wallet: { nova: 500 } })).toBe(false);
    expect(store.load().wallet.nova).toBe(250);
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
      laboratory: {
        ...defaults.laboratory,
        levels: { global_damage: 2 },
        currentOfferIds: ['weapon_damage_projectile', 'weapon_cadence', 'movement_speed']
      },
      unlockedActs: ['radial'],
      overdrive: defaults.overdrive
    })).toBe(true);
    expect(storage.values.has(SAVE_STORAGE_KEY)).toBe(true);
    expect(store.load()).toEqual({
      ...defaults,
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { ...defaults.settings, sfxVolume: 0.35, quality: 'low' },
      best: { timeSeconds: 302.5, score: 8400 },
      tutorialSeen: true,
      skins: defaults.skins,
      cannonSkins: defaults.cannonSkins,
      backgrounds: defaults.backgrounds,
      wallet: { nova: 425 },
      laboratory: {
        ...defaults.laboratory,
        levels: { global_damage: 2 },
        currentOfferIds: ['weapon_damage_projectile', 'weapon_cadence', 'movement_speed']
      },
      unlockedActs: ['radial'],
      lastSelectedRoute: 'radial',
      overdrive: defaults.overdrive
    });
  });

  it('migrates legacy values and clamps unsafe settings', () => {
    expect(migrateSaveData({
      bestTimeSeconds: -10,
      bestScore: 14,
      settings: { musicVolume: 4, sfxVolume: -1, quality: 'unknown' },
      tutorialSeen: true
    })).toEqual({
      ...createDefaultSaveData(),
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: {
        musicVolume: 1,
        sfxVolume: 0,
        muted: false,
        controlScheme: 'joystick',
        quality: 'medium'
      },
      best: { timeSeconds: 0, score: 14 },
      tutorialSeen: true,
      skins: { selected: 'spearhead', unlocked: ['cyan', 'spearhead'] },
      cannonSkins: { selected: 'spearhead', unlocked: ['basic', 'spearhead'] },
      backgrounds: { selected: 'deep-space', unlocked: ['deep-space'] },
      wallet: { nova: 0 },
      laboratory: createDefaultSaveData().laboratory,
      unlockedActs: ['radial'],
      lastSelectedRoute: 'radial',
      overdrive: createDefaultSaveData().overdrive
    });
  });

  it('conserva el nuevo esquema de arrastre relativo para dedos gruesos', () => {
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { controlScheme: 'joystick' }
    }).settings.controlScheme).toBe('joystick');
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { controlScheme: 'relative-touch' }
    }).settings.controlScheme).toBe('joystick');
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settings: { controlScheme: 'unknown' }
    }).settings.controlScheme).toBe('joystick');
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

  it('keeps Overdrive locked when migrating a pre-7 save and preserves a valid current record', () => {
    expect(migrateSaveData({
      schemaVersion: 6,
      unlockedActs: ['radial', 'angular', 'fracture'],
      overdrive: { unlocked: true, bestTotalTimeSeconds: 900, maxStages: 6, bestKills: 1200 }
    }).overdrive).toEqual({
      unlocked: false,
      bestTotalTimeSeconds: 0,
      maxStages: 0,
      bestKills: 0
    });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      overdrive: { unlocked: true, bestTotalTimeSeconds: 900.5, maxStages: 6.9, bestKills: 1200.9 }
    }).overdrive).toEqual({
      unlocked: true,
      bestTotalTimeSeconds: 900.5,
      maxStages: 6,
      bestKills: 1200
    });
  });

  it.each(['radial', 'angular', 'fracture', 'overdrive'] as const)('persists the last available route %s across store instances', route => {
    const storage = new MemoryStorage();
    const store = new LocalSaveStore(storage);
    const defaults = createDefaultSaveData();
    expect(store.save({ ...defaults, unlockedActs: ['radial', 'angular', 'fracture'],
      overdrive: { ...defaults.overdrive, unlocked: true }, lastSelectedRoute: route })).toBe(true);
    expect(new LocalSaveStore(storage).load().lastSelectedRoute).toBe(route);
  });

  it.each(['angular', 'fracture', 'overdrive', 'unknown', null])('rejects an unavailable or invalid saved route %s', route => {
    expect(migrateSaveData({ schemaVersion: 9, lastSelectedRoute: route }).lastSelectedRoute).toBe('radial');
  });

  it('adds the route preference to schema 8 without losing laboratory, wallet or unlocks', () => {
    const defaults = createDefaultSaveData();
    const legacy = { ...defaults, schemaVersion: 8, wallet: { nova: 1234 },
      laboratory: { ...defaults.laboratory, levels: { global_damage: 2 } },
      unlockedActs: ['radial', 'angular'], overdrive: { ...defaults.overdrive, unlocked: true } };
    expect(migrateSaveData(legacy)).toMatchObject({ schemaVersion: SAVE_SCHEMA_VERSION, lastSelectedRoute: 'radial',
      wallet: legacy.wallet, laboratory: legacy.laboratory, unlockedActs: legacy.unlockedActs, overdrive: legacy.overdrive });
  });

  it('resets only the old laboratory on schema 7 while preserving the wallet and real Overdrive unlock', () => {
    const defaults = createDefaultSaveData();
    expect(migrateSaveData({
      schemaVersion: 7,
      wallet: { nova: 4_200 },
      overdrive: { unlocked: true, bestTotalTimeSeconds: 120, maxStages: 4, bestKills: 80 },
      metaUpgrades: { levels: { weapon_damage: 5, weapon_cadence: 5 } },
      backgrounds: { selected: 'nacre-orbit', unlocked: ['nacre-orbit'] }
    })).toMatchObject({
      schemaVersion: SAVE_SCHEMA_VERSION,
      wallet: { nova: 4_200 },
      laboratory: defaults.laboratory,
      backgrounds: { selected: 'nacre-orbit', unlocked: ['deep-space', 'nacre-orbit'] },
      overdrive: { unlocked: true, bestTotalTimeSeconds: 120, maxStages: 4, bestKills: 80 }
    });
  });

  it('unlocks explicitly and merges only the best bounded Overdrive records', () => {
    const locked = createDefaultSaveData();
    const unlocked = unlockOverdrive(locked);
    expect(unlocked.overdrive.unlocked).toBe(true);
    expect(unlockOverdrive(unlocked)).toBe(unlocked);
    const record = mergeOverdriveRecord(unlocked.overdrive, {
      bestTotalTimeSeconds: 45,
      maxStages: 3,
      bestKills: 120
    });
    expect(record).toEqual({
      unlocked: true,
      bestTotalTimeSeconds: 45,
      maxStages: 3,
      bestKills: 120
    });
    expect(mergeOverdriveRecord(record, {
      bestTotalTimeSeconds: 10,
      maxStages: 1,
      bestKills: 3
    })).toEqual(record);
  });

  it('normalizes skin ownership and never equips a locked or unknown skin', () => {
    expect(migrateSaveData({
      schemaVersion: 1,
      skins: { selected: 'violet', unlocked: ['violet', 'violet', 'unknown'] }
    }).skins).toEqual({ selected: 'violet', unlocked: ['cyan', 'spearhead', 'violet'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      skins: { selected: 'violet', unlocked: [] }
    }).skins).toEqual({ selected: 'spearhead', unlocked: ['cyan', 'spearhead'] });
    expect(migrateSaveData({
      schemaVersion: SAVE_SCHEMA_VERSION,
      cannonSkins: { selected: 'rainbow', unlocked: ['rainbow', 'rainbow', 'unknown'] }
    }).cannonSkins).toEqual({ selected: 'rainbow', unlocked: ['basic', 'spearhead', 'rainbow'] });
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
      laboratory: {
        levels: { global_damage: 99, weapon_damage_projectile: -2, unknown: 4 },
        currentOfferIds: ['global_damage', 'weapon_damage_projectile', 'weapon_cadence', 'unknown'],
        deferredOffers: [{ upgradeId: 'weapon_damage_projectile', choicesRemaining: 2 }],
        history: [{ upgradeId: 'global_damage', rank: 99, costNova: 999_999 }],
        purchasesSinceVitalityAd: 99,
        vitalityAdRank: 99,
        offerStep: 99
      }
    })).toMatchObject({
      wallet: { nova: 12_345 },
      laboratory: {
        levels: { global_damage: 5 },
        currentOfferIds: ['weapon_damage_projectile', 'weapon_cadence'],
        purchasesSinceVitalityAd: 3,
        vitalityAdRank: 4,
        offerStep: 99
      }
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
