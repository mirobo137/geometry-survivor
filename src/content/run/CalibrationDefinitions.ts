import {
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId
} from '../upgrades/UpgradeDefinitions';

/** Authored entry templates used when a player enters Act II. */
export type CalibrationId = 'projectile' | 'orbit' | 'chain';

export interface CalibrationDefinition {
  readonly id: CalibrationId;
  readonly title: string;
  readonly description: string;
  /** Authored sequence applied by the direct-entry consumer. */
  readonly starterUpgrades: readonly UpgradeId[];
  readonly initialStacks: Readonly<Partial<Record<UpgradeId, number>>>;
  readonly maxActiveWeapons: 3;
  readonly novaReward: 0;
}

const calibration = (
  definition: Omit<CalibrationDefinition, 'maxActiveWeapons' | 'novaReward'>
): CalibrationDefinition => ({
  ...definition,
  maxActiveWeapons: 3,
  novaReward: 0
});

/**
 * Three authored entry builds. Each template has one weapon branch and two
 * supporting upgrades, so entry is deterministic without granting a fabricated
 * economy bonus or a fourth active weapon.
 */
export const CALIBRATION_DEFINITIONS: readonly CalibrationDefinition[] = [
  calibration({
    id: 'projectile',
    title: 'Calibration · Projectile',
    description: 'Alinea emisores, precisión y ritmo de disparo.',
    starterUpgrades: ['twin_emitters', 'focused_projectiles', 'rapid_projectiles'],
    initialStacks: {
      twin_emitters: 1,
      focused_projectiles: 1,
      rapid_projectiles: 1
    }
  }),
  calibration({
    id: 'orbit',
    title: 'Calibration · Orbit',
    description: 'Activa una defensa orbital y extiende su radio.',
    starterUpgrades: ['orbit_blade', 'orbit_reach', 'reinforced_core'],
    initialStacks: {
      orbit_blade: 1,
      orbit_reach: 1,
      reinforced_core: 1
    }
  }),
  calibration({
    id: 'chain',
    title: 'Calibration · Chain',
    description: 'Conecta objetivos y prepara una descarga resonante.',
    starterUpgrades: ['chain_lightning', 'chain_overload', 'resonant_core'],
    initialStacks: {
      chain_lightning: 1,
      chain_overload: 1,
      resonant_core: 1
    }
  })
] as const;

const CALIBRATION_BY_ID: Readonly<Record<CalibrationId, CalibrationDefinition>> =
  Object.fromEntries(CALIBRATION_DEFINITIONS.map((definition) => [definition.id, definition])) as Readonly<Record<CalibrationId, CalibrationDefinition>>;

const UPGRADE_BY_ID: Readonly<Record<UpgradeId, UpgradeDefinition>> =
  Object.fromEntries(UPGRADE_DEFINITIONS.map((definition) => [definition.id, definition])) as Readonly<Record<UpgradeId, UpgradeDefinition>>;

export const isCalibrationId = (value: unknown): value is CalibrationId => (
  value === 'projectile' || value === 'orbit' || value === 'chain'
);

export const getCalibrationDefinition = (id: CalibrationId): CalibrationDefinition => CALIBRATION_BY_ID[id];

/** Defensive content check used by tests and future direct-entry consumers. */
export const getCalibrationUpgradeDefinitions = (
  definition: CalibrationDefinition
): readonly UpgradeDefinition[] => definition.starterUpgrades.map((upgradeId) => {
  const upgrade = UPGRADE_BY_ID[upgradeId];
  if (!upgrade) throw new Error(`Unknown calibration upgrade: ${upgradeId}`);
  return upgrade;
});
