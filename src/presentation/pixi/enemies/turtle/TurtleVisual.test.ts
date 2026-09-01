import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { EnemyRenderState } from '../../../../simulation/combat/CombatRenderState';
import { TurtleVisual } from './TurtleVisual';

const createState = (vx: number, vy: number): EnemyRenderState => ({
  active: true,
  kind: 'chaser',
  x: 120,
  y: 80,
  vx,
  vy,
  radius: 18,
  health: 24,
  maxHealth: 24
});

describe('TurtleVisual', () => {
  it('faces its movement vector and animates paired parts without rebuilding SVG', () => {
    const visual = new TurtleVisual({
      shell: Texture.EMPTY,
      limbsFront: Texture.EMPTY,
      limbsRear: Texture.EMPTY,
      head: Texture.EMPTY
    });

    visual.render(createState(0, 0), 0);
    expect(visual.root.rotation).toBeCloseTo(0);

    visual.render(createState(90, 0), 0.4);
    expect(visual.root.rotation).toBeCloseTo(Math.PI / 2);
    const [rear, front, shell, head] = visual.root.children as unknown as [
      { rotation: number },
      { rotation: number },
      { scale: { x: number; y: number } },
      { position: { y: number }; rotation: number }
    ];
    expect(front.rotation).toBeGreaterThan(0);
    expect(rear.rotation).toBeLessThan(0);
    expect(head.position.y).not.toBe(0);
    expect(head.rotation).not.toBe(0);
    expect(shell.scale.x).not.toBe(1);

    visual.render(createState(0, -90), 0.6);
    expect(visual.root.rotation).toBeCloseTo(0);
    visual.render(createState(0, 90), 0.7);
    expect(visual.root.rotation).toBeCloseTo(Math.PI);

    visual.render(createState(0, 0), 0.8);
    expect(visual.root.rotation).toBeCloseTo(Math.PI);
  });

  it('can keep its parts local when a combat parent owns the world transform', () => {
    const visual = new TurtleVisual({
      shell: Texture.EMPTY,
      limbsFront: Texture.EMPTY,
      limbsRear: Texture.EMPTY,
      head: Texture.EMPTY
    });

    visual.render(createState(90, 0), 0.4, 'local');
    expect(visual.root.position.x).toBe(0);
    expect(visual.root.position.y).toBe(0);
    expect(visual.root.rotation).toBeCloseTo(Math.PI / 2);
  });
});
