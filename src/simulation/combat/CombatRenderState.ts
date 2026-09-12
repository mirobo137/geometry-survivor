import type { LaserHazardState } from '../hazards/LaserHazard';
import type { RadialPulseState } from '../hazards/RadialPulseHazard';
import type { PulseRingState } from '../hazards/PulseRingHazard';
import type { AngularSweepState } from '../hazards/AngularSweepHazard';
import type { ChargerPhase, EnemyKind, OrbiterDirection, OrbiterPhase, PrismWeaverPhase } from '../../content/enemies/EnemyDefinitions';
import type { ProjectileMuzzle } from '../../content/weapons/WeaponDefinitions';
import type { BoomerangState as PooledBoomerangState } from './EntityPools';
import type { BossId, BossPattern } from '../../content/bosses/BossDefinition';

export type { BoomerangPhase } from './EntityPools';

export type BossPhase =
  | 'inactive'
  | 'intro'
  | 'sweep-telegraph'
  | 'sweep-active'
  | 'charge-telegraph'
  | 'charge-active'
  | 'curve-telegraph'
  | 'curve-active'
  | 'replicas-telegraph'
  | 'replicas-active'
  | 'ring-telegraph'
  | 'ring-active'
  | 'recovery'
  | 'defeated';

export interface BossRenderState {
  bossId: BossId;
  active: boolean;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  phase: BossPhase;
  progress: number;
  pattern: BossPattern;
  sweepAngle: number;
  ringRadius: number;
  safeGapAngle: number;
  safeGapHalfAngle: number;
  chargeStartX: number;
  chargeStartY: number;
  chargeAimX: number;
  chargeAimY: number;
  curveRadius: number;
  curveStartAngle: number;
  curveAngle: number;
  curveTravelRadians: number;
  curveDirection: -1 | 1;
  replicaSequence: number;
  replicaLeftX: number;
  replicaLeftY: number;
  replicaRightX: number;
  replicaRightY: number;
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

export type BoomerangState = PooledBoomerangState;

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
  /** Present only for the Angular family; views never infer it from position. */
  readonly orbiterPhase?: OrbiterPhase;
  readonly orbiterDirection?: OrbiterDirection;
  readonly orbiterSector?: number;
  readonly orbiterProgress?: number;
  readonly orbiterBandRadius?: number;
  readonly orbiterStartAngle?: number;
  readonly orbiterSequence?: number;
  readonly chargerPhase?: ChargerPhase;
  readonly chargerProgress?: number;
  readonly chargerAimX?: number;
  readonly chargerAimY?: number;
  readonly chargerSequence?: number;
  /** Three-spoke angular control cast used by the late Act II mix. */
  readonly prismWeaverPhase?: PrismWeaverPhase;
  readonly prismWeaverProgress?: number;
  readonly prismWeaverAngle?: number;
  readonly prismWeaverRadius?: number;
  readonly prismWeaverSequence?: number;
  /** Splitter lineage used only to scale/animate children after a fracture. */
  readonly splitterDepth?: number;
  /** Warden copies use the common enemy renderer with a distinct asset family. */
  readonly wardenReplica?: boolean;
}

/** Projectile view contract; velocity is included for the sprite orientation. */
export interface ProjectileRenderState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly ageSeconds: number;
  readonly lifetimeSeconds: number;
  readonly muzzle: ProjectileMuzzle;
}

/** Stable presentation signal for the latest authored projectile burst. */
export interface ShotRenderState {
  sequence: number;
  directionX: number;
  directionY: number;
  muzzleMask: number;
  leftOriginX: number;
  leftOriginY: number;
  rightOriginX: number;
  rightOriginY: number;
}

export type OrbitBladeRenderState = Readonly<OrbitBladeState>;
export type ChainSegmentRenderState = Readonly<ChainSegmentState>;
export type BoomerangRenderState = Readonly<BoomerangState>;

/** Stable, read-only view contract used by presentation without exposing the coordinator class. */
export interface CombatRenderState {
  readonly enemies: readonly EnemyRenderState[];
  readonly projectiles: readonly ProjectileRenderState[];
  readonly orbitBlades: readonly OrbitBladeRenderState[];
  readonly chainSegments: readonly ChainSegmentRenderState[];
  readonly boomerangs: readonly BoomerangRenderState[];
  readonly laser: Readonly<LaserHazardState>;
  readonly radialPulse: Readonly<RadialPulseState>;
  readonly pulseRing: Readonly<PulseRingState>;
  readonly angularSweep: Readonly<AngularSweepState>;
  readonly boss: Readonly<BossRenderState>;
  readonly shot: Readonly<ShotRenderState>;
}
