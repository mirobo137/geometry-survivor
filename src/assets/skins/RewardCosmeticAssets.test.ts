import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REWARD_COSMETICS, REWARD_SHIP_IDS, REWARD_CANNON_IDS, REWARD_BACKGROUND_IDS } from '../../content/retention/RewardCosmeticDefinitions';
import { REWARD_COSMETIC_IMAGES, REWARD_SHIP_ART, REWARD_CANNON_ART, REWARD_BACKGROUND_URLS, REWARD_PROJECTILE_ART, REWARD_PROJECTILE_URLS } from './RewardCosmeticAssets';
import { createCannonPreviewSvg } from '../../ui/skins/CannonPreviewSvg';
import { getCannonSkinDefinition } from '../../content/visual/CannonSkinDefinitions';

describe('generated reward art contract', () => {
  it('covers every cosmetic and gives every reward cannon its own body, bolt and wake', () => {
    expect(Object.keys(REWARD_COSMETIC_IMAGES)).toHaveLength(30);
    expect(Object.keys(REWARD_SHIP_ART)).toEqual([...REWARD_SHIP_IDS]);
    expect(Object.keys(REWARD_CANNON_ART)).toEqual([...REWARD_CANNON_IDS]);
    expect(Object.keys(REWARD_BACKGROUND_URLS)).toEqual([...REWARD_BACKGROUND_IDS]);
    expect(new Set(Object.values(REWARD_PROJECTILE_URLS)).size).toBe(20);
    for (const id of REWARD_CANNON_IDS) {
      const art = REWARD_PROJECTILE_ART[id];
      const preview = createCannonPreviewSvg(id, { animated: true });
      expect(preview).toContain(REWARD_CANNON_ART[id].url);
      expect(preview).toContain(REWARD_PROJECTILE_URLS[art.headId]);
      expect(preview).toContain(REWARD_PROJECTILE_URLS[art.trailId]);
      expect(preview).toContain(`data-trail="${getCannonSkinDefinition(id).trail}"`);
      expect(createCannonPreviewSvg(id, { layout: 'thumbnail' })).toContain('transform="rotate(90)"');
    }
    expect(REWARD_COSMETICS.filter(x => x.family === 'cannon').filter(x => ['curve','helix','gyre','razor'].includes(getCannonSkinDefinition(x.id).trail)).length).toBeGreaterThanOrEqual(5);
  });
  it('keeps generated derivatives real WebP, transparent where needed and inside the measured package budget', () => {
    const report = JSON.parse(readFileSync(new URL('../images/reward-catalog/asset-report.json', import.meta.url), 'utf8')) as { file: string; bytes: number; width: number; height: number; alpha: [number,number] | null }[];
    expect(report).toHaveLength(58);
    let bytes = 0;
    for (const entry of report) {
      const data = readFileSync(new URL('../../../'+entry.file, import.meta.url));
      expect(data.toString('ascii', 0, 4)).toBe('RIFF');
      expect(data.toString('ascii', 8, 12)).toBe('WEBP');
      expect(data.length).toBe(entry.bytes);
      bytes += data.length;
      expect(Math.max(entry.width, entry.height)).toBeLessThanOrEqual(1024);
      if (entry.alpha) { expect(entry.alpha[0]).toBe(0); expect(entry.alpha[1]).toBeGreaterThan(16); }
      expect(data.length).toBeLessThan(entry.alpha ? 70_000 : 150_000);
    }
    expect(bytes).toBeLessThan(1_800_000);
  });
});
