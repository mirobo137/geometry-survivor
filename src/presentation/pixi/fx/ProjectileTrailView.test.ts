import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';
import { ProjectileTrailView } from './ProjectileTrailView';

const projectile = (active: boolean, x: number): ProjectileRenderState => ({
  active,
  x,
  y: 240,
  vx: 460,
  vy: 0,
  radius: 7,
  ageSeconds: 0.12,
  lifetimeSeconds: 2.38,
  muzzle: 0
});

describe('ProjectileTrailView', () => {
  it('warms a trail only after a slot is active for two frames', () => {
    const view = new ProjectileTrailView(1, 'medium');
    view.render([projectile(true, 320)]);
    expect(view.activeSegmentCount).toBe(0);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(1);
    view.render([projectile(false, 327)]);
    expect(view.activeSegmentCount).toBe(0);
  });

  it('keeps low quality free of projectile trails', () => {
    const view = new ProjectileTrailView(1, 'low');
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(0);
    expect(view.root.visible).toBe(false);
  });

  it('renders the lattice recipe inside the existing bounded pool', () => {
    const view = new ProjectileTrailView(1, 'medium', 'lattice');
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(1);
    expect(view.root.visible).toBe(true);
    expect(view.root.children.filter(child => child.visible)).toHaveLength(4);
  });

  it('renders the Helix recipe with the same bounded four-band ribbon', () => {
    const view = new ProjectileTrailView(1, 'high', 'helix');
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(1);
    expect(view.root.children.filter(child => child.visible)).toHaveLength(4);
    expect((view.root.children[0] as { tint: number }).tint).toBe(0x8de8ff);
  });

  it('uses one supplied bitmap texture for the smoke recipe without growing the pool', () => {
    const smokeTexture = Texture.WHITE;
    const view = new ProjectileTrailView(1, 'medium', 'smoke', smokeTexture);
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    const sprites = view.root.children.slice(0, 4) as unknown as Array<{
      texture: Texture;
      anchor: { x: number; y: number };
      width: number;
      height: number;
    }>;
    expect(view.activeSegmentCount).toBe(1);
    expect(view.root.children.filter(child => child.visible)).toHaveLength(4);
    expect(sprites).toHaveLength(4);
    expect(sprites.every(sprite => sprite.texture === smokeTexture)).toBe(true);
    expect(sprites.every(sprite => sprite.anchor.x === 0.5 && sprite.anchor.y === 0.5)).toBe(true);
    expect(sprites.every(sprite => sprite.width >= 24 && sprite.height >= 24)).toBe(true);
    expect(view.root.children).toHaveLength(256);
    view.root.destroy({ children: true });
  });

  it('can attach the smoke texture after boot when the cosmetic is selected later', () => {
    const smokeTexture = Texture.WHITE;
    const view = new ProjectileTrailView(1, 'medium', 'smoke');
    view.setSmokeTexture(smokeTexture);
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    expect((view.root.children[0] as unknown as { texture: Texture }).texture).toBe(smokeTexture);
    view.root.destroy({ children: true });
  });

  it('caps a young tail at the muzzle and reuses its sprites when changing recipes', () => {
    const view = new ProjectileTrailView(1, 'high', 'curve');
    const state = { ...projectile(true, 320), ageSeconds: 0.01 };
    const children = [...view.root.children];
    view.render([state]);
    view.render([state]);
    expect(view.root.children[0].position.x).toBeCloseTo(320 - 460 * 0.01);
    view.setCannonSkin('smoke');
    expect(view.root.visible).toBe(false);
    expect(view.root.children).toEqual(children);
    view.root.destroy({ children: true });
  });
});
