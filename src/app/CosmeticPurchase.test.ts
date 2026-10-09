import { describe, expect, it } from 'vitest';
import { createDefaultSaveData } from '../platform/save/SaveStore';
import { getCosmeticDiscountQuote } from '../content/meta/EconomyDefinitions';
import { PLAYER_SKIN_DEFINITIONS } from '../content/visual/SkinDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../content/visual/CannonSkinDefinitions';
import { BACKGROUND_DEFINITIONS } from '../content/visual/BackgroundDefinitions';
import { prepareDiscountedCosmeticPurchase, type CosmeticUnlockTarget } from './CosmeticPurchase';

describe('approved cosmetic store prices', () => {
  const catalogs = [
    { family: 'ships', definitions: PLAYER_SKIN_DEFINITIONS, starter: 'spearhead', prices: {
      cyan: 600, violet: 1200, amber: 1800, manta: 2400, emerald: 3600,
      obsidian: 4800, nova: 6000, corsair: 7200, nautilus: 9600
    } },
    { family: 'cannons', definitions: CANNON_SKIN_DEFINITIONS, starter: 'spearhead', prices: {
      basic: 600, curve: 1200, smoke: 1800, bloom: 2400, rainbow: 3600,
      lattice: 4800, helix: 6000, gyre: 7200, razor: 9600
    } },
    { family: 'backgrounds', definitions: BACKGROUND_DEFINITIONS, starter: 'deep-space', prices: {
      'ion-storm': 600, 'solar-drift': 1200, 'crystal-field': 1800, 'tidal-veil': 2400,
      'vesper-bloom': 3600, 'nacre-orbit': 4800, 'silent-archive': 6000,
      'lunar-fault': 7200, 'leviathan-wake': 9600
    } }
  ];
  it.each(catalogs)('prices all nine $family while preserving the starter and exclusive rewards', ({ definitions, starter, prices }) => {
    const shop = definitions.filter(item => item.acquisition === 'nova');
    expect(Object.fromEntries(shop.map(item => [item.id, item.priceNova]))).toEqual(prices);
    expect(definitions.filter(item => item.acquisition === 'default').map(item => item.id)).toEqual([starter]);
    for (const item of definitions.filter(item => item.acquisition !== 'nova')) expect(item.priceNova).toBe(0);
    for (const item of shop) {
      const pay = item.priceNova * 0.75;
      expect(getCosmeticDiscountQuote(item.priceNova, pay)).toMatchObject({
        eligible: true, payNova: pay, discountNova: item.priceNova * 0.25
      });
      expect(getCosmeticDiscountQuote(item.priceNova, pay - 1).eligible).toBe(false);
      expect(getCosmeticDiscountQuote(item.priceNova, item.priceNova).eligible).toBe(false);
    }
  });
});

describe('cosmetic video discount', () => {
  it('offers only when the full price is unaffordable but the discounted price is affordable', () => {
    expect(getCosmeticDiscountQuote(250, 187).eligible).toBe(false);
    expect(getCosmeticDiscountQuote(250, 188)).toMatchObject({ eligible: true, discountNova: 62, payNova: 188, missingNova: 62 });
    expect(getCosmeticDiscountQuote(250, 249).eligible).toBe(true);
    expect(getCosmeticDiscountQuote(250, 250).eligible).toBe(false);
    expect(getCosmeticDiscountQuote(0, 0).eligible).toBe(false);
    expect(getCosmeticDiscountQuote(NaN, Infinity).eligible).toBe(false);
  });
  const targets: CosmeticUnlockTarget[] = [
    { kind: 'player', id: 'cyan' }, { kind: 'cannon', id: 'basic' }, { kind: 'background', id: 'ion-storm' }
  ];
  it.each(targets)('debits and unlocks $kind together, preserving surplus and other progression', target => {
    const saved = { ...createDefaultSaveData(), wallet: { nova: 480 } };
    const next = prepareDiscountedCosmeticPurchase(saved, target)!;
    expect(next.wallet.nova).toBe(30); // price 600, discount 150, pay 450
    const key = target.kind === 'player' ? 'skins' : target.kind === 'cannon' ? 'cannonSkins' : 'backgrounds';
    expect(next[key]).toMatchObject({ selected: target.id, unlocked: expect.arrayContaining([target.id]) });
    expect(next.laboratory).toEqual(saved.laboratory);
    expect(saved.wallet.nova).toBe(480);
    expect(prepareDiscountedCosmeticPurchase(next, target)).toBeNull();
  });
  it('rejects exclusive rewards, starters, insufficient balances and forged IDs', () => {
    const saved = { ...createDefaultSaveData(), wallet: { nova: 480 } };
    expect(prepareDiscountedCosmeticPurchase(saved, { kind: 'player', id: 'spearhead' })).toBeNull();
    expect(prepareDiscountedCosmeticPurchase(saved, { kind: 'player', id: 'solstice' })).toBeNull();
    expect(prepareDiscountedCosmeticPurchase(saved, { kind: 'player', id: 'violet' })).toBeNull();
    expect(prepareDiscountedCosmeticPurchase(saved, { kind: 'player', id: 'invalid' } as unknown as CosmeticUnlockTarget)).toBeNull();
  });
});
