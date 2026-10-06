import type { PlatformAdapter } from '../Platform';
import { AudioManager } from '../../audio/AudioService';
import { LocalSaveStore } from '../local/LocalSaveStore';
import { CrazyGamesAdService } from './CrazyGamesAdService';
import { CrazyGamesAudioService } from './CrazyGamesAudioService';
import { CrazyGamesPlatformLifecycle } from './CrazyGamesPlatformLifecycle';

// Flip only after CrazyGames confirms Full Launch/ad eligibility for this game.
const ALLOW_PORTAL_REWARDED_ADS = false;

/** CrazyGames-only composition. No portal state leaks into local or Poki builds. */
export class CrazyGamesPlatform implements PlatformAdapter {
  public readonly name = 'crazygames';
  public readonly audio = new CrazyGamesAudioService(new AudioManager());
  public readonly saveStore = new LocalSaveStore();
  public readonly lifecycle = new CrazyGamesPlatformLifecycle(this.audio);
  public readonly ads = new CrazyGamesAdService(
    () => this.lifecycle.getSdk(), this.audio, undefined, ALLOW_PORTAL_REWARDED_ADS
  );
}
