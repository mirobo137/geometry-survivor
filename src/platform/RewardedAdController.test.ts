import { describe, expect, it, vi } from 'vitest';
import type { AdService, RewardedAdResult } from './Platform';
import type { RewardedPlacement } from './Platform';
import { RewardedAdController } from './RewardedAdController';

const placements: readonly RewardedPlacement[] = ['revive', 'reroll', 'double-nova', 'cosmetic-unlock'];

const service = (overrides: Partial<AdService> = {}): AdService => ({
  isRewardedAvailable: vi.fn(async () => true),
  showRewarded: vi.fn(async (): Promise<RewardedAdResult> => 'rewarded'),
  ...overrides
});

describe('RewardedAdController', () => {
  it('translates an unavailable placement without opening the ad', async () => {
    const ads = service({ isRewardedAvailable: vi.fn(async () => false) });
    const controller = new RewardedAdController(ads);

    await expect(controller.request('double-nova')).resolves.toBe('unavailable');
    expect(ads.showRewarded).not.toHaveBeenCalled();
    expect(controller.isPending).toBe(false);
  });

  it.each(placements)('preserves a successful result for %s', async (placement) => {
    const showRewarded = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
    const controller = new RewardedAdController(service({ showRewarded }));

    await expect(controller.request(placement)).resolves.toBe('rewarded');
    expect(showRewarded).toHaveBeenCalledTimes(1);
    expect(controller.isPending).toBe(false);
  });

  it('converts an availability exception into a safe unavailable result', async () => {
    const ads = service({ isRewardedAvailable: vi.fn(async () => { throw new Error('availability'); }) });
    const controller = new RewardedAdController(ads);

    await expect(controller.request('reroll')).resolves.toBe('error');
    expect(ads.showRewarded).not.toHaveBeenCalled();
    expect(controller.isPending).toBe(false);
  });

  it('allows one request at a time and releases the lock after a result', async () => {
    let finish: ((value: 'rewarded') => void) | undefined;
    const ads = service({
      showRewarded: vi.fn(() => new Promise<'rewarded'>((resolve) => { finish = resolve; }))
    });
    const controller = new RewardedAdController(ads);
    const first = controller.request('double-nova');

    await expect(controller.request('double-nova')).resolves.toBe('error');
    expect(controller.isPending).toBe(true);
    finish?.('rewarded');
    await expect(first).resolves.toBe('rewarded');
    expect(controller.isPending).toBe(false);
  });

  it('converts adapter exceptions into a safe error result', async () => {
    const ads = service({ showRewarded: vi.fn(async () => { throw new Error('boom'); }) });
    const controller = new RewardedAdController(ads);

    await expect(controller.request('revive')).resolves.toBe('error');
    expect(controller.isPending).toBe(false);
  });
});
