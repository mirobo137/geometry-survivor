import { describe, expect, it } from 'vitest';
import { REWARD_COSMETICS, REWARD_WEEK_ANCHOR, REWARD_WEEK_MS, getSeasonalReward, isRewardAvailable, getRewardCosmetic } from './RewardCosmeticDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../visual/CannonSkinDefinitions';
import { PLAYER_SKIN_DEFINITIONS } from '../visual/SkinDefinitions';
import { BACKGROUND_DEFINITIONS } from '../visual/BackgroundDefinitions';
import { ownsRewardCosmetic, unlockRewardCosmetic, createRewardPreviewStore } from '../../app/RewardCosmeticOwnership';
import { createDefaultSaveData, migrateSaveData } from '../../platform/save/SaveStore';

describe('complete reward collection', () => {
  it('has exactly ten original exclusive cosmetics per family, alongside the ten base entries', () => {
    expect(REWARD_COSMETICS).toHaveLength(30);
    expect(new Set(REWARD_COSMETICS.map(x => x.id)).size).toBe(30);
    for (const family of ['ship', 'cannon', 'background']) expect(REWARD_COSMETICS.filter(x => x.family === family)).toHaveLength(10);
    for (const catalogue of [PLAYER_SKIN_DEFINITIONS, CANNON_SKIN_DEFINITIONS, BACKGROUND_DEFINITIONS]) {
      expect(catalogue).toHaveLength(20);
      for (const entry of catalogue.filter(x => getRewardCosmetic(x.id))) {
        expect(entry.priceNova).toBe(0);
        expect(entry.acquisition).toMatch(/^(event|daily-wheel)$/);
      }
    }
  });
  it('rotates every reward once per 15 weeks per source, never changing its family or source', () => {
    for (const source of ['weekly-logbook', 'daily-wheel'] as const) {
      const seen = new Set<string>();
      for (let week = 0; week < 15; week++) {
        const time = REWARD_WEEK_ANCHOR + REWARD_WEEK_MS*week;
        const active = getSeasonalReward(source, time);
        seen.add(active.id);
        expect(active.source).toBe(source);
        expect(isRewardAvailable(active.id, time)).toBe(true);
        for (const other of REWARD_COSMETICS.filter(x => x.source === source && x.id !== active.id)) expect(isRewardAvailable(other.id, time)).toBe(false);
      }
      expect(seen.size).toBe(15);
      expect(getSeasonalReward(source, REWARD_WEEK_ANCHOR+15*REWARD_WEEK_MS).id).toBe(getSeasonalReward(source, REWARD_WEEK_ANCHOR).id);
    }
  });
  it('persists ownership/equip in all families, without duplicate unlocks or automatic equip on award', () => {
    let save = createDefaultSaveData();
    for (const reward of REWARD_COSMETICS) {
      expect(ownsRewardCosmetic(save, reward.id)).toBe(false);
      const awarded = unlockRewardCosmetic(save, reward.id);
      expect(awarded.skins.selected).toBe(save.skins.selected);
      expect(awarded.cannonSkins.selected).toBe(save.cannonSkins.selected);
      expect(awarded.backgrounds.selected).toBe(save.backgrounds.selected);
      save = migrateSaveData(JSON.parse(JSON.stringify(unlockRewardCosmetic(awarded, reward.id, true))));
      expect(ownsRewardCosmetic(save, reward.id)).toBe(true);
      expect(unlockRewardCosmetic(save, reward.id)).toEqual(save);
    }
    expect(save.wallet.nova).toBe(0);
  });
  it('unlocks the complete preview in memory without any writes to the source save', () => {
    const real = createDefaultSaveData();
    let writes = 0;
    const store = createRewardPreviewStore({ load: () => real, save: () => { writes++; return true; }, clear: () => { writes++; } });
    for (const reward of REWARD_COSMETICS) expect(ownsRewardCosmetic(store.load(), reward.id)).toBe(true);
    store.save(unlockRewardCosmetic(store.load(), 'frostbite', true));
    store.clear();
    expect(writes).toBe(0);
    expect(real.cannonSkins.unlocked).not.toContain('frostbite');
  });
});
