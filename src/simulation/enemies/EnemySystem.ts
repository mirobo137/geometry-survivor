import {
  CHARGER_DEFINITION,
  ENEMY_DEFINITIONS,
  ORBITER_DEFINITION,
  PRISM_WEAVER_DEFINITION,
  SPLITTER_DEFINITION,
  FRACTURE_GUNNER_DEFINITION,
  THORN_BASTION_DEFINITION,
  ZIGZAG_REAVER_DEFINITION,
  RIFT_MINER_DEFINITION,
  type EnemyKind
} from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { EnemyPool, type EnemyState } from '../combat/EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { RadialActDirector } from '../acts/RadialActDirector';
import { OrbiterBehavior } from './OrbiterBehavior';
import { ChargerBehavior } from './ChargerBehavior';
import { PrismWeaverBehavior } from './PrismWeaverBehavior';
import type { WeaponEvolutionScenario } from '../../content/weapons/WeaponEvolutionDefinitions';
import type { FractureThreatEmitter } from '../fracture/FractureThreatSystem';
import { capOverdriveHealth } from '../../content/run/OverdriveDefinitions';
import type { BossDefinition } from '../../content/bosses/BossDefinition';

const CONTACT_COOLDOWN_SECONDS = 0.45;
const SPAWN_RADIUS_PADDING = 80;
const SPAWN_ANGLE_STEP = 2.399963229728653;
const STRESS_ENEMY_KINDS: readonly EnemyKind[] = ['chaser', 'fast', 'tank'];
const EVOLUTION_DRILL_ENEMY_HEALTH = 10_000;

// Kept as a compatibility export for simulation consumers and existing tools.
// New runtime code uses RadialActDirector so the act owns its timeline.
export { selectEnemyKind } from '../../content/run/EnemySpawnDefinitions';

/** Owns enemy lifecycle, movement and broad-phase queries for a combat run. */
export class EnemySystem {
  private contactCooldown = 0;
  private spawnIndex = 0;
  private readonly orbiterBehavior = new OrbiterBehavior();
  private readonly chargerBehavior = new ChargerBehavior();
  private readonly prismWeaverBehavior = new PrismWeaverBehavior();

  public constructor(
    public readonly pool: EnemyPool,
    private readonly grid: SpatialGrid,
    private readonly actDirector: RadialActDirector = new RadialActDirector(),
    private readonly fractureThreats?: FractureThreatEmitter
  ) {}

  public get states(): readonly EnemyState[] {
    return this.pool.states;
  }

  public spawn(elapsedSeconds: number, arenaRadius: number): EnemyState | null {
    const state = this.pool.acquire();
    if (!state) return null;

    const index = this.spawnIndex;
    this.spawnIndex += 1;
    const kind = this.actDirector.selectEnemyKind(elapsedSeconds, index);
    if (kind === 'prism-weaver' && this.countActivePrismWeavers() >= PRISM_WEAVER_DEFINITION.activeCap) {
      this.pool.release(state);
      return null;
    }
    const fractureDefinition = getFractureDefinition(kind);
    if (fractureDefinition && this.countActiveKind(kind) >= fractureDefinition.activeCap) {
      this.pool.release(state);
      return null;
    }
    this.configureEnemy(state, arenaRadius, index, kind);
    return state;
  }

  public spawnBoss(
    arenaRadius: number,
    spawnDistance: number,
    bossDefinition: BossDefinition = this.actDirector.bossDefinition
  ): EnemyState | null {
    const state = this.pool.acquire();
    if (!state) return null;
    this.configureBoss(state, arenaRadius, spawnDistance, bossDefinition);
    return state;
  }

