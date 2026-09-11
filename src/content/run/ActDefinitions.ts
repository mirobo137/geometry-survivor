import { BOSS_DEFINITION, type BossDefinition } from '../bosses/BossDefinition';
import type { ArenaShapeChangeDefinition } from './ArenaShapeDefinitions';
import { ACT_I_ARENA_SHAPE_CHANGES } from './ArenaShapeDefinitions';
import type { DifficultyPhase } from './DifficultyDefinitions';
import { DIFFICULTY_PHASES } from './DifficultyDefinitions';
import type { EnemySpawnProfile } from './EnemySpawnDefinitions';
import { ENEMY_SPAWN_PROFILES } from './EnemySpawnDefinitions';
import { RADIAL_PULSE_DEFINITION, type RadialPulseDefinition } from '../hazards/RadialPulseDefinition';

/** Only acts with a real consumer belong in this catalog. */
export type ActId = 'radial';

/**
 * Authored contract for a playable act. The detailed timelines stay in their
 * existing content modules; this object composes them without duplicating
 * values or making the future acts appear selectable before they exist.
 */
export interface ActDefinition {
  readonly id: ActId;
  /** Opening timeline up to the boss window; victory still requires the boss. */
  readonly durationSeconds: number;
  readonly arenaProfile: 'radial';
  readonly spawnProfile: 'act-i-default';
  readonly hazardIds: readonly ('laser' | 'radial-pulse')[];
  readonly bossId: 'core-sentinel';
  readonly bossStartSeconds: number;
  readonly spawnPhases: readonly DifficultyPhase[];
  readonly spawnProfiles: readonly EnemySpawnProfile[];
  readonly arenaShapeChanges: readonly ArenaShapeChangeDefinition[];
  readonly radialPulse: RadialPulseDefinition;
  readonly boss: BossDefinition;
}

/**
 * The first real act definition. It is intentionally a composition of the
 * authored timelines already used by the vertical slice. The radial pulse is
 * part of this same authored contract and is not selected from the renderer.
 */
export const RADIAL_ACT_DEFINITION = {
  id: 'radial',
  durationSeconds: BOSS_DEFINITION.startSeconds,
  arenaProfile: 'radial',
  spawnProfile: 'act-i-default',
  hazardIds: ['laser', 'radial-pulse'],
  bossId: 'core-sentinel',
  bossStartSeconds: BOSS_DEFINITION.startSeconds,
  spawnPhases: DIFFICULTY_PHASES,
  spawnProfiles: ENEMY_SPAWN_PROFILES,
  arenaShapeChanges: ACT_I_ARENA_SHAPE_CHANGES,
  radialPulse: RADIAL_PULSE_DEFINITION,
  boss: BOSS_DEFINITION
} as const satisfies ActDefinition;
