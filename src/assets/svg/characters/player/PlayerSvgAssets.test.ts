import { describe, expect, it } from 'vitest';
import accentSvg from './player-accent.svg?raw';
import bodySvg from './player-body.svg?raw';
import coreSvg from './player-core.svg?raw';
import masterSvg from './player.svg?raw';
import ringSvg from './player-ring.svg?raw';
import shadowSvg from './player-shadow.svg?raw';
import weaponsSvg from './player-weapons.svg?raw';
import { createPlayerSkinSignatureSvg } from './SkinSignatureSvg';

const parts = [shadowSvg, ringSvg, weaponsSvg, bodySvg, coreSvg, accentSvg] as const;

describe('player SVG assets', () => {
  it('keeps modular pieces aligned, safe and linked to the master', () => {
    for (const svg of [masterSvg, ...parts]) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('player-'))).toBe(true);
    }

    for (const [, pathData] of parts.join('\n').matchAll(/\sd="([^"]+)"/g)) {
      expect(masterSvg).toContain(`d="${pathData}"`);
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
