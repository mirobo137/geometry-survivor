import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalAdService } from './LocalAdService';

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
