import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS } from '../../config/constants';
import { FRACTURE_ENGINE_DEFINITION } from '../../content/bosses/BossDefinition';
import { PlayerModel } from '../PlayerModel';
import { EnemyPool } from '../combat/EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { EnemySystem } from '../enemies/EnemySystem';
import { FractureThreatSystem } from '../fracture/FractureThreatSystem';
import { BossSystem } from './BossSystem';

describe('Fracture Engine boss patterns', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    it(`retains the zigzag endpoint across recovery and the next warning at dt=${dt}`, () => {
      const boss = new BossSystem(
        new EnemySystem(new EnemyPool(16), new SpatialGrid(1280, 720)),
        { ...FRACTURE_ENGINE_DEFINITION, startSeconds: 0, introSeconds: 0.01,
          patternOrder: ['zigzag'], curveTelegraphSeconds: 0.2,
          curveActiveSeconds: 0.4, recoverySeconds: 0.3 }
      );
      const player = new PlayerModel();
      let transitions = 0;
      let recoveryFrames = 0;
      for (let frame = 0; frame < 240; frame += 1) {
        const previousPhase = boss.state.phase;
        const x = boss.state.x, y = boss.state.y;
        const endX = boss.state.chargeAimX, endY = boss.state.chargeAimY;
        boss.update(dt, frame * dt, player.state, ARENA_RADIUS);
        if (previousPhase === 'zigzag-active' && boss.state.phase === 'recovery') {
          expect(Math.hypot(boss.state.x - endX, boss.state.y - endY)).toBeLessThan(3);
          transitions += 1;
        }
        if (previousPhase === 'recovery') {
          expect(Math.hypot(boss.state.x - x, boss.state.y - y)).toBeLessThan(3);
          recoveryFrames += 1;
        }
      }
      expect(transitions).toBeGreaterThanOrEqual(2);
      expect(recoveryFrames).toBeGreaterThan(0);
    });
  }
  it('fires its battery and reaches the authored mine phase instead of falling back to replicas', () => {
    const definition = {
      ...FRACTURE_ENGINE_DEFINITION,
      startSeconds: 0,
      introSeconds: 0.01,
      sweepTelegraphSeconds: 0.05,
      sweepActiveSeconds: 0.05,
      chargeTelegraphSeconds: 0.05,
      chargeActiveSeconds: 0.05,
      curveTelegraphSeconds: 0.05,
      curveActiveSeconds: 0.05,
      replicasTelegraphSeconds: 0.05,
      replicasActiveSeconds: 0.05,
      recoverySeconds: 0.01
    };
    const threats = new FractureThreatSystem();
    const boss = new BossSystem(
      new EnemySystem(new EnemyPool(16), new SpatialGrid(1280, 720)),
      definition,
      threats
    );
    const player = new PlayerModel();
    let elapsed = 0;
    let sawBattery = false;
    for (let index = 0; index < 80; index += 1) {
      boss.update(1 / 60, elapsed, player.state, ARENA_RADIUS);
      elapsed += 1 / 60;
      sawBattery ||= boss.state.phase === 'battery-active';
      if (boss.state.phase === 'mines-active') break;
    }

    expect(sawBattery).toBe(true);
    expect(boss.state.phase).toBe('mines-active');
    expect(threats.projectiles.some((projectile) => projectile.active)).toBe(true);
    expect(threats.mines.filter((mine) => mine.active)).toHaveLength(4);
  });
});
