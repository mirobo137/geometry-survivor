import type { PlatformLifecycle } from '../Platform';
import { loadPokiSdk, type PokiSdk } from './PokiSdk';

const SDK_INIT_TIMEOUT_MS = 4_000;

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

/**
 * Poki's network bootstrap runs in the background so a blocked CDN cannot hold
 * the game boot screen. Calls are idempotent and buffered until app readiness.
 */
export class PokiPlatformLifecycle implements PlatformLifecycle {
  private sdk: PokiSdk | null = null;
  private connectionStarted = false;
  private gameReady = false;
  private wantsGameplay = false;
  private gameplayActive = false;
  private loadingFinished = false;

  public constructor(
    private readonly loadSdk: () => Promise<PokiSdk | null> = loadPokiSdk,
    private readonly sdkInitTimeoutMs = SDK_INIT_TIMEOUT_MS
  ) {}

  public init(): Promise<void> {
    if (!this.connectionStarted) {
      this.connectionStarted = true;
      void this.connect().catch(() => undefined);
    }
    return Promise.resolve();
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

  public getSdk(): PokiSdk | null {
    return this.sdk;
  }

  private async connect(): Promise<void> {
    const sdk = await this.loadSdk();
    if (!sdk) return;
    const initialized = await withTimeout(sdk.init(), this.sdkInitTimeoutMs, false);
    if (initialized === false) return;
    this.sdk = sdk;
    this.syncSdkState();
  }

  private syncSdkState(): void {
    const sdk = this.sdk;
    if (!sdk) return;

    if (this.gameReady && !this.loadingFinished) {
      this.loadingFinished = true;
      this.callSdk(() => sdk.gameLoadingFinished());
    }

    if (!this.loadingFinished) return;
    if (this.wantsGameplay && !this.gameplayActive) {
      this.gameplayActive = true;
      this.callSdk(() => sdk.gameplayStart());
    } else if (!this.wantsGameplay && this.gameplayActive) {
      this.gameplayActive = false;
      this.callSdk(() => sdk.gameplayStop());
    }
  }

  private callSdk(call: () => void): void {
    try {
      call();
    } catch {
      // SDK telemetry must never interrupt a run or a platform transition.
    }
  }
}
