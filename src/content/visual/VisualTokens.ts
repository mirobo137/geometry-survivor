export type PlayerSkinId = 'cyan' | 'violet' | 'amber' | 'emerald';
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
  },
  amber: {
    shadow: 0x130b03,
    outer: 0xffb86b,
    body: 0x53321d,
    bodyDetail: 0x9b5c2d,
    core: 0xffe39a,
    weapon: 0xfff1bf,
    accent: 0xfffff2
  },
  emerald: {
    shadow: 0x03120f,
    outer: 0x65f2c2,
    body: 0x123d3d,
    bodyDetail: 0x2f8d7c,
    core: 0xb8ffd9,
    weapon: 0x75e6ff,
    accent: 0xe5fff3
  }
} as const;

export interface PlayerSkinMotionTokens {
  readonly signatureSpin: number;
  readonly signaturePulse: number;
}

/** Motion accents are presentation-only and never affect the player model. */
export const PLAYER_SKIN_MOTION: Readonly<Record<PlayerSkinId, PlayerSkinMotionTokens>> = {
  cyan: { signatureSpin: 0.12, signaturePulse: 0.012 },
  violet: { signatureSpin: -0.18, signaturePulse: 0.02 },
  amber: { signatureSpin: 0.28, signaturePulse: 0.016 },
  emerald: { signatureSpin: -0.34, signaturePulse: 0.024 }
} as const;

export interface FxQualityTokens {
  readonly particleCount: number;
  readonly poolCapacity: number;
  readonly ringAlpha: number;
  readonly damageNumberLimit: number;
  readonly healthBarLimit: number;
}

/** Starting budgets; tune only after comparing the same mobile scenario. */
export const FX_QUALITY: Readonly<Record<FxQuality, FxQualityTokens>> = {
  low: { particleCount: 3, poolCapacity: 96, ringAlpha: 0.45, damageNumberLimit: 0, healthBarLimit: 8 },
  medium: { particleCount: 5, poolCapacity: 160, ringAlpha: 0.6, damageNumberLimit: 16, healthBarLimit: 16 },
  high: { particleCount: 8, poolCapacity: 240, ringAlpha: 0.72, damageNumberLimit: 24, healthBarLimit: 24 }
} as const;

export const PLAYER_VISUAL_TOKENS = {
  idlePulseAmplitude: 0.012,
  movementTiltRadians: 0.07,
  damageFlashSeconds: 0.1,
  damageSquash: 0.035
} as const;
