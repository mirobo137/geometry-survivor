import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { WeaponView } from './WeaponView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof WeaponView>[0];

describe('WeaponView', () => {
  it('shows one bounded impact node per new chain segment', () => {
    const onChainImpact = vi.fn();
    const view = new WeaponView(fakeRenderer, onChainImpact);
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, () => ({
        active: false, x: 0, y: 0, radius: 10, angle: 0
      })),
      chainSegments: Array.from({ length: WEAPON_DEFINITIONS.chainLightning.maxTargets }, (_, index) => ({
        active: true, x1: index * 10, y1: 0, x2: index * 20, y2: 20, lifeSeconds: 0.14
      }))
    };

    view.render(combat);
    expect(onChainImpact).toHaveBeenCalledTimes(3);
    const impactLayer = view.root.children[2];
    expect(impactLayer.children.filter((child) => child.visible)).toHaveLength(3);

    view.render(combat);
    expect(onChainImpact).toHaveBeenCalledTimes(3);
    view.reset();
    expect(impactLayer.visible).toBe(false);
  });
});
