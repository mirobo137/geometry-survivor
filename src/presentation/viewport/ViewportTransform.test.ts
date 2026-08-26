import { describe, expect, it } from 'vitest';
import { ViewportTransform } from './ViewportTransform';

describe('ViewportTransform', () => {
  it('contains the logical game without stretching at 16:9', () => {
    const viewport = new ViewportTransform();
    const state = viewport.resize(1920, 1080, 2);

    expect(state.orientation).toBe('landscape');
    expect(state.logicalWidth).toBe(1280);
    expect(state.logicalHeight).toBe(720);
    expect(state.scale).toBe(1.5);
    expect(state.offsetX).toBe(0);
    expect(state.offsetY).toBe(0);
    expect(state.dpr).toBe(1.5);
    expect(viewport.toWorld(960, 540)).toEqual({ x: 640, y: 360 });
  });

  it('letterboxes a taller viewport and maps its center correctly', () => {
    const viewport = new ViewportTransform();
    const state = viewport.resize(1200, 1000);

    expect(state.scale).toBeCloseTo(1200 / 1280);
    expect(state.offsetY).toBeGreaterThan(0);
    expect(viewport.toLogical(600, 500)).toEqual({ x: 640, y: 360 });
  });

  it('uses a portrait presentation viewport without shrinking the arena', () => {
    const viewport = new ViewportTransform();
    const state = viewport.resize(390, 844, 3);

    expect(state.orientation).toBe('portrait');
    expect(state.logicalWidth).toBe(720);
    expect(state.logicalHeight).toBe(1280);
    expect(state.scale).toBeCloseTo(390 / 720);
    expect(state.worldOffsetX).toBe(-280);
    expect(state.worldOffsetY).toBe(280);
    expect(viewport.toWorld(195, 422)).toEqual({ x: 640, y: 360 });
  });
});
