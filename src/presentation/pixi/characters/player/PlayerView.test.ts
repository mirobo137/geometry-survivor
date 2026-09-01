import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { PlayerView } from './PlayerView';

const textures = {
  shadow: Texture.WHITE,
  ring: Texture.WHITE,
  weapons: Texture.WHITE,
  body: Texture.WHITE,
  core: Texture.WHITE,
  accent: Texture.WHITE,
  signature: {
    cyan: Texture.WHITE,
    violet: Texture.WHITE,
    amber: Texture.WHITE,
    emerald: Texture.WHITE
  }
};

const state = (x: number, y: number, health = 100) => ({
  x,
  y,
  radius: 22,
  health,
  maxHealth: 100,
  armor: 0
});

describe('PlayerView', () => {
  it('composes aligned pieces, supports skins and animates damage locally', () => {
    const view = new PlayerView(textures);
    expect(view.root.children).toHaveLength(8);
    expect(view.skinId).toBe('cyan');
    view.render(state(300, 400), 0);
    view.render(state(320, 400), 0.4);
    expect(view.root.position.x).toBe(320);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);

    view.setSkin('violet');
    expect(view.skinId).toBe('violet');
    view.setSkin('amber');
    expect(view.skinId).toBe('amber');
    view.playDamage(20, 0.4);
    view.render(state(320, 400, 80), 0.45);
    const flash = view.root.children[6] as { alpha: number };
    expect(flash.alpha).toBeGreaterThan(0);
    view.playDefeat();
    view.updateDefeat(0.3);
    view.render(state(320, 400, 0), 0.5);
    expect(view.root.alpha).toBeLessThan(1);
    view.updateDefeat(1.8);
    view.render(state(320, 400, 0), 2.3);
    expect(view.root.alpha).toBeGreaterThan(0);
    view.updateDefeat(0.3);
    view.render(state(320, 400, 0), 2.4);
    expect(view.root.alpha).toBe(0);
    view.reset();
    expect(view.root.rotation).toBe(0);
  });
});
