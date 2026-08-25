import type { PlatformAdapter } from '../Platform';

export class LocalPlatform implements PlatformAdapter {
  public readonly name = 'local';

  public async init(): Promise<void> {
    // Local mode intentionally has no external SDK or network dependency.
  }

  public onGameStart(): void {}
  public onGamePause(): void {}
  public onGameResume(): void {}
  public onGameOver(): void {}

  public async showMidgameAd(): Promise<void> {
    if (new URLSearchParams(window.location.search).get('ad') === 'error') {
      throw new Error('Simulated local ad error');
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  }
}
