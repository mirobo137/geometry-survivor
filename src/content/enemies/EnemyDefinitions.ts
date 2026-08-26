export type EnemyKind = 'chaser' | 'fast' | 'tank' | 'elite';

export interface EnemyDefinition {
  readonly kind: EnemyKind;
  readonly radius: number;
  readonly speed: number;
  readonly maxHealth: number;
  readonly contactDamage: number;
  readonly experience: number;
  readonly spawnCost: number;
  readonly color: number;
}

export const ENEMY_DEFINITIONS: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  chaser: {
    kind: 'chaser',
    radius: 18,
    speed: 72,
    maxHealth: 24,
    contactDamage: 8,
    experience: 1,
    spawnCost: 1,
    color: 0xff936b
  },
  fast: {
    kind: 'fast',
    radius: 14,
    speed: 126,
    maxHealth: 12,
    contactDamage: 6,
    experience: 2,
    spawnCost: 1,
    color: 0xffd166
  },
  tank: {
    kind: 'tank',
    radius: 28,
    speed: 42,
    maxHealth: 72,
    contactDamage: 16,
    experience: 5,
    spawnCost: 3,
    color: 0xc58cff
  },
  elite: {
    kind: 'elite',
    radius: 24,
    speed: 84,
    maxHealth: 132,
    contactDamage: 20,
    experience: 8,
    spawnCost: 5,
    color: 0xff5fd2
  }
};
