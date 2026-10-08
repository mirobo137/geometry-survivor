import {
  BOSS_DEFINITION,
  FRACTURE_ENGINE_DEFINITION,
  ORBITAL_WARDEN_DEFINITION,
  type BossDefinition
} from '../../content/bosses/BossDefinition';
import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { RADIAL_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import {
  normalizeOverdriveSeed,
  OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS
} from '../../content/run/OverdriveDefinitions';
import {
  getOverdriveAssaultHealthMultiplier,
  OVERDRIVE_ASSAULT_OPENING_EXPERIENCE_MULTIPLIER,
  OVERDRIVE_ASSAULT_SPAWN_DENSITY,
  OVERDRIVE_ASSAULT_BOSS_ORDER,
  OVERDRIVE_ASSAULT_ENEMY_POOL,
  OVERDRIVE_ASSAULT_ARENA_CHANGES,
  OVERDRIVE_ASSAULT_ARENA_CYCLE_SECONDS
} from '../../content/run/OverdriveAssaultDefinitions';
import { RadialActDirector } from './RadialActDirector';
import type { ArenaLaserPressure, ArenaShape } from '../../content/run/ArenaShapeDefinitions';

const BOSS_DEFINITIONS: Readonly<Record<string, BossDefinition>> = {
  'core-sentinel': BOSS_DEFINITION,
  'orbital-warden': ORBITAL_WARDEN_DEFINITION,
  'fracture-engine': FRACTURE_ENGINE_DEFINITION
};

const ASSAULT_ACT_DEFINITION = {
  ...RADIAL_ACT_DEFINITION,
  durationSeconds: Number.MAX_SAFE_INTEGER,
  bossStartSeconds: 0,
  boss: { ...BOSS_DEFINITION, startSeconds: 0 },
  arenaShapeChanges: OVERDRIVE_ASSAULT_ARENA_CHANGES
} as const;

/** Stateless seeded mixer: the same seed and spawn index select the same family. */
const sample = (seed: number, spawnIndex: number): number => {
  let value = (seed ^ Math.imul(Math.max(0, Math.floor(spawnIndex)) + 1, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
};

/**
 * Continuous Overdrive variant. It shares the simulation-facing act contract,
 * with a repeating arena timeline and no Normal stage clock or difficulty curve.
 */
export class OverdriveAssaultDirector extends RadialActDirector {
  private readonly seed: number;
  private defeatedBossCount = 0;

  public constructor(seed: unknown) {
    super(ASSAULT_ACT_DEFINITION);
    this.seed = normalizeOverdriveSeed(seed);
  }

  public override get enemyHealthMultiplier(): number {
    return getOverdriveAssaultHealthMultiplier(this.defeatedBossCount);
  }

  public override get arenaShapeCycleSeconds(): number {
    return OVERDRIVE_ASSAULT_ARENA_CYCLE_SECONDS;
  }

  /** Geometry changes do not inherit the campaign's escalating hexagon laser cadence. */
  public override getLaserPressure(_shape: ArenaShape, _shapeIndex: number): ArenaLaserPressure {
    return super.getLaserPressure('circle', 0);
  }

  public get commonEnemyExperienceMultiplier(): number {
    return this.defeatedBossCount === 0
      ? OVERDRIVE_ASSAULT_OPENING_EXPERIENCE_MULTIPLIER
      : 1;
  }

  public override get bossDefinition(): BossDefinition {
    const bossId = OVERDRIVE_ASSAULT_BOSS_ORDER[
      this.defeatedBossCount % OVERDRIVE_ASSAULT_BOSS_ORDER.length
    ] ?? 'core-sentinel';
    const definition = BOSS_DEFINITIONS[bossId] ?? BOSS_DEFINITION;
    return { ...definition, startSeconds: 0 };
  }

  /** Progresses only after a boss dies; multipliers apply only to later spawns. */
  public recordBossDefeat(): void {
    this.defeatedBossCount += 1;
  }

  public reset(): void {
    this.defeatedBossCount = 0;
  }

  public get bossesDefeated(): number {
    return this.defeatedBossCount;
  }

  /** The chaos roster mixes common families from all three authored acts. */
  public override selectEnemyKind(_elapsedSeconds: number, spawnIndex: number): EnemyKind {
    const sampleIndex = Math.floor(sample(this.seed, spawnIndex) * OVERDRIVE_ASSAULT_ENEMY_POOL.length);
    return OVERDRIVE_ASSAULT_ENEMY_POOL[sampleIndex] ?? OVERDRIVE_ASSAULT_ENEMY_POOL[0] ?? 'chaser';
  }

  /** Mildly faster than the authored radial cadence, with the shared safety floor. */
  public override getSpawnIntervalSeconds(elapsedSeconds: number): number {
    return Math.max(
      OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS,
      super.getSpawnIntervalSeconds(elapsedSeconds) * 0.9
    );
  }

  /** Sparse-field interval reduction is capped at 10% and ends at eight common enemies. */
  public getAdaptiveSpawnIntervalSeconds(elapsedSeconds: number, commonEnemyCount: number): number {
    const { sparseIntervalMultiplier, baselineFromEnemyCount } = OVERDRIVE_ASSAULT_SPAWN_DENSITY;
    const baseline = this.getSpawnIntervalSeconds(elapsedSeconds);
    const count = Number.isFinite(commonEnemyCount)
      ? Math.max(0, commonEnemyCount)
      : baselineFromEnemyCount;
    const density = Math.min(1, count / baselineFromEnemyCount);
    const sparseInterval = Math.max(
      OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS,
      baseline * sparseIntervalMultiplier
    );
    return sparseInterval + (baseline - sparseInterval) * density;
  }
}
