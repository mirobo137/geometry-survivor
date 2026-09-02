import {
  PLAYER_SKINS,
  type PlayerSkinId,
  type PlayerSkinTokens
} from './VisualTokens';
import type { CosmeticTier } from '../meta/EconomyDefinitions';

export type SkinAcquisition = 'default' | 'nova';
export type PlayerSkinSignature = 'aurora' | 'prism' | 'solar' | 'verdant';

export interface PlayerSkinDefinition {
  readonly id: PlayerSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly tier: CosmeticTier;
  readonly priceNova: number;
  readonly palette: PlayerSkinTokens;
  readonly acquisition: SkinAcquisition;
  readonly signature: PlayerSkinSignature;
}

/**
 * Presentation content for the skin locker. Cosmetic ownership is local and
 * data-driven; the Nova wallet remains independent from gameplay balance.
 */
export const PLAYER_SKIN_DEFINITIONS: readonly PlayerSkinDefinition[] = [
  {
    id: 'cyan',
    name: 'Aurora Strider',
    subtitle: 'La señal original',
    description: 'Aletas de navegación y una corona de luz para abrir camino.',
    rarity: 'INICIAL',
    tier: 'starter',
    priceNova: 0,
    palette: PLAYER_SKINS.cyan,
    acquisition: 'default',
    signature: 'aurora'
  },
  {
    id: 'violet',
    name: 'Eclipse Prism',
    subtitle: 'Energía de eclipse',
    description: 'Fragmentos cristalinos que orbitan el núcleo como una armadura viva.',
    rarity: 'DESBLOQUEABLE',
    palette: PLAYER_SKINS.violet,
    acquisition: 'nova',
    tier: 'common',
    priceNova: 250,
    signature: 'prism'
  },
  {
    id: 'amber',
    name: 'Solar Bastion',
    subtitle: 'Núcleo de forja',
    description: 'Una silueta blindada con aspas solares y pulsos de calor.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.amber,
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 600,
    signature: 'solar'
  },
  {
    id: 'emerald',
    name: 'Verdant Vector',
    subtitle: 'Pulso biocristalino',
    description: 'Cuatro hojas de energía marcan su dirección y respiran al moverse.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.emerald,
    acquisition: 'nova',
    tier: 'epic',
    priceNova: 1200,
    signature: 'verdant'
  }
] as const;

export const isPlayerSkinId = (value: unknown): value is PlayerSkinId => (
  value === 'cyan' || value === 'violet' || value === 'amber' || value === 'emerald'
);

export const getPlayerSkinDefinition = (id: PlayerSkinId): PlayerSkinDefinition => (
  PLAYER_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? PLAYER_SKIN_DEFINITIONS[0]
);
