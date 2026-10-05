import { describe, expect, it } from 'vitest';
import { REWARD_CANNON_IDS } from '../retention/RewardCosmeticDefinitions';
import { CANNON_SKIN_DEFINITIONS, isCannonSkinId } from './CannonSkinDefinitions';

describe('CannonSkinDefinitions', () => {
  it('keeps ten packages, including two distinct moving raster bullets', () => {
    expect(CANNON_SKIN_DEFINITIONS.map((definition) => definition.id)).toEqual(['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead', 'gyre', 'razor', ...REWARD_CANNON_IDS]);
    expect(CANNON_SKIN_DEFINITIONS.slice(0, 10).map((definition) => definition.trail)).toEqual(['straight', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'straight', 'gyre', 'razor']);
    expect(CANNON_SKIN_DEFINITIONS.every((definition) => Number.isInteger(definition.accent))).toBe(true);
    expect(CANNON_SKIN_DEFINITIONS[7].priceNova).toBe(0);
    expect(CANNON_SKIN_DEFINITIONS[7].acquisition).toBe('default');
  });

  it('rejects unknown cannon ids before they reach a renderer', () => {
    expect(isCannonSkinId('rainbow')).toBe(true);
    expect(isCannonSkinId('lattice')).toBe(true);
    expect(isCannonSkinId('helix')).toBe(true);
    expect(isCannonSkinId('spearhead')).toBe(true);
    for (const definition of CANNON_SKIN_DEFINITIONS) expect(isCannonSkinId(definition.id)).toBe(true);
    expect(isCannonSkinId('plasma')).toBe(false);
  });
});
