import { describe, expect, it } from 'vitest';
import accentSvg from './player-accent.svg?raw';
import bodySvg from './player-body.svg?raw';
import coreSvg from './player-core.svg?raw';
import ringSvg from './player-ring.svg?raw';
import shadowSvg from './player-shadow.svg?raw';
import amberBody from './skins/amber/body.svg?raw';
import amberRing from './skins/amber/ring.svg?raw';
import amberCore from './skins/amber/core.svg?raw';
import emeraldBody from './skins/emerald/body.svg?raw';
import emeraldRing from './skins/emerald/ring.svg?raw';
import emeraldCore from './skins/emerald/core.svg?raw';
import mantaBody from './skins/manta/body.svg?raw';
import mantaRing from './skins/manta/ring.svg?raw';
import mantaCore from './skins/manta/core.svg?raw';
import novaBody from './skins/nova/body.svg?raw';
import novaRing from './skins/nova/ring.svg?raw';
import novaCore from './skins/nova/core.svg?raw';
import obsidianBody from './skins/obsidian/body.svg?raw';
import obsidianRing from './skins/obsidian/ring.svg?raw';
import obsidianCore from './skins/obsidian/core.svg?raw';
import violetBody from './skins/violet/body.svg?raw';
import violetRing from './skins/violet/ring.svg?raw';
import violetCore from './skins/violet/core.svg?raw';
import { PLAYER_HULL_SVG } from './PlayerHullSvg';
import { createPlayerSkinSignatureSvg } from './SkinSignatureSvg';

const assertSafeFramed = (svg: string, prefix: string): void => {
  expect(svg).toContain('viewBox="-32 -32 64 64"');
  expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  expect(svg).not.toContain('\uFFFD');
  expect(svg).not.toMatch(/<script|<foreignObject|<image|url\(|on[a-z]+=|filter=|mask=/i);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
  expect((svg.match(/<(?:path|circle|ellipse|polygon|rect)\b/g) ?? []).length).toBeLessThanOrEqual(24);
};

describe('player SVG fallback assets', () => {
  it('keeps shared pieces safe and maps each equipped skin to its fallback parts', () => {
    const families = [
      ['cyan', 'player-', bodySvg, ringSvg, coreSvg],
      ['violet', 'player-violet-', violetBody, violetRing, violetCore],
      ['amber', 'player-amber-', amberBody, amberRing, amberCore],
      ['emerald', 'player-emerald-', emeraldBody, emeraldRing, emeraldCore],
      ['obsidian', 'player-obsidian-', obsidianBody, obsidianRing, obsidianCore],
      ['nova', 'player-nova-', novaBody, novaRing, novaCore],
      ['manta', 'player-manta-', mantaBody, mantaRing, mantaCore]
    ] as const;

    assertSafeFramed(shadowSvg, 'player-');
    assertSafeFramed(accentSvg, 'player-');
    for (const [skin, prefix, body, ring, core] of families) {
      for (const svg of [body, ring, core]) assertSafeFramed(svg, prefix);
      expect(PLAYER_HULL_SVG[skin]).toEqual({ body, ring, core });
    }

    expect(PLAYER_HULL_SVG.spearhead).toEqual(PLAYER_HULL_SVG.cyan);
    expect(PLAYER_HULL_SVG.corsair).toEqual(PLAYER_HULL_SVG.cyan);
    expect(PLAYER_HULL_SVG.nautilus).toEqual(PLAYER_HULL_SVG.cyan);
    expect(PLAYER_HULL_SVG.asterion).toEqual(PLAYER_HULL_SVG.cyan);
    expect(PLAYER_HULL_SVG.solstice).toEqual(PLAYER_HULL_SVG.amber);
  });

  it('keeps legacy cosmetic body silhouettes distinct', () => {
    const shellPath = (svg: string): string | undefined => {
      const match = svg.match(/id="[^"]*body-shell"[^>]*d="([^"]+)"/);
      return match?.[1] ?? svg.match(/\sd="([^"]+)"/)?.[1];
    };
    const shells = [bodySvg, violetBody, amberBody, emeraldBody, obsidianBody, novaBody].map(shellPath);
    expect(shells.every(Boolean)).toBe(true);
    expect(new Set(shells).size).toBe(shells.length);
  });

  it('keeps each procedural skin signature vector-only and framed', () => {
    for (const skin of ['cyan', 'violet', 'amber', 'emerald', 'obsidian', 'nova'] as const) {
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
