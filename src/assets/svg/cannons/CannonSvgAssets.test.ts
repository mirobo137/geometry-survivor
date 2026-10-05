import { describe, expect, it } from 'vitest';
import { PROJECTILE_MUZZLE_OFFSETS } from '../../../content/weapons/WeaponDefinitions';
import projectileBasicSvg from './projectile-basic.svg?raw';
import projectileCurveSvg from './projectile-curve.svg?raw';
import projectileSmokeSvg from './projectile-smoke.svg?raw';
import projectileRainbowSvg from './projectile-rainbow.svg?raw';
import projectileLatticeSvg from './projectile-lattice.svg?raw';
import projectileHelixSvg from './projectile-helix.svg?raw';
import projectileBloomSvg from './projectile-bloom.svg?raw';
import {
  CANNON_BARREL_SVG,
  extractSvgGraphicMarkup
} from './CannonSvgMarkup';

const assertSafeFramed = (svg: string, prefix: string, maxPrimitives = 16): void => {
  expect(svg).toContain('viewBox="-32 -32 64 64"');
  expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  expect(svg).not.toContain('\uFFFD');
  expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
  expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(maxPrimitives);
};

describe('cannon and projectile SVG assets', () => {
  it('keeps left and right barrels aligned to the shared frame and muzzle slots', () => {
    const [leftMuzzle, rightMuzzle] = PROJECTILE_MUZZLE_OFFSETS;
    const barrelPaths = Object.values(CANNON_BARREL_SVG).map((pair) => pair.left.match(/\sd="([^"]+)"/)?.[1]);
    expect(new Set(barrelPaths).size).toBe(7);

    for (const [id, pair] of Object.entries(CANNON_BARREL_SVG)) {
      assertSafeFramed(pair.left, `cannon-${id}-`, 12);
      assertSafeFramed(pair.right, `cannon-${id}-`, 12);
      expect(pair.left).toContain(`cx="${leftMuzzle.x}"`);
      expect(pair.left).toContain(`cy="${leftMuzzle.y}"`);
      expect(pair.right).toContain(`cx="${rightMuzzle.x}"`);
      expect(pair.right).toContain(`cy="${rightMuzzle.y}"`);
    }
    // Pixi rasterizes this pair for the in-game player. Keep Bloomwake's
    // mirrored coordinates explicit: the DOM preview accepts path transforms,
    // but an unsupported transform must never erase a live muzzle in Pixi.
    expect(CANNON_BARREL_SVG.bloom.right).not.toContain('transform=');
    expect(CANNON_BARREL_SVG.bloom.right).toContain('d="M7-5 14-8 22-3');
  });

  it('extracts graphic markup without the SVG root', () => {
    const markup = extractSvgGraphicMarkup(CANNON_BARREL_SVG.basic.left);
    expect(markup).toContain('M-12-7 -24-14 -28-8 -16 3 -12 2z');
    expect(markup).not.toContain('<svg');
    expect(markup).not.toContain('<title');
    expect(markup).not.toContain('id="');
  });

  it('keeps projectiles centered and aligned to +X', () => {
    for (const svg of [projectileBasicSvg, projectileCurveSvg, projectileSmokeSvg, projectileRainbowSvg, projectileLatticeSvg, projectileHelixSvg, projectileBloomSvg]) {
      expect(svg).toContain('viewBox="-16 -16 32 32"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toContain('\uFFFD');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('projectile-'))).toBe(true);
    }
  });
});
