import type { PlatformAdapter } from '../Platform';
import { AudioManager } from '../../audio/AudioService';
import { CrazyGamesAdService } from './CrazyGamesAdService';
import { CrazyGamesAudioService } from './CrazyGamesAudioService';
import { CrazyGamesPlatformLifecycle } from './CrazyGamesPlatformLifecycle';
import { CrazyGamesSaveStore } from './CrazyGamesSaveStore';

// Flip only after CrazyGames confirms Full Launch/ad eligibility for this game.
const ALLOW_PORTAL_REWARDED_ADS = false;

/** CrazyGames-only composition. No portal state leaks into local or Poki builds. */
export class CrazyGamesPlatform implements PlatformAdapter {
  public readonly name = 'crazygames';
  public readonly audio = new CrazyGamesAudioService(new AudioManager());
  public readonly saveStore = new CrazyGamesSaveStore();
  public readonly lifecycle = new CrazyGamesPlatformLifecycle(this.audio);
  public readonly ads = new CrazyGamesAdService(
    () => this.lifecycle.getSdk(), this.audio, undefined, ALLOW_PORTAL_REWARDED_ADS
  );

  /** Await SDK.init and load/migrate SDK.data before the app reads any progress. */
  public async prepare(): Promise<void> {
    let ready = false;
    try {
      const sdk = await this.lifecycle.waitForSdk();
      ready = this.saveStore.prepare(sdk?.data ?? null);
    } catch {
      // SDK data access must never make the game itself fail to start.
    }
    if (!ready) {
      console.warn('[CrazyGames] SDK.data is unavailable or its save could not be verified; this session will use memory-only progress.');
    }
  }
}