  /** Development-only consumer: keeps the first Angular family isolated. */
  public spawnOrbiterDrill(arenaRadius: number): EnemyState | null {
    if (this.countActiveOrbiters() >= ORBITER_DEFINITION.activeCap) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, 'orbiter');
    return state;
  }

  /** Development-only consumer for the fixed-line Angular family. */
  public spawnChargerDrill(arenaRadius: number): EnemyState | null {
    if (this.countActiveChargers() >= CHARGER_DEFINITION.activeCap) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex; this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, 'charger');
    return state;
  }

  /** Development-only consumer for the bounded fracture family. */
  public spawnSplitterDrill(arenaRadius: number): EnemyState | null {
    if (this.countActiveSplitters() >= SPLITTER_DEFINITION.activeCap) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, 'splitter', 0);
    return state;
  }

  /** Development-only consumer for the late Angular control family. */
  public spawnPrismWeaverDrill(arenaRadius: number): EnemyState | null {
    if (this.countActivePrismWeavers() >= PRISM_WEAVER_DEFINITION.activeCap) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, 'prism-weaver');
    return state;
  }

  /** Development-only consumer for one Act III family at a time. */
  public spawnFractureDrill(arenaRadius: number, kind: EnemyKind = 'fracture-gunner'): EnemyState | null {
    if (!getFractureDefinition(kind) || this.countActiveKind(kind) >= (getFractureDefinition(kind)?.activeCap ?? 0)) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, kind);
    return state;
  }

  /** Development-only layout for reading the player-owned Pulse Ring cast. */
  public spawnPulseRingWeaponDrill(arenaRadius: number): number {
    const placements = [
      { radius: 68, angle: -Math.PI / 2 },
      { radius: 102, angle: -Math.PI / 6 },
      { radius: 142, angle: Math.PI / 6 },
      { radius: 184, angle: Math.PI / 2 },
      { radius: 146, angle: Math.PI * 5 / 6 },
      { radius: 104, angle: Math.PI * 7 / 6 },
      { radius: 72, angle: Math.PI * 3 / 2 }
    ] as const;
    let spawned = 0;
    for (let index = 0; index < placements.length; index += 1) {
      const state = this.pool.acquire();
      if (!state) break;
      this.configureEnemy(state, arenaRadius, this.spawnIndex, 'chaser');
      this.spawnIndex += 1;
      state.x = ARENA_CENTER.x + Math.cos(placements[index].angle) * placements[index].radius;
      state.y = ARENA_CENTER.y + Math.sin(placements[index].angle) * placements[index].radius;
      state.vx = 0;
      state.vy = 0;
      state.speed = 0;
      state.contactEnabled = false;
      state.maxHealth = 250;
      state.health = state.maxHealth;
      spawned += 1;
    }
    this.rebuildGrid();
    return spawned;
  }

  /** Development-only layout for reading the remote Magnetic Charge cast. */
  public spawnMagneticChargeWeaponDrill(arenaRadius: number): number {
    const placements = [
      { radius: 28, angle: -Math.PI / 2 },
      { radius: 82, angle: -Math.PI / 2 },
      { radius: 112, angle: -Math.PI / 4 },
      { radius: 138, angle: 0 },
      { radius: 104, angle: Math.PI / 3 },
      { radius: 168, angle: Math.PI * 0.72 },
      { radius: 196, angle: Math.PI },
      { radius: 92, angle: Math.PI * 1.35 }
    ] as const;
    let spawned = 0;
    for (let index = 0; index < placements.length; index += 1) {
      const state = this.pool.acquire();
      if (!state) break;
      this.configureEnemy(state, arenaRadius, this.spawnIndex, 'chaser');
      this.spawnIndex += 1;
      state.x = ARENA_CENTER.x + Math.cos(placements[index].angle) * placements[index].radius;
      state.y = ARENA_CENTER.y + Math.sin(placements[index].angle) * placements[index].radius;
      state.vx = 0;
      state.vy = 0;
      state.speed = 0;
      state.contactEnabled = false;
      state.maxHealth = 250;
      state.health = state.maxHealth;
      spawned += 1;
    }
    this.rebuildGrid();
    return spawned;
  }

  /**
   * Development-only target layouts for validating one evolution in isolation.
   * Targets are durable, stationary and contact-safe so the weapon remains
   * readable instead of turning the route into another combat challenge.
   */
  public spawnEvolutionDrill(arenaRadius: number, scenario: WeaponEvolutionScenario): number {
    const placements = scenario === 'single'
      ? [{ radius: 150, angle: -Math.PI / 2 }]
      : [
        ...this.createEvolutionRing(14, 90),
        ...this.createEvolutionRing(18, 145),
        ...this.createEvolutionRing(24, 205)
      ];
    let spawned = 0;
    for (const placement of placements) {
      const state = this.pool.acquire();
      if (!state) break;
      this.configureEnemy(state, arenaRadius, this.spawnIndex, 'chaser');
      this.spawnIndex += 1;
      state.x = ARENA_CENTER.x + Math.cos(placement.angle) * placement.radius;
      state.y = ARENA_CENTER.y + Math.sin(placement.angle) * placement.radius;
      state.vx = 0;
      state.vy = 0;
      state.speed = 0;
      state.contactEnabled = false;
      state.maxHealth = EVOLUTION_DRILL_ENEMY_HEALTH;
      state.health = state.maxHealth;
      spawned += 1;
    }
    this.rebuildGrid();
    return spawned;
  }

  private createEvolutionRing(count: number, radius: number): readonly { radius: number; angle: number }[] {
    return Array.from({ length: count }, (_, index) => ({
      radius,
      angle: (index / count) * Math.PI * 2 - Math.PI / 2
    }));
  }

  /**
   * Replaces one defeated parent with at most two children. The pool and the
   * family cap are checked before every acquire, so this cannot inflate the
   * active entity budget.
   */
  public spawnSplitterChildren(
    x: number,
    y: number,
    parentDepth: number,
    arenaRadius: number
  ): number {
    if (parentDepth >= SPLITTER_DEFINITION.maxDepth) return 0;
    const remainingFamilySlots = Math.max(0, SPLITTER_DEFINITION.activeCap - this.countActiveSplitters());
    const childCount = Math.min(SPLITTER_DEFINITION.splitCount, remainingFamilySlots);
    if (childCount === 0) return 0;
    const radialAngle = Math.atan2(y - ARENA_CENTER.y, x - ARENA_CENTER.x);
    const baseAngle = Number.isFinite(radialAngle) ? radialAngle + Math.PI / 2 : this.spawnIndex * SPAWN_ANGLE_STEP;
    let spawned = 0;
    for (let index = 0; index < childCount; index += 1) {
      const state = this.pool.acquire();
      if (!state) break;
      const spawnIndex = this.spawnIndex;
      this.spawnIndex += 1;
      this.configureEnemy(state, arenaRadius, spawnIndex, 'splitter', parentDepth + 1);
      const side = index === 0 ? -1 : 1;
      state.x = x + Math.cos(baseAngle) * SPLITTER_DEFINITION.splitOffset * side;
      state.y = y + Math.sin(baseAngle) * SPLITTER_DEFINITION.splitOffset * side;
      state.vx = 0;
      state.vy = 0;
      spawned += 1;
    }
    return spawned;
  }

  /** Launches the Warden's two destructible miniatures without growing a new pool. */
  public spawnWardenReplicas(
    leftX: number,
    leftY: number,
    rightX: number,
    rightY: number,
    arenaRadius: number
  ): number {
    let spawned = 0;
    const left = this.spawnWardenReplica(leftX, leftY, arenaRadius);
    if (left) spawned += 1;
    const right = this.spawnWardenReplica(rightX, rightY, arenaRadius);
    if (right) spawned += 1;
    return spawned;
  }

  public clearWardenReplicas(): void {
    for (const state of this.pool.states) {
      if (state.active && state.kind === 'warden-replica') this.pool.release(state);
    }
  }

  public initializeStress(arenaRadius: number): void {
    for (let index = 0; index < this.pool.capacity; index += 1) {
      const state = this.pool.acquire();
      if (!state) break;
      this.configureEnemy(state, arenaRadius, index, STRESS_ENEMY_KINDS[index % STRESS_ENEMY_KINDS.length]);
    }
    this.rebuildGrid();
  }

  public maintainStress(arenaRadius: number): void {
    while (this.pool.activeCount < this.pool.capacity) {
      const state = this.pool.acquire();
      if (!state) break;
      const index = this.spawnIndex;
      this.spawnIndex += 1;
      this.configureEnemy(state, arenaRadius, index, STRESS_ENEMY_KINDS[index % STRESS_ENEMY_KINDS.length]);
    }
  }

  /** Updates movement and returns the first contact damage, if any. */
  public update(dtSeconds: number, player: PlayerState, arenaRadius = 270): number | null {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt === 0) {
      for (const enemy of this.pool.states) {
        if (enemy.active) {
          enemy.vx = 0;
          enemy.vy = 0;
        }
      }
      return null;
    }
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    let contactDamage: number | null = null;

    let orbiterCommits = 0;
    let chargerCharges = 0;
    for (const enemy of this.pool.states) {
      if (enemy.active && enemy.kind === 'orbiter' && enemy.orbiterPhase === 'commit') orbiterCommits += 1;
      if (enemy.active && enemy.kind === 'charger' && enemy.chargerPhase === 'charge') chargerCharges += 1;
    }
    for (const enemy of this.pool.states) {
      if (!enemy.active) continue;
      enemy.orbitHitCooldown = Math.max(0, enemy.orbitHitCooldown - dt);
      if (enemy.kind === 'boss') continue;
      if (enemy.kind === 'orbiter') {
        const wasCommit = enemy.orbiterPhase === 'commit';
        this.orbiterBehavior.update(
          enemy,
          dt,
          player,
          wasCommit || orbiterCommits < ORBITER_DEFINITION.commitCap
        );
        if (!wasCommit && enemy.orbiterPhase === 'commit') orbiterCommits += 1;
      } else if (enemy.kind === 'charger') {
        const wasCharge = enemy.chargerPhase === 'charge';
        this.chargerBehavior.update(enemy, dt, player, arenaRadius, wasCharge || chargerCharges < CHARGER_DEFINITION.chargeCap);
        if (!wasCharge && enemy.chargerPhase === 'charge') chargerCharges += 1;
      } else if (enemy.kind === 'prism-weaver') {
        const prismResult = this.prismWeaverBehavior.update(enemy, dt, arenaRadius, player);
        if (prismResult.damaged && contactDamage === null && this.contactCooldown <= 0) {
          this.contactCooldown = CONTACT_COOLDOWN_SECONDS;
          contactDamage = PRISM_WEAVER_DEFINITION.attackDamage;
        }
      } else if (isFractureKind(enemy.kind)) {
        const fractureDamage = this.updateFractureEnemy(enemy, dt, player, arenaRadius);
        if (fractureDamage !== null && contactDamage === null && this.contactCooldown <= 0) {
          this.contactCooldown = CONTACT_COOLDOWN_SECONDS;
          contactDamage = fractureDamage;
        }
      } else {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.001) {
        const step = Math.min(distance, enemy.speed * dt);
        enemy.vx = (dx / distance) * (step / dt);
        enemy.vy = (dy / distance) * (step / dt);
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      } else {
        enemy.vx = 0;
        enemy.vy = 0;
      }
      }
      if (
        contactDamage === null
        && this.contactCooldown <= 0
        && enemy.contactEnabled
        && Math.hypot(player.x - enemy.x, player.y - enemy.y) <= player.radius + enemy.radius
      ) {
        this.contactCooldown = CONTACT_COOLDOWN_SECONDS;
        contactDamage = enemy.contactDamage;
      }
    }

    return contactDamage;
  }

  public rebuildGrid(): void {
    this.grid.clear();
    for (let index = 0; index < this.pool.states.length; index += 1) {
      const enemy = this.pool.states[index];
      if (enemy.active) this.grid.insert(index, enemy.x, enemy.y);
    }
  }

  public queryCircle(x: number, y: number, radius: number): readonly number[] {
    return this.grid.queryCircle(x, y, radius);
  }

  public findNearestEnemyIndex(
    x: number,
    y: number,
    radius: number,
    excludedIndices?: readonly number[],
    excludedCount = 0
  ): number {
    const candidates = this.grid.queryCircle(x, y, radius);
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const index of candidates) {
      const enemy = this.pool.states[index];
      if (!enemy.active) continue;
      if (excludedIndices) {
        let excluded = false;
        for (let excludedIndex = 0; excludedIndex < excludedCount; excludedIndex += 1) {
          if (excludedIndices[excludedIndex] === index) {
            excluded = true;
            break;
          }
        }
        if (excluded) continue;
      }
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    }
    return nearestIndex;
  }

  public getState(index: number): EnemyState {
    return this.pool.states[index];
  }

  public reset(): void {
    this.pool.reset();
    this.grid.clear();
    this.contactCooldown = 0;
    this.spawnIndex = 0;
  }

  private configureEnemy(state: EnemyState, arenaRadius: number, index: number, kind: EnemyKind, splitterDepth = 0): void {
    const definition = ENEMY_DEFINITIONS[kind];
    const angle = index * SPAWN_ANGLE_STEP;
    const distance = Math.max(arenaRadius + SPAWN_RADIUS_PADDING + (index % 4) * 24, 380);
    state.kind = kind;
    state.bossId = undefined;
    state.x = ARENA_CENTER.x + Math.cos(angle) * distance;
    state.y = ARENA_CENTER.y + Math.sin(angle) * distance;
    state.vx = 0;
    state.vy = 0;
    const isSplitterChild = kind === 'splitter' && splitterDepth > 0;
    state.radius = definition.radius * (isSplitterChild ? SPLITTER_DEFINITION.childRadiusScale : 1);
    state.speed = definition.speed * (isSplitterChild ? SPLITTER_DEFINITION.childSpeedScale : 1);
    state.maxHealth = capOverdriveHealth(
      definition.maxHealth,
      this.actDirector.enemyHealthMultiplier,
      isSplitterChild ? SPLITTER_DEFINITION.childHealthScale : 1
    );
    state.health = state.maxHealth;
    state.contactDamage = definition.contactDamage * (isSplitterChild ? SPLITTER_DEFINITION.childContactDamageScale : 1);
    state.contactEnabled = kind !== 'orbiter';
    state.orbitHitCooldown = 0;
    state.orbiterPhase = 'inactive';
    state.orbiterDirection = 1;
    state.orbiterSector = -1;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = 0;
    state.orbiterStartAngle = 0;
    state.orbiterRouteCenterX = 0;
    state.orbiterRouteCenterY = 0;
    state.orbiterRouteRadius = 0;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    state.chargerPhase = 'inactive'; state.chargerProgress = 0; state.chargerAimX = 0; state.chargerAimY = 0;
    state.chargerEndX = 0; state.chargerEndY = 0; state.chargerTimer = 0; state.chargerSequence = 0;
    state.prismWeaverPhase = 'inactive'; state.prismWeaverProgress = 0; state.prismWeaverAngle = 0;
    state.prismWeaverStartAngle = 0; state.prismWeaverDirection = 1; state.prismWeaverRadius = 0;
    state.prismWeaverTimer = 0; state.prismWeaverSequence = 0; state.prismWeaverHitApplied = false;
    state.splitterDepth = kind === 'splitter' ? splitterDepth : 0;
    state.wardenReplica = kind === 'warden-replica';
    this.resetFractureState(state, kind);
    if (kind === 'orbiter') this.orbiterBehavior.configure(state, index);
    if (kind === 'charger') this.chargerBehavior.configure(state);
    if (kind === 'prism-weaver') this.prismWeaverBehavior.configure(state, index, arenaRadius);
  }

  private configureBoss(
    state: EnemyState,
    arenaRadius: number,
    spawnDistance: number,
    bossDefinition: BossDefinition = this.actDirector.bossDefinition
  ): void {
    const definition = ENEMY_DEFINITIONS.boss;
    const bossRadius = bossDefinition.bossRadius ?? definition.radius;
    const bossHealth = capOverdriveHealth(
      bossDefinition.maxHealth ?? definition.maxHealth,
      this.actDirector.enemyHealthMultiplier
    );
    const distance = Math.min(
      Math.max(0, spawnDistance),
      Math.max(0, arenaRadius - bossRadius - 16)
    );
    state.kind = definition.kind;
    state.bossId = bossDefinition.id;
    state.x = ARENA_CENTER.x;
    state.y = ARENA_CENTER.y - distance;
    state.vx = 0;
    state.vy = 0;
    state.radius = bossRadius;
    state.speed = definition.speed;
    state.maxHealth = bossHealth;
    state.health = bossHealth;
    state.contactDamage = definition.contactDamage;
    state.contactEnabled = false;
    state.orbitHitCooldown = 0;
    state.orbiterPhase = 'inactive';
    state.orbiterDirection = 1;
    state.orbiterSector = -1;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = 0;
    state.orbiterStartAngle = 0;
    state.orbiterRouteCenterX = 0;
    state.orbiterRouteCenterY = 0;
    state.orbiterRouteRadius = 0;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    state.chargerPhase = 'inactive'; state.chargerProgress = 0; state.chargerAimX = 0; state.chargerAimY = 0;
    state.chargerEndX = 0; state.chargerEndY = 0; state.chargerTimer = 0; state.chargerSequence = 0;
    state.prismWeaverPhase = 'inactive'; state.prismWeaverProgress = 0; state.prismWeaverAngle = 0;
    state.prismWeaverStartAngle = 0; state.prismWeaverDirection = 1; state.prismWeaverRadius = 0;
    state.prismWeaverTimer = 0; state.prismWeaverSequence = 0; state.prismWeaverHitApplied = false;
    state.splitterDepth = 0;
    state.wardenReplica = false;
    this.resetFractureState(state, 'boss');
  }

  private spawnWardenReplica(x: number, y: number, arenaRadius: number): EnemyState | null {
    const state = this.pool.acquire();
    if (!state) return null;
    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, 'warden-replica');
    state.x = x;
    state.y = y;
    state.vx = 0;
    state.vy = 0;
    return state;
  }

  private countActiveOrbiters(): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === 'orbiter' ? 1 : 0), 0);
  }

  private countActiveChargers(): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === 'charger' ? 1 : 0), 0);
  }

  private countActiveSplitters(): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === 'splitter' ? 1 : 0), 0);
  }

  private countActivePrismWeavers(): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === 'prism-weaver' ? 1 : 0), 0);
  }

  private countActiveKind(kind: EnemyKind): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === kind ? 1 : 0), 0);
  }

  private resetFractureState(state: EnemyState, kind: EnemyKind): void {
    state.fracturePhase = isFractureKind(kind) ? 'approach' : 'inactive';
    state.fractureTimer = 0;
    state.fractureProgress = 0;
    state.fractureAimX = 0;
    state.fractureAimY = 0;
    state.fractureStartX = 0;
    state.fractureStartY = 0;
    state.fractureEndX = 0;
    state.fractureEndY = 0;
    state.fractureSequence = 0;
    state.fractureHitApplied = false;
    state.fractureSpikeRadius = 0;
  }

  private updateFractureEnemy(
    state: EnemyState,
    dt: number,
    player: PlayerState,
    arenaRadius: number
  ): number | null {
    const definition = getFractureDefinition(state.kind);
    if (!definition) return null;
    const phase = state.fracturePhase;
    state.fractureTimer += dt;
    state.fractureProgress = Math.min(1, state.fractureTimer / Math.max(0.001,
      phase === 'telegraph' ? definition.telegraphSeconds
        : phase === 'active' ? definition.activeSeconds : definition.recoverySeconds));

    if (phase === 'approach') {
      if (state.kind === 'fracture-gunner') this.moveGunner(state, player, dt, definition.attackRange ?? 190);
      else this.moveToPlayer(state, player, dt);
      if (state.fractureTimer >= definition.attackDelaySeconds) {
        state.fracturePhase = 'telegraph';
        state.fractureTimer = 0;
        state.fractureProgress = 0;
        state.fractureAimX = player.x;
        state.fractureAimY = player.y;
        state.fractureSequence += 1;
        if (state.kind === 'zigzag-reaver') {
          state.fractureStartX = state.x;
          state.fractureStartY = state.y;
          const dx = player.x - state.x;
          const dy = player.y - state.y;
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          const travel = Math.min(ZIGZAG_REAVER_DEFINITION.zigzagDistance ?? 178, distance + 90);
          state.fractureEndX = state.x + dx / distance * travel;
          state.fractureEndY = state.y + dy / distance * travel;
        }
      }
      return null;
    }

    if (phase === 'telegraph') {
      if (state.fractureTimer >= definition.telegraphSeconds) {
        state.fracturePhase = 'active';
        state.fractureTimer = 0;
        state.fractureProgress = 0;
        state.fractureHitApplied = false;
        if (state.kind === 'fracture-gunner') {
          this.fractureThreats?.fireProjectile(
            state.x, state.y, state.fractureAimX, state.fractureAimY,
            FRACTURE_GUNNER_DEFINITION.projectileSpeed ?? 275,
            FRACTURE_GUNNER_DEFINITION.projectileDamage ?? 10,
            0.16,
            FRACTURE_GUNNER_DEFINITION.projectileCount ?? 2
          );
        } else if (state.kind === 'rift-miner') {
          this.deployMinerMines(state, arenaRadius);
        }
      }
      return null;
    }

    if (phase === 'active') {
      if (state.kind === 'zigzag-reaver') this.updateZigzag(state, definition);
      if (state.kind === 'thorn-bastion') {
        state.fractureSpikeRadius = THORN_BASTION_DEFINITION.spikeRadius ?? 58;
        const distance = Math.hypot(player.x - state.x, player.y - state.y);
        if (!state.fractureHitApplied && distance <= state.fractureSpikeRadius + player.radius) {
          state.fractureHitApplied = true;
          return state.contactDamage;
        }
      }
      if (state.fractureTimer >= definition.activeSeconds) {
        state.fracturePhase = 'recovery';
        state.fractureTimer = 0;
        state.fractureProgress = 0;
        state.fractureSpikeRadius = 0;
      }
      return null;
    }

    if (state.fractureTimer >= definition.recoverySeconds) {
      state.fracturePhase = 'approach';
      state.fractureTimer = 0;
      state.fractureProgress = 0;
    }
    return null;
  }

  private moveToPlayer(state: EnemyState, player: PlayerState, dt: number): void {
    const dx = player.x - state.x;
    const dy = player.y - state.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) { state.vx = 0; state.vy = 0; return; }
    state.vx = dx / distance * state.speed;
    state.vy = dy / distance * state.speed;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
  }

  private moveGunner(state: EnemyState, player: PlayerState, dt: number, desiredRange: number): void {
    const dx = player.x - state.x;
    const dy = player.y - state.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) return;
    const tangentX = -dy / distance;
    const tangentY = dx / distance;
    const radial = distance < desiredRange * 0.78 ? -1 : distance > desiredRange * 1.18 ? 1 : 0;
    state.vx = (dx / distance * radial + tangentX * (radial === 0 ? 0.72 : 0.22)) * state.speed;
    state.vy = (dy / distance * radial + tangentY * (radial === 0 ? 0.72 : 0.22)) * state.speed;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
  }

  private updateZigzag(state: EnemyState, definition: { readonly zigzagWidth?: number }): void {
    const progress = Math.min(1, state.fractureTimer / Math.max(0.001, ZIGZAG_REAVER_DEFINITION.activeSeconds));
    const dx = state.fractureEndX - state.fractureStartX;
    const dy = state.fractureEndY - state.fractureStartY;
    const length = Math.max(0.001, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const zig = Math.sin(progress * Math.PI * 2) * (definition.zigzagWidth ?? 70);
    state.x = state.fractureStartX + dx * progress + normalX * zig;
    state.y = state.fractureStartY + dy * progress + normalY * zig;
    state.vx = dx / Math.max(0.001, ZIGZAG_REAVER_DEFINITION.activeSeconds);
    state.vy = dy / Math.max(0.001, ZIGZAG_REAVER_DEFINITION.activeSeconds);
  }

  private deployMinerMines(state: EnemyState, arenaRadius: number): void {
    const baseAngle = state.fractureSequence * 2.3999632297;
    const targetRadius = Math.min(RIFT_MINER_DEFINITION.attackRadius ?? 150, Math.max(48, arenaRadius - 55));
    const count = RIFT_MINER_DEFINITION.mineCount ?? 2;
    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle + (index - (count - 1) * 0.5) * 0.62;
      const x = ARENA_CENTER.x + Math.cos(angle) * targetRadius;
      const y = ARENA_CENTER.y + Math.sin(angle) * targetRadius;
      this.fractureThreats?.deployMine(state.x, state.y, x, y, RIFT_MINER_DEFINITION.mineDamage ?? 18);
    }
  }
}

const isFractureKind = (kind: EnemyKind): boolean => (
  kind === 'fracture-gunner' || kind === 'thorn-bastion' || kind === 'zigzag-reaver' || kind === 'rift-miner'
);

const getFractureDefinition = (kind: EnemyKind) => {
  if (kind === 'fracture-gunner') return FRACTURE_GUNNER_DEFINITION;
  if (kind === 'thorn-bastion') return THORN_BASTION_DEFINITION;
  if (kind === 'zigzag-reaver') return ZIGZAG_REAVER_DEFINITION;
  if (kind === 'rift-miner') return RIFT_MINER_DEFINITION;
  return null;
};
