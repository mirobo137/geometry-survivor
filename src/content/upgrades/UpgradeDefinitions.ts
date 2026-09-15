import type {
  WeaponEvolutionId
} from '../weapons/WeaponEvolutionDefinitions';

/** Developer-only focused paths. They all use the same real-run contract. */
export type WeaponPathId =
  | 'projectile'
  | 'orbit'
  | 'chain'
  | 'boomerang'
  | 'pulse_ring'
  | 'magnetic_charge';

export type WeaponRank = 2 | 3 | 4 | 5 | 6 | 7;

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
  | 'projectile_rank_2'
  | 'projectile_rank_3'
  | 'projectile_rank_4'
  | 'projectile_rank_5'
  | 'projectile_rank_6'
  | 'projectile_rank_7'
  | 'projectile_evolution_offer'
  | 'orbit_rank_2'
  | 'orbit_rank_3'
  | 'orbit_rank_4'
  | 'orbit_rank_5'
  | 'orbit_rank_6'
  | 'orbit_rank_7'
  | 'orbit_evolution_offer'
  | 'chain_rank_2'
  | 'chain_rank_3'
  | 'chain_rank_4'
  | 'chain_rank_5'
  | 'chain_rank_6'
  | 'chain_rank_7'
  | 'chain_evolution_offer'
  | 'boomerang_rank_2'
  | 'boomerang_rank_3'
  | 'boomerang_rank_4'
  | 'boomerang_rank_5'
  | 'boomerang_rank_6'
  | 'boomerang_rank_7'
  | 'boomerang_evolution_offer'
  | 'pulse_ring_rank_2'
  | 'pulse_ring_rank_3'
  | 'pulse_ring_rank_4'
  | 'pulse_ring_rank_5'
  | 'pulse_ring_rank_6'
  | 'pulse_ring_rank_7'
  | 'pulse_ring_evolution_offer'
  | 'magnetic_charge_rank_2'
  | 'magnetic_charge_rank_3'
  | 'magnetic_charge_rank_4'
  | 'magnetic_charge_rank_5'
  | 'magnetic_charge_rank_6'
  | 'magnetic_charge_rank_7'
  | 'magnetic_charge_evolution_offer'
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
  | { readonly type: 'weaponRank'; readonly family: WeaponPathId; readonly rank: WeaponRank }
  | { readonly type: 'evolutionOffer'; readonly family: WeaponPathId }
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

/** Developer-only sequential cards for all focused weapon paths. */
export const PROJECTILE_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'projectile_rank_2',
    title: 'Projectile · Rango II',
    description: 'Doble cañón: dispara desde ambos emisores.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'projectile_rank_3',
    title: 'Projectile · Rango III',
    description: 'Impacto enfocado: el daño base sube a 18.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'projectile_rank_4',
    title: 'Projectile · Rango IV',
    description: 'Ráfaga rápida: el intervalo baja a 0.47 s.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'projectile_rank_5',
    title: 'Projectile · Rango V',
    description: 'Impacto reforzado: el daño base sube a 22.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'projectile_rank_6',
    title: 'Projectile · Rango VI',
    description: 'Acelerador: la velocidad del proyectil sube a 540.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'projectile_rank_7',
    title: 'Projectile · Rango VII',
    description: 'Ciclo optimizado: el intervalo baja a 0.39 s. Evolución lista.',
    effect: { type: 'weaponRank', family: 'projectile', rank: 7 },
    maxStacks: 1
  }
];

export const ORBIT_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'orbit_rank_2',
    title: 'Órbita · Rango II',
    description: 'Órbita extendida: el radio orbital sube a 76.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'orbit_rank_3',
    title: 'Órbita · Rango III',
    description: 'Segundo satélite: añade una segunda hoja espaciada.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'orbit_rank_4',
    title: 'Órbita · Rango IV',
    description: 'Filos reforzados: el daño de cada hoja sube a 22.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'orbit_rank_5',
    title: 'Órbita · Rango V',
    description: 'Tercer satélite: añade una tercera hoja espaciada.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'orbit_rank_6',
    title: 'Órbita · Rango VI',
    description: 'Órbita exterior: el radio orbital sube a 94.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'orbit_rank_7',
    title: 'Órbita · Rango VII',
    description: 'Corona completa: añade una cuarta hoja. Evolución lista.',
    effect: { type: 'weaponRank', family: 'orbit', rank: 7 },
    maxStacks: 1
  }
];

