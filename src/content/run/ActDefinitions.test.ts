import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITION } from '../bosses/BossDefinition';
import { ANGULAR_SWEEP_DEFINITION } from '../hazards/AngularSweepDefinition';
import { PULSE_RING_DEFINITION } from '../hazards/PulseRingDefinition';
import { ACT_I_ARENA_SHAPE_CHANGES, ACT_II_ARENA_SHAPE_CHANGES } from './ArenaShapeDefinitions';
import { DIFFICULTY_PHASES } from './DifficultyDefinitions';
import { ENEMY_SPAWN_PROFILES } from './EnemySpawnDefinitions';
import { ANGULAR_ACT_DEFINITION, RADIAL_ACT_DEFINITION } from './ActDefinitions';

describe('ActDefinitions', () => {
  it('composes the implemented Radial act from its authored data', () => {
    expect(RADIAL_ACT_DEFINITION.id).toBe('radial');
    expect(RADIAL_ACT_DEFINITION.arenaProfile).toBe('radial');
    expect(RADIAL_ACT_DEFINITION.hazardIds).toEqual(['laser', 'radial-pulse']);
    expect(RADIAL_ACT_DEFINITION.radialPulse.firstTriggerSeconds).toBe(92);
    expect(RADIAL_ACT_DEFINITION.bossId).toBe('core-sentinel');
    expect(RADIAL_ACT_DEFINITION.durationSeconds).toBe(BOSS_DEFINITION.startSeconds);
    expect(RADIAL_ACT_DEFINITION.bossStartSeconds).toBe(BOSS_DEFINITION.startSeconds);
    expect(RADIAL_ACT_DEFINITION.spawnPhases).toBe(DIFFICULTY_PHASES);
    expect(RADIAL_ACT_DEFINITION.spawnProfiles).toBe(ENEMY_SPAWN_PROFILES);
    expect(RADIAL_ACT_DEFINITION.initialArenaShape).toBe('circle');
    expect(RADIAL_ACT_DEFINITION.arenaShapeChanges).toBe(ACT_I_ARENA_SHAPE_CHANGES);
    expect(RADIAL_ACT_DEFINITION.boss).toBe(BOSS_DEFINITION);
  });

  it('exposes a complete Angular campaign composition without changing Radial', () => {
    expect(ANGULAR_ACT_DEFINITION.id).toBe('angular');
    expect(ANGULAR_ACT_DEFINITION.arenaProfile).toBe('angular');
    expect(ANGULAR_ACT_DEFINITION.hazardIds).toEqual(['pulse-ring', 'angular-sweep']);
    expect(ANGULAR_ACT_DEFINITION.spawnProfiles[0].defaultKind).toBe('orbiter');
    expect(ANGULAR_ACT_DEFINITION.spawnProfiles.some((profile) => profile.defaultKind === 'charger')).toBe(true);
    expect(ANGULAR_ACT_DEFINITION.spawnProfiles.some((profile) => profile.overrideKind === 'splitter')).toBe(true);
    expect(ANGULAR_ACT_DEFINITION.spawnProfiles.some((profile) => profile.supportKind === 'prism-weaver')).toBe(true);
    expect(ANGULAR_ACT_DEFINITION.bossId).toBe('orbital-warden');
    expect(ANGULAR_ACT_DEFINITION.bossStartSeconds).toBe(260);
    expect(ANGULAR_ACT_DEFINITION.initialArenaShape).toBe('hexagon');
    expect(ANGULAR_ACT_DEFINITION.arenaShapeChanges).toBe(ACT_II_ARENA_SHAPE_CHANGES);
  });

  it('places Angular morphs between new Pulse Ring and Sweep casts without changing either timer', () => {
    const definitions = [PULSE_RING_DEFINITION, ANGULAR_SWEEP_DEFINITION];
    for (const change of ACT_II_ARENA_SHAPE_CHANGES) {
      const morphStart = change.startSeconds + change.telegraphSeconds;
      const morphEnd = morphStart + change.morphSeconds;
      for (const definition of definitions) {
        const startsDuringMorph = Array.from({ length: 32 }, (_, index) => (
          definition.firstTriggerSeconds + definition.intervalSeconds * index
        )).some((triggerSeconds) => triggerSeconds >= morphStart && triggerSeconds < morphEnd);
        expect(startsDuringMorph).toBe(false);
      }
    }
  });
});
