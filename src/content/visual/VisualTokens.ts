export type PlayerSkinId = 'cyan' | 'violet';
export type FxQuality = 'low' | 'medium' | 'high';

export interface PlayerSkinTokens {
  readonly shadow: number;
  readonly outer: number;
  readonly body: number;
  readonly bodyDetail: number;
  readonly core: number;
  readonly weapon: number;
  readonly accent: number;
}

/** Shared palette for the first player skins. Skins are visual-only content. */
export const PLAYER_SKINS: Readonly<Record<PlayerSkinId, PlayerSkinTokens>> = {
  cyan: {
    shadow: 0x050816,
    outer: 0x75e6ff,
    body: 0x1b3158,
    bodyDetail: 0x2e5d88,
    core: 0x75e6ff,
    weapon: 0xb8ffd9,
    accent: 0xf4ffff
  },
  violet: {
    shadow: 0x090515,
    outer: 0xd2a8ff,
    body: 0x302050,
    bodyDetail: 0x68489a,
    core: 0xffb8df,
    weapon: 0xffe39a,
    accent: 0xfff4ff
  }
} as const;

export interface FxQualityTokens {
  readonly particleCount: number;
  readonly poolCapacity: number;
  readonly ringAlpha: number;
}

/** Starting budgets; tune only after comparing the same mobile scenario. */
export const FX_QUALITY: Readonly<Record<FxQuality, FxQualityTokens>> = {
  low: { particleCount: 3, poolCapacity: 96, ringAlpha: 0.45 },
  medium: { particleCount: 5, poolCapacity: 160, ringAlpha: 0.6 },
  high: { particleCount: 8, poolCapacity: 240, ringAlpha: 0.72 }
} as const;

export const PLAYER_VISUAL_TOKENS = {
  idlePulseAmplitude: 0.012,
  movementTiltRadians: 0.07,
  damageFlashSeconds: 0.1,
  damageSquash: 0.035
} as const;
