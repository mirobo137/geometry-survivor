import { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { BossRenderState } from '../../simulation/combat/CombatRenderState';
import { BossView } from './BossView';

const createRingState = (safeGapAngle: number): BossRenderState => ({
  active: true,
  x: 640,
  y: 360,
  radius: 44,
  health: 100,
  maxHealth: 100,
  phase: 'ring-telegraph',
  progress: 0.5,
  sweepAngle: 0,
  ringRadius: 120,
  safeGapAngle,
  safeGapHalfAngle: 0.4
});

const getArcPathActions = (view: BossView): string[][] => {
  const attack = (view as unknown as { attack: Graphics }).attack;
  return attack.context.instructions
    .filter((instruction) => instruction.action === 'stroke')
    .map((instruction) => instruction.data.path.instructions)
    .filter((path) => path.some((instruction) => instruction.action === 'arc'))
    .map((path) => path.map((instruction) => instruction.action));
};

describe('BossView', () => {
  it('starts a ring gap arc as an independent path', () => {
    const view = new BossView();

    view.render(createRingState(Math.PI), 300);

    expect(getArcPathActions(view)).toEqual([['arc']]);
    view.root.destroy({ children: true });
  });

  it('starts both wrapped ring gap segments as independent paths', () => {
    const view = new BossView();

    view.render(createRingState(0), 300);

    expect(getArcPathActions(view)).toEqual([['arc'], ['arc']]);
    view.root.destroy({ children: true });
  });
});
