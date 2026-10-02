import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_DEFINITIONS, isCannonSkinId } from './CannonSkinDefinitions';

describe('CannonSkinDefinitions', () => {
  it('keeps the seven packages and adds Ivory Spear cannons as the eighth', () => {
    expect(CANNON_SKIN_DEFINITIONS.map((definition) => definition.id)).toEqual(['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead']);
    expect(CANNON_SKIN_DEFINITIONS.map((definition) => definition.trail)).toEqual(['straight', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'straight']);
    expect(CANNON_SKIN_DEFINITIONS.every((definition) => Number.isInteger(definition.accent))).toBe(true);
    expect(CANNON_SKIN_DEFINITIONS[7].priceNova).toBe(0);
    expect(CANNON_SKIN_DEFINITIONS[7].acquisition).toBe('default');
  });

  it('rejects unknown cannon ids before they reach a renderer', () => {
    expect(isCannonSkinId('rainbow')).toBe(true);
    expect(isCannonSkinId('lattice')).toBe(true);
    expect(isCannonSkinId('helix')).toBe(true);
    expect(isCannonSkinId('spearhead')).toBe(true);
    expect(isCannonSkinId('plasma')).toBe(false);
  });
});
