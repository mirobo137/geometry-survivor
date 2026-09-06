import { describe, expect, it } from 'vitest';
import {
  getPermanentCombatBonuses,
  PERMANENT_UPGRADE_DEFINITIONS,
  getPermanentUpgradeEffectLabel
} from './PermanentUpgradeDefinitions';

describe('PermanentUpgradeDefinitions', () => {
  it('keeps meta upgrades capped and data-driven', () => {
    expect(PERMANENT_UPGRADE_DEFINITIONS.map((definition) => definition.id)).toEqual(['weapon_damage', 'weapon_cadence']);
    expect(PERMANENT_UPGRADE_DEFINITIONS.every((definition) => definition.costsNova.length === definition.maxLevel)).toBe(true);
  });

  it('clamps unsafe levels and creates bounded combat modifiers', () => {
    expect(getPermanentCombatBonuses({ weapon_damage: 99, weapon_cadence: -4 })).toEqual({
      weaponDamageMultiplier: 1.25,
      weaponCadenceMultiplier: 1
    });
  });

  it('uses the same authored values for the Laboratory copy and combat formula', () => {
    expect(getPermanentUpgradeEffectLabel('weapon_damage', 5)).toBe('+25% daño base');
    expect(getPermanentUpgradeEffectLabel('weapon_cadence', 5)).toBe('-15% intervalo de armas');
    expect(getPermanentCombatBonuses({ weapon_damage: 5, weapon_cadence: 5 })).toEqual({
      weaponDamageMultiplier: 1.25,
      weaponCadenceMultiplier: 0.85
    });
    expect(PERMANENT_UPGRADE_DEFINITIONS.map((definition) => definition.effectLabel(5))).toEqual([
      '+25% daño base',
      '-15% intervalo de armas'
    ]);
  });
});
