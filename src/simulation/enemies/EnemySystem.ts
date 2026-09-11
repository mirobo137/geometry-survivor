import { ENEMY_DEFINITIONS, ORBITER_DEFINITION, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { EnemyPool, type EnemyState } from '../combat/EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { RadialActDirector } from '../acts/RadialActDirector';
import { OrbiterBehavior } from './OrbiterBehavior';

const CONTACT_COOLDOWN_SECONDS = 0.45;
const SPAWN_RADIUS_PADDING = 80;
const SPAWN_ANGLE_STEP = 2.399963229728653;
const STRESS_ENEMY_KINDS: readonly EnemyKind[] = ['chaser', 'fast', 'tank'];

// Kept as a compatibility export for simulation consumers and existing tools.
// New runtime code uses RadialActDirector so the act owns its timeline.
export { selectEnemyKind } from '../../content/run/EnemySpawnDefinitions';

/** Owns enemy lifecycle, movement and broad-phase queries for a combat run. */
export class EnemySystem {
  private contactCooldown = 0;
  private spawnIndex = 0;
  private readonly orbiterBehavior = new OrbiterBehavior();

  public constructor(
    public readonly pool: EnemyPool,
    private readonly grid: SpatialGrid,
    private readonly actDirector: RadialActDirector = new RadialActDirector()
  ) {}

  public get states(): readonly EnemyState[] {
    return this.pool.states;
  }

  public spawn(elapsedSeconds: number, arenaRadius: number): EnemyState | null {
    const state = this.pool.acquire();
    if (!state) return null;

    const index = this.spawnIndex;
    this.spawnIndex += 1;
    this.configureEnemy(state, arenaRadius, index, this.actDirector.selectEnemyKind(elapsedSeconds, index));
    return state;
  }

  public spawnBoss(arenaRadius: number, spawnDistance: number): EnemyState | null {
    if (this.pool.states.some((state) => state.active && state.kind === 'boss')) return null;
    const state = this.pool.acquire();
    if (!state) return null;
    this.configureBoss(state, arenaRadius, spawnDistance);
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
    for (const enemy of this.pool.states) {
      if (enemy.active && enemy.kind === 'orbiter' && enemy.orbiterPhase === 'commit') orbiterCommits += 1;
    }
    for (const enemy of this.pool.states) {
      if (!enemy.active) continue;
      enemy.orbitHitCooldown = Math.max(0, enemy.orbitHitCooldown - dt);
      if (enemy.kind === 'boss') continue;
      if (enemy.kind === 'orbiter') {
        const wasCommit = enemy.orbiterPhase === 'commit';
        this.orbiterBehavior.update(enemy, dt, player, arenaRadius, wasCommit || orbiterCommits < ORBITER_DEFINITION.commitCap);
        if (!wasCommit && enemy.orbiterPhase === 'commit') orbiterCommits += 1;
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

  private configureEnemy(state: EnemyState, arenaRadius: number, index: number, kind: EnemyKind): void {
    const definition = ENEMY_DEFINITIONS[kind];
    const angle = index * SPAWN_ANGLE_STEP;
    const distance = Math.max(arenaRadius + SPAWN_RADIUS_PADDING + (index % 4) * 24, 380);
    state.kind = kind;
    state.x = ARENA_CENTER.x + Math.cos(angle) * distance;
    state.y = ARENA_CENTER.y + Math.sin(angle) * distance;
    state.vx = 0;
    state.vy = 0;
    state.radius = definition.radius;
    state.speed = definition.speed;
    state.maxHealth = definition.maxHealth;
    state.health = definition.maxHealth;
    state.contactDamage = definition.contactDamage;
    state.contactEnabled = kind !== 'orbiter';
    state.orbitHitCooldown = 0;
    state.orbiterPhase = 'inactive';
    state.orbiterDirection = 1;
    state.orbiterSector = -1;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = 0;
    state.orbiterStartAngle = 0;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    if (kind === 'orbiter') this.orbiterBehavior.configure(state, index, arenaRadius);
  }

  private configureBoss(state: EnemyState, arenaRadius: number, spawnDistance: number): void {
    const definition = ENEMY_DEFINITIONS.boss;
    const distance = Math.min(
      Math.max(0, spawnDistance),
      Math.max(0, arenaRadius - definition.radius - 16)
    );
    state.kind = definition.kind;
    state.x = ARENA_CENTER.x;
    state.y = ARENA_CENTER.y - distance;
    state.vx = 0;
    state.vy = 0;
    state.radius = definition.radius;
    state.speed = definition.speed;
    state.maxHealth = definition.maxHealth;
    state.health = definition.maxHealth;
    state.contactDamage = definition.contactDamage;
    state.contactEnabled = false;
    state.orbitHitCooldown = 0;
    state.orbiterPhase = 'inactive';
    state.orbiterDirection = 1;
    state.orbiterSector = -1;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = 0;
    state.orbiterStartAngle = 0;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
  }

  private countActiveOrbiters(): number {
    return this.pool.states.reduce((count, state) => count + (state.active && state.kind === 'orbiter' ? 1 : 0), 0);
  }
}
