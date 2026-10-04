import { GraphicsContext } from 'pixi.js';

// Author at useful pixel size so Pixi tessellates round glows smoothly.
export const DEFEAT_BLOOM_UNITS = 32;

/** Cached, asset-independent reactor discharge. Geometry is built once per view. */
export const createDefeatBloomContexts = (): readonly [GraphicsContext, GraphicsContext, GraphicsContext] => {
  const haze = new GraphicsContext();
  const jets = new GraphicsContext();
  const flare = new GraphicsContext();
  // Overlapping translucent discs approximate a soft glow without a blur filter.
  for (let step = 0; step < 12; step++) {
    haze.beginPath().circle(0, 0, (1 - step * 0.075) * DEFEAT_BLOOM_UNITS)
      .fill({ color: 0x55bdff, alpha: 0.009 + step * 0.003 });
  }
  // Six separated pressure jets leave the hull readable between them.
  for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3 + Math.PI / 6;
    const c = Math.cos(angle), s = Math.sin(angle);
    const rotate = (points: readonly number[]): number[] => points.map((_, i) => {
      const x = points[i - i % 2], y = points[i - i % 2 + 1];
      return (i % 2 === 0 ? x * c - y * s : x * s + y * c) * DEFEAT_BLOOM_UNITS;
    });
    jets.poly(rotate([0.34,-0.02,0.67,-0.04,1.28,0,0.67,0.04,0.34,0.02]))
      .fill({ color: 0x68daff, alpha: 0.85 });
    jets.poly(rotate([0.48,0,0.7,-0.01,1.08,0,0.7,0.01]))
      .fill({ color: 0xe6fbff, alpha: 0.95 });
  }
  flare.beginPath().circle(0, 0, 0.25 * DEFEAT_BLOOM_UNITS).fill({ color: 0xffd396, alpha: 0.3 });
  flare.poly([-1.3,0,-0.16,-0.05,0,-0.11,0.16,-0.05,1.3,0,0.16,0.05,0,0.11,-0.16,0.05].map(v => v * DEFEAT_BLOOM_UNITS))
    .fill(0xfff2d5);
  flare.poly([0,-0.78,0.05,-0.12,0.12,0,0.05,0.12,0,0.78,-0.05,0.12,-0.12,0,-0.05,-0.12].map(v => v * DEFEAT_BLOOM_UNITS))
    .fill(0xe3f8ff);
  flare.beginPath().circle(0, 0, 0.115 * DEFEAT_BLOOM_UNITS).fill(0xffffff);
  return [haze, jets, flare];
};
