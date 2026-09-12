import { describe, expect, it } from 'vitest';
import master from './boss.svg?raw';
import rear from './boss-rear.svg?raw';
import wings from './boss-wings.svg?raw';
import hull from './boss-hull.svg?raw';
import cockpit from './boss-cockpit.svg?raw';
import warden from './orbital-warden.svg?raw';
import wardenRear from './orbital-warden-rear.svg?raw';
import wardenWings from './orbital-warden-wings.svg?raw';
import wardenHull from './orbital-warden-hull.svg?raw';
import wardenCockpit from './orbital-warden-cockpit.svg?raw';

describe('Bastion source contract', () => {
  it('keeps the flattened source identical to four ordered pieces, within its budget', () => {
    const geometry = (svg: string): string[] => svg.match(/<path\b[^>]*\/>/g) ?? [];
    expect(geometry(master)).toEqual([rear, wings, hull, cockpit].flatMap(geometry));
    expect(geometry(master).length).toBeLessThanOrEqual(28);
    for (const svg of [master, rear, wings, hull, cockpit]) {
      expect(svg).toContain('viewBox="-56 -56 112 112"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
      expect(ids.every(id => id.startsWith('enemy-boss-'))).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('Orbital Warden source contract', () => {
  it('keeps the gyroscopic master identical to four ordered pieces', () => {
    const geometry = (svg: string): string[] => svg.match(/<path\b[^>]*\/>/g) ?? [];
    expect(geometry(warden)).toEqual([wardenRear, wardenWings, wardenHull, wardenCockpit].flatMap(geometry));
    expect(geometry(warden).length).toBeLessThanOrEqual(28);
    for (const svg of [warden, wardenRear, wardenWings, wardenHull, wardenCockpit]) {
      expect(svg).toContain('viewBox="-56 -56 112 112"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
      expect(ids.every(id => id.startsWith('enemy-orbital-warden-'))).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
