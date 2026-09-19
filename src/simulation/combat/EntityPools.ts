import type { ChargerPhase, EnemyKind, FractureEnemyPhase, OrbiterDirection, OrbiterPhase, PrismWeaverPhase } from '../../content/enemies/EnemyDefinitions';
import type { ProjectileMuzzle } from '../../content/weapons/WeaponDefinitions';
import type { BoomerangEvolution, ProjectileEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';
import type { BossId } from '../../content/bosses/BossDefinition';

export type BoomerangPhase = 'outbound' | 'holding' | 'returning';

export interface EnemyState {
  active: boolean;
  kind: EnemyKind;
  /** Boss identity is kept on the pooled entity so paired bosses render independently. */
  bossId?: BossId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  contactDamage: number;
  /** Explicit per-phase contact switch; an Orbiter hull keeps contact enabled. */
  contactEnabled: boolean;
  /** Short, simulation-owned control effects. They never affect bosses. */
  stunSeconds: number;
  slowSeconds: number;
  slowMultiplier: number;
  orbitHitCooldown: number;
  orbiterPhase: OrbiterPhase;
  orbiterDirection: OrbiterDirection;
  orbiterSector: number;
  orbiterProgress: number;
  orbiterBandRadius: number;
  orbiterStartAngle: number;
  /** Captured local focus for the current Orbiter route; never the arena origin by default. */
  orbiterRouteCenterX: number;
  orbiterRouteCenterY: number;
  orbiterRouteRadius: number;
  orbiterTimer: number;
  /** Changes only when a new telegraph is authored; views use it to cache paths. */
  orbiterSequence: number;
  chargerPhase: ChargerPhase;
  chargerProgress: number;
  chargerAimX: number;
  chargerAimY: number;
  chargerEndX: number;
  chargerEndY: number;
  chargerTimer: number;
  chargerSequence: number;
  prismWeaverPhase: PrismWeaverPhase;
  prismWeaverProgress: number;
  prismWeaverAngle: number;
  prismWeaverStartAngle: number;
  prismWeaverDirection: OrbiterDirection;
  prismWeaverRadius: number;
  prismWeaverTimer: number;
  prismWeaverSequence: number;
  prismWeaverHitApplied: boolean;
  /** Splitter lineage; depth 0 may fracture once, depth 1 never fractures. */
  splitterDepth: number;
  /** True only for the Warden's destructible miniature copies. */
  wardenReplica: boolean;
  fracturePhase: FractureEnemyPhase;
  fractureTimer: number;
  fractureProgress: number;
  fractureAimX: number;
  fractureAimY: number;
  fractureStartX: number;
  fractureStartY: number;
  fractureEndX: number;
  fractureEndY: number;
  fractureSequence: number;
  fractureHitApplied: boolean;
  fractureSpikeRadius: number;
  /** Increments whenever a pooled slot is acquired, including recycled slots. */
  generation: number;
}

export interface ProjectileState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ageSeconds: number;
  lifetimeSeconds: number;
  muzzle: ProjectileMuzzle;
  evolution: ProjectileEvolution | null;
  piercingHitCount: number;
  lastHitEnemyIndex: number;
}

export interface BoomerangState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ageSeconds: number;
  lifetimeSeconds: number;
  phase: BoomerangPhase;
  directionX: number;
  directionY: number;
  distanceTravelled: number;
  /** Quadratic path anchors used only by Twin Comet's physical trajectory. */
  curveStartX: number;
  curveStartY: number;
  curveControlX: number;
  curveControlY: number;
  curveEndX: number;
  curveEndY: number;
  returnControlX: number;
  returnControlY: number;
  returnStartX: number;
  returnStartY: number;
  returnTargetX: number;
  returnTargetY: number;
  pathProgress: number;
  slotIndex: number;
  evolution?: BoomerangEvolution | null;
}

