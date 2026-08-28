import type { EnemyKind } from '../enemies/EnemyDefinitions';

/**
 * Authored enemy mix for each point in a run. Spawn cadence lives beside it
 * in DifficultyDefinitions; this file owns only which kind is selected.
 */
export interface EnemySpawnProfile {
  readonly startSeconds: number;
  readonly defaultKind: EnemyKind;
  readonly alternateKind?: EnemyKind;
  readonly alternateEvery?: number;
  readonly overrideKind?: EnemyKind;
  readonly overrideEvery?: number;
  readonly eliteKind?: EnemyKind;
  readonly eliteEvery?: number;
}

export const ENEMY_SPAWN_PROFILES: readonly EnemySpawnProfile[] = [
  { startSeconds: 0, defaultKind: 'chaser' },
  {
    startSeconds: 20,
    defaultKind: 'chaser',
    alternateKind: 'fast',
    alternateEvery: 4
  },
  {
    startSeconds: 100,
    defaultKind: 'chaser',
    alternateKind: 'fast',
    alternateEvery: 2,
    overrideKind: 'tank',
    overrideEvery: 5
  },
  {
    startSeconds: 120,
    defaultKind: 'chaser',
    alternateKind: 'fast',
    alternateEvery: 2,
    overrideKind: 'tank',
    overrideEvery: 5,
    eliteKind: 'elite',
    eliteEvery: 7
  }
] as const;

const getProfile = (elapsedSeconds: number): EnemySpawnProfile => {
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  for (let index = ENEMY_SPAWN_PROFILES.length - 1; index >= 0; index -= 1) {
    const profile = ENEMY_SPAWN_PROFILES[index];
    if (elapsed >= profile.startSeconds) return profile;
  }
  return ENEMY_SPAWN_PROFILES[0];
};

/** Deterministically chooses a kind without embedding the run timeline in the engine. */
export const selectEnemyKind = (elapsedSeconds: number, spawnIndex: number): EnemyKind => {
  const profile = getProfile(elapsedSeconds);
  if (profile.eliteKind && profile.eliteEvery && spawnIndex % profile.eliteEvery === 0) {
    return profile.eliteKind;
  }
  if (profile.overrideKind && profile.overrideEvery && spawnIndex % profile.overrideEvery === 0) {
    return profile.overrideKind;
  }
  if (profile.alternateKind && profile.alternateEvery && spawnIndex % profile.alternateEvery === 0) {
    return profile.alternateKind;
  }
  return profile.defaultKind;
};
