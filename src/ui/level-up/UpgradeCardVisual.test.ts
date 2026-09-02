import { describe, expect, it } from 'vitest';
import { UPGRADE_DEFINITIONS } from '../../content/upgrades/UpgradeDefinitions';
import { getUpgradeCardVisual } from './UpgradeCardVisual';

describe('upgrade card visual map', () => {
  it('assigns every data-driven upgrade a stable icon, tone and category', () => {
    for (const upgrade of UPGRADE_DEFINITIONS) {
      const visual = getUpgradeCardVisual(upgrade.id);
      expect(visual.icon).toMatch(/^(speed|projectile|core|orbit|chain|armor|experience|repair|vampirism|critical|shield|phase)$/);
      expect(visual.tone).toMatch(/^(cyan|gold|violet|amber|rose|mint)$/);
      expect(visual.category.length).toBeGreaterThan(0);
    }
  });
});
