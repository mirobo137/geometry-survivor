import { describe, expect, it } from 'vitest';
import { EnemyPool, ProjectilePool, XpPool } from './EntityPools';

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

  it('tracks projectile and XP active counts without allocating on release', () => {
    const projectiles = new ProjectilePool(2);
    const xp = new XpPool(2);
    const projectile = projectiles.acquire();
    const pickup = xp.acquire();

    expect(projectiles.activeCount).toBe(1);
    expect(xp.activeCount).toBe(1);
    projectiles.release(projectile!);
    xp.release(pickup!);
    expect(projectiles.activeCount).toBe(0);
    expect(xp.activeCount).toBe(0);
  });
});
