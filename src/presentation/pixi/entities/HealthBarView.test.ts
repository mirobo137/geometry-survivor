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
  it('shows the same recent-damage bar window for every ordinary enemy', () => {
    const view = new HealthBarView(4, 'low');
    const enemies = [enemy('chaser'), enemy('tank'), enemy('elite'), enemy('fast')];
    for (let index = 0; index < enemies.length; index += 1) view.noteDamage(index, 0);
    view.render(enemies, 0);
    expect(view.activeBarCount).toBe(4);
    view.render(enemies, 1.01);
    expect(view.activeBarCount).toBe(0);
  });

  it('does not show tank or elite bars before they are damaged', () => {
    const view = new HealthBarView(3, 'low');
    const enemies = [enemy('tank'), enemy('elite'), enemy('boss')];
    view.render(enemies, 0);
    expect(view.activeBarCount).toBe(0);

    view.noteDamage(0, 0);
    view.noteDamage(1, 0);
    view.render(enemies, 0.5);
    expect(view.activeBarCount).toBe(2);
  });
});
