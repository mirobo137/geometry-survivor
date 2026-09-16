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
