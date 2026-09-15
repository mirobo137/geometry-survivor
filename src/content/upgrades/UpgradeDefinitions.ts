import type {
  WeaponEvolutionId
} from '../weapons/WeaponEvolutionDefinitions';

export type UpgradeId =
  | 'swift_step'
  | 'focused_projectiles'
  | 'twin_emitters'
  | 'reinforced_core'
  | 'orbit_blade'
  | 'chain_lightning'
  | 'vector_boomerang'
  | 'pulse_ring'
  | 'magnetic_charge'
  | 'rapid_projectiles'
  | 'resonant_core'
  | 'regenerative_reactor'
  | 'vampiric_core'
  | 'critical_impact'
  | 'recharging_shield'
  | 'orbit_reach'
  | 'chain_overload'
  | 'hardened_shell'
  | WeaponEvolutionId;

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
  | { readonly type: 'vectorBoomerang' }
  | { readonly type: 'pulseRing' }
  | { readonly type: 'magneticCharge' }
  | { readonly type: 'projectileCooldown'; readonly amount: number }
  | { readonly type: 'experienceGain'; readonly amount: number }
  | { readonly type: 'healthRecovery'; readonly amount: number }
  | { readonly type: 'vampirism'; readonly amount: number }
  | { readonly type: 'criticalChance'; readonly amount: number }
  | { readonly type: 'shield'; readonly rechargeSeconds: number }
  | { readonly type: 'orbitRadius'; readonly amount: number }
  | { readonly type: 'chainDamage'; readonly amount: number }
  | { readonly type: 'armor'; readonly amount: number }
  | { readonly type: 'weaponEvolution'; readonly evolution: WeaponEvolutionId };

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
    id: 'vector_boomerang',
    title: 'Búmeran vectorial',
    description: 'Lanza una hoja que golpea al salir y al regresar hacia ti',
    effect: { type: 'vectorBoomerang' },
    maxStacks: 1
  },
  {
    id: 'pulse_ring',
    title: 'Anillo de pulso',
    description: 'Carga una onda que se expande, daña una vez y empuja',
    effect: { type: 'pulseRing' },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge',
    title: 'Carga magnética',
    description: 'Lanza una carga remota que atrae y detona en una banda',
    effect: { type: 'magneticCharge' },
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

/**
 * Evolution cards live outside the normal three-card rotation. Keeping them
 * in a separate pool preserves the authored level rotation and guarantees
 * that an evolution offer contains exactly two mutually-exclusive routes.
 */
export const WEAPON_EVOLUTION_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'rail_lance',
    title: 'Rail Lance',
    description: 'Proyectil pesado: +35% dano, mayor calibre y atraviesa hasta 5 objetivos.',
    effect: { type: 'weaponEvolution', evolution: 'rail_lance' },
    maxStacks: 1
  },
  {
    id: 'pulse_volley',
    title: 'Pulse Volley',
    description: 'Abre un abanico de 3 proyectiles estrechos para cubrir grupos.',
    effect: { type: 'weaponEvolution', evolution: 'pulse_volley' },
    maxStacks: 1
  },
  {
    id: 'solar_crown',
    title: 'Solar Crown',
    description: 'La orbita gana alcance y potencia; sus hojas giran con una cadencia mas pesada.',
    effect: { type: 'weaponEvolution', evolution: 'solar_crown' },
    maxStacks: 1,
    requires: ['orbit_blade']
  },
  {
    id: 'graviton_halo',
    title: 'Graviton Halo',
    description: 'Sacrifica dano directo para emitir un pulso de control cada 3 s.',
    effect: { type: 'weaponEvolution', evolution: 'graviton_halo' },
    maxStacks: 1,
    requires: ['orbit_blade']
  },
  {
    id: 'closed_circuit',
    title: 'Closed Circuit',
    description: 'La cadena salta hasta 5 veces y puede regresar desde un borde cargado.',
    effect: { type: 'weaponEvolution', evolution: 'closed_circuit' },
    maxStacks: 1,
    requires: ['chain_lightning']
  },
  {
    id: 'thunderhead',
    title: 'Thunderhead',
    description: 'Pierde un salto; cada objetivo alcanzado deja una explosion retardada.',
    effect: { type: 'weaponEvolution', evolution: 'thunderhead' },
    maxStacks: 1,
    requires: ['chain_lightning']
  },
  {
    id: 'twin_comet',
    title: 'Twin Comet',
    description: 'Lanza dos piezas con apertura opuesta, cada una al 65% del dano.',
    effect: { type: 'weaponEvolution', evolution: 'twin_comet' },
    maxStacks: 1,
    requires: ['vector_boomerang']
  },
  {
    id: 'singularity_return',
    title: 'Singularity Return',
    description: 'El retorno gana dano y libera un pulso que atrae y golpea al capturarse.',
    effect: { type: 'weaponEvolution', evolution: 'singularity_return' },
    maxStacks: 1,
    requires: ['vector_boomerang']
  },
  {
    id: 'echo_shock',
    title: 'Echo Shock',
    description: 'Una segunda onda llega 0.45 s despues con el 45% del dano.',
    effect: { type: 'weaponEvolution', evolution: 'echo_shock' },
    maxStacks: 1,
    requires: ['pulse_ring']
  },
  {
    id: 'compression_wave',
    title: 'Compression Wave',
    description: 'Atrae durante la carga y libera un impacto al 165% con mayor empuje.',
    effect: { type: 'weaponEvolution', evolution: 'compression_wave' },
    maxStacks: 1,
    requires: ['pulse_ring']
  },
  {
    id: 'event_horizon',
    title: 'Event Horizon',
    description: 'Amplia duracion, radio y atraccion; reduce dano y cadencia para controlar el espacio.',
    effect: { type: 'weaponEvolution', evolution: 'event_horizon' },
    maxStacks: 1,
    requires: ['magnetic_charge']
  },
  {
    id: 'polar_collapse',
    title: 'Polar Collapse',
    description: 'Acorta la atraccion y anade una segunda contraccion con dano parcial.',
    effect: { type: 'weaponEvolution', evolution: 'polar_collapse' },
    maxStacks: 1,
    requires: ['magnetic_charge']
  }
];

export const getWeaponEvolutionChoices = (
  isAvailable: (upgrade: UpgradeDefinition) => boolean = () => true
): readonly UpgradeDefinition[] => WEAPON_EVOLUTION_DEFINITIONS.filter(isAvailable);

export const getLevelUpChoices = (
  level: number,
  isAvailable: (upgrade: UpgradeDefinition) => boolean = () => true
): readonly UpgradeDefinition[] => {
  const start = Math.max(0, (level - 2) % UPGRADE_DEFINITIONS.length);
  return Array.from({ length: UPGRADE_DEFINITIONS.length }, (_, index) => (
    UPGRADE_DEFINITIONS[(start + index) % UPGRADE_DEFINITIONS.length]
  )).filter(isAvailable).slice(0, 3);
};
