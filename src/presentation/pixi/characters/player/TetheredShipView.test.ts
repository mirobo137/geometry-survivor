import { describe, expect, it } from 'vitest';
import { Graphics, Sprite, Texture } from 'pixi.js';
import { TetheredShipView } from './TetheredShipView';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../../../content/weapons/WeaponDefinitions';

const art = { ship: Texture.WHITE, cannon: Texture.WHITE };
const loaded = async (quality: 'low' | 'high' = 'high') => {
  const view = new TetheredShipView(quality, 'spearhead', 'spearhead', async () => art);
  await Promise.resolve();
  return view;
};

describe('TetheredShipView visual trial', () => {
  it('shares cannon and flash textures, keeps the intact ship in Low, and reuses all nodes', async () => {
    const view = await loaded('low');
    const children = [...view.root.children];
    expect(children).toHaveLength(5);
    expect(view.render(0, 0, 0, 0, 0, 0, 0)).toBe(true);
    const left = children[2] as Sprite;
    const right = children[3] as Sprite;
    expect(left.texture).toBe(right.texture);
    expect((children[4] as Sprite).texture).toBe((children[1] as Sprite).texture);
    expect(children.some(child => child.label === 'tether-engine')).toBe(false);
    for (let i = 0; i < 180; i++) view.render(i / 60, i / 60, 1, 0, 0, 0, 0);
    expect(view.root.children).toEqual(children);
    expect(left.visible && right.visible && children[1].visible && children[2].visible).toBe(true);
    expect((children[0] as Graphics).context.instructions.length).toBe(4);
  });

  it.each([0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.73])('preserves real muzzle slots at aim %s', async aim => {
    const view = await loaded();
    view.render(1, aim, 1, 0, 0, 0, 0);
    for (const [index, slot] of PROJECTILE_MUZZLE_OFFSETS.entries()) {
      const gun = view.root.children[index + 2] as Sprite;
      expect(gun.rotation).toBe(aim);
      expect(gun.x).toBeCloseTo(slot.x * Math.cos(aim) - slot.y * Math.sin(aim));
      expect(gun.y).toBeCloseTo(slot.x * Math.sin(aim) + slot.y * Math.cos(aim));
      expect(gun.anchor.y).toBe(0.08);
    }
    const strokes = (view.root.children[0] as Graphics).context.instructions as unknown as {
      data: { path: { instructions: { action: string; data: number[] }[] } }
    }[];
    const firstPort = strokes[0].data.path.instructions.find(p => p.action === 'moveTo')!.data;
    const secondPort = strokes[2].data.path.instructions.find(p => p.action === 'moveTo')!.data;
    expect(firstPort[0]).toBe(-secondPort[0]);
    expect(Math.abs(firstPort[0])).toBe(11);
  });

  it('freezes at the same clock, recoils only fired barrels and resets defeat', async () => {
    const view = await loaded();
    view.render(2, 0, 0.5, 0, 0, 0, 0);
    const ship = view.root.children[1] as Sprite;
    const height = ship.height;
    const left = view.root.children[2] as Sprite;
    view.render(2, 0, 0, 0, 0, 0, 0);
    expect(ship.height).toBe(height);
    view.render(2.01, 0, 0.5, 0, 0.8, 3, 0);
    expect(left.y).toBeGreaterThan(-11);
    expect((view.root.children[3] as Sprite).y).toBe(-11);
    expect((view.root.children[4] as Sprite).alpha).toBeGreaterThan(0);
    view.render(3, 0, 0, 1, 0, 0, 0);
    expect(ship.y).toBe(-9);
    expect(ship.height).toBe(height);
    view.reset();
    expect(view.root.visible).toBe(false);
    view.render(0, 0, 0, 0, 0, 0, 0);
    expect(ship.y).toBeCloseTo(0);
    expect(left.x).toBe(-27);
    expect(left.y).toBe(-11);
  });

  it('requests a new full ship and independent cannon when either skin changes', async () => {
    const requests: string[] = [];
    const view = new TetheredShipView('low', 'cyan', 'basic', async (ship, cannon) => {
      requests.push(`${ship}:${cannon}`);
      return art;
    });
    await Promise.resolve();
    expect(view.render(0, 0, 0, 0, 0, 0, 0)).toBe(true);
    view.setSkins('manta', 'bloom');
    await Promise.resolve();
    expect(requests).toEqual(['cyan:basic', 'manta:bloom']);
    expect(view.render(0.1, 0, 0, 0, 0, 0, 0)).toBe(true);
  });

  it('samples each actual cable without allocation, including rotated aim and recoil', async () => {
    const view = await loaded();
    const target = { x: 0, y: 0 };
    for (const aim of [0, 0.73, Math.PI]) {
      view.render(aim + 1, aim, 1, 0, 0, 4, 0);
      const strokes = (view.root.children[0] as Graphics).context.instructions as unknown as {
        data: { path: { instructions: { action: string; data: number[] }[] } }
      }[];
      for (const index of [0, 1] as const) {
        const points = strokes[index * 2].data.path.instructions;
        for (const t of [0, 0.5, 1]) {
          expect(view.sampleCable(index, t, target)).toBe(true);
          if (t === 0) expect(target.x).toBe(index === 0 ? -11 : 11);
          const point = points[Math.round(t * 8)].data;
          expect(target.x).toBeCloseTo(point[0]);
          expect(target.y).toBeCloseTo(point[1]);
        }
      }
    }
    view.reset();
    expect(view.sampleCable(0, 0.5, target)).toBe(false);
    view.root.destroy({ children: true });
  });

  it('falls back on failure and never attaches art after disposal', async () => {
    const failed = new TetheredShipView('low', 'spearhead', 'spearhead', async () => undefined);
    await Promise.resolve();
    expect(failed.render(0, 0, 0, 0, 0, 0, 0)).toBe(false);
    const rejected = new TetheredShipView('high', 'spearhead', 'spearhead', async () => { throw new Error('decode'); });
    await Promise.resolve();
    await Promise.resolve();
    expect(rejected.render(0, 0, 0, 0, 0, 0, 0)).toBe(false);
    const disposed = new TetheredShipView('high', 'spearhead', 'spearhead', async () => art);
    disposed.root.destroy({ children: true });
    await Promise.resolve();
    expect(disposed.root.destroyed).toBe(true);
  });
});
