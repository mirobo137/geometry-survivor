import type { SaveStore } from './save/SaveStore';
import type { AudioService } from '../audio/AudioService';

export interface PlatformLifecycle {
  init(): Promise<void>;
  onGameStart(): void;
  onGamePause(): void;
  onGameResume(): void;
  onGameOver(): void;
}

/** Rewarded placements are product decisions, not SDK-specific strings. */
export type RewardedPlacement = 'revive' | 'reroll' | 'double-nova' | 'cosmetic-unlock';

export type RewardedAdResult = 'rewarded' | 'dismissed' | 'unavailable' | 'error';

export interface AdService {
  isRewardedAvailable(placement: RewardedPlacement): Promise<boolean>;
  showRewarded(placement: RewardedPlacement): Promise<RewardedAdResult>;
}

/** Platform composition root; gameplay consumes the narrow services it needs. */
export interface PlatformAdapter {
  readonly name: string;
  readonly lifecycle: PlatformLifecycle;
  readonly ads: AdService;
  readonly saveStore: SaveStore;
  readonly audio: AudioService;
}
