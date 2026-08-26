import { describe, expect, it } from 'vitest';
import { SpatialGrid } from './SpatialGrid';

describe('SpatialGrid', () => {
  it('returns candidates from overlapping cells without allocating a result array', () => {
    const grid = new SpatialGrid(320, 240, 80);
    grid.insert(1, 40, 40);
    grid.insert(2, 150, 40);
    grid.insert(3, 280, 200);

    const first = grid.queryCircle(40, 40, 10);
    expect(first).toEqual([1]);
    expect(grid.queryCircle(155, 40, 80)).toEqual([1, 2]);
    expect(first).toEqual([1, 2]);
  });

  it('clamps positions outside the arena to edge cells', () => {
    const grid = new SpatialGrid(320, 240, 80);
    grid.insert(7, -40, 280);

    expect(grid.queryCircle(0, 239, 20)).toEqual([7]);
  });
});