export const CHAIN_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'chain_rank_2',
    title: 'Cadena · Rango II',
    description: 'Sobrecarga eléctrica: el daño por enlace sube a 16.',
    effect: { type: 'weaponRank', family: 'chain', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'chain_rank_3',
    title: 'Cadena · Rango III',
    description: 'Cuarto enlace: la cadena alcanza un objetivo adicional.',
    effect: { type: 'weaponRank', family: 'chain', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'chain_rank_4',
    title: 'Cadena · Rango IV',
    description: 'Conductividad: el salto máximo sube a 210.',
    effect: { type: 'weaponRank', family: 'chain', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'chain_rank_5',
    title: 'Cadena · Rango V',
    description: 'Recarga de arco: el intervalo baja a 1.05 s.',
    effect: { type: 'weaponRank', family: 'chain', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'chain_rank_6',
    title: 'Cadena · Rango VI',
    description: 'Núcleo de descarga: el daño por enlace sube a 18.',
    effect: { type: 'weaponRank', family: 'chain', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'chain_rank_7',
    title: 'Cadena · Rango VII',
    description: 'Quinto enlace: completa la cadena. Evolución lista.',
    effect: { type: 'weaponRank', family: 'chain', rank: 7 },
    maxStacks: 1
  }
];

export const BOOMERANG_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'boomerang_rank_2',
    title: 'Búmeran · Rango II',
    description: 'Filo templado: el daño de ida y regreso sube a 16.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'boomerang_rank_3',
    title: 'Búmeran · Rango III',
    description: 'Brazo extendido: la distancia de salida sube a 280.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'boomerang_rank_4',
    title: 'Búmeran · Rango IV',
    description: 'Retorno acelerado: la vuelta sube a 500 u/s.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'boomerang_rank_5',
    title: 'Búmeran · Rango V',
    description: 'Hoja amplia: el radio de impacto sube a 13.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'boomerang_rank_6',
    title: 'Búmeran · Rango VI',
    description: 'Relanzamiento: el intervalo baja a 1.10 s.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'boomerang_rank_7',
    title: 'Búmeran · Rango VII',
    description: 'Núcleo de impacto: el daño sube a 19. Evolución lista.',
    effect: { type: 'weaponRank', family: 'boomerang', rank: 7 },
    maxStacks: 1
  }
];

export const PULSE_RING_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'pulse_ring_rank_2',
    title: 'Pulso · Rango II',
    description: 'Carga ágil: la preparación baja a 0.50 s.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_rank_3',
    title: 'Pulso · Rango III',
    description: 'Frente extendido: el radio final sube a 220.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_rank_4',
    title: 'Pulso · Rango IV',
    description: 'Impulso de escape: el empuje sube a 16.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_rank_5',
    title: 'Pulso · Rango V',
    description: 'Cresta reforzada: el daño sube a 32.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_rank_6',
    title: 'Pulso · Rango VI',
    description: 'Reactivación: el intervalo baja a 3.30 s.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_rank_7',
    title: 'Pulso · Rango VII',
    description: 'Frente completo: el radio final sube a 240. Evolución lista.',
    effect: { type: 'weaponRank', family: 'pulse_ring', rank: 7 },
    maxStacks: 1
  }
];

export const MAGNETIC_CHARGE_WEAPON_PATH_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'magnetic_charge_rank_2',
    title: 'Magnética · Rango II',
    description: 'Lanzador ágil: el vuelo baja a 0.34 s.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 2 },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_rank_3',
    title: 'Magnética · Rango III',
    description: 'Banda extendida: el radio exterior sube a 166.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 3 },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_rank_4',
    title: 'Magnética · Rango IV',
    description: 'Captación amplia: el radio de atracción sube a 200.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 4 },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_rank_5',
    title: 'Magnética · Rango V',
    description: 'Carga reforzada: el daño por tick sube a 22.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 5 },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_rank_6',
    title: 'Magnética · Rango VI',
    description: 'Recarga magnética: el intervalo baja a 4.60 s.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 6 },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_rank_7',
    title: 'Magnética · Rango VII',
    description: 'Campo persistente: la detonación dura 1.60 s. Evolución lista.',
    effect: { type: 'weaponRank', family: 'magnetic_charge', rank: 7 },
    maxStacks: 1
  }
];

/**
 * A milestone card is shown inside a normal three-card hand after rank VII.
 * It opens the two mutually-exclusive evolution routes without consuming the
 * level-up until one of those routes is confirmed.
 */
