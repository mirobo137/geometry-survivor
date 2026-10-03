import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, Sprite } from 'pixi.js';
import { CannonFeedbackView } from './CannonFeedbackView';
import type { ShotRenderState } from '../../../../simulation/combat/CombatRenderState';
import { CANNON_DISCHARGE_PROFILES } from '../../../../content/visual/CannonFeedbackDefinitions';
import type { CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';

const shot = (muzzleMask = 1): ShotRenderState => ({ sequence: 1, directionX: 0, directionY: -1,
  muzzleMask, leftOriginX: 293, leftOriginY: 389, rightOriginX: 347, rightOriginY: 389 });
const node = (view: CannonFeedbackView, label: string): Sprite => view.root.children.find(child => child.label === label) as Sprite;
afterEach(() => vi.unstubAllGlobals());

describe('CannonFeedbackView', () => {
  it.each(['low', 'medium', 'high'] as const)('keeps a fixed atlas/pool across all skins and bursts in %s', quality => {
    const view = new CannonFeedbackView(quality, 'basic');
    const children = [...view.root.children] as Sprite[];
    const source = children[0].texture.source;
    expect(children.length).toBe(quality === 'low' ? 4 : quality === 'medium' ? 8 : 12);
    expect((source.resource as Uint8Array).byteLength).toBe(16384);
    for (const skin of Object.keys(CANNON_DISCHARGE_PROFILES) as CannonSkinId[]) {
      view.setSkin(skin);
      for (let frame = 0; frame < 120; frame++) {
        if (frame % 4 === 0) view.playShot(frame / 60, shot(frame % 8 === 0 ? 3 : 1));
        view.render(frame / 60, 320, 400, 0, true);
      }
      expect(view.root.children).toEqual(children);
      expect(children.every(child => child.texture.source === source)).toBe(true);
    }
    view.root.destroy({ children: true });
    expect(source.destroyed).toBe(true);
  });

  it('copies the reused descriptor and anchors the flash in world space despite hull rotation/scale/motion', () => {
    const view = new CannonFeedbackView('high', 'helix');
    const descriptor = shot();
    view.playShot(1, descriptor);
    descriptor.leftOriginX = 999; descriptor.directionX = 1; descriptor.directionY = 0;
    const parent = new Container();
    parent.addChild(view.root);
    parent.position.set(330, 420); parent.rotation = Math.PI / 2; parent.scale.set(1.03, 0.97);
    view.render(1.02, 330, 420, parent.rotation, true, undefined, parent.scale.x, parent.scale.y);
    const flare = node(view, 'cannon-flare-0');
    const world = flare.toGlobal({ x: 0, y: 0 });
    expect(world.x).toBeCloseTo(293);
    expect(world.y).toBeCloseTo(389);
    expect(flare.rotation + parent.rotation).toBeCloseTo(Math.PI);
    expect(node(view, 'cannon-flare-1').visible).toBe(false);
    parent.destroy({ children: true });
  });

  it('kicks immediately, recovers smoothly and preserves alternating/twin barrels independently', () => {
    const view = new CannonFeedbackView('high', 'basic');
    view.playShot(1, shot(1));
    expect(view.recoilAt(0, 1)).toBeGreaterThan(view.recoilAt(0, 1.03));
    expect(view.recoilAt(1, 1)).toBe(0);
    view.playShot(1.04, shot(2));
    view.render(1.04, 320, 400, 0, true);
    expect(node(view, 'cannon-flare-0').visible).toBe(true);
    expect(node(view, 'cannon-flare-1').visible).toBe(true);
    expect(view.recoilAt(0, 1.04)).toBeGreaterThan(0);
    expect(view.recoilAt(1, 1.04)).toBeGreaterThan(view.recoilAt(0, 1.04));
    view.playShot(2, shot(3));
    expect(view.recoilAt(0, 2)).toBe(view.recoilAt(1, 2));
    expect(view.recoilAt(0, 2.3)).toBe(0);
    view.root.destroy({ children: true });
  });

  it('samples feed from the live cable, freezes in pause, fades and clears on death/reset/skin change', () => {
    const view = new CannonFeedbackView('high', 'bloom');
    const sampler = { sampleCable: vi.fn((_index, t, target) => { target.x = t * 10; target.y = 7; return true; }) };
    view.playShot(1, shot());
    view.render(1.08, 320, 400, 0, true, sampler);
    const feed = node(view, 'cannon-feed-0');
    expect(feed.visible).toBe(true);
    expect(feed.y).toBe(7);
    const before = feed.x;
    view.render(1.08, 999, 999, 3, true, sampler);
    expect(feed.x).toBe(before);
    expect(sampler.sampleCable).toHaveBeenCalledTimes(1);
    view.render(1.5, 320, 400, 0, true, sampler);
    expect(view.root.visible).toBe(false);
    view.playShot(2, shot(3));
    view.render(2, 320, 400, 0, false, sampler);
    expect(view.root.visible).toBe(false);
    expect(view.recoilAt(0, 2)).toBe(0);
    view.playShot(3, shot()); view.setSkin('curve');
    expect(view.recoilAt(0, 3)).toBe(0);
    view.playShot(4, shot()); view.reset();
    expect(view.root.children.every(child => !child.visible)).toBe(true);
    view.root.destroy({ children: true });
  });

  it('keeps essential discharge with fewer nodes and less recoil for reduced motion', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const view = new CannonFeedbackView('high', 'basic');
    expect(view.root.children).toHaveLength(2);
    view.playShot(1, shot(3));
    view.render(1, 320, 400, 0, true);
    expect(view.root.children.every(child => child.visible)).toBe(true);
    expect(view.recoilAt(0, 1)).toBeLessThan(2);
    view.render(1.1, 320, 400, 0, true);
    expect(view.root.visible).toBe(false);
    view.root.destroy({ children: true });
  });

  it('lets vapor expand after the flash, freezes it in pause and clears it within half a second', () => {
    const view = new CannonFeedbackView('low', 'smoke');
    view.playShot(1, shot());
    view.render(1.15, 320, 400, 0, true);
    const vapor = node(view, 'cannon-vapor-0-0');
    expect(vapor.visible).toBe(true);
    expect(vapor.alpha).toBeGreaterThan(0);
    expect(node(view, 'cannon-flare-0').visible).toBe(false);
    const width = vapor.width, x = vapor.x, y = vapor.y;
    view.render(1.15, 999, 999, 2, true);
    expect([vapor.width, vapor.x, vapor.y]).toEqual([width, x, y]);
    view.render(1.25, 320, 400, 0, true);
    expect(vapor.width).toBeGreaterThan(width);
    view.render(1.5, 320, 400, 0, true);
    expect(view.root.visible).toBe(false);
    expect(vapor.visible).toBe(false);
    view.root.destroy({ children: true });
  });
});
