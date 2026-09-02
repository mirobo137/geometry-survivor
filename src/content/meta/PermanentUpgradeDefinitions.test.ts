import { describe, expect, it } from 'vitest';
import { getPermanentCombatBonuses, PERMANENT_UPGRADE_DEFINITIONS } from './PermanentUpgradeDefinitions';

describe('PermanentUpgradeDefinitions', () => {
  it('keeps meta upgrades capped and data-driven', () => {
    expect(PERMANENT_UPGRADE_DEFINITIONS.map((definition) => definition.id)).toEqual(['weapon_damage', 'weapon_cadence']);
    expect(PERMANENT_UPGRADE_DEFINITIONS.every((definition) => definition.costsNova.length === definition.maxLevel)).toBe(true);
  });

  it('clamps unsafe levels and creates bounded combat modifiers', () => {
    expect(getPermanentCombatBonuses({ weapon_damage: 99, weapon_cadence: -4 })).toEqual({
      projectileDamageMultiplier: 1.25,
      projectileCooldownMultiplier: 1
    });
  });
});
