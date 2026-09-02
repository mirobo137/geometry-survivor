export type CannonSkinId = 'basic' | 'curve' | 'smoke' | 'rainbow';
export type CannonTrailKind = 'straight' | 'curve' | 'smoke' | 'rainbow';
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
  }
] as const;

export const isCannonSkinId = (value: unknown): value is CannonSkinId => (
  value === 'basic' || value === 'curve' || value === 'smoke' || value === 'rainbow'
);

export const getCannonSkinDefinition = (id: CannonSkinId): CannonSkinDefinition => (
  CANNON_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? CANNON_SKIN_DEFINITIONS[0]
);
