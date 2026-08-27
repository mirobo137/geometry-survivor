export type QualityPreset = 'low' | 'medium' | 'high';
export type ControlScheme = 'auto' | 'touch' | 'keyboard';

export const SAVE_SCHEMA_VERSION = 1 as const;
export const SAVE_STORAGE_KEY = 'geometry-survivor:save';
export const MAX_SAVE_BYTES = 20_000;

export interface SaveSettings {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly muted: boolean;
  readonly controlScheme: ControlScheme;
  readonly quality: QualityPreset;
}

export interface BestRun {
  readonly timeSeconds: number;
  readonly score: number;
}

export interface SaveData {
  readonly schemaVersion: typeof SAVE_SCHEMA_VERSION;
  readonly settings: SaveSettings;
  readonly best: BestRun;
  readonly tutorialSeen: boolean;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveStore {
  load(): SaveData;
  save(data: SaveData): boolean;
  clear(): void;
}

export const mergeBestRun = (current: BestRun, candidate: BestRun): BestRun => ({
  timeSeconds: Math.max(0, current.timeSeconds, candidate.timeSeconds),
  score: Math.max(0, current.score, candidate.score)
});

export const createDefaultSaveData = (): SaveData => ({
  schemaVersion: SAVE_SCHEMA_VERSION,
  settings: {
    musicVolume: 1,
    sfxVolume: 1,
    muted: false,
    controlScheme: 'auto',
    quality: 'medium'
  },
  best: {
    timeSeconds: 0,
    score: 0
  },
  tutorialSeen: false
});

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const finiteOr = (value: unknown, fallback: number): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const readQuality = (value: unknown, fallback: QualityPreset): QualityPreset => (
  value === 'low' || value === 'medium' || value === 'high' ? value : fallback
);

const readControlScheme = (value: unknown, fallback: ControlScheme): ControlScheme => (
  value === 'auto' || value === 'touch' || value === 'keyboard' ? value : fallback
);

/** Migrates unknown/legacy payloads into the current bounded schema. */
export const migrateSaveData = (value: unknown): SaveData => {
  const defaults = createDefaultSaveData();
  if (!isRecord(value)) return defaults;

  const version = finiteOr(value.schemaVersion, 0);
  if (version > SAVE_SCHEMA_VERSION) return defaults;

  const rawSettings = isRecord(value.settings) ? value.settings : {};
  const rawBest = isRecord(value.best) ? value.best : {};
  const legacyBestTime = value.bestTimeSeconds;
  const legacyBestScore = value.bestScore;

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    settings: {
      musicVolume: clamp(finiteOr(rawSettings.musicVolume, defaults.settings.musicVolume), 0, 1),
      sfxVolume: clamp(finiteOr(rawSettings.sfxVolume, defaults.settings.sfxVolume), 0, 1),
      muted: typeof rawSettings.muted === 'boolean' ? rawSettings.muted : defaults.settings.muted,
      controlScheme: readControlScheme(rawSettings.controlScheme, defaults.settings.controlScheme),
      quality: readQuality(rawSettings.quality, defaults.settings.quality)
    },
    best: {
      timeSeconds: Math.max(0, finiteOr(rawBest.timeSeconds, finiteOr(legacyBestTime, defaults.best.timeSeconds))),
      score: Math.max(0, finiteOr(rawBest.score, finiteOr(legacyBestScore, defaults.best.score)))
    },
    tutorialSeen: typeof value.tutorialSeen === 'boolean' ? value.tutorialSeen : defaults.tutorialSeen
  };
};

export const parseSaveData = (raw: string | null): SaveData | null => {
  if (!raw) return null;
  try {
    return migrateSaveData(JSON.parse(raw));
  } catch {
    return null;
  }
};
