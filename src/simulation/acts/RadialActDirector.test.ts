import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITION } from '../../content/bosses/BossDefinition';
import { RADIAL_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import { getSpawnIntervalSeconds } from '../../content/run/DifficultyDefinitions';
import { selectEnemyKind } from '../../content/run/EnemySpawnDefinitions';
import { RadialActDirector } from './RadialActDirector';

describe('RadialActDirector', () => {
  it('keeps the current boss contract and authored schedule', () => {
    const director = new RadialActDirector();

    expect(director.definition).toBe(RADIAL_ACT_DEFINITION);
    expect(director.bossStartSeconds).toBe(BOSS_DEFINITION.startSeconds);
    expect(director.bossDefinition).toBe(BOSS_DEFINITION);
    expect(director.arenaShapeChanges).toBe(RADIAL_ACT_DEFINITION.arenaShapeChanges);
  });

  it('matches the legacy timeline for a deterministic seeded sample', () => {
    const director = new RadialActDirector();
    let seed = 0x51a7c0de;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x1_0000_0000;
    };

    for (let sample = 0; sample < 128; sample += 1) {
      const elapsedSeconds = Math.floor(next() * 360) + next();
      const spawnIndex = Math.floor(next() * 240);
      expect(director.getSpawnIntervalSeconds(elapsedSeconds)).toBe(
        getSpawnIntervalSeconds(elapsedSeconds)
      );
      expect(director.selectEnemyKind(elapsedSeconds, spawnIndex)).toBe(
        selectEnemyKind(elapsedSeconds, spawnIndex)
      );
    }
  });

  it('preserves the exact authored boundary values around timeline transitions', () => {
    const director = new RadialActDirector();

    for (const elapsedSeconds of [0, 59.999, 60, 119.999, 120, 179.999, 180, 239.999, 240, 300]) {
      expect(director.getSpawnIntervalSeconds(elapsedSeconds)).toBe(
        getSpawnIntervalSeconds(elapsedSeconds)
      );
    }
    expect(director.selectEnemyKind(119.999, 7)).toBe(selectEnemyKind(119.999, 7));
    expect(director.selectEnemyKind(120, 7)).toBe(selectEnemyKind(120, 7));
  });
});
