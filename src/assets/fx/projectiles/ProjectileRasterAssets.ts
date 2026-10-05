import basicHead from './basic-head.png';
import basicTrail from './basic-trail.png';
import curveHead from './curve-head.png';
import curveTrail from './curve-trail.png';
import smokeHead from './smoke-head.png';
import smokeTrail from './smoke-trail.png';
import rainbowHead from './rainbow-head.png';
import rainbowTrail from './rainbow-trail.png';
import latticeHead from './lattice-head.png';
import latticeTrail from './lattice-trail.png';
import helixHead from './helix-head.png';
import helixTrail from './helix-trail.png';
import bloomHead from './bloom-head.png';
import bloomTrail from './bloom-trail.png';
import spearheadHead from './spearhead-head.png';
import spearheadTrail from './spearhead-trail.png';
import gyreHead from './gyre-head.png';
import gyreTrail from './gyre-trail.png';
import razorHead from './razor-head.png';
import razorTrail from './razor-trail.png';
import type { CannonSkinId } from '../../../content/visual/CannonSkinDefinitions';
import { REWARD_PROJECTILE_ART, REWARD_PROJECTILE_URLS } from '../../skins/RewardCosmeticAssets';

/** URLs only: importing the catalogue does not decode or upload its images. */
export const PROJECTILE_ART_URLS = {
  ...REWARD_PROJECTILE_URLS,
  shot_basic: basicHead, wake_basic: basicTrail,
  shot_curve: curveHead, wake_curve: curveTrail,
  shot_smoke: smokeHead, wake_smoke: smokeTrail,
  shot_rainbow: rainbowHead, wake_rainbow: rainbowTrail,
  shot_lattice: latticeHead, wake_lattice: latticeTrail,
  shot_helix: helixHead, wake_helix: helixTrail,
  shot_bloom: bloomHead, wake_bloom: bloomTrail,
  shot_spearhead: spearheadHead, wake_spearhead: spearheadTrail,
  shot_gyre: gyreHead, wake_gyre: gyreTrail,
  shot_razor: razorHead, wake_razor: razorTrail
} as const;

export const PROJECTILE_SKIN_ART = {
  ...REWARD_PROJECTILE_ART,
  basic: { headId: 'shot_basic', trailId: 'wake_basic' },
  curve: { headId: 'shot_curve', trailId: 'wake_curve' },
  smoke: { headId: 'shot_smoke', trailId: 'wake_smoke' },
  rainbow: { headId: 'shot_rainbow', trailId: 'wake_rainbow' },
  lattice: { headId: 'shot_lattice', trailId: 'wake_lattice' },
  helix: { headId: 'shot_helix', trailId: 'wake_helix' },
  bloom: { headId: 'shot_bloom', trailId: 'wake_bloom' },
  spearhead: { headId: 'shot_spearhead', trailId: 'wake_spearhead' },
  gyre: { headId: 'shot_gyre', trailId: 'wake_gyre' },
  razor: { headId: 'shot_razor', trailId: 'wake_razor' }
} as const satisfies Record<CannonSkinId, { headId: keyof typeof PROJECTILE_ART_URLS; trailId: keyof typeof PROJECTILE_ART_URLS }>;

export const PROJECTILE_HEAD_SIZE = { width: 36, height: 18 } as const;

/** Low retains the PNG head without requesting an invisible trail. */
export const getProjectileSkinArtIds = (skin: CannonSkinId, trails = true): (keyof typeof PROJECTILE_ART_URLS)[] => {
  const art = PROJECTILE_SKIN_ART[skin];
  return trails ? [art.headId, art.trailId] : [art.headId];
};
