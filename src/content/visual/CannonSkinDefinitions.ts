import { REWARD_CANNON_IDS, REWARD_COSMETICS, type RewardCannonId } from '../retention/RewardCosmeticDefinitions';
export type CannonSkinId = 'basic' | 'curve' | 'smoke' | 'rainbow' | 'lattice' | 'helix' | 'bloom' | 'spearhead' | 'gyre' | 'razor' | RewardCannonId;
export type CannonTrailKind = 'straight' | 'curve' | 'smoke' | 'rainbow' | 'lattice' | 'helix' | 'bloom' | 'gyre' | 'razor';
import type { CosmeticTier } from '../meta/EconomyDefinitions';

export interface CannonSkinDefinition {
  readonly id: CannonSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly tier: CosmeticTier;
  readonly priceNova: number;
  readonly acquisition: 'default' | 'nova' | 'event' | 'daily-wheel';
  readonly trail: CannonTrailKind;
  readonly accent: number;
  readonly projectileAccent: number;
}

/** Cosmetic loadouts: cannon, projectile body and trail move as one package. */
export const CANNON_SKIN_DEFINITIONS: readonly CannonSkinDefinition[] = [
  {
    id: 'basic',
    name: 'Pulse Standard',
    subtitle: 'Emisor de calibracion',
    description: 'El pulso original: limpio, rapido y facil de leer.',
    rarity: 'COMÚN',
    tier: 'common',
    priceNova: 600,
    acquisition: 'nova',
    trail: 'straight',
    accent: 0x75e6ff,
    projectileAccent: 0xfff6a8
  },
  {
    id: 'curve',
    name: 'Arc Needle',
    subtitle: 'Estela de arco fino',
    description: 'Una aguja violeta con una curva visual delicada al salir.',
    rarity: 'COMÚN',
    acquisition: 'nova',
    tier: 'common',
    priceNova: 1200,
    trail: 'curve',
    accent: 0xd2a8ff,
    projectileAccent: 0xffb8df
  },
  {
    id: 'smoke',
    name: 'Cinder Bloom',
    subtitle: 'Humo de combustion',
    description: 'El impacto deja una nube calida que se disipa rapidamente.',
    rarity: 'RARA',
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 1800,
    trail: 'smoke',
    accent: 0xffb86b,
    projectileAccent: 0xffe39a
  },
  {
    id: 'rainbow',
    name: 'Spectrum Drive',
    subtitle: 'Arcoiris prismático',
    description: 'Un proyectil prismático que pinta una estela multicolor.',
    rarity: 'RARA',
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 3600,
    trail: 'rainbow',
    accent: 0x65f2c2,
    projectileAccent: 0xffffff
  },
  {
    id: 'lattice',
    name: 'Lattice Halo',
    subtitle: 'Estela de resonancia',
    description: 'Un emisor de anillos que deja una retícula breve alrededor del pulso.',
    rarity: 'ÉPICA',
    tier: 'epic',
    priceNova: 4800,
    acquisition: 'nova',
    trail: 'lattice',
    accent: 0xff7ca8,
    projectileAccent: 0xffd3e8
  },
  {
    id: 'helix',
    name: 'Helix Lance',
    subtitle: 'Curva de retorno',
    description: 'Una lanza singular traza dos curvas serpenteantes antes de recuperar su eje.',
    rarity: 'ÉPICA',
    tier: 'epic',
    priceNova: 6000,
    acquisition: 'nova',
    trail: 'helix',
    accent: 0x8de8ff,
    projectileAccent: 0xffd978
  },
  {
    id: 'bloom',
    name: 'Bloomwake',
    subtitle: 'Estela de pétalos híbrida',
    description: 'Un emisor floral de cristal que abre una ráfaga luminosa en cada disparo.',
    rarity: 'RARA',
    tier: 'rare',
    priceNova: 2400,
    acquisition: 'nova',
    trail: 'bloom',
    accent: 0xff8fd8,
    projectileAccent: 0x9fffe8
  },
  {
    id: 'spearhead',
    name: 'Ivory Spear',
    subtitle: 'Módulos vinculados de marfil',
    description: 'Los cañones originales de Ivory Spear, con el mismo pulso directo y la estela elegida.',
    rarity: 'CAÑÓN INICIAL',
    tier: 'starter',
    priceNova: 0,
    acquisition: 'default',
    trail: 'straight',
    accent: 0x75e6ff,
    projectileAccent: 0xfff6a8
  },
  {
    id: 'gyre', name: 'Gyre Coil', subtitle: 'Resonador de inducción',
    description: 'Una cápsula de anillos menta traza tres ondas suaves antes de recuperar su eje.',
    rarity: 'ÉPICA', tier: 'epic', priceNova: 7200, acquisition: 'nova',
    trail: 'gyre', accent: 0x91e8d2, projectileAccent: 0xc5ffe8
  },
  {
    id: 'razor', name: 'Rift Saw', subtitle: 'Mandíbulas de corte',
    description: 'Una esquirla serrada dibuja una vibración angular y deja una cinta de cortes rosados.',
    rarity: 'ÉPICA', tier: 'epic', priceNova: 9600, acquisition: 'nova',
    trail: 'razor', accent: 0xff8faa, projectileAccent: 0xffdae9
  }
  ,...REWARD_COSMETICS.filter(reward => reward.family === 'cannon').map((reward, index) => ({
    id: reward.id as RewardCannonId, name: reward.name, subtitle: reward.subtitle, description: reward.description,
    rarity: reward.source === 'daily-wheel' ? 'RULETA DIARIA · EXCLUSIVA' : 'RETO SEMANAL · EXCLUSIVA',
    tier: 'epic' as const, priceNova: 0, acquisition: reward.source === 'daily-wheel' ? 'daily-wheel' as const : 'event' as const,
    trail: (['curve','helix','smoke','curve','gyre','straight','bloom','lattice','helix','razor'] as const)[index],
    accent: [0x8bc4ff,0xa5e5ff,0xff945b,0xb5a0ff,0x93efce,0xffd07d,0xff94cd,0xa1f7f3,0x69dacd,0xcced83][index],
    projectileAccent: [0x8bc4ff,0xa5e5ff,0xff945b,0xb5a0ff,0x93efce,0xffd07d,0xff94cd,0xa1f7f3,0x69dacd,0xcced83][index]
  }))
] as const;

export const isCannonSkinId = (value: unknown): value is CannonSkinId => (
  (REWARD_CANNON_IDS as readonly unknown[]).includes(value) || value === 'basic' || value === 'curve' || value === 'smoke' || value === 'rainbow' || value === 'lattice' || value === 'helix' || value === 'bloom' || value === 'spearhead' || value === 'gyre' || value === 'razor'
);

export const getCannonSkinDefinition = (id: CannonSkinId): CannonSkinDefinition => (
  CANNON_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? CANNON_SKIN_DEFINITIONS[0]
);
