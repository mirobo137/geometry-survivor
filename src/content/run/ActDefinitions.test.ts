import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITION } from '../bosses/BossDefinition';
import { ACT_I_ARENA_SHAPE_CHANGES } from './ArenaShapeDefinitions';
import { DIFFICULTY_PHASES } from './DifficultyDefinitions';
import { ENEMY_SPAWN_PROFILES } from './EnemySpawnDefinitions';
import { RADIAL_ACT_DEFINITION } from './ActDefinitions';

describe('ActDefinitions', () => {
  it('exposes only the implemented Radial act and composes existing authored data', () => {
    expect(RADIAL_ACT_DEFINITION.id).toBe('radial');
    expect(RADIAL_ACT_DEFINITION.arenaProfile).toBe('radial');
    expect(RADIAL_ACT_DEFINITION.hazardIds).toEqual(['laser', 'radial-pulse']);
    expect(RADIAL_ACT_DEFINITION.radialPulse.firstTriggerSeconds).toBe(92);
    expect(RADIAL_ACT_DEFINITION.bossId).toBe('core-sentinel');
    expect(RADIAL_ACT_DEFINITION.durationSeconds).toBe(BOSS_DEFINITION.startSeconds);
    expect(RADIAL_ACT_DEFINITION.bossStartSeconds).toBe(BOSS_DEFINITION.startSeconds);
    expect(RADIAL_ACT_DEFINITION.spawnPhases).toBe(DIFFICULTY_PHASES);
    expect(RADIAL_ACT_DEFINITION.spawnProfiles).toBe(ENEMY_SPAWN_PROFILES);
    expect(RADIAL_ACT_DEFINITION.arenaShapeChanges).toBe(ACT_I_ARENA_SHAPE_CHANGES);
    expect(RADIAL_ACT_DEFINITION.boss).toBe(BOSS_DEFINITION);
  });
});
