import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sprite } from 'pixi.js';
import { PlayerPropulsionView } from './PlayerPropulsionView';
import { PLAYER_ENGINE_PORTS } from '../../../../content/visual/PlayerPropulsionDefinitions';
import type { PlayerSkinId } from '../../../../content/visual/VisualTokens';

afterEach(() => vi.unstubAllGlobals());

describe('player propulsion budget and lifecycle', () => {
  it.each(['low', 'medium', 'high'] as const)('keeps a fixed shared pool through every skin and releases its source in %s', quality => {
    const view = new PlayerPropulsionView(quality, 'spearhead');
    const nodes = [...view.root.children] as Sprite[];
    const source = nodes[0].texture.source;
    expect((source.resource as Uint8Array).byteLength).toBe(8192);
    expect(nodes.length).toBeLessThanOrEqual(quality === 'low' ? 3 : quality === 'medium' ? 6 : 9);
    for (const skin of Object.keys(PLAYER_ENGINE_PORTS) as PlayerSkinId[]) {
      view.setSkin(skin);
      for (let frame = 0; frame < 120; frame++) view.render(frame / 60, 1, true, true);
      expect(view.root.children).toEqual(nodes);
      expect(nodes.every(node => node.texture.source === source)).toBe(true);
    }
    view.root.destroy({ children: true });
    expect(source.destroyed).toBe(true);
  });

  it('freezes throttle during pause, fades after stopping and clears on death/reset', () => {
    const view = new PlayerPropulsionView('high', 'nova');
    view.render(0, 0, true, true);
    expect(view.root.visible).toBe(false);
    for (let frame = 1; frame <= 30; frame++) view.render(frame / 60, 1, true, true);
    const snapshot = () => view.root.children.map(node => ({ alpha: node.alpha, x: node.x, y: node.y, scaleY: node.scale.y }));
    const moving = snapshot();
    for (let i = 0; i < 90; i++) view.render(0.5, 0, true, true);
    expect(snapshot()).toEqual(moving);
    expect(view.root.visible).toBe(true);
    for (let frame = 31; frame <= 100; frame++) view.render(frame / 60, 0, true, true);
    expect(view.root.visible).toBe(false);
    view.render(2, 1, true, true);
    expect(view.root.visible).toBe(true);
    view.render(2, 1, false, true);
    expect(view.root.visible).toBe(false);
    view.render(3, 0, true, true);
    expect(view.root.visible).toBe(false);
    view.reset();
    expect(view.root.visible).toBe(false);
    view.root.destroy({ children: true });
  });

  it('reduces decorative layers and removes flicker for reduced motion', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const view = new PlayerPropulsionView('high', 'amber');
    expect(view.root.children).toHaveLength(3);
    for (let frame = 0; frame < 300; frame++) view.render(frame / 60, 1, true, true);
    const heights = (view.root.children as Sprite[]).map(node => node.height);
    view.render(7, 1, true, true);
    (view.root.children as Sprite[]).forEach((node, i) => expect(node.height).toBeCloseTo(heights[i], 5));
    view.root.destroy({ children: true });
  });
});