export const WEAPON_EVOLUTION_OFFER_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'projectile_evolution_offer',
    title: 'Evolucion disponible',
    description: 'Projectile esta calibrado. Compara Rail Lance y Pulse Volley antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'projectile' },
    maxStacks: 1
  },
  {
    id: 'orbit_evolution_offer',
    title: 'Evolución disponible',
    description: 'Órbita está calibrada. Compara Solar Crown y Graviton Halo antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'orbit' },
    maxStacks: 1
  },
  {
    id: 'chain_evolution_offer',
    title: 'Evolución disponible',
    description: 'Cadena está calibrada. Compara Closed Circuit y Thunderhead antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'chain' },
    maxStacks: 1
  },
  {
    id: 'boomerang_evolution_offer',
    title: 'Evolución disponible',
    description: 'Búmeran está calibrado. Compara Twin Comet y Singularity Return antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'boomerang' },
    maxStacks: 1
  },
  {
    id: 'pulse_ring_evolution_offer',
    title: 'Evolución disponible',
    description: 'Pulso está calibrado. Compara Echo Shock y Compression Wave antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'pulse_ring' },
    maxStacks: 1
  },
  {
    id: 'magnetic_charge_evolution_offer',
    title: 'Evolución disponible',
    description: 'Magnética está calibrada. Compara Event Horizon y Polar Collapse antes de confirmar.',
    effect: { type: 'evolutionOffer', family: 'magnetic_charge' },
    maxStacks: 1
  }
];

export const isWeaponPathId = (value: unknown): value is WeaponPathId => (
  value === 'projectile'
  || value === 'orbit'
  || value === 'chain'
  || value === 'boomerang'
  || value === 'pulse_ring'
  || value === 'magnetic_charge'
);

export const WEAPON_PATH_RANK_DEFINITIONS: Readonly<Record<WeaponPathId, readonly UpgradeDefinition[]>> = {
  projectile: PROJECTILE_WEAPON_PATH_DEFINITIONS,
  orbit: ORBIT_WEAPON_PATH_DEFINITIONS,
  chain: CHAIN_WEAPON_PATH_DEFINITIONS,
  boomerang: BOOMERANG_WEAPON_PATH_DEFINITIONS,
  pulse_ring: PULSE_RING_WEAPON_PATH_DEFINITIONS,
  magnetic_charge: MAGNETIC_CHARGE_WEAPON_PATH_DEFINITIONS
};

export const WEAPON_PATH_BASE_UPGRADE_IDS: Readonly<Record<WeaponPathId, UpgradeId | null>> = {
  projectile: null,
  orbit: 'orbit_blade',
  chain: 'chain_lightning',
  boomerang: 'vector_boomerang',
  pulse_ring: 'pulse_ring',
  magnetic_charge: 'magnetic_charge'
};

const WEAPON_PATH_EVOLUTION_OFFER_IDS: Readonly<Record<WeaponPathId, UpgradeId>> = {
  projectile: 'projectile_evolution_offer',
  orbit: 'orbit_evolution_offer',
  chain: 'chain_evolution_offer',
  boomerang: 'boomerang_evolution_offer',
  pulse_ring: 'pulse_ring_evolution_offer',
  magnetic_charge: 'magnetic_charge_evolution_offer'
};

export const getProjectileWeaponPathChoices = (
  rank: number,
  isAvailable: (upgrade: UpgradeDefinition) => boolean = () => true
): readonly UpgradeDefinition[] => {
  const definition = PROJECTILE_WEAPON_PATH_DEFINITIONS.find((candidate) => (
    candidate.effect.type === 'weaponRank' && candidate.effect.rank === rank
  ));
  return definition !== undefined && isAvailable(definition) ? [definition] : [];
};

export const getWeaponPathRankChoices = (
  path: WeaponPathId,
  rank: number,
  isAvailable: (upgrade: UpgradeDefinition) => boolean = () => true
): readonly UpgradeDefinition[] => {
  const definition = WEAPON_PATH_RANK_DEFINITIONS[path].find((candidate) => (
    candidate.effect.type === 'weaponRank' && candidate.effect.rank === rank
  ));
  return definition !== undefined && isAvailable(definition) ? [definition] : [];
};

export const getProjectileEvolutionOffer = (): UpgradeDefinition => (
  WEAPON_EVOLUTION_OFFER_DEFINITIONS[0]
);

export const getWeaponPathEvolutionOffer = (path: WeaponPathId): UpgradeDefinition => (
  WEAPON_EVOLUTION_OFFER_DEFINITIONS.find((candidate) => (
    candidate.id === WEAPON_PATH_EVOLUTION_OFFER_IDS[path]
  ))!
);

export const getWeaponPathBaseUpgradeId = (path: WeaponPathId): UpgradeId | null => (
  WEAPON_PATH_BASE_UPGRADE_IDS[path]
);

export const getWeaponPathEvolutionOfferId = (path: WeaponPathId): UpgradeId => (
  WEAPON_PATH_EVOLUTION_OFFER_IDS[path]
);

export const getWeaponPathForEvolutionOffer = (upgradeId: UpgradeId): WeaponPathId | null => {
  for (const path of Object.keys(WEAPON_PATH_EVOLUTION_OFFER_IDS) as WeaponPathId[]) {
    if (WEAPON_PATH_EVOLUTION_OFFER_IDS[path] === upgradeId) return path;
  }
  return null;
};

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
