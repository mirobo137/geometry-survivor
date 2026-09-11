import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Graphics, Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { WeaponView } from './WeaponView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof WeaponView>[0];

describe('WeaponView', () => {
  beforeEach(() => {
    vi.spyOn(Graphics.prototype, 'svg').mockImplementation(function (this: Graphics) {
      return this;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('mantiene Prism Aegis en capas cacheadas y conserva la identidad en Low', () => {
    const view = new WeaponView(fakeRenderer, undefined, 'low');
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, (_, index) => ({
        active: index === 0,
        x: 120,
        y: 80,
        radius: WEAPON_DEFINITIONS.orbit.radius,
        angle: index * 0.4
      })),
      chainSegments: []
    };

    view.render(combat);
    const orbitLayer = view.root.children[0];
    const bladeRoot = orbitLayer.children[0];
    expect(bladeRoot.children).toHaveLength(5);
    expect(bladeRoot.visible).toBe(true);
    expect(bladeRoot.children[0].visible).toBe(false); // wake is decorative in Low.
    expect(bladeRoot.children[1].visible).toBe(true); // aura remains as a faint signal.

    const pieces = [...bladeRoot.children];
    for (let frame = 0; frame < 180; frame += 1) {
      combat.orbitBlades[0].angle += 0.04;
      view.render(combat);
    }
    expect(bladeRoot.children).toEqual(pieces);
    view.reset();
    expect(bladeRoot.visible).toBe(false);
  });

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
    const pulseLayer = view.root.children[3];
    expect(impactLayer.children.filter((child) => child.visible)).toHaveLength(3);
    expect(pulseLayer.children.filter((child) => child.visible)).toHaveLength(3);

    view.render(combat);
    expect(onChainImpact).toHaveBeenCalledTimes(3);
    view.reset();
    expect(impactLayer.visible).toBe(false);
    expect(pulseLayer.visible).toBe(false);
  });

  it('conserva la lectura del arco en Low y oculta solo el pulso decorativo', () => {
    const view = new WeaponView(fakeRenderer, undefined, 'low');
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, () => ({
        active: false, x: 0, y: 0, radius: 10, angle: 0
      })),
      chainSegments: [{ active: true, x1: 100, y1: 80, x2: 260, y2: 140, lifeSeconds: 0.14 }]
    };

    view.render(combat);
    expect(view.root.children[1].visible).toBe(true); // layered beam remains readable.
    expect(view.root.children[2].children[0].visible).toBe(true); // target relay remains visible.
    expect(view.root.children[3].visible).toBe(false); // moving pulse is optional in Low.
  });

  it('renders a bounded Vector Boomerang in outbound and return phases', () => {
    const view = new WeaponView(fakeRenderer, undefined, 'medium');
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, () => ({
        active: false, x: 0, y: 0, radius: 10, angle: 0
      })),
      chainSegments: [],
      boomerangs: Array.from({ length: 8 }, (_, index) => ({
        active: index === 0,
        x: 320,
        y: 240,
        vx: index === 0 ? 360 : 0,
        vy: 0,
        radius: WEAPON_DEFINITIONS.vectorBoomerang.radius,
        damage: WEAPON_DEFINITIONS.vectorBoomerang.damage,
        ageSeconds: 0.4,
        lifetimeSeconds: 1.8,
        phase: (index === 0 ? 'outbound' : 'returning') as 'outbound' | 'returning',
        directionX: 1,
        directionY: 0,
        distanceTravelled: 120,
        slotIndex: index
      }))
    };

    view.render(combat);
    const layer = view.root.children[4];
    const root = layer.children[0];
    expect(root.visible).toBe(true);
    expect(root.children).toHaveLength(5);
    expect(root.children[0].visible).toBe(true);

    combat.boomerangs[0].phase = 'returning';
    combat.boomerangs[0].vx = -430;
    view.render(combat);
    expect(root.visible).toBe(true);
    expect(root.rotation).toBeCloseTo(Math.PI);
    view.reset();
    expect(root.visible).toBe(false);
  });
});
