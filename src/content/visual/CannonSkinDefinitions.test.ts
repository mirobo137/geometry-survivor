import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_DEFINITIONS, isCannonSkinId } from './CannonSkinDefinitions';

describe('CannonSkinDefinitions', () => {
  it('contains the four complete cosmetic packages', () => {
    expect(CANNON_SKIN_DEFINITIONS.map((definition) => definition.id)).toEqual(['basic', 'curve', 'smoke', 'rainbow']);
    expect(CANNON_SKIN_DEFINITIONS.map((definition) => definition.trail)).toEqual(['straight', 'curve', 'smoke', 'rainbow']);
    expect(CANNON_SKIN_DEFINITIONS.every((definition) => Number.isInteger(definition.accent))).toBe(true);
  });

  it('rejects unknown cannon ids before they reach a renderer', () => {
    expect(isCannonSkinId('rainbow')).toBe(true);
    expect(isCannonSkinId('plasma')).toBe(false);
  });
});
