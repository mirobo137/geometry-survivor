import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
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
    expect(view.activeParticleCount).toBe(1);

    view.update(0.1);
    expect(view.isActive).toBe(true);
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
