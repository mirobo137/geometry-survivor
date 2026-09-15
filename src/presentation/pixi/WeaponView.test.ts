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
        phase: (index === 0 ? 'outbound' : 'returning') as 'outbound' | 'holding' | 'returning',
        directionX: 1,
        directionY: 0,
        distanceTravelled: 120,
        curveStartX: 320,
        curveStartY: 240,
        curveControlX: 420,
        curveControlY: 240,
        curveEndX: 570,
        curveEndY: 240,
        returnControlX: 420,
        returnControlY: 240,
        returnStartX: 570,
        returnStartY: 240,
        returnTargetX: 320,
        returnTargetY: 240,
        pathProgress: 0,
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

  it('renders the Pulse Ring through persistent premium layers in Low and High', () => {
    const pulseRingWeapon = {
      active: true,
      phase: 'active' as 'active' | 'recovery',
      originX: 320,
      originY: 240,
      radius: 120,
      startRadius: 30,
      endRadius: 200,
      progress: 0.5,
      width: 28,
      sequence: 1
    };
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, () => ({
        active: false, x: 0, y: 0, radius: 10, angle: 0
      })),
      chainSegments: [],
      pulseRingWeapon
    };

    const lowView = new WeaponView(fakeRenderer, undefined, 'low');
    lowView.render(combat);
    const lowLayer = lowView.root.children[5];
    expect(lowLayer.visible).toBe(true);
    expect(lowLayer.children).toHaveLength(8);
    expect(lowLayer.children[3].visible).toBe(true); // active body remains readable in Low.
    expect(lowLayer.children[2].visible).toBe(false); // mantle is decorative in Low.

    const highView = new WeaponView(fakeRenderer, undefined, 'high');
    highView.render(combat);
    const highLayer = highView.root.children[5];
    expect(highLayer.visible).toBe(true);
    expect(highLayer.children[2].visible).toBe(true); // layered mantle is available in High.
    expect(highLayer.children[6].visible).toBe(true); // cadence markers are High-only.

    pulseRingWeapon.phase = 'recovery';
    pulseRingWeapon.progress = 0.25;
    highView.render(combat);
    expect(highLayer.children[7].visible).toBe(true);
    highView.reset();
    expect(highLayer.visible).toBe(false);
  });

  it('renders Magnetic Charge with a remote beacon, safe center and detonation layers', () => {
    const magneticCharge = {
      active: true,
      phase: 'detonate' as const,
      originX: 120,
      originY: 180,
      x: 320,
      y: 240,
      targetX: 320,
      targetY: 240,
      innerRadius: WEAPON_DEFINITIONS.magneticCharge.innerRadius,
      outerRadius: WEAPON_DEFINITIONS.magneticCharge.outerRadius,
      pullRadius: WEAPON_DEFINITIONS.magneticCharge.pullRadius,
      progress: 0.25,
      rotation: 0.4,
      sequence: 1
    };
    const combat = {
      orbitBlades: Array.from({ length: WEAPON_DEFINITIONS.orbit.maxBlades }, () => ({
        active: false, x: 0, y: 0, radius: 10, angle: 0
      })),
      chainSegments: [],
      magneticCharge
    };
    const lowView = new WeaponView(fakeRenderer, undefined, 'low');
    lowView.render(combat);
    const lowLayer = lowView.root.children[6];
    expect(lowLayer.visible).toBe(true);
    expect(lowLayer.children).toHaveLength(8);
    expect(lowLayer.children[4].visible).toBe(true); // damage band remains readable in Low.
    expect(lowLayer.children[2].visible).toBe(false); // attraction ornaments are decorative in Low.

    const highView = new WeaponView(fakeRenderer, undefined, 'high');
    highView.render(combat);
    const highLayer = highView.root.children[6];
    expect(highLayer.visible).toBe(true);
    expect(highLayer.children[4].visible).toBe(true);
    for (const index of [1, 2, 3, 4, 5, 7]) {
      const layer = highLayer.children[index];
      expect(layer.position.x).toBe(magneticCharge.targetX);
      expect(layer.position.y).toBe(magneticCharge.targetY);
      expect(layer.pivot.x).toBe(0);
      expect(layer.pivot.y).toBe(0);
    }
    const bandBounds = highLayer.children[4].getLocalBounds();
    expect(Math.abs(bandBounds.x + bandBounds.width / 2)).toBeLessThan(1);
    expect(Math.abs(bandBounds.y + bandBounds.height / 2)).toBeLessThan(1);
    magneticCharge.active = false;
    highView.render(combat);
    expect(highLayer.visible).toBe(false);
  });
});
