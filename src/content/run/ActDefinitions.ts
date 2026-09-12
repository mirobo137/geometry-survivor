import { BOSS_DEFINITION, ORBITAL_WARDEN_DEFINITION, type BossDefinition } from '../bosses/BossDefinition';
import type { ArenaShape, ArenaShapeChangeDefinition } from './ArenaShapeDefinitions';
import { ACT_I_ARENA_SHAPE_CHANGES, ACT_II_ARENA_SHAPE_CHANGES } from './ArenaShapeDefinitions';
import type { DifficultyPhase } from './DifficultyDefinitions';
import { ACT_II_DIFFICULTY_PHASES, DIFFICULTY_PHASES } from './DifficultyDefinitions';
import type { EnemySpawnProfile } from './EnemySpawnDefinitions';
import { ACT_II_ENEMY_SPAWN_PROFILES, ENEMY_SPAWN_PROFILES } from './EnemySpawnDefinitions';
import { RADIAL_PULSE_DEFINITION, type RadialPulseDefinition } from '../hazards/RadialPulseDefinition';
import { ANGULAR_SWEEP_DEFINITION, type AngularSweepDefinition } from '../hazards/AngularSweepDefinition';
import { PULSE_RING_DEFINITION, type PulseRingDefinition } from '../hazards/PulseRingDefinition';
import type { BossId } from '../bosses/BossDefinition';

/** Only acts with a real consumer belong in this catalog. */
export type ActId = 'radial' | 'angular';

/**
 * Authored contract for a playable act. The detailed timelines stay in their
 * existing content modules; this object composes them without duplicating
 * values or making the future acts appear selectable before they exist.
 */
export interface ActDefinition {
  readonly id: ActId;
  /** Opening timeline up to the boss window; victory still requires the boss. */
  readonly durationSeconds: number;
  readonly arenaProfile: 'radial' | 'angular';
  readonly spawnProfile: 'act-i-default' | 'act-ii-angular';
  readonly hazardIds: readonly ('laser' | 'radial-pulse' | 'pulse-ring' | 'angular-sweep')[];
  readonly bossId: BossId;
  readonly bossStartSeconds: number;
  readonly spawnPhases: readonly DifficultyPhase[];
  readonly spawnProfiles: readonly EnemySpawnProfile[];
  /** Shape used before this act's first authored arena intervention. */
  readonly initialArenaShape: ArenaShape;
  readonly arenaShapeChanges: readonly ArenaShapeChangeDefinition[];
  readonly radialPulse: RadialPulseDefinition;
  readonly pulseRing: PulseRingDefinition;
  readonly angularSweep: AngularSweepDefinition;
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
  initialArenaShape: 'circle',
  arenaShapeChanges: ACT_I_ARENA_SHAPE_CHANGES,
  radialPulse: RADIAL_PULSE_DEFINITION,
  pulseRing: PULSE_RING_DEFINITION,
  angularSweep: ANGULAR_SWEEP_DEFINITION,
  boss: BOSS_DEFINITION
} as const satisfies ActDefinition;

/**
 * Act II's boss uses the already validated Warden family, but its campaign
 * consumer owns the real 04:20 entry point. The isolated drill keeps start=0.
 */
export const ANGULAR_WARDEN_ACT_DEFINITION = {
  ...ORBITAL_WARDEN_DEFINITION,
  startSeconds: 260
} as const satisfies BossDefinition;

/** First real campaign composition for the Angular family. */
export const ANGULAR_ACT_DEFINITION = {
  id: 'angular',
  durationSeconds: ANGULAR_WARDEN_ACT_DEFINITION.startSeconds,
  arenaProfile: 'angular',
  spawnProfile: 'act-ii-angular',
  hazardIds: ['pulse-ring', 'angular-sweep'],
  bossId: 'orbital-warden',
  bossStartSeconds: ANGULAR_WARDEN_ACT_DEFINITION.startSeconds,
  spawnPhases: ACT_II_DIFFICULTY_PHASES,
  spawnProfiles: ACT_II_ENEMY_SPAWN_PROFILES,
  initialArenaShape: 'hexagon',
  arenaShapeChanges: ACT_II_ARENA_SHAPE_CHANGES,
  radialPulse: RADIAL_PULSE_DEFINITION,
  pulseRing: PULSE_RING_DEFINITION,
  angularSweep: ANGULAR_SWEEP_DEFINITION,
  boss: ANGULAR_WARDEN_ACT_DEFINITION
} as const satisfies ActDefinition;
