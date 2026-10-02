import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { migrateSaveData } from '../../../platform/save/SaveStore';

describe('Manta fleet skin contract', () => {
  it('retains existing ownership and selection while granting the free base ship', () => {
    const save = migrateSaveData({ schemaVersion: 5, skins: { selected: 'manta', unlocked: ['cyan', 'manta'] } });
    expect(save.skins).toEqual({ selected: 'manta', unlocked: ['cyan', 'spearhead', 'manta'] });
  });
  it('publishes the new full-ship image as transparent RGBA PNG', () => {
    const png = readFileSync(new URL('../ships/manta.png', import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(256);
    expect(png.readUInt32BE(20)).toBe(256);
    expect(png[25]).toBe(6); // RGBA, never a painted checkerboard RGB export.
    expect(png.length).toBeLessThan(128 * 1024);
  });
});
