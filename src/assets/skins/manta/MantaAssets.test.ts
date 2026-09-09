import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAYER_HULL_SVG } from '../../svg/characters/player/PlayerHullSvg';
import { migrateSaveData } from '../../../platform/save/SaveStore';

describe('Manta asset contract', () => {
  it('retains the seventh cosmetic through save migration', () => {
    const save = migrateSaveData({ schemaVersion: 5, skins: { selected: 'manta', unlocked: ['cyan', 'manta'] } });
    expect(save.skins).toEqual({ selected: 'manta', unlocked: ['cyan', 'manta'] });
  });
  it('publishes a small RGBA PNG and safe editable vector pieces', () => {
    const png = readFileSync(new URL('./manta-wing.png', import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(256);
    expect(png.readUInt32BE(20)).toBe(256);
    expect(png[25]).toBe(6); // RGBA, never a painted checkerboard RGB export.
    expect(png.length).toBeLessThan(64 * 1024);
    for (const svg of Object.values(PLAYER_HULL_SVG.manta)) {
      expect(svg).toContain('viewBox="-32 -32 64 64"');
      expect(svg).not.toMatch(/<image|<script|filter=|mask=/i);
    }
  });
});
