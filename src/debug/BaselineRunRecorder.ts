import type { FxQuality } from '../content/visual/VisualTokens';

export const BASELINE_STORAGE_KEY = 'geometry-survivor:baseline-v1';
export const BASELINE_TARGET_RUNS = 10;
const BASELINE_SCHEMA_VERSION = 1;

export type BaselineOutcome = 'game-over' | 'victory';
export type BaselineDamageSource = 'contact' | 'laser' | 'boss';

export interface BaselineObservation {
  readonly enemies: number;
  readonly projectiles: number;
  readonly fx: number;
}

export interface BaselineFrameProfile {
  readonly averageMs: number | null;
  readonly p95Ms: number | null;
}

export interface BaselineRunRecord {
  readonly schemaVersion: 1;
  readonly runNumber: number;
  readonly outcome: BaselineOutcome;
  readonly elapsedSeconds: number;
  readonly firstLevelUpSeconds: number | null;
  readonly bossSeconds: number | null;
  readonly cause: BaselineDamageSource | 'boss-defeated' | 'unknown';
  readonly upgrades: readonly string[];
  readonly nova: number;
  readonly maxEnemies: number;
  readonly maxProjectiles: number;
  readonly maxFx: number;
  readonly frameAverageMs: number | null;
  readonly frameP95Ms: number | null;
  readonly fpsAverage: number | null;
  readonly quality: FxQuality;
}

export interface BaselineCurrentSnapshot {
  readonly firstLevelUpSeconds: number | null;
  readonly bossSeconds: number | null;
  readonly cause: BaselineDamageSource | null;
  readonly upgrades: readonly string[];
  readonly maxEnemies: number;
  readonly maxProjectiles: number;
  readonly maxFx: number;
  readonly quality: FxQuality;
}

export interface BaselineFinishInput {
  readonly outcome: BaselineOutcome;
  readonly elapsedSeconds: number;
  readonly nova: number;
  readonly frameProfile: BaselineFrameProfile;
}

export interface BaselineStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const browserStorage = (): BaselineStorage | null => {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

interface MutableCurrent {
  firstLevelUpSeconds: number | null;
  bossSeconds: number | null;
  cause: BaselineDamageSource | null;
  upgrades: string[];
  maxEnemies: number;
  maxProjectiles: number;
  maxFx: number;
  quality: FxQuality;
}

const createCurrent = (quality: FxQuality): MutableCurrent => ({
  firstLevelUpSeconds: null,
  bossSeconds: null,
  cause: null,
  upgrades: [],
  maxEnemies: 0,
  maxProjectiles: 0,
  maxFx: 0,
  quality
});

const safeNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const isQuality = (value: unknown): value is FxQuality => (
  value === 'low' || value === 'medium' || value === 'high'
);

const isOutcome = (value: unknown): value is BaselineOutcome => (
  value === 'game-over' || value === 'victory'
);

const isCause = (value: unknown): value is BaselineRunRecord['cause'] => (
  value === 'contact' || value === 'laser' || value === 'boss'
    || value === 'boss-defeated' || value === 'unknown'
);

const parseRecord = (value: unknown): BaselineRunRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<BaselineRunRecord>;
  if (candidate.schemaVersion !== BASELINE_SCHEMA_VERSION
    || !isOutcome(candidate.outcome)
    || !isCause(candidate.cause)
    || !isQuality(candidate.quality)
    || !Array.isArray(candidate.upgrades)) return null;
  return {
    schemaVersion: 1,
    runNumber: Math.max(1, Math.floor(safeNumber(candidate.runNumber, 1))),
    outcome: candidate.outcome,
    elapsedSeconds: Math.max(0, safeNumber(candidate.elapsedSeconds)),
    firstLevelUpSeconds: candidate.firstLevelUpSeconds === null ? null : Math.max(0, safeNumber(candidate.firstLevelUpSeconds)),
    bossSeconds: candidate.bossSeconds === null ? null : Math.max(0, safeNumber(candidate.bossSeconds)),
    cause: candidate.cause,
    upgrades: candidate.upgrades.filter((upgrade): upgrade is string => typeof upgrade === 'string').slice(0, 32),
    nova: Math.max(0, Math.floor(safeNumber(candidate.nova))),
    maxEnemies: Math.max(0, Math.floor(safeNumber(candidate.maxEnemies))),
    maxProjectiles: Math.max(0, Math.floor(safeNumber(candidate.maxProjectiles))),
    maxFx: Math.max(0, Math.floor(safeNumber(candidate.maxFx))),
    frameAverageMs: candidate.frameAverageMs === null ? null : Math.max(0, safeNumber(candidate.frameAverageMs)),
    frameP95Ms: candidate.frameP95Ms === null ? null : Math.max(0, safeNumber(candidate.frameP95Ms)),
    fpsAverage: candidate.fpsAverage === null ? null : Math.max(0, safeNumber(candidate.fpsAverage)),
    quality: candidate.quality
  };
};

