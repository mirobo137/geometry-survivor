import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { BOSS_DEFINITION } from '../../content/bosses/BossDefinition';
import { PlayerModel } from '../PlayerModel';
import { EnemyPool } from '../combat/EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { EnemySystem } from '../enemies/EnemySystem';
import { BossSystem } from './BossSystem';

const TEST_DEFINITION = {
  ...BOSS_DEFINITION,
  startSeconds: 0,
  introSeconds: 0.05,
  sweepTelegraphSeconds: 0.05,
  sweepActiveSeconds: 0.05,
  ringTelegraphSeconds: 0.05,
  ringActiveSeconds: 0.25,
  recoverySeconds: 0.05
};

const createBoss = (): { boss: BossSystem; enemies: EnemySystem; player: PlayerModel } => {
  const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
  return {
    boss: new BossSystem(enemies, TEST_DEFINITION),
    enemies,
    player: new PlayerModel()
  };
};

const advanceToRing = (boss: BossSystem, player: PlayerModel): void => {
  for (let index = 0; index < 60 && boss.state.phase !== 'ring-active'; index += 1) {
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
  }
  expect(boss.state.phase).toBe('ring-active');
};

describe('BossSystem', () => {
  it('spawns only at the authored start time and alternates telegraphed patterns', () => {
    const { boss, enemies, player } = createBoss();

    expect(boss.update(1 / 60, -0.01, player.state, ARENA_RADIUS)).toBe(0);
    expect(boss.state.active).toBe(false);

    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    expect(boss.state.active).toBe(true);
    expect(boss.state.phase).toBe('intro');
    expect(enemies.states.filter((state) => state.active && state.kind === 'boss')).toHaveLength(1);

    const phases = new Set<string>();
    for (let index = 0; index < 60; index += 1) {
      phases.add(boss.state.phase);
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }
    expect(phases.has('sweep-telegraph')).toBe(true);
    expect(phases.has('ring-telegraph')).toBe(true);
  });

  it('moves deterministically on a bounded orbit inside the arena', () => {
    const first = createBoss();
    const second = createBoss();
    first.boss.update(1 / 60, 0, first.player.state, ARENA_RADIUS);
    second.boss.update(1 / 60, 0, second.player.state, ARENA_RADIUS);
    const initialX = first.boss.state.x;
    const initialY = first.boss.state.y;

    for (let index = 0; index < 60; index += 1) {
      first.boss.update(1 / 60, 1, first.player.state, ARENA_RADIUS);
      second.boss.update(1 / 60, 1, second.player.state, ARENA_RADIUS);
    }

    expect(first.boss.state.x).not.toBeCloseTo(initialX, 4);
    expect(first.boss.state.y).not.toBeCloseTo(initialY, 4);
    expect(first.boss.state.x).toBeCloseTo(second.boss.state.x, 8);
    expect(first.boss.state.y).toBeCloseTo(second.boss.state.y, 8);
    const distance = Math.hypot(
      first.boss.state.x - ARENA_CENTER.x,
      first.boss.state.y - ARENA_CENTER.y
    );
    expect(distance).toBeCloseTo(TEST_DEFINITION.movementRadius, 5);
    expect(distance + first.boss.state.radius).toBeLessThan(ARENA_RADIUS);
  });

  it('damages a player in the sweep but permits the declared ring safe gap', () => {
    const first = createBoss();
    first.boss.update(1 / 60, 0, first.player.state, ARENA_RADIUS);
    let sweepDamage = 0;
    for (let index = 0; index < 30; index += 1) {
      sweepDamage += first.boss.update(1 / 60, 0, first.player.state, ARENA_RADIUS);
    }
    expect(sweepDamage).toBe(BOSS_DEFINITION.damage);

    const safe = createBoss();
    safe.boss.update(1 / 60, 0, safe.player.state, ARENA_RADIUS);
    advanceToRing(safe.boss, safe.player);
    let safeGapDamage = 0;
    for (let index = 0; index < 20; index += 1) {
      const angle = safe.boss.state.safeGapAngle;
      safe.player.state.x = ARENA_CENTER.x + safe.boss.state.ringRadius * Math.cos(angle);
      safe.player.state.y = ARENA_CENTER.y + safe.boss.state.ringRadius * Math.sin(angle);
      safeGapDamage += safe.boss.update(1 / 60, 0, safe.player.state, ARENA_RADIUS);
    }
    expect(safeGapDamage).toBe(0);

    const unsafe = createBoss();
    unsafe.boss.update(1 / 60, 0, unsafe.player.state, ARENA_RADIUS);
    advanceToRing(unsafe.boss, unsafe.player);
    let ringDamage = 0;
    for (let index = 0; index < 20 && ringDamage === 0; index += 1) {
      const angle = unsafe.boss.state.safeGapAngle + Math.PI;
      unsafe.player.state.x = ARENA_CENTER.x + unsafe.boss.state.ringRadius * Math.cos(angle);
      unsafe.player.state.y = ARENA_CENTER.y + unsafe.boss.state.ringRadius * Math.sin(angle);
      ringDamage += unsafe.boss.update(1 / 60, 0, unsafe.player.state, ARENA_RADIUS);
    }
    expect(ringDamage).toBe(BOSS_DEFINITION.damage);
  });

  it('supports a terminal defeat and a full reset', () => {
    const { boss, player, enemies } = createBoss();
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    boss.markDefeated();
    expect(boss.state.phase).toBe('defeated');
    expect(boss.update(1 / 60, 10, player.state, ARENA_RADIUS)).toBe(0);

    boss.reset();
    enemies.reset();
    expect(boss.state.phase).toBe('inactive');
    expect(boss.state.active).toBe(false);
    expect(boss.state.health).toBe(0);
  });
});
