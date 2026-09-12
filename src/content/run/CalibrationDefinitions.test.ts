import { describe, expect, it } from 'vitest';
import { UPGRADE_DEFINITIONS } from '../upgrades/UpgradeDefinitions';
import {
  CALIBRATION_DEFINITIONS,
  getCalibrationDefinition,
  getCalibrationUpgradeDefinitions,
  isCalibrationId
} from './CalibrationDefinitions';

describe('CalibrationDefinitions', () => {
  it('exposes exactly the three authored entry templates', () => {
    expect(CALIBRATION_DEFINITIONS.map((definition) => definition.id)).toEqual([
      'projectile',
      'orbit',
      'chain'
    ]);
    expect(CALIBRATION_DEFINITIONS.every((definition) => definition.maxActiveWeapons === 3)).toBe(true);
    expect(CALIBRATION_DEFINITIONS.every((definition) => definition.novaReward === 0)).toBe(true);
  });

  it('only references existing upgrades and keeps initial stacks aligned', () => {
    const knownUpgradeIds = new Set(UPGRADE_DEFINITIONS.map((definition) => definition.id));
    for (const definition of CALIBRATION_DEFINITIONS) {
      expect(new Set(definition.starterUpgrades).size).toBe(definition.starterUpgrades.length);
      expect(getCalibrationUpgradeDefinitions(definition).length).toBe(definition.starterUpgrades.length);
      for (const upgradeId of definition.starterUpgrades) {
        expect(knownUpgradeIds.has(upgradeId)).toBe(true);
        expect(definition.initialStacks[upgradeId]).toBe(1);
      }
    }
  });

  it('keeps the entry branch explicit and deterministic', () => {
    expect(CALIBRATION_DEFINITIONS.every((definition) => definition.starterUpgrades.length === 3)).toBe(true);
    expect(getCalibrationDefinition('chain').starterUpgrades).toContain('chain_lightning');
  });

  it('guards direct-entry identifiers without touching the save', () => {
    expect(isCalibrationId('projectile')).toBe(true);
    expect(isCalibrationId('orbit')).toBe(true);
    expect(isCalibrationId('chain')).toBe(true);
    expect(isCalibrationId('radial')).toBe(false);
    expect(isCalibrationId(undefined)).toBe(false);
  });
});
