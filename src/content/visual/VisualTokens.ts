export type PlayerSkinId = 'cyan' | 'violet' | 'amber' | 'emerald' | 'obsidian' | 'nova' | 'manta' | 'spearhead' | 'corsair' | 'nautilus' | 'asterion' | 'solstice';
export type FxQuality = 'low' | 'medium' | 'high';

export interface PlayerSkinTokens {
  readonly shadow: number;
  readonly outer: number;
  readonly body: number;
  readonly bodyDetail: number;
  readonly core: number;
  readonly accent: number;
}

/** Shared palette for the first player skins. Skins are visual-only content. */
export const PLAYER_SKINS: Readonly<Record<PlayerSkinId, PlayerSkinTokens>> = {
  cyan: {
    shadow: 0x050816,
    outer: 0x75e6ff,
    body: 0x6397bc,
    bodyDetail: 0x2e5d88,
    core: 0x75e6ff,
    accent: 0xf4ffff
  },
  violet: {
    shadow: 0x090515,
    outer: 0xd2a8ff,
    body: 0x9e7fc4,
    bodyDetail: 0x68489a,
    core: 0xffb8df,
    accent: 0xfff4ff
  },
  amber: {
    shadow: 0x130b03,
    outer: 0xffb86b,
    body: 0xc39a62,
    bodyDetail: 0x9b5c2d,
    core: 0xffe39a,
    accent: 0xfffff2
  },
  emerald: {
    shadow: 0x03120f,
    outer: 0x65f2c2,
    body: 0x64ae96,
    bodyDetail: 0x2f8d7c,
    core: 0xb8ffd9,
    accent: 0xe5fff3
  },
  obsidian: {
    shadow: 0x0d0610,
    outer: 0xff7ca8,
    body: 0xb47695,
    bodyDetail: 0x7e3f61,
    core: 0xffb8d9,
    accent: 0xfff0fa
  },
  nova: {
    shadow: 0x080b18,
    outer: 0x8de8ff,
    body: 0xb6bfd0,
    bodyDetail: 0x687995,
    core: 0xffd978,
    accent: 0xfff4cf
  },
  manta: {
    shadow: 0x050e18, outer: 0xd5eee8, body: 0xffefd9,
    bodyDetail: 0x446477, core: 0x88fff0, accent: 0xfff7e6
  },
  spearhead: {
    shadow: 0x050e18, outer: 0x75e6ff, body: 0xffefd9,
    bodyDetail: 0x446477, core: 0x75e6ff, accent: 0xffd978
  },
  corsair: {
    shadow: 0x140812, outer: 0xff809e, body: 0xa32f4b,
    bodyDetail: 0x49273a, core: 0x9ce8ff, accent: 0xffecef
  },
  nautilus: {
    shadow: 0x060e1b, outer: 0x91dacd, body: 0x34659e,
    bodyDetail: 0x8f774d, core: 0x8effdc, accent: 0xffecc5
  },
  asterion: {
    shadow: 0x07111a, outer: 0x83f4e4, body: 0xb7cad1,
    bodyDetail: 0x465d70, core: 0x80ffdf, accent: 0xffe2a0
  },
  solstice: {
    shadow: 0x100b13, outer: 0xffd685, body: 0xbda570,
    bodyDetail: 0x333440, core: 0xff536d, accent: 0xffefd0
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
  emerald: { signatureSpin: -0.34, signaturePulse: 0.024 },
  obsidian: { signatureSpin: 0.22, signaturePulse: 0.018 },
  nova: { signatureSpin: -0.26, signaturePulse: 0.021 },
  manta: { signatureSpin: 0, signaturePulse: 0.012 },
  spearhead: { signatureSpin: 0, signaturePulse: 0 },
  corsair: { signatureSpin: 0, signaturePulse: 0 },
  nautilus: { signatureSpin: 0, signaturePulse: 0 },
  asterion: { signatureSpin: 0, signaturePulse: 0 },
  solstice: { signatureSpin: 0, signaturePulse: 0 }
} as const;

export interface FxQualityTokens {
  readonly particleCount: number;
  readonly poolCapacity: number;
  readonly ringAlpha: number;
  readonly projectileTrailAlpha: number;
  readonly projectileTrailLimit: number;
  readonly projectileGlowLimit: number;
  readonly damageNumberLimit: number;
  readonly healthBarLimit: number;
}

/** Starting budgets; tune only after comparing the same mobile scenario. */
export const FX_QUALITY: Readonly<Record<FxQuality, FxQualityTokens>> = {
  low: { particleCount: 3, poolCapacity: 96, ringAlpha: 0.45, projectileTrailAlpha: 0, projectileTrailLimit: 0, projectileGlowLimit: 0, damageNumberLimit: 0, healthBarLimit: 8 },
  medium: { particleCount: 5, poolCapacity: 160, ringAlpha: 0.6, projectileTrailAlpha: 0.46, projectileTrailLimit: 64, projectileGlowLimit: 64, damageNumberLimit: 16, healthBarLimit: 16 },
  high: { particleCount: 8, poolCapacity: 240, ringAlpha: 0.72, projectileTrailAlpha: 0.64, projectileTrailLimit: 120, projectileGlowLimit: 120, damageNumberLimit: 24, healthBarLimit: 24 }
} as const;

/** Short trail budget for projectiles; it is presentation-only. */
export const PROJECTILE_TRAIL_TOKENS = {
  lengthSeconds: 0.14,
  maxLength: 64,
  width: 3.2,
  color: 0xfff6a8
} as const;

/** Presentation-only arc for the Arc Needle projectile package. */
export const PROJECTILE_VISUAL_TOKENS = {
  curveAmplitude: 14,
  curveDurationSeconds: 0.32,
  /** A two-lobed S curve for the premium Helix Lance package. */
  helixAmplitude: 11,
  helixDurationSeconds: 0.46,
  gyreAmplitude: 10,
  gyreDurationSeconds: 0.65,
  razorAmplitude: 9,
  razorDurationSeconds: 0.55
} as const;

export const PLAYER_VISUAL_TOKENS = {
  idlePulseAmplitude: 0.012,
  movementTiltRadians: 0.07,
  damageFlashSeconds: 0.1,
  damageSquash: 0.035
} as const;
