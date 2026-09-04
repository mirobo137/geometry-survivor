import type { AdService, RewardedAdResult, RewardedPlacement } from '../Platform';

type LocalAdMode = RewardedAdResult | 'timeout';

const LOCAL_AD_DELAY_MS = 250;

const getLocalAdMode = (): LocalAdMode => {
  if (typeof window === 'undefined') return 'rewarded';
  const mode = new URLSearchParams(window.location.search).get('ad');
  if (mode === 'dismissed' || mode === 'unavailable' || mode === 'error' || mode === 'timeout') {
    return mode;
  }
  return 'rewarded';
};

export class LocalAdService implements AdService {
  public async isRewardedAvailable(_placement: RewardedPlacement): Promise<boolean> {
    // An adapter can be available and still fail while opening/finishing.
    // Keeping `error` available makes that path testable from the UI.
    return getLocalAdMode() !== 'unavailable';
  }

  public async showRewarded(_placement: RewardedPlacement): Promise<RewardedAdResult> {
    const mode = getLocalAdMode();
    if (mode === 'unavailable') return 'unavailable';
    if (mode === 'error') return 'error';
    if (mode === 'timeout') {
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, LOCAL_AD_DELAY_MS));
      return 'error';
    }
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, LOCAL_AD_DELAY_MS));
    return mode;
  }
}
