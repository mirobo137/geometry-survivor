import type { PlatformAdapter } from '../Platform';
import { LocalAdService } from './LocalAdService';
import { LocalPlatformLifecycle } from './LocalPlatformLifecycle';

export class LocalPlatform implements PlatformAdapter {
  public readonly name = 'local';
  public readonly lifecycle = new LocalPlatformLifecycle();
  public readonly ads = new LocalAdService();
}
