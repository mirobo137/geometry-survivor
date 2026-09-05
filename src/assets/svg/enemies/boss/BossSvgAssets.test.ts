import { describe, expect, it } from 'vitest';
import master from './boss.svg?raw';
import rear from './boss-rear.svg?raw';
import wings from './boss-wings.svg?raw';
import hull from './boss-hull.svg?raw';
import cockpit from './boss-cockpit.svg?raw';

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
