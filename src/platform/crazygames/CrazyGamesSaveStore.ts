import {
  parseSaveData,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  type SaveData,
  type SaveStore,
  type StorageAdapter
} from '../save/SaveStore';
import { LocalSaveStore } from '../local/LocalSaveStore';

export const CRAZYGAMES_SAVE_MIGRATION_KEY = 'geometry-survivor:crazygames-save-migration';
const CRAZYGAMES_SAVE_MIGRATION_VERSION = 'v1';

const getBrowserStorage = (): StorageAdapter | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

const isFutureSave = (raw: string): boolean => {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('schemaVersion' in value)) return false;
    const version = (value as { schemaVersion?: unknown }).schemaVersion;
    return typeof version === 'number' && Number.isFinite(version) && version > SAVE_SCHEMA_VERSION;
  } catch {
    return false;
  }
};

const markMigrationCompleted = (storage: StorageAdapter): boolean => {
  if (storage.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY) !== null) return true;
  storage.setItem(CRAZYGAMES_SAVE_MIGRATION_KEY, CRAZYGAMES_SAVE_MIGRATION_VERSION);
  return storage.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY) === CRAZYGAMES_SAVE_MIGRATION_VERSION;
};

/**
 * SDK.data adapter with a read-failure fuse. Once a read fails, cached values
 * remain readable but writes are refused for this session so defaults cannot
 * replace a save whose current value could not be confirmed.
 */
class CrazyGamesDataStorageAdapter implements StorageAdapter {
  private readonly cache = new Map<string, string | null>();
  private readFailed = false;
  private writeFailed = false;

  public constructor(private readonly data: StorageAdapter) {}

  public getItem(key: string): string | null {
    if (this.writeFailed && this.cache.has(key)) return this.cache.get(key) ?? null;
    try {
      const value = this.data.getItem(key);
      this.cache.set(key, value);
      return value;
    } catch (error) {
      this.readFailed = true;
      if (this.cache.has(key)) return this.cache.get(key) ?? null;
      throw error;
    }
  }

  public setItem(key: string, value: string): void {
    if (this.readFailed || this.writeFailed) throw new Error('CrazyGames SDK.data failed; writes are disabled for this session.');
    try {
      this.data.setItem(key, value);
      this.cache.set(key, value);
    } catch (error) {
      this.writeFailed = true;
      this.cache.set(key, value);
      throw error;
    }
  }

  public removeItem(key: string): void {
    if (this.readFailed || this.writeFailed) throw new Error('CrazyGames SDK.data failed; writes are disabled for this session.');
    try {
      this.data.removeItem(key);
      this.cache.set(key, null);
    } catch (error) {
      this.writeFailed = true;
      this.cache.set(key, null);
      throw error;
    }
  }
}

/** CrazyGames uses SDK.data after SDK.init; unavailable data falls back to memory only. */
export class CrazyGamesSaveStore implements SaveStore {
  private activeStore: SaveStore = new LocalSaveStore(null);
  private prepared = false;
  private platformReady = false;

  /**
   * Connects to portal data and imports a legacy browser save once, only when
   * SDK.data has no save and no prior migration marker.
   */
  public prepare(
    data: StorageAdapter | null,
    legacyStorage: StorageAdapter | null = getBrowserStorage()
  ): boolean {
    if (this.prepared) return this.platformReady;
    this.prepared = true;
    if (!data) return false;

    const platformStorage = new CrazyGamesDataStorageAdapter(data);
    try {
      const remoteRaw = platformStorage.getItem(SAVE_STORAGE_KEY);
      if (remoteRaw !== null) {
        // A remote profile proves migration is no longer needed. Keep a marker
        // even when an older browser save still exists, so clearing progress
        // in-game cannot resurrect that stale copy on the next boot.
        if (!markMigrationCompleted(platformStorage)) return false;
        // Preserve malformed or newer-schema data instead of saving defaults over it.
        if (isFutureSave(remoteRaw) || parseSaveData(remoteRaw) === null) return false;
        this.activate(platformStorage);
        return true;
      }

      const migrationMarker = platformStorage.getItem(CRAZYGAMES_SAVE_MIGRATION_KEY);
      if (migrationMarker !== null) {
        this.activate(platformStorage);
        return true;
      }

      const legacyRaw = legacyStorage?.getItem(SAVE_STORAGE_KEY) ?? null;
      if (legacyRaw !== null && isFutureSave(legacyRaw)) return false;

      const migrated = parseSaveData(legacyRaw);
      const platformStore = new LocalSaveStore(platformStorage);
      if (migrated && !platformStore.saveDurably(migrated)) return false;

      if (!markMigrationCompleted(platformStorage)) return false;

      this.activate(platformStorage, platformStore);
      return true;
    } catch {
      // Keep the old browser save untouched and run in memory if the SDK data
      // module is disabled, throws, or cannot confirm the initial migration.
      return false;
    }
  }

  public load(): SaveData {
    return this.activeStore.load();
  }

  public save(data: SaveData): boolean {
    return this.activeStore.save(data);
  }

  public saveDurably(data: SaveData): boolean {
    return this.activeStore.saveDurably?.(data) ?? false;
  }

  public clear(): void {
    this.activeStore.clear();
  }

  private activate(storage: StorageAdapter, store = new LocalSaveStore(storage)): void {
    this.activeStore = store;
    this.platformReady = true;
  }
}
