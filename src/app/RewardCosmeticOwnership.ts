import { getRewardCosmetic, REWARD_COSMETICS, type RewardCosmeticId } from '../content/retention/RewardCosmeticDefinitions';
import type { SaveData, SaveStore } from '../platform/save/SaveStore';

export const ownsRewardCosmetic = (data: Pick<SaveData, 'skins' | 'cannonSkins' | 'backgrounds'>, id: RewardCosmeticId): boolean => {
  const reward = getRewardCosmetic(id)!;
  switch (reward.family) {
    case 'ship': return data.skins.unlocked.includes(reward.id);
    case 'cannon': return data.cannonSkins.unlocked.includes(reward.id);
    case 'background': return data.backgrounds.unlocked.includes(reward.id);
  }
};
/** Ownership/equip are application decisions, never renderer decisions. */
export const unlockRewardCosmetic = (data: SaveData, id: RewardCosmeticId, equip = false): SaveData => {
  const reward = getRewardCosmetic(id)!;
  switch (reward.family) {
    case 'ship': return { ...data, skins: { selected: equip ? reward.id : data.skins.selected, unlocked: [...new Set([...data.skins.unlocked, reward.id])] } };
    case 'cannon': return { ...data, cannonSkins: { selected: equip ? reward.id : data.cannonSkins.selected, unlocked: [...new Set([...data.cannonSkins.unlocked, reward.id])] } };
    case 'background': return { ...data, backgrounds: { selected: equip ? reward.id : data.backgrounds.selected, unlocked: [...new Set([...data.backgrounds.unlocked, reward.id])] } };
  }
};
/** Local/Pages debug route. All writes stay in this session; never unlock the real save. */
export const createRewardPreviewStore = (source: SaveStore): SaveStore => {
  let current = source.load();
  for (const reward of REWARD_COSMETICS) current = unlockRewardCosmetic(current, reward.id);
  const initial = structuredClone(current);
  return {
    load: () => structuredClone(current),
    save: data => { current = structuredClone(data); return true; },
    saveDurably: data => { current = structuredClone(data); return true; },
    clear: () => { current = structuredClone(initial); }
  };
};

