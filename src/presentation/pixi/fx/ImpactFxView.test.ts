import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { ImpactFxView } from './ImpactFxView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof ImpactFxView>[0];

describe('ImpactFxView', () => {
  it('creates a bounded player damage pulse without touching simulation state', () => {
    const view = new ImpactFxView(fakeRenderer, 'low');
    view.playPlayerDamage(360, 640, 10);
    expect(view.isActive).toBe(true);
    expect(view.activeParticleCount).toBe(3);
    view.update(0.1);
    expect(view.isActive).toBe(true);
    view.update(0.1);
    view.update(0.1);
    expect(view.isActive).toBe(false);
    view.clear();
    expect(view.activeParticleCount).toBe(0);
  });
});
