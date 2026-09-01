import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { FxPool } from './FxPool';

describe('FxPool', () => {
  it('reuses a bounded set of sprites and drops overflow', () => {
    const pool = new FxPool(Texture.WHITE, 2);
    expect(pool.capacity).toBe(2);
    expect(pool.activeCount).toBe(0);
    expect(pool.spawn(10, 20, 0xffffff, 0.2, 10, 0)).toBe(true);
    expect(pool.spawn(10, 20, 0xffffff, 0.2, 0, 10)).toBe(true);
    expect(pool.spawn(10, 20, 0xffffff, 0.2, 0, 0)).toBe(false);
    expect(pool.activeCount).toBe(2);

    pool.update(0.1);
    pool.update(0.1);
    pool.update(0.1);
    expect(pool.activeCount).toBe(0);
    expect(pool.spawn(30, 40, 0x75e6ff, 0.1, 0, 0)).toBe(true);
    pool.clear();
    expect(pool.activeCount).toBe(0);
  });

  it('can reuse the same bounded sprite for a cached alternate texture', () => {
    const pool = new FxPool(Texture.WHITE, 1);
    expect(pool.spawn(10, 20, 0xffffff, 0.2, 0, 0, 0.8, 0.6, Texture.EMPTY, 0.5)).toBe(true);
    const sprite = pool.root.children[0] as unknown as { texture: Texture; alpha: number; scale: { x: number } };
    expect(sprite.texture).toBe(Texture.EMPTY);
    pool.update(0.1);
    expect(sprite.alpha).toBeLessThan(0.5);
    expect(sprite.scale.x).toBeLessThan(0.6);
  });
});
