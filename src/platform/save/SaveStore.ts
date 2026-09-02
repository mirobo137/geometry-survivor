export type QualityPreset = 'low' | 'medium' | 'high';
export type ControlScheme = 'auto' | 'touch' | 'keyboard';

import { isPlayerSkinId } from '../../content/visual/SkinDefinitions';
import { isCannonSkinId, type CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import { isBackgroundId, type BackgroundId } from '../../content/visual/BackgroundDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import { PERMANENT_UPGRADE_DEFINITIONS, type PermanentUpgradeId } from '../../content/meta/PermanentUpgradeDefinitions';

export const SAVE_SCHEMA_VERSION = 5 as const;
export const SAVE_STORAGE_KEY = 'geometry-survivor:save';
export const MAX_SAVE_BYTES = 20_000;
export const MAX_NOVA = 9_999_999;

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

export interface SkinSaveData {
  readonly selected: PlayerSkinId;
  readonly unlocked: readonly PlayerSkinId[];
}

export interface CannonSkinSaveData {
  readonly selected: CannonSkinId;
  readonly unlocked: readonly CannonSkinId[];
}

export interface BackgroundSaveData {
  readonly selected: BackgroundId;
  readonly unlocked: readonly BackgroundId[];
}

export interface WalletSaveData {
  readonly nova: number;
}

export interface MetaUpgradeSaveData {
  readonly levels: Readonly<Partial<Record<PermanentUpgradeId, number>>>;
}

export interface SaveData {
  readonly schemaVersion: typeof SAVE_SCHEMA_VERSION;
  readonly settings: SaveSettings;
  readonly best: BestRun;
  readonly tutorialSeen: boolean;
  readonly skins: SkinSaveData;
  readonly cannonSkins: CannonSkinSaveData;
  readonly backgrounds: BackgroundSaveData;
  readonly wallet: WalletSaveData;
  readonly metaUpgrades: MetaUpgradeSaveData;
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
  tutorialSeen: false,
  skins: {
    selected: 'cyan',
    unlocked: ['cyan']
  },
  cannonSkins: {
    selected: 'basic',
    unlocked: ['basic']
  },
  backgrounds: {
    selected: 'deep-space',
    unlocked: ['deep-space']
  },
  wallet: {
    nova: 0
  },
  metaUpgrades: {
    levels: {}
  }
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

const readNonNegativeInt = (value: unknown, fallback: number, max: number): number => (
  Math.min(max, Math.max(0, Math.floor(finiteOr(value, fallback))))
);

/** Migrates unknown/legacy payloads into the current bounded schema. */
export const migrateSaveData = (value: unknown): SaveData => {
  const defaults = createDefaultSaveData();
  if (!isRecord(value)) return defaults;

  const version = finiteOr(value.schemaVersion, 0);
  if (version > SAVE_SCHEMA_VERSION) return defaults;

  const rawSettings = isRecord(value.settings) ? value.settings : {};
  const rawBest = isRecord(value.best) ? value.best : {};
  const rawSkins = isRecord(value.skins) ? value.skins : {};
  const rawCannonSkins = isRecord(value.cannonSkins) ? value.cannonSkins : {};
  const rawBackgrounds = isRecord(value.backgrounds) ? value.backgrounds : {};
  const rawWallet = isRecord(value.wallet) ? value.wallet : {};
  const rawMetaUpgrades = isRecord(value.metaUpgrades) ? value.metaUpgrades : {};
  const rawMetaLevels = isRecord(rawMetaUpgrades.levels) ? rawMetaUpgrades.levels : {};
  const legacyBestTime = value.bestTimeSeconds;
  const legacyBestScore = value.bestScore;
  const unlocked = Array.isArray(rawSkins.unlocked)
    ? rawSkins.unlocked.filter(isPlayerSkinId)
    : [];
  const normalizedUnlocked = Array.from(new Set<PlayerSkinId>(['cyan', ...unlocked]));
  const requestedSelected = isPlayerSkinId(rawSkins.selected) ? rawSkins.selected : 'cyan';
  const selected = normalizedUnlocked.includes(requestedSelected) ? requestedSelected : 'cyan';
  const cannonUnlocked = Array.isArray(rawCannonSkins.unlocked)
    ? rawCannonSkins.unlocked.filter(isCannonSkinId)
    : [];
  const normalizedCannonUnlocked = Array.from(new Set<CannonSkinId>(['basic', ...cannonUnlocked]));
  const requestedCannon = isCannonSkinId(rawCannonSkins.selected) ? rawCannonSkins.selected : 'basic';
  const selectedCannon = normalizedCannonUnlocked.includes(requestedCannon) ? requestedCannon : 'basic';
  const backgroundUnlocked = Array.isArray(rawBackgrounds.unlocked)
    ? rawBackgrounds.unlocked.filter(isBackgroundId)
    : [];
  const normalizedBackgroundUnlocked = Array.from(new Set<BackgroundId>(['deep-space', ...backgroundUnlocked]));
  const requestedBackground = isBackgroundId(rawBackgrounds.selected) ? rawBackgrounds.selected : 'deep-space';
  const selectedBackground = normalizedBackgroundUnlocked.includes(requestedBackground) ? requestedBackground : 'deep-space';
  const metaLevels: Partial<Record<PermanentUpgradeId, number>> = {};
  for (const definition of PERMANENT_UPGRADE_DEFINITIONS) {
    const level = readNonNegativeInt(rawMetaLevels[definition.id], 0, definition.maxLevel);
    if (level > 0) metaLevels[definition.id] = level;
  }

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
    tutorialSeen: typeof value.tutorialSeen === 'boolean' ? value.tutorialSeen : defaults.tutorialSeen,
    skins: {
      selected,
      unlocked: normalizedUnlocked
    },
    cannonSkins: {
      selected: selectedCannon,
      unlocked: normalizedCannonUnlocked
    },
    backgrounds: {
      selected: selectedBackground,
      unlocked: normalizedBackgroundUnlocked
    },
    wallet: {
      nova: readNonNegativeInt(rawWallet.nova, defaults.wallet.nova, MAX_NOVA)
    },
    metaUpgrades: {
      levels: metaLevels
    }
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
