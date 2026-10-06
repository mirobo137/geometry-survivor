import type { PlatformAdapter } from '../Platform';
import { AudioManager } from '../../audio/AudioService';
import { LocalSaveStore } from '../local/LocalSaveStore';
import { PokiAdService } from './PokiAdService';
import { PokiPlatformLifecycle } from './PokiPlatformLifecycle';

/** Poki-only composition. No Poki script or service is loaded by other builds. */
export class PokiPlatform implements PlatformAdapter {
  public readonly name = 'poki';
  public readonly lifecycle = new PokiPlatformLifecycle();
  public readonly saveStore = new LocalSaveStore();
  public readonly audio = new AudioManager();
  public readonly ads: PokiAdService;

  public constructor() {
    this.ads = new PokiAdService(() => this.lifecycle.getSdk(), this.audio);
  }
}
