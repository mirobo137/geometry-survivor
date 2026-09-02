import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';
import type { ProjectileMuzzle } from '../../content/weapons/WeaponDefinitions';

export interface EnemyState {
  active: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  contactDamage: number;
  orbitHitCooldown: number;
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
}

const createEnemyState = (): EnemyState => ({
  active: false,
  kind: 'chaser',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 0,
  speed: 0,
  health: 0,
  maxHealth: 0,
  contactDamage: 0,
  orbitHitCooldown: 0
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
  muzzle: 0
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
    for (const state of this.states) state.active = false;
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
