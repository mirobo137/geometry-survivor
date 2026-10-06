import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferImageSource, Sprite, Texture } from 'pixi.js';
import { BossShipVisual, type BossShipTextures } from './BossShipVisual';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';

const textures: BossShipTextures = { flat: Texture.EMPTY, parts: [Texture.WHITE, Texture.WHITE, Texture.WHITE, Texture.WHITE] };
const state: EnemyRenderState = { active: true, kind: 'boss', x: 300, y: 200, vx: 0, vy: 0, health: 100, maxHealth: 100, radius: 48 };

describe('BossShipVisual', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('brings in the complete hull and settles at its combat pose', () => {
    const view = new BossShipVisual(textures, 'high');
    view.render(state, 0, 0, 0);
    const pieces = view.root.children as Sprite[];
    expect(pieces.map(piece => piece.texture)).toEqual([textures.flat, textures.flat, textures.flat, textures.flat]);
    expect(pieces.filter(piece => piece.visible)).toHaveLength(1);
    expect(pieces[0].alpha).toBe(0);
    view.render(state, 0.6, 0, 0.5);
    expect(pieces[0].alpha).toBeGreaterThan(0.5);
    expect(pieces[0].scale.x).toBeGreaterThan(0.8);
    view.render(state, 1.2, 0, 1);
    expect(pieces[0].x).toBe(0);
    expect(pieces[0].y).toBe(0);
    expect(pieces[0].texture).toBe(textures.flat);
    expect(pieces.map(piece => piece.visible)).toEqual([true, false, false, false]);
    expect(view.root.scale.x).toBe(1);
  });

  it.each(['core-sentinel', 'orbital-warden', 'fracture-engine'] as const)('ruptures %s from one shared body, preserving pose and resetting cleanly', (bossId) => {
    const body = new Texture({ source: new BufferImageSource({
      resource: new Uint8Array(112 * 112 * 4), width: 112, height: 112
    }) });
    const view = new BossShipVisual({ ...textures, flat: body }, 'high');
    view.setBossId(bossId);
    view.render(Object.freeze(state), 1);
    expect(view.root.children).toHaveLength(4);
    expect(view.root.position.x).toBe(300);
    const pieces = view.root.children as Sprite[];
    expect(pieces.filter(piece => piece.visible)).toHaveLength(1);
    view.root.rotation = 1.2;
    view.root.scale.set(0.9);
    view.root.alpha = 0.7;
    view.playDefeat(300, 200);
    expect(view.root.rotation).toBe(1.2);
    expect(view.root.scale.x).toBe(0.9);
    expect(pieces.every(piece => piece.visible && piece.texture.source === body.source)).toBe(true);
    expect(pieces.reduce((sum, piece) => sum + piece.texture.width * piece.texture.height, 0)).toBe(112 * 112);
    const initialX = pieces[0].x;
    view.update(0);
    expect(pieces[0].x).toBe(initialX);
    view.update(0.1);
    view.beginFrame();
    expect(view.root.visible).toBe(true);
    expect(pieces[0].x).toBeLessThan(initialX);
    expect(pieces[0].tint).not.toBe(0xffffff);
    expect(view.root.alpha).toBeLessThan(0.7);
    for (let index = 0; index < 4; index++) view.update(0.1);
    expect(view.root.visible).toBe(false);
    expect(view.isDefeatActive).toBe(false);
    view.reset();
    expect(pieces.every(piece => piece.tint === 0xffffff && piece.scale.x === 1)).toBe(true);
    view.render(state, 0);
    expect(view.root.visible).toBe(true);
    expect(pieces[0].texture).toBe(body);
    view.root.destroy({ children: true });
    expect(body.source.destroyed).toBe(false);
    body.destroy(true);
  });

  it('keeps one complete, static sprite in Low and leaves defeat feedback to the bloom', () => {
    const view = new BossShipVisual(textures, 'low');
    view.render(state, 1);
    expect(view.root.children).toHaveLength(1);
    expect(view.root.children[0].scale.x).toBe(1);
    view.render(state, 2);
    expect(view.root.children[0].scale.x).toBe(1);
    view.playDefeat(300, 200);
    expect(view.root.visible).toBe(false);
    expect(view.isDefeatActive).toBe(false);
  });

  it('switches the complete hull when the boss identity changes', () => {
    const wardenTextures: BossShipTextures = {
      flat: Texture.WHITE,
      parts: [Texture.EMPTY, Texture.EMPTY, Texture.EMPTY, Texture.EMPTY]
    };
    const view = new BossShipVisual({
      'core-sentinel': textures,
      'orbital-warden': wardenTextures
    }, 'high');

    view.render(state, 0);
    expect((view.root.children[0] as Sprite).texture).toBe(textures.flat);
    view.setBossId('orbital-warden');
    expect((view.root.children[0] as Sprite).texture).toBe(Texture.WHITE);
    expect((view.root.children[3] as Sprite).texture).toBe(Texture.WHITE);
    view.reset();
    expect((view.root.children[0] as Sprite).texture).toBe(Texture.WHITE);
  });

  it('omits moving fragments with reduced motion, independently of boss size', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const view = new BossShipVisual(textures, 'high');
    view.render(state, 0);
    view.playDefeat(state.x, state.y);
    expect(view.isDefeatActive).toBe(false);
    expect(view.root.visible).toBe(false);
    view.root.destroy({ children: true });
  });

  it('keeps paired bosses independent, reuses their sprites and resets family identity', () => {
    const sentinel = new BossShipVisual(textures, 'high');
    const warden = new BossShipVisual(textures, 'high');
    warden.setBossId('orbital-warden');
    const children = [...warden.root.children];
    for (let cycle = 0; cycle < 60; cycle++) {
      sentinel.render(state, 0);
      warden.render({ ...state, vx: 80 }, 0);
      warden.playDefeat(state.x, state.y);
      expect(sentinel.root.visible).toBe(true);
      expect(sentinel.isDefeatActive).toBe(false);
      for (let step = 0; step < 5; step++) warden.update(0.1);
      warden.reset();
      warden.render({ ...state, vx: 80 }, 0);
      expect(warden.root.rotation).toBeCloseTo(Math.PI / 2);
      expect(warden.root.children).toEqual(children);
    }
    sentinel.root.destroy({ children: true });
    warden.root.destroy({ children: true });
  });
});
