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
  OVERDRIVE_ASSAULT_BOSS_ORDER,
  OVERDRIVE_ASSAULT_ENEMY_POOL
} from '../../content/run/OverdriveAssaultDefinitions';
import { RadialActDirector } from './RadialActDirector';

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
  arenaShapeChanges: []
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
 * but owns no stage clock, arena rotation or Normal difficulty curve.
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

  /** 25% faster than the authored radial cadence, with the shared safety floor. */
  public override getSpawnIntervalSeconds(elapsedSeconds: number): number {
    return Math.max(
      OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS,
      super.getSpawnIntervalSeconds(elapsedSeconds) * 0.75
    );
  }
}
