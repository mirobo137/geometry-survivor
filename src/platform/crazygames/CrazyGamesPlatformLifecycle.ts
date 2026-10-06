import type { PlatformLifecycle } from '../Platform';
import type { CrazyGamesAudioService } from './CrazyGamesAudioService';
import { loadCrazyGamesSdk, type CrazyGamesSdk } from './CrazyGamesSdk';

const SDK_INIT_TIMEOUT_MS = 4_000;
const SDK_READY_TIMEOUT_MS = 8_500;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => (
  new Promise((resolve) => {
    let settled = false;
    const timeout = globalThis.setTimeout(() => finish(fallback), timeoutMs);
    const finish = (value: T): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      resolve(value);
    };
    promise.then(finish, () => finish(fallback));
  })
);

/** Buffers game events while the portal SDK initializes in the background. */
export class CrazyGamesPlatformLifecycle implements PlatformLifecycle {
  private sdk: CrazyGamesSdk | null = null;
  private connection: Promise<CrazyGamesSdk | null> | null = null;
  private gameReady = false;
  private wantsGameplay = false;
  private gameplayActive = false;
  private loadingStarted = false;
  private loadingFinished = false;

  public constructor(
    private readonly audio: CrazyGamesAudioService,
    private readonly loadSdk: () => Promise<CrazyGamesSdk | null> = loadCrazyGamesSdk,
    private readonly sdkInitTimeoutMs = SDK_INIT_TIMEOUT_MS,
    private readonly sdkReadyTimeoutMs = SDK_READY_TIMEOUT_MS
  ) {}

  public init(): Promise<void> {
    void this.ensureConnection();
    // A blocked portal CDN must not hold the game boot screen.
    return Promise.resolve();
  }

  /** Waits for initialized SDK data during the boot/loading screen, but is bounded. */
  public waitForSdk(): Promise<CrazyGamesSdk | null> {
    return withTimeout(this.ensureConnection(), this.sdkReadyTimeoutMs, null);
  }

  public onGameReady(): void {
    this.gameReady = true;
    this.syncSdkState();
  }

  public onGameStart(): void {
    this.wantsGameplay = true;
    this.syncSdkState();
  }

  public onGamePause(): void {
    this.wantsGameplay = false;
    this.syncSdkState();
  }

  public onGameResume(): void {
    this.wantsGameplay = true;
    this.syncSdkState();
  }

  public onGameOver(): void {
    this.wantsGameplay = false;
    this.syncSdkState();
  }

  public getSdk(): CrazyGamesSdk | null {
    return this.sdk;
  }

  private ensureConnection(): Promise<CrazyGamesSdk | null> {
    if (!this.connection) this.connection = this.connect().catch(() => null);
    return this.connection;
  }

  private async connect(): Promise<CrazyGamesSdk | null> {
    const sdk = await this.loadSdk();
    if (!sdk) return null;

    const initialized = await withTimeout(sdk.init(), this.sdkInitTimeoutMs, false);
    if (initialized === false) return null;
    // v3 reports "uninitialized" until init resolves. Checking first silently
    // skips init and prevents every loading/gameplay event from reaching QA.
    if (sdk.environment !== 'local' && sdk.environment !== 'crazygames') return null;
    this.sdk = sdk;
    try {
      this.audio.setPortalMuted(sdk.game.settings?.muteAudio === true);
    } catch {
      // Audio remains usable with the player's own settings if this hook fails.
    }
    try {
      sdk.game.addSettingsChangeListener?.((settings) => {
        try {
          this.audio.setPortalMuted(settings.muteAudio === true);
        } catch {
          // A platform preference must not break gameplay or audio controls.
        }
      });
    } catch {
      // Initial SDK settings and gameplay lifecycle remain available.
    }
    this.syncSdkState();
    return sdk;
  }

  private syncSdkState(): void {
    const sdk = this.sdk;
    if (!sdk) return;

    if (!this.loadingStarted) {
      this.loadingStarted = true;
      this.callSdk(() => sdk.game.loadingStart?.());
    }
    if (this.gameReady && !this.loadingFinished) {
      this.loadingFinished = true;
      this.callSdk(() => sdk.game.loadingStop?.());
    }
    if (!this.loadingFinished) return;

    if (this.wantsGameplay && !this.gameplayActive) {
      this.gameplayActive = true;
      this.callSdk(() => sdk.game.gameplayStart());
    } else if (!this.wantsGameplay && this.gameplayActive) {
      this.gameplayActive = false;
      this.callSdk(() => sdk.game.gameplayStop());
    }
  }

  private callSdk(call: () => void): void {
    try {
      call();
    } catch {
      // Portal lifecycle telemetry must never interrupt a local run.
    }
  }
}
