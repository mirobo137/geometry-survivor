import type { AdService } from '../Platform';

export class LocalAdService implements AdService {
  public async showMidgameAd(): Promise<void> {
    if (new URLSearchParams(window.location.search).get('ad') === 'error') {
      throw new Error('Simulated local ad error');
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  }
}
