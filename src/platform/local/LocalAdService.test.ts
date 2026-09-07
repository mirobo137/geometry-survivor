import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalAdService } from './LocalAdService';
import type { RewardedPlacement } from '../Platform';

const placements: readonly RewardedPlacement[] = ['revive', 'reroll', 'double-nova', 'cosmetic-unlock'];

describe('LocalAdService', () => {
  afterEach(() => vi.unstubAllGlobals());

  const setSearch = (search: string): void => {
    vi.stubGlobal('window', { location: { search } });
  };

  it('defaults to a successful explicit local simulation', async () => {
    setSearch('');
    const ads = new LocalAdService();

    await expect(ads.isRewardedAvailable('double-nova')).resolves.toBe(true);
    await expect(ads.showRewarded('double-nova')).resolves.toBe('rewarded');
  });

  it.each(placements)('keeps the successful local contract for %s', async (placement) => {
    setSearch('');
    const ads = new LocalAdService();

    await expect(ads.isRewardedAvailable(placement)).resolves.toBe(true);
    await expect(ads.showRewarded(placement)).resolves.toBe('rewarded');
  });

  it.each(placements)('marks %s unavailable without pretending it was rewarded', async (placement) => {
    setSearch('?ad=unavailable');
    const ads = new LocalAdService();

    await expect(ads.isRewardedAvailable(placement)).resolves.toBe(false);
    await expect(ads.showRewarded(placement)).resolves.toBe('unavailable');
  });

  it.each([
    ['dismissed', 'dismissed'],
    ['unavailable', 'unavailable'],
    ['error', 'error'],
    ['timeout', 'error']
  ] as const)('maps ?ad=%s to %s without throwing', async (mode, expected) => {
    setSearch(`?ad=${mode}`);
    const ads = new LocalAdService();

    await expect(ads.isRewardedAvailable('reroll')).resolves.toBe(mode !== 'unavailable');
    await expect(ads.showRewarded('reroll')).resolves.toBe(expected);
  });
});
