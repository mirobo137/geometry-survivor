import type { LaserHazardState } from '../hazards/LaserHazard';
import type { EnemyState, ProjectileState } from './EntityPools';

export type BossPhase =
  | 'inactive'
  | 'intro'
  | 'sweep-telegraph'
  | 'sweep-active'
  | 'ring-telegraph'
  | 'ring-active'
  | 'recovery'
  | 'defeated';

export interface BossRenderState {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  phase: BossPhase;
  progress: number;
  sweepAngle: number;
  ringRadius: number;
  safeGapAngle: number;
  safeGapHalfAngle: number;
}

export interface OrbitBladeState {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface ChainSegmentState {
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lifeSeconds: number;
}

/** Stable, read-only view contract used by presentation without exposing the coordinator class. */
export interface CombatRenderState {
  readonly enemies: readonly EnemyState[];
  readonly projectiles: readonly ProjectileState[];
  readonly orbitBlades: readonly OrbitBladeState[];
  readonly chainSegments: readonly ChainSegmentState[];
  readonly laser: LaserHazardState;
  readonly boss: BossRenderState;
}
