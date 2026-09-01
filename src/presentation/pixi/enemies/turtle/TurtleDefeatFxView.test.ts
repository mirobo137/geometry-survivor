import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { TurtleDefeatFxView } from './TurtleDefeatFxView';

describe('TurtleDefeatFxView', () => {
  it('reuses cached turtle pieces for a bounded presentation-only disassembly', () => {
    const view = new TurtleDefeatFxView({
      shell: Texture.EMPTY,
      limbsFront: Texture.EMPTY,
      limbsRear: Texture.EMPTY,
      head: Texture.EMPTY
    }, 'medium');

    view.play(320, 480);
    expect(view.activeCount).toBe(1);
    const slot = view.root.children[0] as unknown as { children: Array<{ x: number; y: number }> };
    expect(slot.children).toHaveLength(4);

    view.update(0.1);
    expect(slot.children.some((part) => Math.abs(part.x) > 1 || Math.abs(part.y) > 1)).toBe(true);
    expect(view.activeCount).toBe(1);

    view.update(0.1);
    view.update(0.1);
    view.update(0.1);
    expect(view.activeCount).toBe(0);
    view.clear();
    expect(view.root.visible).toBe(false);
  });

  it('keeps the low preset free of modular defeat copies', () => {
    const view = new TurtleDefeatFxView({
      shell: Texture.EMPTY,
      limbsFront: Texture.EMPTY,
      limbsRear: Texture.EMPTY,
      head: Texture.EMPTY
    }, 'low');
    view.play(10, 10);
    expect(view.activeCount).toBe(0);
  });
});
