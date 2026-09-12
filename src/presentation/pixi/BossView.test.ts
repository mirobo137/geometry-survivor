import { Graphics } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { WardenAttackView } from './WardenAttackView';
import type { BossRenderState } from '../../simulation/combat/CombatRenderState';
import { BossView } from './BossView';

const createRingState = (safeGapAngle: number): BossRenderState => ({
  bossId: 'core-sentinel',
  active: true,
  x: 640,
  y: 360,
  radius: 44,
  health: 100,
  maxHealth: 100,
  phase: 'ring-telegraph',
  progress: 0.5,
  pattern: 'ring',
  sweepAngle: 0,
  ringRadius: 120,
  safeGapAngle,
  safeGapHalfAngle: 0.4,
  chargeStartX: 640,
  chargeStartY: 360,
  chargeAimX: 900,
  chargeAimY: 360,
  curveRadius: 140,
  curveStartAngle: 0,
  curveAngle: 0.5,
  curveTravelRadians: 1.72,
  curveDirection: 1,
  replicaSequence: 0,
  replicaLeftX: 600,
  replicaLeftY: 360,
  replicaRightX: 680,
  replicaRightY: 360
});

const getArcPathActions = (view: BossView): string[][] => {
  const safeGuide = (view as unknown as { safeGuide: Graphics }).safeGuide;
  return safeGuide.context.instructions
    .filter((instruction) => instruction.action === 'stroke')
    .map((instruction) => instruction.data.path.instructions)
    .filter((path) => path.some((instruction) => instruction.action === 'arc'))
    .map((path) => path.map((instruction) => instruction.action));
};


const createAttackState = (phase: BossRenderState['phase'], pattern: BossRenderState['pattern']): BossRenderState => ({
  ...createRingState(0.8),
  bossId: 'orbital-warden',
  phase,
  pattern,
  progress: 0.5,
  chargeStartX: 640,
  chargeStartY: 180,
  chargeAimX: 640,
  chargeAimY: 920,
  curveRadius: 160,
  curveStartAngle: -0.8,
  curveAngle: -0.2,
  curveTravelRadians: 1.72,
  curveDirection: -1,
  replicaSequence: 3,
  replicaLeftX: 590,
  replicaLeftY: 350,
  replicaRightX: 690,
  replicaRightY: 350
});

describe('BossView', () => {
  it('starts a ring gap arc as an independent path', () => {
    const view = new BossView();

    view.render(createRingState(Math.PI), 300);

    expect(getArcPathActions(view)).toEqual([['arc']]);
    expect((view as unknown as { safeGuide: Graphics }).safeGuide.visible).toBe(true);
    view.root.destroy({ children: true });
  });

  it('starts both wrapped ring gap segments as independent paths', () => {
    const view = new BossView();

    view.render(createRingState(0), 300);

    expect(getArcPathActions(view)).toEqual([['arc'], ['arc']]);
    expect((view as unknown as { safeGuide: Graphics }).safeGuide.visible).toBe(true);
    view.root.destroy({ children: true });
  });

  it('renders the Warden curve telegraph as an independent bounded arc', () => {
    const view = new WardenAttackView();
    view.render(createAttackState('curve-telegraph', 'curve'));
    const clear = vi.spyOn(Graphics.prototype,'clear');
    const poly = vi.spyOn(Graphics.prototype,'poly');
    view.render(createAttackState('curve-active', 'curve'));
    expect(clear).not.toHaveBeenCalled();
    expect(poly).not.toHaveBeenCalled();
    clear.mockRestore(); poly.mockRestore();
    expect(view.root.visible).toBe(true);
    view.root.destroy({ children: true });
  });

  it('renders the Warden charge and replica markers without hiding the boss', () => {
    const view = new WardenAttackView();
    view.render(createAttackState('charge-telegraph', 'charge'));
    expect(view.root.children.some(child=>child.visible)).toBe(true);
    view.render(createAttackState('replicas-telegraph', 'replicas'));
    expect(view.root.children.filter(child=>child.visible).length).toBeGreaterThan(2);
    expect(view.root.visible).toBe(true);
    view.root.destroy({ children: true });
  });
});
