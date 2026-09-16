import { BOSS_DEFINITION, FRACTURE_ENGINE_DEFINITION, ORBITAL_WARDEN_DEFINITION, type BossDefinition } from '../bosses/BossDefinition';
import type { ArenaShape, ArenaShapeChangeDefinition } from './ArenaShapeDefinitions';
import { ACT_I_ARENA_SHAPE_CHANGES, ACT_II_ARENA_SHAPE_CHANGES, ACT_III_ARENA_SHAPE_CHANGES } from './ArenaShapeDefinitions';
import type { DifficultyPhase } from './DifficultyDefinitions';
import { ACT_II_DIFFICULTY_PHASES, ACT_III_DIFFICULTY_PHASES, DIFFICULTY_PHASES } from './DifficultyDefinitions';
import type { EnemySpawnProfile } from './EnemySpawnDefinitions';
import { ACT_II_ENEMY_SPAWN_PROFILES, ACT_III_ENEMY_SPAWN_PROFILES, ENEMY_SPAWN_PROFILES } from './EnemySpawnDefinitions';
import { RADIAL_PULSE_DEFINITION, type RadialPulseDefinition } from '../hazards/RadialPulseDefinition';
import { ANGULAR_SWEEP_DEFINITION, type AngularSweepDefinition } from '../hazards/AngularSweepDefinition';
import { PULSE_RING_DEFINITION, type PulseRingDefinition } from '../hazards/PulseRingDefinition';
import type { BossId } from '../bosses/BossDefinition';

/** Only acts with a real consumer belong in this catalog. */
export type ActId = 'radial' | 'angular' | 'fracture';

/**
 * Authored contract for a playable act. The detailed timelines stay in their
 * existing content modules; this object composes them without duplicating
 * values or making the future acts appear selectable before they exist.
 */
export interface ActDefinition {
  readonly id: ActId;
  /** Opening timeline up to the boss window; victory still requires the boss. */
  readonly durationSeconds: number;
  readonly arenaProfile: 'radial' | 'angular' | 'fracture';
  readonly spawnProfile: 'act-i-default' | 'act-ii-angular' | 'act-iii-fracture';
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

/**
 * Act III campaign composition. It starts clean and keeps the boss arena
 * circular after the final pre-boss morph; all four existing arena hazards
 * remain authored consumers so the arena becomes a fourth enemy family.
 */
export const FRACTURE_ACT_DEFINITION = {
  id: 'fracture',
  durationSeconds: FRACTURE_ENGINE_DEFINITION.startSeconds,
  arenaProfile: 'fracture',
  spawnProfile: 'act-iii-fracture',
  hazardIds: ['laser', 'radial-pulse', 'pulse-ring', 'angular-sweep'],
  bossId: 'fracture-engine',
  bossStartSeconds: FRACTURE_ENGINE_DEFINITION.startSeconds,
  spawnPhases: ACT_III_DIFFICULTY_PHASES,
  spawnProfiles: ACT_III_ENEMY_SPAWN_PROFILES,
  initialArenaShape: 'octagon',
  arenaShapeChanges: ACT_III_ARENA_SHAPE_CHANGES,
  radialPulse: {
    ...RADIAL_PULSE_DEFINITION,
    firstTriggerSeconds: 18,
    intervalSeconds: 31,
    lastTriggerSeconds: 238,
    telegraphSeconds: 0.9,
    attackSeconds: 1.25
  },
  pulseRing: {
    ...PULSE_RING_DEFINITION,
    firstTriggerSeconds: 11,
    intervalSeconds: 27,
    lastTriggerSeconds: 236,
    telegraphSeconds: 0.8,
    attackSeconds: 1.45,
    safeGapHalfAngle: 0.27,
    safeGapRotationRadians: 0.9
  },
  angularSweep: {
    ...ANGULAR_SWEEP_DEFINITION,
    firstTriggerSeconds: 7,
    intervalSeconds: 22,
    lastTriggerSeconds: 236,
    telegraphSeconds: 0.78,
    attackSeconds: 1.3,
    travelRadians: 1.18,
    dangerHalfAngle: 0.2
  },
  boss: FRACTURE_ENGINE_DEFINITION
} as const satisfies ActDefinition;
