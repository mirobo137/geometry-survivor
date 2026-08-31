import {
  PLAYER_SKINS,
  type PlayerSkinId,
  type PlayerSkinTokens
} from './VisualTokens';

export type SkinAcquisition = 'default' | 'prototype-free';

export interface PlayerSkinDefinition {
  readonly id: PlayerSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly palette: PlayerSkinTokens;
  readonly acquisition: SkinAcquisition;
}

/**
 * Presentation content for the skin locker. Acquisition is intentionally a
 * free local prototype until a real meta-progression wallet is designed; the
 * data contract is ready for a cost/requirement without touching the UI.
 */
export const PLAYER_SKIN_DEFINITIONS: readonly PlayerSkinDefinition[] = [
  {
    id: 'cyan',
    name: 'Núcleo Aurora',
    subtitle: 'La señal original',
    description: 'Una geometría fría y estable para entrar al protocolo.',
    rarity: 'INICIAL',
    palette: PLAYER_SKINS.cyan,
    acquisition: 'default'
  },
  {
    id: 'violet',
    name: 'Prisma Violeta',
    subtitle: 'Energía de eclipse',
    description: 'Capas violetas con emisores dorados para una presencia más intensa.',
    rarity: 'DESBLOQUEABLE',
    palette: PLAYER_SKINS.violet,
    acquisition: 'prototype-free'
  }
] as const;

export const isPlayerSkinId = (value: unknown): value is PlayerSkinId => (
  value === 'cyan' || value === 'violet'
);

export const getPlayerSkinDefinition = (id: PlayerSkinId): PlayerSkinDefinition => (
  PLAYER_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? PLAYER_SKIN_DEFINITIONS[0]
);
