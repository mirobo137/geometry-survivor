import { describe, expect, it } from 'vitest';
import { getLevelUpChoices, UPGRADE_DEFINITIONS } from './UpgradeDefinitions';

describe('UpgradeDefinitions', () => {
  it('keeps every upgrade identifiable and data-driven', () => {
    const ids = UPGRADE_DEFINITIONS.map((upgrade) => upgrade.id);

    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(ids.length);
    expect(UPGRADE_DEFINITIONS.every((upgrade) => upgrade.title && upgrade.description && upgrade.effect)).toBe(true);
  });

  it('returns three deterministic choices for each level', () => {
    const first = getLevelUpChoices(4);
    const repeat = getLevelUpChoices(4);

    expect(first).toHaveLength(3);
    expect(first.map((choice) => choice.id)).toEqual(repeat.map((choice) => choice.id));
    expect(new Set(first.map((choice) => choice.id)).size).toBe(3);
  });
});
