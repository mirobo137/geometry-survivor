import { getPlayerSkinDefinition, isPlayerSkinId } from '../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../content/visual/VisualTokens';
import { getCannonSkinDefinition, isCannonSkinId, type CannonSkinId } from '../content/visual/CannonSkinDefinitions';
import { getBackgroundDefinition, isBackgroundId, type BackgroundId } from '../content/visual/BackgroundDefinitions';
import { getRewardCosmetic } from '../content/retention/RewardCosmeticDefinitions';
import { getCosmeticDiscountQuote } from '../content/meta/EconomyDefinitions';
import type { SaveData } from '../platform/save/SaveStore';
import type { RewardedAdResult } from '../platform/Platform';

export type CosmeticUnlockTarget =
  | { readonly kind: 'player'; readonly id: PlayerSkinId }
  | { readonly kind: 'cannon'; readonly id: CannonSkinId }
  | { readonly kind: 'background'; readonly id: BackgroundId };

export interface CosmeticUnlockResult {
  readonly result: RewardedAdResult;
  readonly data?: SaveData;
}

/** Catalog-authoritative transaction: one save contains both debit and ownership. */
export const prepareDiscountedCosmeticPurchase = (saved: SaveData, target: CosmeticUnlockTarget): SaveData | null => {
  if (getRewardCosmetic(target.id)) return null;
  if (target.kind === 'player' && isPlayerSkinId(target.id)) {
    const definition = getPlayerSkinDefinition(target.id);
    const quote = getCosmeticDiscountQuote(definition.priceNova, saved.wallet.nova);
    if (definition.acquisition !== 'nova' || saved.skins.unlocked.includes(target.id) || !quote.eligible) return null;
    return { ...saved, wallet: { nova: saved.wallet.nova - quote.payNova },
      skins: { selected: target.id, unlocked: [...saved.skins.unlocked, target.id] } };
  }
  if (target.kind === 'cannon' && isCannonSkinId(target.id)) {
    const quote = getCosmeticDiscountQuote(getCannonSkinDefinition(target.id).priceNova, saved.wallet.nova);
    if (saved.cannonSkins.unlocked.includes(target.id) || !quote.eligible) return null;
    return { ...saved, wallet: { nova: saved.wallet.nova - quote.payNova },
      cannonSkins: { selected: target.id, unlocked: [...saved.cannonSkins.unlocked, target.id] } };
  }
  if (target.kind === 'background' && isBackgroundId(target.id)) {
    const quote = getCosmeticDiscountQuote(getBackgroundDefinition(target.id).priceNova, saved.wallet.nova);
    if (saved.backgrounds.unlocked.includes(target.id) || !quote.eligible) return null;
    return { ...saved, wallet: { nova: saved.wallet.nova - quote.payNova },
      backgrounds: { selected: target.id, unlocked: [...saved.backgrounds.unlocked, target.id] } };
  }
  return null;
};
