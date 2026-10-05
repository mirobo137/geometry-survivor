import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { PlayerView } from './PlayerView';
import { PLAYER_SKINS, type PlayerSkinId } from '../../../../content/visual/VisualTokens';
import { REWARD_CANNON_IDS, type RewardCannonId } from '../../../../content/retention/RewardCosmeticDefinitions';

const skinTextures = {
  ...Object.fromEntries(Object.keys(PLAYER_SKINS).map(id => [id, Texture.WHITE])) as Record<PlayerSkinId, Texture>,
  spearhead: Texture.WHITE,
  manta: Texture.WHITE,
  cyan: Texture.WHITE,
  violet: Texture.WHITE,
  amber: Texture.WHITE,
  emerald: Texture.WHITE,
  obsidian: Texture.WHITE,
  nova: Texture.WHITE,
  corsair: Texture.WHITE,
  nautilus: Texture.WHITE,
  asterion: Texture.WHITE,
  solstice: Texture.WHITE
};

const cannonPair = () => ({ left: Texture.WHITE, right: Texture.WHITE });

const textures = {
  shadow: Texture.WHITE,
  ring: skinTextures,
  weapons: {
    ...Object.fromEntries(REWARD_CANNON_IDS.map(id => [id, cannonPair()])) as Record<RewardCannonId, ReturnType<typeof cannonPair>>,
    basic: cannonPair(),
    curve: cannonPair(),
    smoke: cannonPair(),
    rainbow: cannonPair(),
    lattice: cannonPair(),
    helix: cannonPair(),
    bloom: cannonPair(),
    spearhead: cannonPair(),
    gyre: cannonPair(),
    razor: cannonPair()
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
  it('uses the selected full PNG skin when available and keeps the SVG fallback', async () => {
    const view = new PlayerView(textures);
    const raster = view.root.children.find(child => child.label === 'raster-player-skin')!;
    expect(raster).toBeDefined();
    await Promise.resolve(); // Without browser Image, the original hull remains the safe fallback.
    view.render(state(300, 400), 0);
    expect(raster.visible).toBe(false);
    view.setSkin('manta');
    view.render(state(300, 400), 0.1);
    expect(view.skinId).toBe('manta');
    expect(raster.visible).toBe(false);
    view.setSkin('spearhead');
    view.setCannonSkin('helix');
    view.render(state(300, 400), 0.2);
    expect(view.cannonSkinId).toBe('helix');
    expect(view.root.children.filter(child => child.label === 'raster-player-skin')).toHaveLength(1);
    view.reset();
    view.setSkin('cyan');
    view.render(state(300, 400), 0);
    expect(raster.visible).toBe(false);
  });
  it('composes aligned pieces, supports skins and animates damage locally', () => {
    const view = new PlayerView(textures);
    expect(view.root.children).toHaveLength(13); // shared shield plus the raster path/fallback
    expect(view.skinId).toBe('cyan');
    view.render(state(300, 400), 0, 1);
    const shield = view.root.children[11] as { visible: boolean };
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
    view.setCannonSkin('bloom');
    view.render(state(320, 400, 80), 0.5);
    const bloomWeapons = view.root.children[4] as { children: { visible: boolean }[] };
    expect(bloomWeapons.children).toHaveLength(2);
    view.playDamage(20, 0.4);
    view.render(state(320, 400, 80), 0.45);
    const flash = view.root.children.find(child => child.label === 'player-damage-flash')!;
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
    const shotFlash = view.root.children.find(child => child.label === 'cannon-feedback')!;
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

  it('anchors the muzzle flash to the shot even when hull facing differs', () => {
    const view = new PlayerView(textures);
    view.render(state(300, 400), 0);
    // Movement turns the hull right; the next shot still aims upward.
    view.render(state(320, 400), 0.1);
    expect(view.root.rotation).toBeCloseTo(Math.PI / 2);
    view.playShot(0.1, {
      sequence: 1,
      directionX: 0,
      directionY: -1,
      muzzleMask: 1,
      leftOriginX: 293,
      leftOriginY: 389,
      rightOriginX: 0,
      rightOriginY: 0
    });

    view.render(state(320, 400), 0.13);

    const feedback = view.root.children.find(child => child.label === 'cannon-feedback')!;
    const flare = feedback.children.find(child => child.label === 'cannon-flare-0') as Sprite;
    const world = flare.toGlobal({ x: 0, y: 0 });
    expect(world.x).toBeCloseTo(293);
    expect(world.y).toBeCloseTo(389);
    expect(flare.rotation + view.root.rotation).toBeCloseTo(Math.PI);
  });
});
