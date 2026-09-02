import { describe, expect, it } from 'vitest';
import { Graphics } from 'pixi.js';
import { BackgroundView } from './BackgroundView';

const getArt = (view: BackgroundView): Graphics => view.root.children[0] as Graphics;

describe('BackgroundView', () => {
  it('draws a selected theme once and rebuilds only after a viewport change', () => {
    const view = new BackgroundView('ion-storm', 'low');
    expect(view.backgroundId).toBe('ion-storm');
    expect(view.root.children).toHaveLength(1);
    const firstInstructionCount = getArt(view).context.instructions.length;

    view.setBackground('ion-storm');
    expect(getArt(view).context.instructions.length).toBe(firstInstructionCount);
    view.resize(720, 1280);
    expect(getArt(view).context.instructions.length).toBeGreaterThan(0);
  });

  it('keeps a low quality background bounded to its smaller star budget', () => {
    const view = new BackgroundView('deep-space', 'low');
    expect(getArt(view).context.instructions.length).toBeLessThanOrEqual(30);
  });
});
