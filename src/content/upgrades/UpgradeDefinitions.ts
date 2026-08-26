export type UpgradeId = 'swift_step' | 'focused_projectiles' | 'reinforced_core';

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly title: string;
  readonly description: string;
}

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'swift_step',
    title: 'Paso veloz',
    description: '+25 velocidad de movimiento'
  },
  {
    id: 'focused_projectiles',
    title: 'Proyectiles enfocados',
    description: '+4 daño del proyectil automático'
  },
  {
    id: 'reinforced_core',
    title: 'Núcleo reforzado',
    description: '+20 vida máxima y recuperación inmediata'
  }
];

export const getLevelUpChoices = (level: number): readonly UpgradeDefinition[] => {
  const start = Math.max(0, (level - 2) % UPGRADE_DEFINITIONS.length);
  return Array.from({ length: UPGRADE_DEFINITIONS.length }, (_, index) => (
    UPGRADE_DEFINITIONS[(start + index) % UPGRADE_DEFINITIONS.length]
  ));
};
