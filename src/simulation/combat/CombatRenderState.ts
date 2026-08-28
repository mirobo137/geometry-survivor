import type { LaserHazardState } from '../hazards/LaserHazard';
import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';

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

/**
 * Presentation only sees the fields needed to draw an enemy. Keeping these
 * fields readonly prevents a view from mutating simulation state through the
 * render contract while still allowing the pooled arrays to be reused.
 */
export interface EnemyRenderState {
  readonly active: boolean;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly health: number;
  readonly maxHealth: number;
}

/** Projectile view contract; velocity is included for the sprite orientation. */
export interface ProjectileRenderState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
}

export type OrbitBladeRenderState = Readonly<OrbitBladeState>;
export type ChainSegmentRenderState = Readonly<ChainSegmentState>;

/** Stable, read-only view contract used by presentation without exposing the coordinator class. */
export interface CombatRenderState {
  readonly enemies: readonly EnemyRenderState[];
  readonly projectiles: readonly ProjectileRenderState[];
  readonly orbitBlades: readonly OrbitBladeRenderState[];
  readonly chainSegments: readonly ChainSegmentRenderState[];
  readonly laser: Readonly<LaserHazardState>;
  readonly boss: Readonly<BossRenderState>;
}
