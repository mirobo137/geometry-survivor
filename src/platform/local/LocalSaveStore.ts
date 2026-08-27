import {
  MAX_SAVE_BYTES,
  migrateSaveData,
  parseSaveData,
  SAVE_STORAGE_KEY,
  type SaveData,
  type SaveStore,
  type StorageAdapter
} from '../save/SaveStore';

const getBrowserStorage = (): StorageAdapter | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
};

/** Local persistence with a memory fallback for private mode, quota and blocked storage. */
export class LocalSaveStore implements SaveStore {
  private memoryRaw: string | null = null;
  private readonly storage: StorageAdapter | null;

  public constructor(storage: StorageAdapter | null = getBrowserStorage()) {
    this.storage = storage;
  }

  public load(): SaveData {
    const stored = this.readStorage() ?? this.memoryRaw;
    return parseSaveData(stored) ?? migrateSaveData(null);
  }

  public save(data: SaveData): boolean {
    const normalized = migrateSaveData(data);
    const raw = JSON.stringify(normalized);
    if (raw.length > MAX_SAVE_BYTES) return false;

    this.memoryRaw = raw;
    try {
      this.storage?.setItem(SAVE_STORAGE_KEY, raw);
    } catch {
      // The in-memory copy remains usable when localStorage is blocked or full.
    }
    return true;
  }

  public clear(): void {
    this.memoryRaw = null;
    try {
      this.storage?.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Clearing memory is still safe when persistent storage is unavailable.
    }
  }

  private readStorage(): string | null {
    try {
      return this.storage?.getItem(SAVE_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
}
