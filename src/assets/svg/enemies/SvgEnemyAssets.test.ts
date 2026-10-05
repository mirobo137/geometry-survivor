import { describe, expect, it } from 'vitest';
import chaserSvg from './chaser/chaser.svg?raw';
import fastSvg from './fast/fast.svg?raw';
import tankSvg from './tank/tank.svg?raw';
import eliteSvg from './elite/elite.svg?raw';
import orbiterSvg from './orbiter/orbiter.svg?raw';
import chargerSvg from './charger/charger.svg?raw';
import splitterSvg from './splitter/splitter.svg?raw';
import prismWeaverSvg from './prism-weaver/prism-weaver.svg?raw';
import replicaSvg from './warden-replica/warden-replica.svg?raw';

const productionFallbacks = [
  ['enemy-chaser-', chaserSvg],
  ['enemy-fast-', fastSvg],
  ['enemy-tank-', tankSvg],
  ['enemy-elite-', eliteSvg],
  ['enemy-orbiter-', orbiterSvg],
  ['enemy-charger-', chargerSvg],
  ['enemy-splitter-', splitterSvg],
  ['enemy-prism-weaver-', prismWeaverSvg],
  ['enemy-warden-replica-', replicaSvg]
] as const;

describe('enemy SVG fallback masters', () => {
  it('keeps every production fallback complete, safe and framed', () => {
    for (const [prefix, svg] of productionFallbacks) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).toContain('role="img"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);

      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
      expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(24);
    }
  });

  it('keeps the Warden replica fallback inside its shared 64px texture frame', () => {
    // Pixi's Graphics.svg parser walks <g> but does not apply its transform.
    expect(replicaSvg).not.toMatch(/<g\s+transform=/);
    const values = [...replicaSvg.matchAll(/\sd="([^"]+)"/g)].flatMap(([, pathData]) =>
      [...pathData.matchAll(/-?(?:\d+\.\d+|\d+|\.\d+)/g)].map(([value]) => Number(value))
    );
    expect(values.length).toBeGreaterThan(0);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-32);
    expect(Math.max(...values)).toBeLessThanOrEqual(32);
  });
});
