import { REWARD_BACKGROUND_IDS, REWARD_COSMETICS, type RewardBackgroundId } from '../retention/RewardCosmeticDefinitions';
export type BackgroundId = 'deep-space' | 'ion-storm' | 'solar-drift' | 'crystal-field' | 'nacre-orbit' | 'vesper-bloom' | 'tidal-veil' | 'silent-archive' | 'lunar-fault' | 'leviathan-wake' | RewardBackgroundId;
export type BackgroundPattern = 'constellation' | 'nebula' | 'solar' | 'crystal';
import type { CosmeticTier } from '../meta/EconomyDefinitions';

export interface BackgroundTokens {
  readonly base: number;
  readonly glow: number;
  readonly accent: number;
  readonly secondary: number;
  readonly pattern: BackgroundPattern;
}

export interface BackgroundDefinition {
  readonly id: BackgroundId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly tier: CosmeticTier;
  readonly priceNova: number;
  readonly acquisition: 'default' | 'nova' | 'event' | 'daily-wheel';
  readonly tokens: BackgroundTokens;
}

/** Presentation-only themes. They never alter arena, enemies, damage or difficulty. */
export const BACKGROUND_DEFINITIONS: readonly BackgroundDefinition[] = [
  {
    id: 'nacre-orbit',
    name: 'Órbita de Nacre',
    subtitle: 'Silencio entre mundos',
    description: 'Un gigante anillado en penumbra y una luna distante.',
    rarity: 'ÉPICA',
    tier: 'epic',
    priceNova: 4800,
    acquisition: 'nova',
    tokens: { base: 0x080e1c, glow: 0x243745, accent: 0x718b90, secondary: 0x899188, pattern: 'constellation' }
  },
  {
    id: 'vesper-bloom',
    name: 'Flor del Ocaso',
    subtitle: 'Materia que despierta',
    description: 'Una flor astral facetada en la periferia.',
    rarity: 'ÉPICA',
    tier: 'epic',
    priceNova: 3600,
    acquisition: 'nova',
    tokens: { base: 0x080b17, glow: 0x3d315a, accent: 0x9b8aac, secondary: 0x79aaa5, pattern: 'crystal' }
  },
  {
    id: 'tidal-veil',
    name: 'Velo de Marea',
    subtitle: 'Corrientes bajo el vacío',
    description: 'Nebulosas pintadas en los bordes y un centro sereno.',
    rarity: 'RARA',
    tier: 'rare',
    priceNova: 2400,
    acquisition: 'nova',
    tokens: { base: 0x080b17, glow: 0x243742, accent: 0x668d91, secondary: 0x93816b, pattern: 'nebula' }
  },
  {
    id: 'deep-space',
    name: 'Vacío profundo',
    subtitle: 'La señal original',
    description: 'Nubes azules e índigo en un vacío profundo, con el centro despejado.',
    rarity: 'INICIAL',
    tier: 'starter',
    priceNova: 0,
    acquisition: 'default',
    tokens: { base: 0x080b17, glow: 0x18315d, accent: 0x75e6ff, secondary: 0xaab7d8, pattern: 'constellation' }
  },
  {
    id: 'ion-storm',
    name: 'Tormenta iónica',
    subtitle: 'Nubes de carga',
    description: 'Velos de vapor iónico teal y cian alrededor de una zona central oscura.',
    rarity: 'COMÚN',
    acquisition: 'nova',
    tier: 'common',
    priceNova: 600,
    tokens: { base: 0x071321, glow: 0x174c5a, accent: 0x65f2c2, secondary: 0x75e6ff, pattern: 'nebula' }
  },
  {
    id: 'solar-drift',
    name: 'Deriva solar',
    subtitle: 'Ruta de forja',
    description: 'Corrientes pictóricas de cobre y ámbar, contenidas en los bordes.',
    rarity: 'RARA',
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 1200,
    tokens: { base: 0x170d0d, glow: 0x5b2b1f, accent: 0xffb86b, secondary: 0xffe39a, pattern: 'solar' }
  },
  {
    id: 'crystal-field',
    name: 'Campo cristal',
    subtitle: 'Geometría suspendida',
    description: 'Estratos de geoda violeta y teal que enmarcan el espacio de combate.',
    rarity: 'RARA',
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 1800,
    tokens: { base: 0x100b20, glow: 0x38205b, accent: 0xd2a8ff, secondary: 0x75e6ff, pattern: 'crystal' }
  },
  {
    id: 'silent-archive', name: 'Archivo Silente', subtitle: 'Bóvedas que olvidaron las estrellas',
    description: 'Arcos monumentales de cerámica erosionada descansan sobre un abismo teal.',
    rarity: 'ÉPICA', tier: 'epic', priceNova: 6000, acquisition: 'nova',
    tokens: { base: 0x070e16, glow: 0x243f45, accent: 0xa0c1bc, secondary: 0xb8ad91, pattern: 'constellation' }
  },
  {
    id: 'lunar-fault', name: 'Falla Lunar', subtitle: 'El silencio de una corteza rota',
    description: 'Terrazas de cráter y basalto ceniciento enmarcan un golfo oscuro con luz rasante.',
    rarity: 'ÉPICA', tier: 'epic', priceNova: 7200, acquisition: 'nova',
    tokens: { base: 0x0c0e15, glow: 0x343b44, accent: 0xb1b7c2, secondary: 0xa58268, pattern: 'solar' }
  },
  {
    id: 'leviathan-wake', name: 'Estela del Leviatán', subtitle: 'Un fósil entre las mareas negras',
    description: 'Costillas colosales de jade y nácar se pierden en una profundidad azul abisal.',
    rarity: 'ÉPICA', tier: 'epic', priceNova: 9600, acquisition: 'nova',
    tokens: { base: 0x050d17, glow: 0x183f41, accent: 0x82bcaf, secondary: 0x91aabd, pattern: 'nebula' }
  }
  ,...REWARD_COSMETICS.filter(reward => reward.family === 'background').map((reward, index) => ({
    id: reward.id as RewardBackgroundId, name: reward.name, subtitle: reward.subtitle, description: reward.description,
    rarity: reward.source === 'daily-wheel' ? 'RULETA DIARIA · EXCLUSIVA' : 'RETO SEMANAL · EXCLUSIVA',
    tier: 'epic' as const, priceNova: 0, acquisition: reward.source === 'daily-wheel' ? 'daily-wheel' as const : 'event' as const,
    tokens: { base: 0x080b14, glow: 0x283240,
      accent: [0xb78e76,0x93c4d0,0xb97891,0xbfb9a2,0xb3c2cc,0xbea174,0xa3cac9,0xb2957b,0xb39aa5,0x87b9a4][index],
      secondary: 0x8f9caa, pattern: 'nebula' as const }
  }))
] as const;

export const isBackgroundId = (value: unknown): value is BackgroundId => (
  (REWARD_BACKGROUND_IDS as readonly unknown[]).includes(value) ||
  value === 'deep-space' || value === 'ion-storm' || value === 'solar-drift' || value === 'crystal-field'
  || value === 'nacre-orbit' || value === 'vesper-bloom' || value === 'tidal-veil'
  || value === 'silent-archive' || value === 'lunar-fault' || value === 'leviathan-wake'
);

export const getBackgroundDefinition = (id: BackgroundId): BackgroundDefinition => (
  BACKGROUND_DEFINITIONS.find((definition) => definition.id === id) ?? BACKGROUND_DEFINITIONS.find((definition) => definition.id === 'deep-space')!
);
