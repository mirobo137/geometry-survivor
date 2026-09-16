import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';
import { EnemyShipVisual, type EnemyShipTextureMap } from './EnemyShipVisual';

const textures: EnemyShipTextureMap = {
  chaser: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  fast: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  tank: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  elite: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  orbiter: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  charger: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  splitter: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  'prism-weaver': { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  'warden-replica': { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE }
};

const state = (kind: EnemyRenderState['kind'], vx = 80, vy = 0): EnemyRenderState => ({
  active: true,
  kind,
  x: 320,
  y: 240,
  vx,
  vy,
  radius: 18,
  health: 100,
  maxHealth: 100
});

describe('EnemyShipVisual', () => {
  it('aims the Gunner barrel at its captured target while retreating and recoils axially', () => {
    const view = new EnemyShipVisual(textures, 0, 'high');
    const gunner = { ...state('fracture-gunner', -40, 0), fractureAimX: 500, fractureAimY: 240 };
    view.render({ ...gunner, fracturePhase: 'telegraph', fractureProgress: 0.5 }, 0);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);
    expect(view.root.children[1].position.x).toBe(0);
    expect(view.root.children[1].rotation).toBe(0);
    const preparedY = view.root.children[1].position.y;
    view.render({ ...gunner, fracturePhase: 'active' }, 0);
    expect(view.root.children[1].position.y).toBeGreaterThan(preparedY);
    view.render({ ...gunner, fracturePhase: 'recovery' }, 0);
    expect(view.root.rotation).toBeCloseTo(Math.PI * 1.5);
  });

  it('does not retain expanded Thorn parts or faded Splitter wings across pooled kinds', () => {
    const reused = new EnemyShipVisual(textures, 0, 'high');
    reused.render({ ...state('thorn-bastion'), fracturePhase: 'active' }, 0);
    expect(reused.root.children[0].scale.x).toBeGreaterThan(1);
    reused.render({ ...state('splitter'), splitterDepth: 1 }, 0);
    reused.render(state('rift-miner'), 1);
    const fresh = new EnemyShipVisual(textures, 0, 'high');
    fresh.render(state('rift-miner'), 1);
    for (let index = 0; index < 4; index += 1) {
      expect(reused.root.children[index].scale.x).toBe(fresh.root.children[index].scale.x);
      expect(reused.root.children[index].alpha).toBe(fresh.root.children[index].alpha);
    }
  });

  it('uses a complete Low silhouette on first chaser and after pool reset', () => {
    const map = { ...textures, chaser: { ...textures.chaser, flat: Texture.EMPTY } };
    const view = new EnemyShipVisual(map, 0, 'low');
    view.render(state('chaser'), 0);
    expect((view.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.EMPTY);
    view.render(state('elite'), 1);
    view.reset();
    view.render(state('chaser'), 2);
    expect((view.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.EMPTY);
    const high = new EnemyShipVisual(map, 0, 'high');
    high.render(state('elite'), 1);
    high.reset();
    high.render(state('chaser'), 2);
    expect(high.currentKind).toBe('chaser');
    expect((high.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.WHITE);
  });
  it('composes four pieces, follows movement direction and animates locally', () => {
    const view = new EnemyShipVisual(textures, 0.7);
    view.render(state('chaser'), 0.2);
    expect(view.root.children).toHaveLength(5);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);
    const firstWingRotation = view.root.children[1].rotation;

    view.render(state('fast', 0, 80), 0.8);
    expect(view.currentKind).toBe('fast');
    expect(view.root.rotation).toBeCloseTo(Math.PI);
    expect(view.root.children[1].rotation).not.toBe(firstWingRotation);
  });

  it('does not render a boss through a common ship visual', () => {
    const view = new EnemyShipVisual(textures);
    view.render(state('boss'), 0.5);
    expect(view.root.visible).toBe(false);
  });

  it('keeps the required hull but hides decorative pieces in Low quality', () => {
    const view = new EnemyShipVisual(textures, 0, 'low');
    view.render(state('tank'), 0.5, 1);
    expect(view.root.children.map((child) => child.visible)).toEqual([false, false, true, false, false]);
  });

  it('opens Orbiter gate pieces from simulation phase without rebuilding textures', () => {
    const view = new EnemyShipVisual(textures, 0, 'high');
    view.render({ ...state('orbiter'), orbiterPhase: 'telegraph', orbiterDirection: 1, orbiterProgress: 0.5 }, 0.5);
    expect(view.currentKind).toBe('orbiter');
    expect(view.root.children[1].position.x).toBeGreaterThan(0);
  });

  it('uses flattened Tank in Low and restores the hull when changing family', () => {
    const map = { ...textures, tank: { ...textures.tank, flat: Texture.EMPTY } };
    const view = new EnemyShipVisual(map, 0, 'low');
    view.render(state('tank'), 0);
    expect((view.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.EMPTY);
    view.render(state('fast'), 0);
    expect((view.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.WHITE);
    const detailed = new EnemyShipVisual(map, 0, 'high');
    detailed.render(state('tank'), 0);
    expect((detailed.root.children[2] as import('pixi.js').Sprite).texture).toBe(Texture.WHITE);
  });
});
