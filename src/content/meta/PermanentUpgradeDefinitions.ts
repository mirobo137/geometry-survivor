export type PermanentUpgradeId = 'weapon_damage' | 'weapon_cadence';

export interface PermanentUpgradeDefinition {
  readonly id: PermanentUpgradeId;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  readonly costsNova: readonly number[];
  readonly effectLabel: (level: number) => string;
}

export const PERMANENT_UPGRADE_DEFINITIONS: readonly PermanentUpgradeDefinition[] = [
  {
    id: 'weapon_damage',
    name: 'Núcleo de impacto',
    description: 'Aumenta el daño base de todos los proyectiles y armas del loadout.',
    maxLevel: 5,
    costsNova: [100, 250, 500, 900, 1_400],
    effectLabel: (level) => `+${level * 5}% daño base`
  },
  {
    id: 'weapon_cadence',
    name: 'Calibración de fuego',
    description: 'Reduce el tiempo entre disparos sin cambiar la física del proyectil.',
    maxLevel: 5,
    costsNova: [100, 250, 500, 900, 1_400],
    effectLabel: (level) => `-${level * 3}% intervalo de disparo`
  }
] as const;

export const getPermanentUpgradeDefinition = (id: PermanentUpgradeId): PermanentUpgradeDefinition => (
  PERMANENT_UPGRADE_DEFINITIONS.find((definition) => definition.id === id)
    ?? PERMANENT_UPGRADE_DEFINITIONS[0]
);

export interface PermanentCombatBonuses {
  readonly projectileDamageMultiplier: number;
  readonly projectileCooldownMultiplier: number;
}

export const getPermanentCombatBonuses = (
  levels: Readonly<Partial<Record<PermanentUpgradeId, number>>>
): PermanentCombatBonuses => {
  const damageLevel = Math.min(5, Math.max(0, Math.floor(levels.weapon_damage ?? 0)));
  const cadenceLevel = Math.min(5, Math.max(0, Math.floor(levels.weapon_cadence ?? 0)));
  return {
    projectileDamageMultiplier: 1 + damageLevel * 0.05,
    projectileCooldownMultiplier: Math.max(0.75, 1 - cadenceLevel * 0.03)
  };
};
