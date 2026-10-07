import { describe, expect, it } from 'vitest';
import {
  getLaboratoryCombatBonuses,
  getLaboratoryEffectTotal,
  LABORATORY_RANK_COSTS_NOVA,
  LABORATORY_UPGRADE_DEFINITIONS,
  normalizeLaboratorySaveData
} from './LaboratoryDefinitions';

describe('LaboratoryDefinitions', () => {
  it('defines eleven bounded permanent lines with ten discounted ranks', () => {
    expect(LABORATORY_UPGRADE_DEFINITIONS).toHaveLength(11);
    expect(LABORATORY_UPGRADE_DEFINITIONS.every((definition) => (
      definition.maxRank === 10 && definition.costsNova === LABORATORY_RANK_COSTS_NOVA
    ))).toBe(true);
    expect(LABORATORY_RANK_COSTS_NOVA).toEqual([613, 928, 1_400, 2_100, 3_150, 4_725, 7_088, 10_632, 15_947, 23_921]);
    expect(LABORATORY_RANK_COSTS_NOVA.reduce((sum, cost) => sum + cost, 0)).toBe(70_504);
  });

  it('clamps each attribute to its ten-rank cap and ignores malformed numbers', () => {
    const bonuses = getLaboratoryCombatBonuses({
      global_damage: 99,
      weapon_damage_projectile: 99,
      weapon_cadence: 99,
      movement_speed: 99,
      max_health: 99,
      damage_resistance: 99
    }, 99);
    expect(bonuses).toMatchObject({
      weaponDamageMultiplier: 1.5,
      weaponDamageByFamily: {
        projectile: 1.2,
        orbit: 1,
        chain: 1,
        boomerang: 1,
        pulse_ring: 1,
        magnetic_charge: 1
      },
      weaponCadenceMultiplier: 0.7,
      movementSpeedMultiplier: 1.2,
      maxHealthMultiplier: 1.248,
      incomingDamageMultiplier: 0.9
    });
    expect(getLaboratoryCombatBonuses({ global_damage: Number.NaN }, Number.POSITIVE_INFINITY).weaponDamageMultiplier).toBe(1);
    expect(getLaboratoryEffectTotal('weapon_cadence', Number.NaN)).toBe(1);
  });

  it('caps the requested max profile and keeps damage/cadence bonuses multiplicative', () => {
    const bonuses = getLaboratoryCombatBonuses({
      global_damage: 99,
      weapon_damage_projectile: 99,
      weapon_cadence: 99,
      movement_speed: 99,
      max_health: 99,
      damage_resistance: 99
    }, 99);
    expect(bonuses.weaponDamageMultiplier * bonuses.weaponDamageByFamily.projectile).toBeCloseTo(1.8);
    expect(1 / bonuses.weaponCadenceMultiplier).toBeCloseTo(1 / 0.7);
    expect(bonuses).toMatchObject({
      weaponCadenceMultiplier: 0.7,
      movementSpeedMultiplier: 1.2,
      maxHealthMultiplier: 1.248,
      incomingDamageMultiplier: 0.9
    });
  });

  it('normalizes save data to known branches and bounded, short histories', () => {
    const normalized = normalizeLaboratorySaveData({
      levels: { global_damage: 3.9, weapon_damage_projectile: -1, unknown: 5 },
      currentOfferIds: ['global_damage', 'unknown', 'global_damage'],
      deferredOffers: [{ upgradeId: 'weapon_cadence', choicesRemaining: 20 }],
      history: Array.from({ length: 8 }, (_, index) => ({
        upgradeId: 'global_damage', rank: index + 1, costNova: 1_000 + index
      })),
      purchasesSinceVitalityAd: 9,
      vitalityAdRank: 9,
      offerStep: Number.MAX_SAFE_INTEGER
    });
    expect(normalized.levels).toEqual({ global_damage: 3 });
    expect(normalized.currentOfferIds).toEqual(['global_damage']);
    expect(normalized.deferredOffers).toEqual([{ upgradeId: 'weapon_cadence', choicesRemaining: 2 }]);
    expect(normalized.history).toHaveLength(4);
    expect(normalized.purchasesSinceVitalityAd).toBe(3);
    expect(normalized.vitalityAdRank).toBe(4);
    expect(normalized.offerStep).toBe(1_000_000_000);
  });
});
