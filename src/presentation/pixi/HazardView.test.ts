import { describe, expect, it } from 'vitest';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';
import { HazardView } from './HazardView';

const createState = (overrides: Partial<LaserHazardState> = {}): LaserHazardState => ({
  phase: 'telegraph',
  angle: 0.2,
  progress: 0.5,
  width: 22,
  sweepProgress: 0,
  sweeping: false,
  ...overrides
});

describe('HazardView', () => {
  it('keeps telegraph, beam, pulse and endpoint layers visible without a flat single stroke', () => {
    const view = new HazardView();
    const telegraph = view.root.children[1];

    view.renderLaser(createState(), 300);

    expect(view.root.children).toHaveLength(4);
    expect(view.root.children[0].visible).toBe(false);
    expect(view.root.children.slice(1).every((child) => child.visible)).toBe(true);
    expect(telegraph).toBe(view.root.children[1]);
    expect((telegraph as unknown as { context: { instructions: Array<{ action: string }> } }).context.instructions
      .filter((instruction) => instruction.action === 'stroke')).toHaveLength(3);
  });

  it('adds sweep echoes only while an active beam is moving and clears all layers at idle', () => {
    const view = new HazardView();
    const echo = view.root.children[0];

    view.renderLaser(createState({ phase: 'active', progress: 0.4, sweepProgress: 0.35, sweeping: true }), 300);

    expect(echo.visible).toBe(true);
    expect((echo as unknown as { context: { instructions: Array<{ action: string }> } }).context.instructions
      .filter((instruction) => instruction.action === 'stroke')).toHaveLength(2);

    view.renderLaser(createState({ phase: 'active', progress: 0.9, sweepProgress: 1, sweeping: false }), 300);
    expect(echo.visible).toBe(false);

    view.renderLaser(createState({ phase: 'idle', progress: 0 }), 300);
    expect(view.root.children.every((child) => !child.visible)).toBe(true);
    view.root.destroy({ children: true });
  });
});
