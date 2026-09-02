import { describe, expect, it } from 'vitest';
import { FrameProfiler } from './FrameProfiler';

describe('FrameProfiler', () => {
  it('keeps a bounded rolling sample and calculates p95', () => {
    const profiler = new FrameProfiler(true);
    for (let index = 0; index < 240; index += 1) profiler.record(index === 239 ? 40 : 16.67);
    const snapshot = profiler.snapshot();
    expect(snapshot.samples).toBe(240);
    expect(snapshot.averageMs).toBeGreaterThan(16.67);
    expect(snapshot.p95Ms).toBeCloseTo(16.67, 2);
    expect(snapshot.maxMs).toBe(40);
    expect(snapshot.longFrames).toBe(1);
  });

  it('does not sample when profiling is disabled', () => {
    const profiler = new FrameProfiler();
    profiler.record(100);
    expect(profiler.snapshot()).toMatchObject({ enabled: false, samples: 0, longFrames: 0 });
  });
});
