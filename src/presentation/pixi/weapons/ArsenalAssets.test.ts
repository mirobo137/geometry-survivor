import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { WEAPON_EVOLUTION_IDS } from '../../../content/weapons/WeaponEvolutionDefinitions';

describe('generated combat PNG contract', () => {
  it('covers every evolution and base plus shield with bounded RGBA frames', () => {
    const directory = fileURLToPath(new URL('../../../assets/fx/arsenal/', import.meta.url));
    const files = readdirSync(directory).filter(name => name.endsWith('.png'));
    expect(files).toHaveLength(21);
    for (const id of [...WEAPON_EVOLUTION_IDS, 'projectile', 'orbit', 'chain', 'boomerang', 'pulse_ring', 'recharging_shield',
      'thunderhead_burst', 'singularity_split', 'singularity_shard']) {
      const png = readFileSync(directory + id.replaceAll('_', '-') + '.png');
      expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
      expect([128, 256]).toContain(width);
      expect(height).toBe(width);
      expect(png[25]).toBe(6); // RGBA, not an opaque RGB canvas
      expect(png.length).toBeLessThan(110_000);
    }
    expect(files.reduce((sum, name) => sum + readFileSync(directory + name).length, 0)).toBeLessThan(750_000);
  });
});
