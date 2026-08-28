import { describe, expect, it } from 'vitest';
import headSvg from './turtle-head.svg?raw';
import frontSvg from './turtle-limbs-front.svg?raw';
import rearSvg from './turtle-limbs-rear.svg?raw';
import shellSvg from './turtle-shell.svg?raw';
import masterSvg from './turtle.svg?raw';

const parts = [shellSvg, frontSvg, rearSvg, headSvg] as const;

describe('turtle SVG parts', () => {
  it('keeps every animated part aligned, safe and self-contained', () => {
    for (const svg of parts) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('enemy-turtle-') || id.startsWith('turtle-'))).toBe(true);

      // The static master remains the source-of-truth silhouette. If a part
      // changes, this guard forces the fallback and animated composition to
      // be updated together instead of drifting visually.
      for (const [, pathData] of svg.matchAll(/\sd="([^"]+)"/g)) {
        expect(masterSvg).toContain(`d="${pathData}"`);
      }
    }
  });
});
