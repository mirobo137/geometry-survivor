import type { PlatformLifecycle } from '../Platform';

export class LocalPlatformLifecycle implements PlatformLifecycle {
  public async init(): Promise<void> {
    // Local mode intentionally has no external SDK or network dependency.
  }

  public onGameStart(): void {}
  public onGamePause(): void {}
  public onGameResume(): void {}
  public onGameOver(): void {}
}
