import { describe, expect, it } from 'vitest';
import turtleSvg from './turtle/turtle.svg?raw';
import chaserSvg from './chaser/chaser.svg?raw';
import chaserRearSvg from './chaser/chaser-rear.svg?raw';
import chaserWingsSvg from './chaser/chaser-wings.svg?raw';
import chaserHullSvg from './chaser/chaser-hull.svg?raw';
import chaserCockpitSvg from './chaser/chaser-cockpit.svg?raw';
import fastSvg from './fast/fast.svg?raw';
import fastRearSvg from './fast/fast-rear.svg?raw';
import fastWingsSvg from './fast/fast-wings.svg?raw';
import fastHullSvg from './fast/fast-hull.svg?raw';
import fastCockpitSvg from './fast/fast-cockpit.svg?raw';
import tankSvg from './tank/tank.svg?raw';
import tankRearSvg from './tank/tank-rear.svg?raw';
import tankWingsSvg from './tank/tank-wings.svg?raw';
import tankHullSvg from './tank/tank-hull.svg?raw';
import tankCockpitSvg from './tank/tank-cockpit.svg?raw';
import eliteSvg from './elite/elite.svg?raw';
import eliteRearSvg from './elite/elite-rear.svg?raw';
import eliteWingsSvg from './elite/elite-wings.svg?raw';
import eliteHullSvg from './elite/elite-hull.svg?raw';
import eliteCockpitSvg from './elite/elite-cockpit.svg?raw';

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
    const families = [
      ['enemy-chaser-', chaserSvg, [chaserRearSvg, chaserWingsSvg, chaserHullSvg, chaserCockpitSvg]],
      ['enemy-fast-', fastSvg, [fastRearSvg, fastWingsSvg, fastHullSvg, fastCockpitSvg]],
      ['enemy-tank-', tankSvg, [tankRearSvg, tankWingsSvg, tankHullSvg, tankCockpitSvg]],
      ['enemy-elite-', eliteSvg, [eliteRearSvg, eliteWingsSvg, eliteHullSvg, eliteCockpitSvg]]
    ] as const;
    for (const [prefix, svg, parts] of families) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).toContain('role="img"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
      expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(12);
      for (const part of parts) {
        expect(part).toContain('viewBox="-32 -32 64 64"');
        expect(part).toContain('preserveAspectRatio="xMidYMid meet"');
        expect(part).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
        const partIds = [...part.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
        expect(new Set(partIds).size).toBe(partIds.length);
        expect(partIds.every((id) => id.startsWith(prefix))).toBe(true);
        for (const [, pathData] of part.matchAll(/\sd="([^"]+)"/g)) {
          expect(svg).toContain(`d="${pathData}"`);
        }
      }
    }
  });
});
