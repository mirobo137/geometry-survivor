import { describe, expect, it } from 'vitest';
import vectorBoomerangSvg from './vector-boomerang.svg?raw';

describe('Vector Boomerang SVG master', () => {
  it('keeps a centered, oriented and vector-only weapon asset', () => {
    expect(vectorBoomerangSvg).toContain('viewBox="-24 -24 48 48"');
    expect(vectorBoomerangSvg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(vectorBoomerangSvg).toContain('id="vector-boomerang-shell"');
    expect(vectorBoomerangSvg).not.toMatch(/<script|<foreignObject|<image|url\(|filter=|mask=/i);
    expect((vectorBoomerangSvg.match(/<(?:path|circle|ellipse|rect|polygon|line)\b/g) ?? []).length).toBeLessThanOrEqual(8);
  });
});
