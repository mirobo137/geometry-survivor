export type UpgradeId =
  | 'swift_step'
  | 'focused_projectiles'
  | 'reinforced_core'
  | 'orbit_blade'
  | 'chain_lightning'
  | 'rapid_projectiles'
  | 'longshot_projectiles'
  | 'orbit_reach'
  | 'chain_overload'
  | 'hardened_shell';

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly title: string;
  readonly description: string;
  readonly effect: UpgradeEffect;
  readonly maxStacks?: number;
  readonly requires?: readonly UpgradeId[];
}

export type UpgradeEffect =
  | { readonly type: 'movementSpeed'; readonly amount: number }
  | { readonly type: 'projectileDamage'; readonly amount: number }
  | { readonly type: 'maxHealth'; readonly amount: number }
  | { readonly type: 'orbitBlade' }
  | { readonly type: 'chainLightning' }
  | { readonly type: 'projectileCooldown'; readonly amount: number }
  | { readonly type: 'projectileSpeed'; readonly amount: number }
  | { readonly type: 'orbitRadius'; readonly amount: number }
  | { readonly type: 'chainDamage'; readonly amount: number }
  | { readonly type: 'armor'; readonly amount: number };

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'swift_step',
    title: 'Paso veloz',
    description: '+25 velocidad de movimiento',
    effect: { type: 'movementSpeed', amount: 25 }
  },
  {
    id: 'focused_projectiles',
    title: 'Proyectiles enfocados',
    description: '+4 daño del proyectil automático',
    effect: { type: 'projectileDamage', amount: 4 }
  },
  {
    id: 'reinforced_core',
    title: 'Núcleo reforzado',
    description: '+20 vida máxima y recuperación inmediata',
    effect: { type: 'maxHealth', amount: 20 }
  },
  {
    id: 'orbit_blade',
    title: 'Órbita geométrica',
    description: 'Desbloquea una hoja que gira y daña al contacto',
    effect: { type: 'orbitBlade' },
    maxStacks: 6
  },
  {
    id: 'chain_lightning',
    title: 'Cadena eléctrica',
    description: 'Desbloquea un rayo que salta hasta 3 enemigos',
    effect: { type: 'chainLightning' },
    maxStacks: 1
  },
  {
    id: 'rapid_projectiles',
    title: 'Ráfaga rápida',
    description: 'Reduce 0.08 s el tiempo entre proyectiles',
    effect: { type: 'projectileCooldown', amount: 0.08 },
    maxStacks: 4
  },
  {
    id: 'longshot_projectiles',
    title: 'Lanzamiento lejano',
    description: '+90 velocidad de proyectil automático',
    effect: { type: 'projectileSpeed', amount: 90 }
  },
  {
    id: 'orbit_reach',
    title: 'Órbita extendida',
    description: '+18 radio de la órbita geométrica',
    effect: { type: 'orbitRadius', amount: 18 },
    requires: ['orbit_blade']
  },
  {
    id: 'chain_overload',
    title: 'Sobrecarga eléctrica',
    description: '+6 daño de Cadena eléctrica',
    effect: { type: 'chainDamage', amount: 6 },
    requires: ['chain_lightning']
  },
  {
    id: 'hardened_shell',
    title: 'Coraza endurecida',
    description: '+2 armadura contra contacto',
    effect: { type: 'armor', amount: 2 },
    maxStacks: 9
  }
];

export const getLevelUpChoices = (
  level: number,
  isAvailable: (upgrade: UpgradeDefinition) => boolean = () => true
): readonly UpgradeDefinition[] => {
  const start = Math.max(0, (level - 2) % UPGRADE_DEFINITIONS.length);
  return Array.from({ length: UPGRADE_DEFINITIONS.length }, (_, index) => (
    UPGRADE_DEFINITIONS[(start + index) % UPGRADE_DEFINITIONS.length]
  )).filter(isAvailable).slice(0, 3);
};
