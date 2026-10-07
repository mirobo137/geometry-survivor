import type { BossId } from '../bosses/BossDefinition';
import type { EnemyKind } from '../enemies/EnemyDefinitions';
import { OVERDRIVE_HEALTH_MULTIPLIER_CAP } from './OverdriveDefinitions';

/** Initial balance hypothesis; compare against Normal runs before release. */
export const OVERDRIVE_ASSAULT_KILLS_PER_BOSS = 100 as const;
export const OVERDRIVE_ASSAULT_INITIAL_HEALTH_MULTIPLIER = 0.25 as const;
export const OVERDRIVE_ASSAULT_SECOND_HEALTH_MULTIPLIER = 0.5 as const;
/** Opening-only trial: common enemies grant half XP until the first boss falls. */
export const OVERDRIVE_ASSAULT_OPENING_EXPERIENCE_MULTIPLIER = 0.5 as const;

/** Only the twelve authored common enemies; bosses and Warden replicas are excluded. */
export const OVERDRIVE_ASSAULT_ENEMY_POOL: readonly EnemyKind[] = [
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
