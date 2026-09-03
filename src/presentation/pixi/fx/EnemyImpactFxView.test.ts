import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { ContainerChild } from 'pixi.js';
import { EnemyImpactFxView } from './EnemyImpactFxView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof EnemyImpactFxView>[0];

describe('EnemyImpactFxView', () => {
  it('keeps hit and defeat feedback bounded and presentation-only', () => {
    const view = new EnemyImpactFxView(fakeRenderer, 'low');
    view.playHit(320, 240, 18, 'chaser');
    expect(view.isActive).toBe(true);
    expect(view.activeRingCount).toBe(1);
    // 3 dust + 1 white impact flash = 4 particles at low quality
    expect(view.activeParticleCount).toBe(4);
    const particleRoot = (view as unknown as { particles: { root: { children: ContainerChild[] } } }).particles.root;
    const dust = particleRoot.children.filter((child) => child.visible) as unknown as Array<{ x: number; y: number }>;
    expect(dust).toHaveLength(4);

    view.update(0.1);
    expect(view.isActive).toBe(true);
    // Dust particles move outward; the stationary impact flash stays near origin.
    const movedDust = dust.filter((p) => Math.hypot(p.x - 320, p.y - 240) > 20);
    expect(movedDust.length).toBeGreaterThanOrEqual(3);
    view.playDefeat(320, 240, 'tank');
    expect(view.activeRingCount).toBe(2);
    expect(view.activeParticleCount).toBeGreaterThan(1);

    view.update(0.1);
    view.update(0.1);
    view.update(0.1);
    view.update(0.1);
    expect(view.isActive).toBe(false);
    view.clear();
    expect(view.activeRingCount).toBe(0);
    expect(view.activeParticleCount).toBe(0);
  });
});
