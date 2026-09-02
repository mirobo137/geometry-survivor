export type UpgradeId =
  | 'swift_step'
  | 'focused_projectiles'
  | 'twin_emitters'
  | 'reinforced_core'
  | 'orbit_blade'
  | 'chain_lightning'
  | 'rapid_projectiles'
  | 'resonant_core'
  | 'regenerative_reactor'
  | 'vampiric_core'
  | 'critical_impact'
  | 'recharging_shield'
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
  | { readonly type: 'twinEmitters' }
  | { readonly type: 'maxHealth'; readonly amount: number }
  | { readonly type: 'orbitBlade' }
  | { readonly type: 'chainLightning' }
  | { readonly type: 'projectileCooldown'; readonly amount: number }
  | { readonly type: 'experienceGain'; readonly amount: number }
  | { readonly type: 'healthRecovery'; readonly amount: number }
  | { readonly type: 'vampirism'; readonly amount: number }
  | { readonly type: 'criticalChance'; readonly amount: number }
  | { readonly type: 'shield'; readonly rechargeSeconds: number }
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
    id: 'twin_emitters',
    title: 'Doble ca\u00f1\u00f3n',
    description: 'Dispara desde ambos emisores con cada ataque',
    effect: { type: 'twinEmitters' },
    maxStacks: 1
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
    id: 'resonant_core',
    title: 'Núcleo resonante',
    description: '+12% experiencia por derrota',
    effect: { type: 'experienceGain', amount: 0.12 },
    maxStacks: 3
  },
  {
    id: 'regenerative_reactor',
    title: 'Reactor regenerativo',
    description: 'Recupera 2% de vida máxima cada 5 s',
    effect: { type: 'healthRecovery', amount: 0.02 },
    maxStacks: 3
  },
  {
    id: 'vampiric_core',
    title: 'Núcleo vampírico',
    description: 'Cura 1% de vida máxima al derrotar',
    effect: { type: 'vampirism', amount: 0.01 },
    maxStacks: 3
  },
  {
    id: 'critical_impact',
    title: 'Impacto critico',
    description: '+10% de probabilidad de infligir 2x dano',
    effect: { type: 'criticalChance', amount: 0.1 },
    maxStacks: 3
  },
  {
    id: 'recharging_shield',
    title: 'Escudo recargable',
    description: 'Bloquea un impacto y se recarga en 10 s',
    effect: { type: 'shield', rechargeSeconds: 10 },
    maxStacks: 1
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
