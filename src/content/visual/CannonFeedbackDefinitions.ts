import type { CannonSkinId } from './CannonSkinDefinitions';

/** Cosmetic discharge shapes, in logical units; never projectile range or hitbox. */
export const CANNON_DISCHARGE_PROFILES: Readonly<Record<CannonSkinId, {
  readonly length: number; readonly width: number; readonly corona: number; readonly recoil: number;
}>> = {
  basic: { length: 28, width: 11, corona: 0.5, recoil: 4 },
  curve: { length: 35, width: 7, corona: 0.35, recoil: 3.5 },
  smoke: { length: 24, width: 18, corona: 0.65, recoil: 4.8 },
  rainbow: { length: 30, width: 13, corona: 0.5, recoil: 4 },
  lattice: { length: 22, width: 10, corona: 0.85, recoil: 3.8 },
  helix: { length: 38, width: 8, corona: 0.4, recoil: 4.5 },
  bloom: { length: 22, width: 17, corona: 1, recoil: 3.5 },
  spearhead: { length: 32, width: 9, corona: 0.45, recoil: 4.2 },
  gyre: { length: 26, width: 15, corona: 0.95, recoil: 3.7 },
  razor: { length: 34, width: 8, corona: 0.55, recoil: 4.7 }
};

export const CANNON_FEEDBACK_TIMING = {
  flashSeconds: 0.13,
  recoilSeconds: 0.2,
  recoilDecaySeconds: 0.055,
  feedStartSeconds: 0.035,
  feedSeconds: 0.23,
  vaporSeconds: 0.38,
  rasterRecoilScale: 0.82
} as const;
