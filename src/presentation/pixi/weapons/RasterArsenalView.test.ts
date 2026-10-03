import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Graphics, Sprite, Texture, type Renderer } from 'pixi.js';
import { WeaponView } from '../WeaponView';
import { RasterArsenalView, type ArsenalRenderInput } from './RasterArsenalView';
import { getArsenalTexture } from './ArsenalTextures';
import { RechargeableShieldView } from '../characters/player/RechargeableShieldView';
import { BoomerangPool } from '../../../simulation/combat/EntityPools';

vi.mock('./ArsenalTextures', () => ({
  getArsenalTexture: vi.fn(() => Texture.WHITE),
  loadArsenalTexture: vi.fn(async () => Texture.WHITE),
  MAGNETIC_ART_IDS: ['magnetic_core', 'magnetic_field', 'magnetic_travel', 'magnetic_burst']
}));
const base = (): ArsenalRenderInput => ({ orbitBlades: [], chainSegments: [] });
const sprite = (view: RasterArsenalView, label: string): Sprite =>
  [...view.root.children, ...view.underlay.children].find(child => child.label === label) as Sprite;

describe('PNG arsenal presentation', () => {
  beforeEach(() => vi.mocked(getArsenalTexture).mockReturnValue(Texture.WHITE));
  it('uses unique Thunderhead detonation and Singularity fork/shard textures, never the magnetic explosion', () => {
    const view = new RasterArsenalView('high');
    view.render({ ...base(), boomerangs: [{ active: true, fragment: true, evolution: 'singularity_return',
      x: 100, y: 80, radius: 8, vx: 520, vy: 0, ageSeconds: 0.3 }] as unknown as ArsenalRenderInput['boomerangs'],
      boomerangPulse: { active: true, x: 90, y: 80, radius: 42, progress: 0.1, sequence: 1 },
      chainExplosions: [{ active: true, x: 30, y: 40, radius: 100, progress: 0.1, phase: 'active', sequence: 1 }]
    });
    expect(getArsenalTexture).toHaveBeenCalledWith('thunderhead_burst');
    expect(getArsenalTexture).toHaveBeenCalledWith('singularity_split');
    expect(getArsenalTexture).toHaveBeenCalledWith('singularity_shard');
    expect(getArsenalTexture).not.toHaveBeenCalledWith('magnetic_burst');
    expect(sprite(view, 'arsenal-boomerang-0').rotation).toBe(0);
  });

  it('Echo Shock recovery keeps the small contracted radius and fades until idle', () => {
    const view = new RasterArsenalView('low');
    const pulse = { active: true, phase: 'recovery', originX: 100, originY: 70, radius: 30,
      startRadius: 30, endRadius: 280, progress: 0, sequence: 1, width: 28, wave: 1, evolution: 'echo_shock' } as const;
    view.render({ ...base(), pulseRingWeapon: pulse });
    expect(sprite(view, 'arsenal-pulse').width).toBeCloseTo(30 * 256 / 110);
    const alpha = sprite(view, 'arsenal-pulse').alpha;
    view.render({ ...base(), pulseRingWeapon: { ...pulse, progress: 0.75 } });
    expect(sprite(view, 'arsenal-pulse').width).toBeCloseTo(30 * 256 / 110);
    expect(sprite(view, 'arsenal-pulse').alpha).toBeLessThan(alpha);
    view.render({ ...base(), pulseRingWeapon: { ...pulse, active: false, phase: 'idle' } });
    expect(sprite(view, 'arsenal-pulse').visible).toBe(false);
  });

  it.each(['orbit', 'solar_crown', 'graviton_halo'] as const)('maps %s to the readonly orbit variant', id => {
    const view = new RasterArsenalView('low');
    view.render({ ...base(), orbitEvolution: id === 'orbit' ? null : id,
      orbitBlades: [{ active: true, x: 80, y: 90, radius: 10, angle: 0.8 }] });
    expect(getArsenalTexture).toHaveBeenCalledWith(id);
    expect(sprite(view, 'arsenal-orbit-0').visible).toBe(true);
    expect(sprite(view, 'arsenal-orbit-0').x).toBe(80);
    const children = [...view.root.children];
    for (let i = 0; i < 120; i++) view.render(base());
    expect(view.root.children).toEqual(children);
    expect(sprite(view, 'arsenal-orbit-0').visible).toBe(false);
  });

  it.each(['chain', 'closed_circuit', 'thunderhead'] as const)('represents %s with a bounded endpoint-aligned ribbon', id => {
    const view = new RasterArsenalView('high');
    view.render({ ...base(), chainEvolution: id === 'chain' ? null : id,
      chainSegments: [{ active: true, x1: 10, y1: 20, x2: 110, y2: 20, lifeSeconds: 0.14 }] });
    expect(getArsenalTexture).toHaveBeenCalledWith(id);
    expect(sprite(view, 'arsenal-chain-0').position).toMatchObject({ x: 60, y: 20 });
    expect(sprite(view, 'arsenal-chain-0').width).toBeCloseTo(100);
    if (id === 'closed_circuit') expect(sprite(view, 'arsenal-chain-0').height).toBeCloseTo(17 / 24);
  });

  it.each(['boomerang', 'twin_comet', 'singularity_return'] as const)('keeps %s on the real return trajectory', id => {
    const view = new RasterArsenalView('medium');
    const input = { ...base(), boomerangs: [{ active: true, x: 100, y: 70, radius: 11,
      vx: -200, vy: 0, directionX: 1, directionY: 0, ageSeconds: 0.4, phase: 'returning',
      evolution: id === 'boomerang' ? null : id }] } as unknown as ArsenalRenderInput;
    view.render(input);
    expect(getArsenalTexture).toHaveBeenCalledWith(id);
    expect(sprite(view, 'arsenal-boomerang-0').position).toMatchObject({ x: 100, y: 70 });
    expect(sprite(view, 'arsenal-wake-0').visible).toBe(true);
    view.reset();
    expect(sprite(view, 'arsenal-wake-0').visible).toBe(false);
  });

  it.each(['low', 'high'] as const)('keeps the complete grown circuit and all six shards in its fixed pools in %s', quality => {
    const view = new RasterArsenalView(quality);
    const chainSegments = Array.from({ length: 13 }, (_, index) => ({
      active: true, x1: index * 20, y1: 60, x2: index * 20 + 20, y2: 70,
      lifeSeconds: index >= 10 ? 0.9 : 0.14, persistent: index >= 10
    }));
    const pool = new BoomerangPool(8);
    for (let index = 0; index < 6; index++) {
      const shard = pool.acquire()!;
      Object.assign(shard, { x: index * 30, y: 200, vx: 520, vy: 0, radius: 7.7,
        phase: 'homing', fragment: true, evolution: 'singularity_return', ageSeconds: 0.1 });
    }
    const input = { ...base(), chainEvolution: 'closed_circuit' as const, chainSegments, boomerangs: pool.states };
    const roots = [...view.root.children];
    const underlay = [...view.underlay.children];
    for (let frame = 0; frame < 120; frame++) view.render(input);
    expect(view.root.children.filter(node => node.label.startsWith('arsenal-chain-') && node.visible)).toHaveLength(13);
    expect(view.root.children.filter(node => node.label.startsWith('arsenal-boomerang-') && node.visible)).toHaveLength(6);
    expect(sprite(view, 'arsenal-chain-12').alpha).toBe(0.72);
    expect(view.root.children).toEqual(roots);
    expect(view.underlay.children).toEqual(underlay);
    view.reset();
    expect(view.root.children.every(node => !node.visible)).toBe(true);
  });

  it.each(['pulse_ring', 'echo_shock', 'compression_wave'] as const)('registers %s radius, phase and captured axis', id => {
    const view = new RasterArsenalView('high');
    const pulse = { active: true, phase: 'active', originX: 60, originY: 80,
      radius: 128, startRadius: 14, endRadius: 320, width: 16, sequence: 1,
      directionX: 0, directionY: 1, wave: 1, progress: 0.5, evolution: id === 'pulse_ring' ? null : id } as const;
    view.render({ ...base(), pulseRingWeapon: pulse });
    expect(getArsenalTexture).toHaveBeenCalledWith(id);
    const art = sprite(view, 'arsenal-pulse');
    expect(art.position).toMatchObject({ x: 60, y: 80 });
    if (id === 'compression_wave') {
      expect(art.anchor.x).toBe(0.28125);
      expect(art.rotation).toBeCloseTo(Math.PI / 2);
      expect(art.scale.x).toBe(1);
    }
    expect(pulse.radius).toBe(128);
  });

  it('dissipates Event Horizon without a terminal explosion and preserves Polar width and final radius', () => {
    const view = new RasterArsenalView('high');
    const magnetic = { active: true, phase: 'attract', originX: 0, originY: 0,
      x: 150, y: 120, targetX: 150, targetY: 120, innerRadius: 30, outerRadius: 150,
      pullRadius: 190, progress: 0.5, rotation: 1, sequence: 1, evolution: 'event_horizon' } as const;
    view.render({ ...base(), magneticCharge: magnetic });
    expect(sprite(view, 'arsenal-magnetic-field').visible).toBe(true);
    view.render({ ...base(), magneticCharge: { ...magnetic, phase: 'recovery' } });
    expect(sprite(view, 'arsenal-magnetic-burst').visible).toBe(false);
    view.render({ ...base(), magneticCharge: { ...magnetic, phase: 'detonate',
      evolution: 'polar_collapse', polarFrontRadius: 100, polarAngle: 0 } });
    const front = sprite(view, 'arsenal-polar-front-0');
    expect(front.width).toBeCloseTo(100);
    const thickness = front.scale.y;
    view.render({ ...base(), magneticCharge: { ...magnetic, phase: 'detonate',
      evolution: 'polar_collapse', polarFrontRadius: 40 } });
    expect(front.scale.y).toBe(thickness); // convergence never shrinks the 24u front
    view.render({ ...base(), magneticCharge: { ...magnetic, phase: 'collapse',
      evolution: 'polar_collapse', polarFinalRadius: 64, polarPulseCount: 2 } });
    expect(sprite(view, 'arsenal-magnetic-burst').visible).toBe(true);
  });

  it('falls back atomically if one magnetic component fails and never recreates sprites', () => {
    vi.mocked(getArsenalTexture).mockImplementation(id => id === 'polar_collapse' ? null : Texture.WHITE);
    const view = new RasterArsenalView('low');
    expect(view.magneticReady({ evolution: 'polar_collapse' } as ArsenalRenderInput['magneticCharge'])).toBe(false);
    expect(sprite(view, 'arsenal-magnetic-core').visible).toBe(false);
  });

  it('has one rechargeable shell and one blocking burst, both cleared by reset', () => {
    const view = new RechargeableShieldView('low');
    expect(view.render(0.5, 1, 10)).toBe(true);
    expect(view.root.children).toHaveLength(2);
    expect(view.root.children[0].visible).toBe(true);
    expect(view.root.children[1].visible).toBe(false);
    expect(view.render(0, 0.5, 10)).toBe(true);
    expect(view.root.children[1].visible).toBe(true);
    view.reset();
    expect(view.root.children.every(child => !child.visible)).toBe(true);
    vi.mocked(getArsenalTexture).mockReturnValue(null);
    expect(view.render(1, 1, 10)).toBe(false);
  });

  it('replaces vector bodies only when PNG is ready without silencing chain feedback', () => {
    const spy = vi.spyOn(Graphics.prototype, 'svg').mockImplementation(function(this: Graphics) { return this; });
    const feedback = vi.fn();
    const view = new WeaponView({ generateTexture: () => Texture.WHITE } as unknown as Renderer, feedback, 'low');
    const input = { ...base(),
      orbitBlades: Array.from({ length: 6 }, (_, i) => ({ active: i === 0, x: 60, y: 70, radius: 10, angle: 0 })),
      chainSegments: [{ active: true, x1: 10, y1: 20, x2: 80, y2: 90, lifeSeconds: 0.14 }] };
    view.render(input);
    expect(view.root.children[0].children[0].visible).toBe(false);
    expect(feedback).toHaveBeenCalledOnce();
    view.render(input);
    expect(feedback).toHaveBeenCalledOnce();
    vi.mocked(getArsenalTexture).mockReturnValue(null);
    view.render(input);
    expect(view.root.children[0].children[0].visible).toBe(true);
    view.reset();
    expect(view.root.children[0].children[0].visible).toBe(false);
    const pool = new BoomerangPool(8);
    const shard = pool.acquire()!;
    Object.assign(shard, { fragment: true, phase: 'homing', evolution: 'singularity_return', radius: 8, vx: 520 });
    vi.mocked(getArsenalTexture).mockImplementation(id => id === 'singularity_shard' ? null : Texture.WHITE);
    view.render({ ...input, boomerangs: pool.states });
    expect(view.root.children[4].children[0].visible).toBe(true); // carrier PNG ready cannot hide a missing shard PNG
    shard.fragment = false;
    view.render({ ...input, boomerangs: pool.states });
    expect(view.root.children[4].children[0].visible).toBe(false);
    spy.mockRestore();
  });
});
