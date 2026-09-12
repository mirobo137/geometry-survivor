import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import { BOSS_DEFINITION, ORBITAL_WARDEN_DEFINITION } from '../../content/bosses/BossDefinition';
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
  it.each(['charge','curve'] as const)('keeps the %s endpoint at the recovery boundary and starts the next attack there', (pattern) => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280,720));
    const player = new PlayerModel();
    const boss = new BossSystem(enemies, {...ORBITAL_WARDEN_DEFINITION,
      patternOrder:[pattern,'curve'], introSeconds:0.02, recoverySeconds:0.4});
    const step=()=>boss.update(1/60,0,player.state,ARENA_RADIUS);
    step();
    for(let i=0;i<300 && boss.state.phase!=='recovery';i++) step();
    expect(boss.state.phase).toBe('recovery');
    const {x,y}=boss.state;
    expect(Math.hypot(x-ARENA_CENTER.x,y-ARENA_CENTER.y)+boss.state.radius).toBeLessThan(ARENA_RADIUS);
    step();
    expect(Math.hypot(boss.state.x - x, boss.state.y - y)).toBeGreaterThan(0.01);
    for(let i=0;i<60 && boss.state.phase==='recovery';i++) step();
    expect(boss.state.phase).toBe('curve-telegraph');
    expect(boss.state.curveRadius).toBeCloseTo(Math.hypot(x-ARENA_CENTER.x,y-ARENA_CENTER.y),8);
    expect(Math.hypot(boss.state.x-ARENA_CENTER.x,boss.state.y-ARENA_CENTER.y))
      .toBeCloseTo(boss.state.curveRadius,8);
  });
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

  it('gives Orbital Warden an active rotating rail and a moving safe corridor', () => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
    const boss = new BossSystem(enemies, {
      ...ORBITAL_WARDEN_DEFINITION,
      patternOrder: ['sweep', 'ring'],
      introSeconds: 0.02,
      sweepTelegraphSeconds: 0.02,
      sweepActiveSeconds: 0.2,
      ringTelegraphSeconds: 0.02,
      ringActiveSeconds: 0.2,
      recoverySeconds: 0.02
    });
    const player = new PlayerModel();
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    for (let index = 0; index < 60 && boss.state.phase !== 'sweep-active'; index += 1) {
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }
    expect(boss.state.bossId).toBe('orbital-warden');
    const sweepAngle = boss.state.sweepAngle;
    boss.update(0.1, 0, player.state, ARENA_RADIUS);
    expect(boss.state.sweepAngle).not.toBeCloseTo(sweepAngle, 5);

    for (let index = 0; index < 60 && boss.state.phase !== 'ring-active'; index += 1) {
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }
    const gapAngle = boss.state.safeGapAngle;
    boss.update(0.1, 0, player.state, ARENA_RADIUS);
    expect(boss.state.safeGapAngle).not.toBeCloseTo(gapAngle, 5);
  });

  it('gives Orbital Warden ambient motion without snapping away from an attack endpoint', () => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
    const boss = new BossSystem(enemies, {
      ...ORBITAL_WARDEN_DEFINITION,
      startSeconds: 0,
      introSeconds: 0.4,
      patternOrder: ['sweep'],
      sweepTelegraphSeconds: 0.4,
      sweepActiveSeconds: 0.4
    });
    const player = new PlayerModel();
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    const initialX = boss.state.x;
    const initialY = boss.state.y;

    boss.update(0.1, 0, player.state, ARENA_RADIUS);

    expect(Math.hypot(boss.state.x - initialX, boss.state.y - initialY)).toBeGreaterThan(0.1);
    expect(Math.hypot(
      boss.state.x - ARENA_CENTER.x,
      boss.state.y - ARENA_CENTER.y
    )).toBeCloseTo(180, 5);
  });

  it('commits Warden charge even when the player is already on its route', () => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
    const boss = new BossSystem(enemies, {
      ...ORBITAL_WARDEN_DEFINITION,
      startSeconds: 0,
      introSeconds: 0.02,
      chargeTelegraphSeconds: 0.2,
      chargeActiveSeconds: 0.4,
      recoverySeconds: 0.2,
      patternOrder: ['charge']
    });
    const player = new PlayerModel();
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    for (let index = 0; index < 30 && boss.state.phase !== 'charge-telegraph'; index += 1) {
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }

    expect(boss.state.phase).toBe('charge-telegraph');
    const aimX = boss.state.chargeAimX;
    const aimY = boss.state.chargeAimY;
    for (let index = 0; index < 30 && boss.state.phase === 'charge-telegraph'; index += 1) {
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }

    expect(boss.state.phase).toBe('charge-active');
    expect(boss.state.chargeAimX).toBeCloseTo(aimX, 8);
    expect(boss.state.chargeAimY).toBeCloseTo(aimY, 8);
    const beforeX = boss.state.x;
    const beforeY = boss.state.y;
    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    expect(Math.hypot(boss.state.x - beforeX, boss.state.y - beforeY)).toBeGreaterThan(0.1);
  });

  it('reuses Charger, Orbiter and Splitter verbs as readable Warden patterns', () => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
    const boss = new BossSystem(enemies, {
      ...ORBITAL_WARDEN_DEFINITION,
      startSeconds: 0,
      introSeconds: 0.02,
      sweepTelegraphSeconds: 0.02,
      sweepActiveSeconds: 0.02,
      chargeTelegraphSeconds: 0.02,
      chargeActiveSeconds: 0.12,
      curveTelegraphSeconds: 0.02,
      curveActiveSeconds: 0.12,
      replicasTelegraphSeconds: 0.02,
      replicasActiveSeconds: 0.04,
      ringTelegraphSeconds: 0.02,
      ringActiveSeconds: 0.02,
      recoverySeconds: 0.02,
      patternOrder: ['charge', 'curve', 'replicas']
    });
    const player = new PlayerModel();
    const phases = new Set<string>();
    let chargeMoved = false;
    let curveMoved = false;
    let replicasSpawned = false;

    boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    for (let index = 0; index < 240; index += 1) {
      const phase = boss.state.phase;
      const beforeX = boss.state.x;
      const beforeY = boss.state.y;
      phases.add(phase);
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);

      if (phase === 'charge-active' && Math.hypot(boss.state.x - beforeX, boss.state.y - beforeY) > 0.01) {
        chargeMoved = true;
      }
      if (phase === 'curve-active' && Math.hypot(boss.state.x - beforeX, boss.state.y - beforeY) > 0.01) {
        curveMoved = true;
      }
      if (phase === 'replicas-active') {
        const activeReplicas = enemies.states.filter(
          (enemy) => enemy.active && enemy.kind === 'warden-replica'
        );
        replicasSpawned ||= activeReplicas.length >= 2;
      }
    }

    expect(phases.has('charge-telegraph')).toBe(true);
    expect(phases.has('charge-active')).toBe(true);
    expect(phases.has('curve-telegraph')).toBe(true);
    expect(phases.has('curve-active')).toBe(true);
    expect(phases.has('replicas-telegraph')).toBe(true);
    expect(phases.has('replicas-active')).toBe(true);
    expect(chargeMoved).toBe(true);
    expect(curveMoved).toBe(true);
    expect(replicasSpawned).toBe(true);
  });

  it('keeps Warden replica spawn points inside the visual-safe arena radius', () => {
    const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(1280, 720));
    const boss = new BossSystem(enemies, {
      ...ORBITAL_WARDEN_DEFINITION,
      startSeconds: 0,
      introSeconds: 0.02,
      replicasTelegraphSeconds: 0.2,
      replicasActiveSeconds: 0.04,
      patternOrder: ['replicas']
    });
    const player = new PlayerModel();
    // Boss starts above the arena center; aim further upward to exercise the
    // edge clamp instead of relying on the default player position.
    player.state.x = ARENA_CENTER.x;
    player.state.y = 0;
    for (let index = 0; index < 30 && boss.state.phase !== 'replicas-telegraph'; index += 1) {
      boss.update(1 / 60, 0, player.state, ARENA_RADIUS);
    }

    expect(boss.state.phase).toBe('replicas-telegraph');
    for (const [x, y] of [
      [boss.state.replicaLeftX, boss.state.replicaLeftY],
      [boss.state.replicaRightX, boss.state.replicaRightY]
    ]) {
      expect(Math.hypot(x - ARENA_CENTER.x, y - ARENA_CENTER.y)).toBeLessThanOrEqual(ARENA_RADIUS - 30 + 0.000001);
    }
  });
});
