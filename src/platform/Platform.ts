import type { SaveStore } from './save/SaveStore';

export interface PlatformLifecycle {
  init(): Promise<void>;
  onGameStart(): void;
  onGamePause(): void;
  onGameResume(): void;
  onGameOver(): void;
}

export interface AdService {
  showMidgameAd(): Promise<void>;
}

/** Platform composition root; gameplay consumes the narrow services it needs. */
export interface PlatformAdapter {
  readonly name: string;
  readonly lifecycle: PlatformLifecycle;
  readonly ads: AdService;
  readonly saveStore: SaveStore;
}
