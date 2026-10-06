export type CrazyGamesEnvironment = 'uninitialized' | 'local' | 'crazygames' | 'disabled';

export interface CrazyGamesAdError {
  readonly code?: string;
  readonly message?: string;
}

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: CrazyGamesAdError | string | unknown) => void;
}

export interface CrazyGamesSdk {
  init(): Promise<unknown>;
  readonly environment: CrazyGamesEnvironment;
  readonly game: {
    readonly settings?: { readonly muteAudio?: boolean };
    loadingStart?(): void;
    loadingStop?(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    addSettingsChangeListener?(listener: (settings: { readonly muteAudio?: boolean }) => void): void;
  };
  readonly ad: {
    requestAd(type: 'rewarded', callbacks: CrazyGamesAdCallbacks): void | Promise<unknown>;
    hasAdblock?(): Promise<boolean>;
  };
}

const CRAZYGAMES_SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const DEFAULT_SCRIPT_TIMEOUT_MS = 4_000;

const readGlobalSdk = (): CrazyGamesSdk | null => {
  if (typeof window === 'undefined') return null;
  return (window as Window & { CrazyGames?: { SDK?: CrazyGamesSdk } }).CrazyGames?.SDK ?? null;
};

/** Loads the HTML5 SDK only when the CrazyGames build selects this adapter. */
export const loadCrazyGamesSdk = (timeoutMs = DEFAULT_SCRIPT_TIMEOUT_MS): Promise<CrazyGamesSdk | null> => {
  const existing = readGlobalSdk();
  if (existing) return Promise.resolve(existing);
  if (typeof document === 'undefined' || !document.head) return Promise.resolve(null);

  return new Promise((resolve) => {
    let script = [...document.scripts].find(candidate => candidate.src === CRAZYGAMES_SDK_URL) ?? null;
    const shouldAppend = script === null;
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.src = CRAZYGAMES_SDK_URL;
    }

    let settled = false;
    const timeout = globalThis.setTimeout(() => finish(null), timeoutMs);
    const finish = (sdk: CrazyGamesSdk | null): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      if (script) {
        script.onload = null;
        script.onerror = null;
      }
      resolve(sdk);
    };

    script.onload = () => finish(readGlobalSdk());
    script.onerror = () => finish(null);
    if (shouldAppend) document.head.appendChild(script);
  });
};
