import type { BossId } from '../bosses/BossDefinition';
import type { EnemyKind } from '../enemies/EnemyDefinitions';
import { OVERDRIVE_HEALTH_MULTIPLIER_CAP } from './OverdriveDefinitions';
import type { ArenaShape, ArenaShapeChangeDefinition } from './ArenaShapeDefinitions';

/** A bounded, repeating timeline; fights and kill quotas continue during morphs. */
export const OVERDRIVE_ASSAULT_ARENA_SHAPES: readonly ArenaShape[] = [
  'circle', 'hexagon', 'square', 'diamond', 'rectangle-horizontal', 'octagon', 'rectangle-vertical'
];
export const OVERDRIVE_ASSAULT_ARENA_TIMING = {
  intervalSeconds: 45, telegraphSeconds: 2, morphSeconds: 1.25
} as const;
export const OVERDRIVE_ASSAULT_ARENA_CYCLE_SECONDS =
  OVERDRIVE_ASSAULT_ARENA_TIMING.intervalSeconds * OVERDRIVE_ASSAULT_ARENA_SHAPES.length;
export const OVERDRIVE_ASSAULT_ARENA_CHANGES: readonly ArenaShapeChangeDefinition[] =
  OVERDRIVE_ASSAULT_ARENA_SHAPES.map((from, index) => ({
    from,
    to: OVERDRIVE_ASSAULT_ARENA_SHAPES[(index + 1) % OVERDRIVE_ASSAULT_ARENA_SHAPES.length],
    startSeconds: (index + 1) * OVERDRIVE_ASSAULT_ARENA_TIMING.intervalSeconds
      - OVERDRIVE_ASSAULT_ARENA_TIMING.telegraphSeconds - OVERDRIVE_ASSAULT_ARENA_TIMING.morphSeconds,
    telegraphSeconds: OVERDRIVE_ASSAULT_ARENA_TIMING.telegraphSeconds,
    morphSeconds: OVERDRIVE_ASSAULT_ARENA_TIMING.morphSeconds
  }));

/** Initial balance hypothesis; compare against Normal runs before release. */
export const OVERDRIVE_ASSAULT_KILLS_PER_BOSS = 100 as const;
export const OVERDRIVE_ASSAULT_INITIAL_HEALTH_MULTIPLIER = 0.25 as const;
export const OVERDRIVE_ASSAULT_SECOND_HEALTH_MULTIPLIER = 0.5 as const;
/** Opening-only trial: common enemies grant half XP until the first boss falls. */
export const OVERDRIVE_ASSAULT_OPENING_EXPERIENCE_MULTIPLIER = 0.5 as const;

/** Density adaptation is exclusive to Assault; pool capacities remain shared. */
export const OVERDRIVE_ASSAULT_SPAWN_DENSITY = {
  /** At zero common enemies, shorten the interval by at most 10% vs. baseline. */
  sparseIntervalMultiplier: 0.9,
  /** Return to baseline once a small, readable group is already present. */
  baselineFromEnemyCount: 8
} as const;

/** Only the twelve authored common enemies; bosses and Warden replicas are excluded. */
export const OVERDRIVE_ASSAULT_ENEMY_POOL: readonly Exclude<EnemyKind, 'boss' | 'warden-replica'>[] = [
  'chaser', 'fast', 'tank', 'elite',
  'orbiter', 'charger', 'splitter', 'prism-weaver',
  'fracture-gunner', 'thorn-bastion', 'zigzag-reaver', 'rift-miner'
];

export const OVERDRIVE_ASSAULT_BOSS_ORDER: readonly BossId[] = [
  'core-sentinel', 'orbital-warden', 'fracture-engine'
];

/**
 * Per-boss health sequence: ×0.25, ×0.5, ×1, ×2, ×3, ×4…
 * The only ceiling is the shared technical health-safety bound, not an authored
 * gameplay tier; every 100 common kills continues to lead to another boss.
 */
export const getOverdriveAssaultHealthMultiplier = (bossesDefeated: number): number => {
  const index = Number.isFinite(bossesDefeated)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(bossesDefeated)))
    : 0;
  const multiplier = index === 0
    ? OVERDRIVE_ASSAULT_INITIAL_HEALTH_MULTIPLIER
    : index === 1
      ? OVERDRIVE_ASSAULT_SECOND_HEALTH_MULTIPLIER
      : index - 1;
  return Math.min(OVERDRIVE_HEALTH_MULTIPLIER_CAP, multiplier);
};
