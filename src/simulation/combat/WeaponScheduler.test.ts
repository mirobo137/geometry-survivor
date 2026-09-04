import { describe, expect, it, vi } from 'vitest';
import type { PlayerState } from '../PlayerModel';
import { WeaponScheduler } from './WeaponScheduler';

const player = { x: 0, y: 0, radius: 20, health: 100, maxHealth: 100, armor: 0 } satisfies PlayerState;

describe('WeaponScheduler', () => {
  it('keeps projectile-before-chain trigger order and catches up fixed steps', () => {
    const events: string[] = [];
    const scheduler = new WeaponScheduler({
      fireProjectile: () => events.push('projectile'),
      fireChain: () => events.push('chain')
    });

    scheduler.update(0.1, 0.05, true, 0.1, player);

    expect(events).toEqual(['projectile', 'projectile', 'chain']);
  });

  it('does not accumulate a locked chain and reset removes leftover cooldown', () => {
    const fireProjectile = vi.fn();
    const fireChain = vi.fn();
    const scheduler = new WeaponScheduler({ fireProjectile, fireChain });

    scheduler.update(0.1, 0.5, false, 0.5, player);
    scheduler.update(0.05, 0.5, true, 0.5, player);
    expect(fireChain).toHaveBeenCalledTimes(0);

    scheduler.reset();
    scheduler.update(0.1, 0.1, true, 0.1, player);
    expect(fireProjectile).toHaveBeenCalledTimes(1);
    expect(fireChain).toHaveBeenCalledTimes(1);
  });
});
