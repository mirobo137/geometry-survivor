export interface PokiSdk {
  init(): Promise<unknown>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  rewardedBreak(onAdStarted?: () => void): Promise<boolean>;
}

const POKI_SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
const DEFAULT_SCRIPT_TIMEOUT_MS = 4_000;

const readGlobalSdk = (): PokiSdk | null => {
  if (typeof window === 'undefined') return null;
  return (window as Window & { PokiSDK?: PokiSdk }).PokiSDK ?? null;
};

/** Loads only from the Poki build's adapter; never called by local or CrazyGames. */
export const loadPokiSdk = (timeoutMs = DEFAULT_SCRIPT_TIMEOUT_MS): Promise<PokiSdk | null> => {
  const existing = readGlobalSdk();
  if (existing) return Promise.resolve(existing);
  if (typeof document === 'undefined' || !document.head) return Promise.resolve(null);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    let settled = false;
    const timeout = globalThis.setTimeout(() => finish(null), timeoutMs);
    const finish = (sdk: PokiSdk | null): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      resolve(sdk);
    };

    script.async = true;
    script.src = POKI_SDK_URL;
    script.onload = () => finish(readGlobalSdk());
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
};