const loadRecords = (storage: BaselineStorage | null): BaselineRunRecord[] => {
  if (!storage) return [];
  try {
    const raw = storage.getItem(BASELINE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseRecord).filter((record): record is BaselineRunRecord => record !== null).slice(-BASELINE_TARGET_RUNS);
  } catch {
    return [];
  }
};

const formatSeconds = (seconds: number | null): string => {
  if (seconds === null || !Number.isFinite(seconds)) return '--';
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60).toString().padStart(2, '0');
  const remainder = (whole % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const formatMs = (value: number | null): string => value === null ? '--' : `${value.toFixed(2)} ms`;

const formatCurrent = (current: BaselineCurrentSnapshot | null): string => {
  if (!current) return 'Run en curso: no';
  return [
    'Run en curso: si',
    `  calidad ${current.quality} | primera subida ${formatSeconds(current.firstLevelUpSeconds)} | boss ${formatSeconds(current.bossSeconds)}`,
    `  maximos enemigos ${current.maxEnemies} | proyectiles ${current.maxProjectiles} | FX ${current.maxFx}`,
    `  elecciones ${current.upgrades.length > 0 ? current.upgrades.join(', ') : '--'}`
  ].join('\n');
};

/** Formats a bounded, copy-friendly report for the ten-run Act I baseline. */
export const formatBaselineReport = (
  records: readonly BaselineRunRecord[],
  current: BaselineCurrentSnapshot | null
): string => {
  const lines = [
    'Geometry Survivor | Linea base Acto I v1',
    `Runs completadas: ${records.length}/${BASELINE_TARGET_RUNS}`,
    formatCurrent(current),
    ''
  ];
  for (const record of records) {
    lines.push(
      `#${record.runNumber} ${record.outcome} | tiempo ${formatSeconds(record.elapsedSeconds)} | calidad ${record.quality}`,
      `  subida ${formatSeconds(record.firstLevelUpSeconds)} | boss ${formatSeconds(record.bossSeconds)} | causa ${record.cause}`,
      `  NOVA ${record.nova} | max enemigos ${record.maxEnemies} | proyectiles ${record.maxProjectiles} | FX ${record.maxFx}`,
      `  FPS medio ${record.fpsAverage === null ? '--' : record.fpsAverage.toFixed(2)} | frame medio ${formatMs(record.frameAverageMs)} | p95 ${formatMs(record.frameP95Ms)}`,
      `  cartas ${record.upgrades.length > 0 ? record.upgrades.join(', ') : '--'}`,
      ''
    );
  }
  return lines.join('\n').trim();
};

/** Local, bounded recorder. It has no Pixi, DOM, audio or gameplay decisions. */
export class BaselineRunRecorder {
  private readonly storage: BaselineStorage | null;
  private readonly enabled: boolean;
  private recordsState: BaselineRunRecord[];
  private current: MutableCurrent | null = null;

  public constructor(enabled = false, storage: BaselineStorage | null = browserStorage()) {
    this.enabled = enabled;
    this.storage = storage;
    this.recordsState = loadRecords(storage);
  }

  public get records(): readonly BaselineRunRecord[] {
    return this.recordsState;
  }

  public get isActive(): boolean {
    return this.current !== null;
  }

  public get currentSnapshot(): BaselineCurrentSnapshot | null {
    if (!this.current) return null;
    return {
      firstLevelUpSeconds: this.current.firstLevelUpSeconds,
      bossSeconds: this.current.bossSeconds,
      cause: this.current.cause,
      upgrades: [...this.current.upgrades],
      maxEnemies: this.current.maxEnemies,
      maxProjectiles: this.current.maxProjectiles,
      maxFx: this.current.maxFx,
      quality: this.current.quality
    };
  }

  public beginRun(quality: FxQuality): void {
    if (!this.enabled) return;
    this.current = createCurrent(quality);
  }

  public noteLevelUp(elapsedSeconds: number): void {
    if (!this.current || this.current.firstLevelUpSeconds !== null) return;
    this.current.firstLevelUpSeconds = Math.max(0, elapsedSeconds);
  }

  public noteBoss(elapsedSeconds: number): void {
    if (!this.current || this.current.bossSeconds !== null) return;
    this.current.bossSeconds = Math.max(0, elapsedSeconds);
  }

  public noteDamageSource(source: BaselineDamageSource): void {
    if (this.current) this.current.cause = source;
  }

  public noteUpgrade(upgradeId: string): void {
    if (!this.current || this.current.upgrades.length >= 32) return;
    this.current.upgrades.push(upgradeId);
  }

  public observe(observation: BaselineObservation): void {
    if (!this.current) return;
    this.current.maxEnemies = Math.max(this.current.maxEnemies, Math.max(0, Math.floor(observation.enemies)));
    this.current.maxProjectiles = Math.max(this.current.maxProjectiles, Math.max(0, Math.floor(observation.projectiles)));
    this.current.maxFx = Math.max(this.current.maxFx, Math.max(0, Math.floor(observation.fx)));
  }

  public finish(input: BaselineFinishInput): BaselineRunRecord | null {
    if (!this.current) return null;
    const current = this.current;
    const frameAverageMs = input.frameProfile.averageMs === null ? null : Math.max(0, input.frameProfile.averageMs);
    const frameP95Ms = input.frameProfile.p95Ms === null ? null : Math.max(0, input.frameProfile.p95Ms);
    const record: BaselineRunRecord = {
      schemaVersion: 1,
      runNumber: this.recordsState.length + 1,
      outcome: input.outcome,
      elapsedSeconds: Math.max(0, input.elapsedSeconds),
      firstLevelUpSeconds: current.firstLevelUpSeconds,
      bossSeconds: current.bossSeconds,
      cause: input.outcome === 'victory' ? 'boss-defeated' : current.cause ?? 'unknown',
      upgrades: [...current.upgrades],
      nova: Math.max(0, Math.floor(input.nova)),
      maxEnemies: current.maxEnemies,
      maxProjectiles: current.maxProjectiles,
      maxFx: current.maxFx,
      frameAverageMs,
      frameP95Ms,
      fpsAverage: frameAverageMs !== null && frameAverageMs > 0 ? 1000 / frameAverageMs : null,
      quality: current.quality
    };
    this.recordsState = [...this.recordsState, record].slice(-BASELINE_TARGET_RUNS);
    this.current = null;
    this.persist();
    return record;
  }

  /** Drops an interrupted run when the player returns to the menu. */
  public cancelRun(): void {
    this.current = null;
  }

  /** Reopens the just-recorded death when a rewarded revive continues the run. */
  public resumeAfterRevive(): void {
    if (!this.enabled || this.current || this.recordsState.length === 0) return;
    const previous = this.recordsState.at(-1);
    if (!previous || previous.outcome !== 'game-over') return;
    this.recordsState = this.recordsState.slice(0, -1);
    this.current = {
      firstLevelUpSeconds: previous.firstLevelUpSeconds,
      bossSeconds: previous.bossSeconds,
      cause: null,
      upgrades: [...previous.upgrades],
      maxEnemies: previous.maxEnemies,
      maxProjectiles: previous.maxProjectiles,
      maxFx: previous.maxFx,
      quality: previous.quality
    };
    this.persist();
  }

  public clear(): void {
    this.recordsState = [];
    this.current = null;
    try {
      this.storage?.removeItem(BASELINE_STORAGE_KEY);
    } catch {
      // A blocked storage should not prevent a new local measurement session.
    }
  }

  public report(): string {
    return formatBaselineReport(this.recordsState, this.currentSnapshot);
  }

  private persist(): void {
    try {
      this.storage?.setItem(BASELINE_STORAGE_KEY, JSON.stringify(this.recordsState));
    } catch {
      // The in-memory report remains available when storage is blocked/full.
    }
  }
}
