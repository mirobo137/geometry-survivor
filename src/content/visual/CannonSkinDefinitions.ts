export type CannonSkinId = 'basic' | 'curve' | 'smoke' | 'rainbow' | 'lattice' | 'helix' | 'bloom';
export type CannonTrailKind = 'straight' | 'curve' | 'smoke' | 'rainbow' | 'lattice' | 'helix' | 'bloom';
import type { CosmeticTier } from '../meta/EconomyDefinitions';

export interface CannonSkinDefinition {
  readonly id: CannonSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly tier: CosmeticTier;
  readonly priceNova: number;
  readonly acquisition: 'default' | 'nova';
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
    rarity: 'INICIAL',
    tier: 'starter',
    priceNova: 0,
    acquisition: 'default',
    trail: 'straight',
    accent: 0x75e6ff,
    projectileAccent: 0xfff6a8
  },
  {
    id: 'curve',
    name: 'Arc Needle',
    subtitle: 'Estela de arco fino',
    description: 'Una aguja violeta con una curva visual delicada al salir.',
    rarity: 'DESBLOQUEABLE',
    acquisition: 'nova',
    tier: 'common',
    priceNova: 250,
    trail: 'curve',
    accent: 0xd2a8ff,
    projectileAccent: 0xffb8df
  },
  {
    id: 'smoke',
    name: 'Cinder Bloom',
    subtitle: 'Humo de combustion',
    description: 'El impacto deja una nube calida que se disipa rapidamente.',
    rarity: 'NUEVA · DEMO',
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 600,
    trail: 'smoke',
    accent: 0xffb86b,
    projectileAccent: 0xffe39a
  },
  {
    id: 'rainbow',
    name: 'Spectrum Drive',
    subtitle: 'Arcoiris prismático',
    description: 'Un proyectil prismático que pinta una estela multicolor.',
    rarity: 'NUEVA · DEMO',
    acquisition: 'nova',
    tier: 'epic',
    priceNova: 1200,
    trail: 'rainbow',
    accent: 0x65f2c2,
    projectileAccent: 0xffffff
  },
  {
    id: 'lattice',
    name: 'Lattice Halo',
    subtitle: 'Estela de resonancia',
    description: 'Un emisor de anillos que deja una retícula breve alrededor del pulso.',
    rarity: 'NUEVA · DEMO',
    tier: 'epic',
    priceNova: 1800,
    acquisition: 'nova',
    trail: 'lattice',
    accent: 0xff7ca8,
    projectileAccent: 0xffd3e8
  },
  {
    id: 'helix',
    name: 'Helix Lance',
    subtitle: 'Curva de retorno',
    description: 'Una lanza premium que serpentea en dos pulsos antes de recuperar su eje.',
    rarity: 'NUEVA · PREMIUM',
    tier: 'epic',
    priceNova: 3000,
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
    rarity: 'NUEVA · HÍBRIDA',
    tier: 'epic',
    priceNova: 0,
    acquisition: 'nova',
    trail: 'bloom',
    accent: 0xff8fd8,
    projectileAccent: 0x9fffe8
  }
] as const;

export const isCannonSkinId = (value: unknown): value is CannonSkinId => (
  value === 'basic' || value === 'curve' || value === 'smoke' || value === 'rainbow' || value === 'lattice' || value === 'helix' || value === 'bloom'
);

export const getCannonSkinDefinition = (id: CannonSkinId): CannonSkinDefinition => (
  CANNON_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? CANNON_SKIN_DEFINITIONS[0]
);
