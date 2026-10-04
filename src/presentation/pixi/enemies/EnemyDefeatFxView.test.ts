import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferImageSource, Sprite, Texture } from 'pixi.js';
import type { EnemyShipTextureMap } from './EnemyShipVisual';
import { EnemyDefeatFxView } from './EnemyDefeatFxView';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../../content/enemies/EnemyDefinitions';

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

describe('EnemyDefeatFxView', () => {
  afterEach(() => vi.unstubAllGlobals());

  const singleBody = () => new Texture({ source: new BufferImageSource({
    resource: new Uint8Array(64 * 64 * 4), width: 64, height: 64
  }) });

  it.each(Object.keys(ENEMY_DEFINITIONS).filter(kind => kind !== 'boss') as Exclude<EnemyKind, 'boss'>[])('uses the same single-image recipe for %s across reused slots', (kind) => {
    const body = singleBody();
    const map = { ...textures, [kind]: { ...textures.chaser, flat: body } };
    const view = new EnemyDefeatFxView(map, 'high');
    const count = view.root.children.length;
    for (let cycle = 0; cycle < 30; cycle++) {
      view.play(10, 20, kind, { rotation: 2, scaleX: 0.72, scaleY: 0.72, alpha: 0.8, offsetX: 0, offsetY: 0 });
      const root = view.root.children.find(node => node.visible) as import('pixi.js').Container;
      expect(root.scale.x).toBe(0.72);
      expect(root.children.every(node => (node as Sprite).texture.source === body.source)).toBe(true);
      for (let step = 0; step < 5; step++) view.update(0.1);
      expect(view.activeCount).toBe(0);
    }
    expect(view.root.children).toHaveLength(count);
    view.root.destroy({ children: true });
    expect(body.source.destroyed).toBe(false);
    body.destroy(true);
  });

  it('reassembles one source exactly, copies the pose and darkens/expels its four regions', () => {
    const body = singleBody();
    const view = new EnemyDefeatFxView({ ...textures, tank: { ...textures.tank, flat: body } }, 'high');
    const pose = { rotation: 1.2, scaleX: 0.8, scaleY: 0.9, offsetX: 0.3, offsetY: -0.7, alpha: 0.8 };
    view.play(320, 240, 'tank', pose);
    const root = view.root.children.find(child => child.visible)!;
    const parts = (root as import('pixi.js').Container).children as Sprite[];
    expect(parts).toHaveLength(4);
    expect(new Set(parts.map(part => part.texture.source))).toEqual(new Set([body.source]));
    expect(parts.reduce((sum, part) => sum + part.texture.frame.width * part.texture.frame.height, 0)).toBe(64 * 64);
    for (const part of parts) {
      expect(part.x).toBeCloseTo(part.texture.frame.x + part.texture.width / 2 - 32);
      expect(part.y).toBeCloseTo(part.texture.frame.y + part.texture.height / 2 - 32);
      expect(part.rotation).toBe(0);
    }
    expect(root.x).toBeCloseTo(320.3);
    expect(root.y).toBeCloseTo(239.3);
    expect(root.rotation).toBe(1.2);
    pose.rotation = 0;
    const initialX = parts[0].x;
    view.update(0);
    expect(parts[0].x).toBe(initialX);
    view.update(0.025);
    expect(root.scale.x).toBeLessThan(0.8);
    expect(parts[0].x).toBe(initialX);
    view.update(0.1);
    expect(parts[0].x).toBeLessThan(initialX);
    expect(parts[0].tint).not.toBe(0xffffff);
    expect(root.rotation).toBe(1.2);
    expect(root.alpha).toBeLessThan(0.8);
    for (let i = 0; i < 4; i++) view.update(0.1);
    expect(view.activeCount).toBe(0);
    const fragment = parts[0].texture;
    view.root.destroy({ children: true });
    expect(fragment.destroyed).toBe(true);
    expect(body.source.destroyed).toBe(false);
    body.destroy(true);
  });

  it('caps bursts, clears them, and restores textures/tints when a slot changes family', () => {
    const body = singleBody();
    const view = new EnemyDefeatFxView({ ...textures, tank: { ...textures.tank, flat: body } }, 'medium');
    for (let i = 0; i < 30; i++) view.play(i, 0, 'tank');
    expect(view.activeCount).toBe(12);
    const count = view.root.children.length;
    view.update(0.1);
    view.clear();
    expect(view.root.visible).toBe(false);
    view.play(0, 0, 'chaser');
    const parts = (view.root.children[0] as import('pixi.js').Container).children as Sprite[];
    expect(parts.every(part => part.tint === 0xffffff && part.texture.source === Texture.WHITE.source)).toBe(true);
    expect(view.root.children.length).toBe(count);
    view.root.destroy({ children: true });
    body.destroy(true);
  });

  it('omits fragments in Low and reduced-motion, even with a complete body', () => {
    const body = singleBody();
    const map = { ...textures, tank: { ...textures.tank, flat: body } };
    const low = new EnemyDefeatFxView(map, 'low');
    low.play(0, 0, 'tank');
    expect(low.activeCount).toBe(0);
    expect(low.root.children).toHaveLength(0);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const reduced = new EnemyDefeatFxView(map, 'high');
    reduced.play(0, 0, 'tank');
    expect(reduced.activeCount).toBe(0);
    low.root.destroy({ children: true });
    reduced.root.destroy({ children: true });
    body.destroy(true);
  });
  it('reuses pooled pieces for every ship family and expires them', () => {
    const view = new EnemyDefeatFxView(textures, 'medium');
    view.play(320, 240, 'tank');
    expect(view.activeCount).toBe(1);
    view.update(0.1);
    expect(view.activeCount).toBe(1);
    view.play(400, 260, 'elite');
    expect(view.activeCount).toBe(2);
    for (let index = 0; index < 5; index += 1) view.update(0.1);
    expect(view.activeCount).toBe(0);
  });

  it('keeps Low quality free of modular defeat sprites', () => {
    const view = new EnemyDefeatFxView(textures, 'low');
    view.play(320, 240, 'chaser');
    expect(view.activeCount).toBe(0);
    expect(view.root.visible).toBe(false);
  });
});
