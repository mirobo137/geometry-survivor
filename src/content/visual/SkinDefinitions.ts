import {
  PLAYER_SKINS,
  type PlayerSkinId,
  type PlayerSkinTokens
} from './VisualTokens';

export type SkinAcquisition = 'default' | 'prototype-free';
export type PlayerSkinSignature = 'aurora' | 'prism' | 'solar' | 'verdant';

export interface PlayerSkinDefinition {
  readonly id: PlayerSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly palette: PlayerSkinTokens;
  readonly acquisition: SkinAcquisition;
  readonly signature: PlayerSkinSignature;
}

/**
 * Presentation content for the skin locker. Acquisition is intentionally a
 * free local prototype until a real meta-progression wallet is designed; the
 * data contract is ready for a cost/requirement without touching the UI.
 */
export const PLAYER_SKIN_DEFINITIONS: readonly PlayerSkinDefinition[] = [
  {
    id: 'cyan',
    name: 'Aurora Strider',
    subtitle: 'La señal original',
    description: 'Aletas de navegación y una corona de luz para abrir camino.',
    rarity: 'INICIAL',
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
    acquisition: 'prototype-free',
    signature: 'prism'
  },
  {
    id: 'amber',
    name: 'Solar Bastion',
    subtitle: 'Núcleo de forja',
    description: 'Una silueta blindada con aspas solares y pulsos de calor.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.amber,
    acquisition: 'prototype-free',
    signature: 'solar'
  },
  {
    id: 'emerald',
    name: 'Verdant Vector',
    subtitle: 'Pulso biocristalino',
    description: 'Cuatro hojas de energía marcan su dirección y respiran al moverse.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.emerald,
    acquisition: 'prototype-free',
    signature: 'verdant'
  }
] as const;

export const isPlayerSkinId = (value: unknown): value is PlayerSkinId => (
  value === 'cyan' || value === 'violet' || value === 'amber' || value === 'emerald'
);

export const getPlayerSkinDefinition = (id: PlayerSkinId): PlayerSkinDefinition => (
  PLAYER_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? PLAYER_SKIN_DEFINITIONS[0]
);
