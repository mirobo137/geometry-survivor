import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { PlayerView } from './PlayerView';

const skinTextures = {
  cyan: Texture.WHITE,
  violet: Texture.WHITE,
  amber: Texture.WHITE,
  emerald: Texture.WHITE
};

const cannonPair = () => ({ left: Texture.WHITE, right: Texture.WHITE });

const textures = {
  shadow: Texture.WHITE,
  ring: skinTextures,
  weapons: {
    basic: cannonPair(),
    curve: cannonPair(),
    smoke: cannonPair(),
    rainbow: cannonPair()
  },
  body: skinTextures,
  core: skinTextures,
  accent: Texture.WHITE,
  signature: skinTextures
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
    expect(view.root.children).toHaveLength(11);
    expect(view.skinId).toBe('cyan');
    view.render(state(300, 400), 0, 1);
    const shield = view.root.children[10] as { visible: boolean };
    expect(shield.visible).toBe(true);
    view.render(state(300, 400), 0.1, 0.5);
    expect(shield.visible).toBe(true);
    view.render(state(300, 400), 0.2, 0);
    expect(shield.visible).toBe(false);
    view.playGuard(0.2);
    view.render(state(300, 400), 0.3, 0);
    expect(shield.visible).toBe(true);
    view.render(state(320, 400), 0.4);
    expect(view.root.position.x).toBe(320);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);
    expect(view.root.children[1].visible).toBe(true);

    view.setSkin('violet');
    expect(view.skinId).toBe('violet');
    view.setSkin('amber');
    expect(view.skinId).toBe('amber');
    view.setCannonSkin('rainbow');
    expect(view.cannonSkinId).toBe('rainbow');
    view.playDamage(20, 0.4);
    view.render(state(320, 400, 80), 0.45);
    const flash = view.root.children[8] as { alpha: number };
    expect(flash.alpha).toBeGreaterThan(0);
    view.playShot(0.6, {
      sequence: 1,
      directionX: 0,
      directionY: -1,
      muzzleMask: 1,
      leftOriginX: 293,
      leftOriginY: 389,
      rightOriginX: 0,
      rightOriginY: 0
    });
    view.render(state(320, 400, 80), 0.63);
    const shotFlash = view.root.children[9] as { visible: boolean };
    expect(shotFlash.visible).toBe(true);
    const weapons = view.root.children[4] as { children: { position: { x: number; y: number } }[] };
    expect(weapons.children[0].position.y).toBeGreaterThan(0);
    expect(weapons.children[1].position.y).toBe(0);
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

  it('holds cannon aim on the last shot until the next one', () => {
    const view = new PlayerView(textures);
    const weapons = view.root.children[4] as { rotation: number };
    view.render(state(300, 400), 0);
    view.render(state(320, 400), 0.1);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);
    view.playShot(0.2, {
      sequence: 1,
      directionX: 0,
      directionY: -1,
      muzzleMask: 3,
      leftOriginX: 320,
      leftOriginY: 389,
      rightOriginX: 320,
      rightOriginY: 389
    });
    view.render(state(320, 400, 80), 1);
    expect(weapons.rotation).toBeCloseTo(-Math.PI / 2);
    view.render(state(320, 450, 80), 1.1);
    expect(view.root.rotation).toBeCloseTo(Math.PI);
    expect(weapons.rotation).toBeCloseTo(-Math.PI);
    view.reset();
    view.render(state(300, 400), 0);
    expect(weapons.rotation).toBeCloseTo(0);
  });
});
