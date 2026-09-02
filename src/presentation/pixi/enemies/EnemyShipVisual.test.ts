import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';
import { EnemyShipVisual, type EnemyShipTextureMap } from './EnemyShipVisual';

const textures: EnemyShipTextureMap = {
  chaser: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  fast: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  tank: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  elite: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE }
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
});
