import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS } from '../../config/constants';
import { PlayerModel } from '../PlayerModel';
import { FractureThreatSystem } from './FractureThreatSystem';

describe('FractureThreatSystem', () => {
  it('moves a battery projectile and emits one bounded damage packet on contact', () => {
    const threats = new FractureThreatSystem();
    const player = new PlayerModel();
    const created = threats.fireProjectile(660, 360, player.state.x, player.state.y, 200, 13);

    expect(created).toBe(1);
    const update = threats.update(0.1, player.state, ARENA_RADIUS);

    expect(update).toEqual({ amount: 13, source: 'fracture-projectile' });
    expect(threats.projectiles.some((projectile) => projectile.active)).toBe(false);
  });

  it('arms and detonates a mine at its authored target without creating unbounded state', () => {
    const threats = new FractureThreatSystem();
    const player = new PlayerModel();
    const created = threats.deployMine(400, 300, player.state.x, player.state.y, 18);

    expect(created).toBe(1);
    for (let index = 0; index < 7; index += 1) {
      expect(threats.update(0.1, player.state, ARENA_RADIUS)).toBeNull();
    }
    for (let index = 0; index < 17; index += 1) {
      expect(threats.update(0.1, player.state, ARENA_RADIUS)).toBeNull();
    }
    expect(threats.update(0.1, player.state, ARENA_RADIUS)).toEqual({
      amount: 18,
      source: 'fracture-mine'
    });
    expect(threats.mines.filter((mine) => mine.active)).toHaveLength(0);
  });

  it('stays capped when the authored boss requests more ordnance than a frame can hold', () => {
    const threats = new FractureThreatSystem();
    for (let index = 0; index < 64; index += 1) {
      threats.fireProjectile(400, 300, 600, 360, 240, 5, 0, 1);
    }
    for (let index = 0; index < 20; index += 1) {
      threats.deployMine(400, 300, 600 + index, 360, 5);
    }

    expect(threats.projectiles.filter((projectile) => projectile.active)).toHaveLength(48);
    expect(threats.mines.filter((mine) => mine.active)).toHaveLength(12);
  });

  it('retires a stalled hostile projectile instead of leaving a frozen non-damaging slot', () => {
    const threats = new FractureThreatSystem();
    expect(threats.fireProjectile(400, 300, 600, 360, 240, 5)).toBe(1);
    const projectile = threats.projectiles[0];
    projectile.vx = 0;
    projectile.vy = 0;

    threats.update(1 / 60, new PlayerModel().state, ARENA_RADIUS);

    expect(projectile.active).toBe(false);
    expect(threats.projectiles.filter((candidate) => candidate.active)).toHaveLength(0);
  });
});
