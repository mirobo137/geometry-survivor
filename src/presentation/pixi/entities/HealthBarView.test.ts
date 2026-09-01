import { describe, expect, it } from 'vitest';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';
import { HealthBarView } from './HealthBarView';

const enemy = (kind: EnemyRenderState['kind'], active = true): EnemyRenderState => ({
  active,
  kind,
  x: 320,
  y: 240,
  vx: 0,
  vy: 0,
  radius: 18,
  health: 12,
  maxHealth: 24
});

describe('HealthBarView', () => {
  it('prioritizes tank and elite bars and limits recent common enemies', () => {
    const view = new HealthBarView(4, 'low');
    const enemies = [enemy('chaser'), enemy('tank'), enemy('elite'), enemy('fast')];
    view.noteDamage(0, 0);
    view.noteDamage(3, 0);
    view.render(enemies, 0);
    expect(view.activeBarCount).toBe(4);
    view.render(enemies, 1.01);
    expect(view.activeBarCount).toBe(2);
  });
});