const createEnemyState = (): EnemyState => ({
  active: false,
  kind: 'chaser',
  bossId: undefined,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 0,
  speed: 0,
  health: 0,
  maxHealth: 0,
  contactDamage: 0,
  contactEnabled: true,
  stunSeconds: 0,
  slowSeconds: 0,
  slowMultiplier: 1,
  orbitHitCooldown: 0,
  orbiterPhase: 'inactive',
  orbiterDirection: 1,
  orbiterSector: -1,
  orbiterProgress: 0,
  orbiterBandRadius: 0,
  orbiterStartAngle: 0,
  orbiterRouteCenterX: 0,
  orbiterRouteCenterY: 0,
  orbiterRouteRadius: 0,
  orbiterTimer: 0,
  orbiterSequence: 0,
  chargerPhase: 'inactive', chargerProgress: 0, chargerAimX: 0, chargerAimY: 0,
  chargerEndX: 0, chargerEndY: 0, chargerTimer: 0, chargerSequence: 0,
  prismWeaverPhase: 'inactive', prismWeaverProgress: 0, prismWeaverAngle: 0,
  prismWeaverStartAngle: 0, prismWeaverDirection: 1, prismWeaverRadius: 0,
  prismWeaverTimer: 0, prismWeaverSequence: 0, prismWeaverHitApplied: false,
  splitterDepth: 0,
  wardenReplica: false,
  fracturePhase: 'inactive',
  fractureTimer: 0,
  fractureProgress: 0,
  fractureAimX: 0,
  fractureAimY: 0,
  fractureStartX: 0,
  fractureStartY: 0,
  fractureEndX: 0,
  fractureEndY: 0,
  fractureSequence: 0,
  fractureHitApplied: false,
  fractureSpikeRadius: 0,
  generation: 0
});

const createProjectileState = (): ProjectileState => ({
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 0,
  damage: 0,
  ageSeconds: 0,
  lifetimeSeconds: 0,
  muzzle: 0,
  evolution: null,
  piercingHitCount: 0,
  lastHitEnemyIndex: -1
});

const createBoomerangState = (slotIndex: number): BoomerangState => ({
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 0,
  damage: 0,
  ageSeconds: 0,
  lifetimeSeconds: 0,
  phase: 'outbound',
      directionX: 1,
      directionY: 0,
      distanceTravelled: 0,
      curveStartX: 0,
      curveStartY: 0,
      curveControlX: 0,
      curveControlY: 0,
      curveEndX: 0,
      curveEndY: 0,
      returnControlX: 0,
      returnControlY: 0,
      returnStartX: 0,
      returnStartY: 0,
      returnTargetX: 0,
      returnTargetY: 0,
      pathProgress: 0,
  slotIndex,
  evolution: null
});

export class EnemyPool {
  public readonly states: EnemyState[];
  public activeCount = 0;
  private cursor = 0;

  public constructor(public readonly capacity: number) {
    this.states = Array.from({ length: capacity }, createEnemyState);
  }

  public acquire(): EnemyState | null {
    for (let offset = 0; offset < this.capacity; offset += 1) {
      const index = (this.cursor + offset) % this.capacity;
      const state = this.states[index];
      if (state.active) continue;
      state.active = true;
      state.generation = state.generation >= 2_000_000_000 ? 1 : state.generation + 1;
      this.cursor = (index + 1) % this.capacity;
      this.activeCount += 1;
      return state;
    }
    return null;
  }

  public release(state: EnemyState): void {
    if (!state.active) return;
    state.active = false;
    this.activeCount -= 1;
  }

  public reset(): void {
    for (const state of this.states) {
      state.active = false;
      state.wardenReplica = false;
    }
    this.activeCount = 0;
    this.cursor = 0;
  }
}

export class ProjectilePool {
  public readonly states: ProjectileState[];
  public activeCount = 0;
  private cursor = 0;

  public constructor(public readonly capacity: number) {
    this.states = Array.from({ length: capacity }, createProjectileState);
  }

  public acquire(): ProjectileState | null {
    for (let offset = 0; offset < this.capacity; offset += 1) {
      const index = (this.cursor + offset) % this.capacity;
      const state = this.states[index];
      if (state.active) continue;
      state.active = true;
      this.cursor = (index + 1) % this.capacity;
      this.activeCount += 1;
      return state;
    }
    return null;
  }

  public release(state: ProjectileState): void {
    if (!state.active) return;
    state.active = false;
    this.activeCount -= 1;
  }

  public reset(): void {
    for (const state of this.states) state.active = false;
    this.activeCount = 0;
    this.cursor = 0;
  }
}

export class BoomerangPool {
  public readonly states: BoomerangState[];
  public activeCount = 0;
  private cursor = 0;

  public constructor(public readonly capacity: number) {
    this.states = Array.from({ length: capacity }, (_, index) => createBoomerangState(index));
  }

  public acquire(): BoomerangState | null {
    for (let offset = 0; offset < this.capacity; offset += 1) {
      const index = (this.cursor + offset) % this.capacity;
      const state = this.states[index];
      if (state.active) continue;
      state.active = true;
      this.cursor = (index + 1) % this.capacity;
      this.activeCount += 1;
      return state;
    }
    return null;
  }

  public release(state: BoomerangState): void {
    if (!state.active) return;
    state.active = false;
    this.activeCount -= 1;
  }

  public reset(): void {
    for (const state of this.states) state.active = false;
    this.activeCount = 0;
    this.cursor = 0;
  }
}
