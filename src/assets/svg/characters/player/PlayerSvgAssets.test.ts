import { describe, expect, it } from 'vitest';
import accentSvg from './player-accent.svg?raw';
import bodySvg from './player-body.svg?raw';
import coreSvg from './player-core.svg?raw';
import masterSvg from './player.svg?raw';
import ringSvg from './player-ring.svg?raw';
import shadowSvg from './player-shadow.svg?raw';
import weaponsSvg from './player-weapons.svg?raw';
import { createPlayerSkinSignatureSvg } from './SkinSignatureSvg';
import violetMaster from './skins/violet/master.svg?raw';
import violetBody from './skins/violet/body.svg?raw';
import violetRing from './skins/violet/ring.svg?raw';
import violetCore from './skins/violet/core.svg?raw';
import amberMaster from './skins/amber/master.svg?raw';
import amberBody from './skins/amber/body.svg?raw';
import amberRing from './skins/amber/ring.svg?raw';
import amberCore from './skins/amber/core.svg?raw';
import emeraldMaster from './skins/emerald/master.svg?raw';
import emeraldBody from './skins/emerald/body.svg?raw';
import emeraldRing from './skins/emerald/ring.svg?raw';
import emeraldCore from './skins/emerald/core.svg?raw';

const parts = [ringSvg, bodySvg, coreSvg] as const;

const assertSafeFramed = (svg: string, prefix: string): void => {
  expect(svg).toContain('viewBox="-32 -32 64 64"');
  expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  expect(svg).not.toContain('\uFFFD');
  expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
  // Faceted planes are baked, not additional runtime sprites. Master budget: 24.
  expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(24);
};

describe('player SVG assets', () => {
  it('keeps modular pieces aligned, safe and linked to the master', () => {
    // Historical utility sources remain safe; weapons are not part of a hull master.
    for (const svg of [masterSvg, ...parts, shadowSvg, weaponsSvg, accentSvg]) {
      assertSafeFramed(svg, 'player-');
    }

    for (const [, pathData] of parts.join('\n').matchAll(/\sd="([^"]+)"/g)) {
      expect(masterSvg).toContain(`d="${pathData}"`);
    }
  });

  it('keeps hull silhouettes distinct per skin and aligned to their masters', () => {
    const families = [
      ['player-violet-', violetMaster, [violetBody, violetRing, violetCore]],
      ['player-amber-', amberMaster, [amberBody, amberRing, amberCore]],
      ['player-emerald-', emeraldMaster, [emeraldBody, emeraldRing, emeraldCore]]
    ] as const;
    const shells = [bodySvg, violetBody, amberBody, emeraldBody].map((svg) => {
      const match = svg.match(/id="[^"]*body-shell"[^>]*d="([^"]+)"/);
      return match?.[1] ?? svg.match(/\sd="([^"]+)"/)?.[1];
    });
    expect(new Set(shells).size).toBe(4);

    for (const [prefix, master, skinParts] of families) {
      assertSafeFramed(master, prefix);
      for (const part of skinParts) {
        assertSafeFramed(part, prefix);
        for (const [, pathData] of part.matchAll(/\sd="([^"]+)"/g)) {
          expect(master).toContain(`d="${pathData}"`);
        }
      }
    }
  });

  it('keeps every skin signature vector-only and framed for the player texture', () => {
    for (const skin of ['cyan', 'violet', 'amber', 'emerald'] as const) {
      const svg = createPlayerSkinSignatureSvg(skin);
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('player-signature-'))).toBe(true);
    }
  });
});
