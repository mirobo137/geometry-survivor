import { describe, expect, it } from 'vitest';
import {
  canClaimLaboratoryVitalityAd,
  claimLaboratoryVitalityAd,
  createFreshLaboratory,
  getLaboratoryRadarIds,
  purchaseLaboratoryUpgrade
} from './LaboratoryProgression';
import { LABORATORY_UPGRADE_DEFINITIONS } from './LaboratoryDefinitions';

describe('LaboratoryProgression', () => {
  it('offers a stable three-choice hand and keeps the preview separate from guaranteed offers', () => {
    const first = createFreshLaboratory();
    expect(first.currentOfferIds).toHaveLength(3);
    expect(new Set(first.currentOfferIds).size).toBe(3);
    expect(createFreshLaboratory().currentOfferIds).toEqual(first.currentOfferIds);
    expect(getLaboratoryRadarIds(first)).toHaveLength(3);
    expect(getLaboratoryRadarIds(first).some((id) => first.currentOfferIds.includes(id))).toBe(false);
  });

  it('charges the rank price, rotates unchosen offers away for two paid choices, and remains repeatable', () => {
    let state = createFreshLaboratory();
    let nova = 50_000;
    const firstHand = [...state.currentOfferIds];
    const selected = firstHand[0]!;
    let purchase = purchaseLaboratoryUpgrade(state, nova, selected);
    expect(purchase.purchased).toBe(true);
    expect(purchase.nova).toBe(50_000 - 613);
    expect(purchase.laboratory.levels[selected]).toBe(1);
    expect(purchase.laboratory.currentOfferIds.some((id) => firstHand.slice(1).includes(id))).toBe(false);
    state = purchase.laboratory;
    nova = purchase.nova;

    purchase = purchaseLaboratoryUpgrade(state, nova, state.currentOfferIds[0]!);
    expect(purchase.purchased).toBe(true);
    expect(purchase.laboratory.currentOfferIds.some((id) => firstHand.slice(1).includes(id))).toBe(false);
    state = purchase.laboratory;
    nova = purchase.nova;
    purchase = purchaseLaboratoryUpgrade(state, nova, state.currentOfferIds[0]!);
    expect(purchase.purchased).toBe(true);
    expect(purchase.laboratory.history).toHaveLength(3);
    expect(purchase.laboratory.purchasesSinceVitalityAd).toBe(3);
    expect(canClaimLaboratoryVitalityAd(purchase.laboratory)).toBe(true);
  });

  it('does not spend NOVA on stale, unaffordable, or maxed offers', () => {
    const state = createFreshLaboratory();
    const [offered, stale] = state.currentOfferIds;
    expect(purchaseLaboratoryUpgrade(state, 612, offered!).purchased).toBe(false);
    expect(purchaseLaboratoryUpgrade(state, 20_000, 'global_damage').purchased).toBe(state.currentOfferIds.includes('global_damage'));
    expect(purchaseLaboratoryUpgrade({
      ...state,
      levels: { global_damage: 10 },
      currentOfferIds: ['global_damage']
    }, 20_000, 'global_damage').purchased).toBe(false);
    expect(stale).toBeDefined();
  });

  it('grants at most four optional +1% vitality ranks and only after three NOVA purchases each time', () => {
    let state = createFreshLaboratory();
    const definitions = new Map(LABORATORY_UPGRADE_DEFINITIONS.map((definition) => [definition.id, definition]));
    for (let adRank = 1; adRank <= 4; adRank += 1) {
      for (let purchaseNumber = 0; purchaseNumber < 3; purchaseNumber += 1) {
        const id = state.currentOfferIds.find((candidate) => (state.levels[candidate] ?? 0) < definitions.get(candidate)!.maxRank)!;
        state = purchaseLaboratoryUpgrade(state, 50_000, id).laboratory;
      }
      expect(canClaimLaboratoryVitalityAd(state)).toBe(true);
      state = claimLaboratoryVitalityAd(state)!;
      expect(state.vitalityAdRank).toBe(adRank);
      expect(state.purchasesSinceVitalityAd).toBe(0);
    }
    expect(canClaimLaboratoryVitalityAd(state)).toBe(false);
    expect(claimLaboratoryVitalityAd(state)).toBeNull();
  });
});
