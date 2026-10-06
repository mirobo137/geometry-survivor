import type { BossId } from '../bosses/BossDefinition';
import type { EnemyKind } from '../enemies/EnemyDefinitions';

/** Initial balance hypothesis; compare against Normal runs before release. */
export const OVERDRIVE_ASSAULT_KILLS_PER_BOSS = 100 as const;
export const OVERDRIVE_ASSAULT_HEALTH_MULTIPLIERS = [1, 2, 3, 4, 5] as const;
export const OVERDRIVE_ASSAULT_MAX_HEALTH_MULTIPLIER = 5 as const;

/** Only the twelve authored common enemies; bosses and Warden replicas are excluded. */
export const OVERDRIVE_ASSAULT_ENEMY_POOL: readonly EnemyKind[] = [
  'chaser', 'fast', 'tank', 'elite',
  'orbiter', 'charger', 'splitter', 'prism-weaver',
  'fracture-gunner', 'thorn-bastion', 'zigzag-reaver', 'rift-miner'
];

export const OVERDRIVE_ASSAULT_BOSS_ORDER: readonly BossId[] = [
  'core-sentinel', 'orbital-warden', 'fracture-engine'
];

/** First boss has ×1 HP; each defeated boss raises future spawns by one tier. */
export const getOverdriveAssaultHealthMultiplier = (bossesDefeated: number): number => {
  const index = Number.isFinite(bossesDefeated)
    ? Math.max(0, Math.floor(bossesDefeated))
    : 0;
  return OVERDRIVE_ASSAULT_HEALTH_MULTIPLIERS[
    Math.min(index, OVERDRIVE_ASSAULT_HEALTH_MULTIPLIERS.length - 1)
  ] ?? 1;
};
