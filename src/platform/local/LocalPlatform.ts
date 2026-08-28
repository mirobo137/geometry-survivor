import type { PlatformAdapter } from '../Platform';
import { AudioManager } from '../../audio/AudioService';
import { LocalAdService } from './LocalAdService';
import { LocalPlatformLifecycle } from './LocalPlatformLifecycle';
import { LocalSaveStore } from './LocalSaveStore';

export class LocalPlatform implements PlatformAdapter {
  public readonly name = 'local';
  public readonly lifecycle = new LocalPlatformLifecycle();
  public readonly ads = new LocalAdService();
  public readonly saveStore = new LocalSaveStore();
  public readonly audio = new AudioManager();
}
