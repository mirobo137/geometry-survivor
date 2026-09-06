export type PermanentUpgradeId = 'weapon_damage' | 'weapon_cadence';

export interface PermanentUpgradeDefinition {
  readonly id: PermanentUpgradeId;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  readonly costsNova: readonly number[];
  readonly effectLabel: (level: number) => string;
}

/**
 * Single source for the authored permanent-weapon rules. The values are
 * intentionally unchanged from the first Laboratory delivery; EX-02b only
 * defines which weapon event consumes each modifier.
 */
export const PERMANENT_UPGRADE_RULES = {
  weapon_damage: {
    maxLevel: 5,
    increasePerLevel: 0.05
  },
  weapon_cadence: {
    maxLevel: 5,
    intervalReductionPerLevel: 0.03,
    minimumIntervalMultiplier: 0.75
  }
} as const;

const clampLevel = (level: number | undefined, maxLevel: number): number => (
  Math.min(maxLevel, Math.max(0, Math.floor(level ?? 0)))
);

const formatPercent = (value: number): number => Math.round(value * 100);

export const getPermanentUpgradeEffectLabel = (id: PermanentUpgradeId, level: number): string => {
  if (id === 'weapon_damage') {
    const safeLevel = clampLevel(level, PERMANENT_UPGRADE_RULES.weapon_damage.maxLevel);
    return `+${formatPercent(safeLevel * PERMANENT_UPGRADE_RULES.weapon_damage.increasePerLevel)}% daño base`;
  }
  const safeLevel = clampLevel(level, PERMANENT_UPGRADE_RULES.weapon_cadence.maxLevel);
  return `-${formatPercent(safeLevel * PERMANENT_UPGRADE_RULES.weapon_cadence.intervalReductionPerLevel)}% intervalo de armas`;
};

export const PERMANENT_UPGRADE_DEFINITIONS: readonly PermanentUpgradeDefinition[] = [
  {
    id: 'weapon_damage',
    name: 'Núcleo de impacto',
    description: 'Aumenta el daño base de todos los proyectiles y armas del loadout.',
    maxLevel: PERMANENT_UPGRADE_RULES.weapon_damage.maxLevel,
    costsNova: [100, 250, 500, 900, 1_400],
    effectLabel: (level) => getPermanentUpgradeEffectLabel('weapon_damage', level)
  },
  {
    id: 'weapon_cadence',
    name: 'Calibración de fuego',
    description: 'Reduce el tiempo entre disparos sin cambiar la física del proyectil.',
    maxLevel: PERMANENT_UPGRADE_RULES.weapon_cadence.maxLevel,
    costsNova: [100, 250, 500, 900, 1_400],
    effectLabel: (level) => getPermanentUpgradeEffectLabel('weapon_cadence', level)
  }
] as const;

export const getPermanentUpgradeDefinition = (id: PermanentUpgradeId): PermanentUpgradeDefinition => (
  PERMANENT_UPGRADE_DEFINITIONS.find((definition) => definition.id === id)
    ?? PERMANENT_UPGRADE_DEFINITIONS[0]
);

export interface PermanentCombatBonuses {
  /** Multiplies every authored weapon damage event. */
  readonly weaponDamageMultiplier: number;
  /** Multiplies weapon intervals; lower means more frequent events. */
  readonly weaponCadenceMultiplier: number;
}

export const getPermanentCombatBonuses = (
  levels: Readonly<Partial<Record<PermanentUpgradeId, number>>>
): PermanentCombatBonuses => {
  const damageLevel = clampLevel(levels.weapon_damage, PERMANENT_UPGRADE_RULES.weapon_damage.maxLevel);
  const cadenceLevel = clampLevel(levels.weapon_cadence, PERMANENT_UPGRADE_RULES.weapon_cadence.maxLevel);
  return {
    weaponDamageMultiplier: 1 + damageLevel * PERMANENT_UPGRADE_RULES.weapon_damage.increasePerLevel,
    weaponCadenceMultiplier: Math.max(
      PERMANENT_UPGRADE_RULES.weapon_cadence.minimumIntervalMultiplier,
      1 - cadenceLevel * PERMANENT_UPGRADE_RULES.weapon_cadence.intervalReductionPerLevel
    )
  };
};
