export interface PlatformAdapter {
  readonly name: string;
  init(): Promise<void>;
  onGameStart(): void;
  onGamePause(): void;
  onGameResume(): void;
  onGameOver(): void;
  showMidgameAd(): Promise<void>;
}
