import { describe, expect, it } from 'vitest';
import { FRACTURE_BOSS_SVGS, FRACTURE_ENEMY_SVGS } from './FractureEnemySvgMarkup';

const geometry = (svg: string): string[] => svg.match(/<path\b[^>]*\/>/g) ?? [];
const fleets = [...Object.entries(FRACTURE_ENEMY_SVGS), ['fracture-engine', FRACTURE_BOSS_SVGS] as const];

describe('Fracture modular ships', () => {
  for (const [id, ship] of fleets) {
    it(`${id}: Low preserves all ordered plates, bounded geometry and source budget`, () => {
      const boss = id === 'fracture-engine';
      const extent = boss ? 56 : 32;
      const parts = [ship.rear, ship.wings, ship.hull, ship.cockpit];
      expect(geometry(ship.flat)).toEqual(parts.flatMap(geometry));
      expect(geometry(ship.flat).length).toBeLessThanOrEqual(boss ? 28 : 24);
      for (const svg of [ship.flat, ...parts]) {
        expect(svg).toContain(`viewBox="${-extent} ${-extent} ${extent * 2} ${extent * 2}"`);
        expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
        expect(svg).toContain('role="img"');
        expect(svg).not.toMatch(/<script|<foreignObject|<image|<filter|<mask|<clipPath|transform=|url\(|on[a-z]+=/i);
        const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every((value) => value.startsWith(`enemy-${id}-`))).toBe(true);
        // Sources deliberately use absolute M/L/H/V/Z only. All vertices must
        // remain inside the common frame, including a margin for raster edges.
        for (const [, d] of svg.matchAll(/\bd="([^"]+)"/g)) {
          expect(d.replace(/[MLHVZ\d.\s-]/g, '')).toBe('');
          const coords = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
          expect(Math.max(...coords.map(Math.abs))).toBeLessThanOrEqual(extent - 2);
        }
      }
    });
  }
  it('does not reuse one hull geometry with four different palettes', () => {
    const hulls = Object.values(FRACTURE_ENEMY_SVGS).map((ship) =>
      [...ship.hull.matchAll(/\bd="([^"]+)"/g)].map((match) => match[1]).join('|'));
    expect(new Set(hulls).size).toBe(4);
  });
});
