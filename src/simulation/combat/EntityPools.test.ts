import { describe, expect, it } from 'vitest';
import { EnemyPool, ProjectilePool } from './EntityPools';

describe('entity pools', () => {
  it('reuses released enemy slots and enforces capacity', () => {
    const pool = new EnemyPool(1);
    const first = pool.acquire();

    expect(first).not.toBeNull();
    expect(pool.acquire()).toBeNull();
    pool.release(first!);
    expect(pool.acquire()).toBe(first);
    expect(pool.activeCount).toBe(1);
  });

  it('tracks projectile active counts without allocating on release', () => {
    const projectiles = new ProjectilePool(2);
    const projectile = projectiles.acquire();

    expect(projectiles.activeCount).toBe(1);
    projectiles.release(projectile!);
    expect(projectiles.activeCount).toBe(0);
  });
});
