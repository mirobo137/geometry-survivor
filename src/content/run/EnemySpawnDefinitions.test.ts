import { describe, expect, it } from 'vitest';
import { ENEMY_SPAWN_PROFILES, selectEnemyKind } from './EnemySpawnDefinitions';

describe('EnemySpawnDefinitions', () => {
  it('mantiene perfiles ordenados y una fase base', () => {
    expect(ENEMY_SPAWN_PROFILES[0].startSeconds).toBe(0);
    expect(ENEMY_SPAWN_PROFILES.map((profile) => profile.startSeconds)).toEqual([0, 20, 100, 120]);
  });

  it('selecciona la mezcla authored en los límites de cada fase', () => {
    expect(selectEnemyKind(19.99, 4)).toBe('chaser');
    expect(selectEnemyKind(20, 4)).toBe('fast');
    expect(selectEnemyKind(20, 5)).toBe('chaser');
    expect(selectEnemyKind(100, 5)).toBe('tank');
    expect(selectEnemyKind(100, 2)).toBe('fast');
    expect(selectEnemyKind(100, 3)).toBe('chaser');
    expect(selectEnemyKind(119.99, 7)).not.toBe('elite');
    expect(selectEnemyKind(120, 7)).toBe('elite');
    expect(selectEnemyKind(120, 5)).toBe('tank');
  });

  it('trata tiempos no finitos como el inicio de la run', () => {
    expect(selectEnemyKind(Number.NaN, 0)).toBe('chaser');
    expect(selectEnemyKind(Number.POSITIVE_INFINITY, 0)).toBe('chaser');
  });
});
