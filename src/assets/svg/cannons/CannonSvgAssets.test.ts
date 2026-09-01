import { describe, expect, it } from 'vitest';
import cannonBasicSvg from './cannon-basic.svg?raw';
import cannonCurveSvg from './cannon-curve.svg?raw';
import cannonSmokeSvg from './cannon-smoke.svg?raw';
import cannonRainbowSvg from './cannon-rainbow.svg?raw';
import projectileBasicSvg from './projectile-basic.svg?raw';
import projectileCurveSvg from './projectile-curve.svg?raw';
import projectileSmokeSvg from './projectile-smoke.svg?raw';
import projectileRainbowSvg from './projectile-rainbow.svg?raw';

describe('cannon and projectile SVG assets', () => {
  it('keeps every cannon package framed, local and vector-only', () => {
    for (const svg of [cannonBasicSvg, cannonCurveSvg, cannonSmokeSvg, cannonRainbowSvg]) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('cannon-'))).toBe(true);
    }
  });

  it('keeps projectiles centered and aligned to +X', () => {
    for (const svg of [projectileBasicSvg, projectileCurveSvg, projectileSmokeSvg, projectileRainbowSvg]) {
      expect(svg).toContain('viewBox="-16 -16 32 32"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('projectile-'))).toBe(true);
    }
  });
});
