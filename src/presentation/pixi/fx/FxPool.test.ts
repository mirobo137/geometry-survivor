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
});
