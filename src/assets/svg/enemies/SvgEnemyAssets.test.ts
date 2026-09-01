import { describe, expect, it } from 'vitest';
import turtleSvg from './turtle/turtle.svg?raw';
import fastSvg from './fast/fast.svg?raw';
import tankSvg from './tank/tank.svg?raw';
import eliteSvg from './elite/elite.svg?raw';

describe('enemy SVG masters', () => {
  it('keeps the top-down turtle within the character contract', () => {
    expect(turtleSvg).toContain('viewBox="-32 -32 64 64"');
    expect(turtleSvg).toContain('role="img"');
    expect(turtleSvg).toContain('id="enemy-turtle-shell-base"');
    expect(turtleSvg).toContain('id="enemy-turtle-head-base"');
    expect(turtleSvg).toContain('id="enemy-turtle-leg-front-left"');
    expect(turtleSvg).toContain('id="enemy-turtle-leg-rear-right"');
    expect(turtleSvg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
    const ids = [...turtleSvg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('enemy-turtle-'))).toBe(true);
    expect((turtleSvg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(20);
  });
});

describe('enemy SVG masters', () => {
  it('keeps the Fast, Tank and Elite family masters self-contained and directional', () => {
    for (const [prefix, svg] of [['enemy-fast-', fastSvg], ['enemy-tank-', tankSvg], ['enemy-elite-', eliteSvg]] as const) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).toContain('role="img"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
      expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(12);
    }
  });
});
