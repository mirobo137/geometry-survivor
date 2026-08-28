import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { LevelUpFxView, LEVEL_UP_FX_COLORS } from './LevelUpFxView';

describe('LevelUpFxView', () => {
  it('keeps its effect state in presentation and reuses one particle texture', () => {
    let textureCalls = 0;
    const renderer = {
      generateTexture: () => {
        textureCalls += 1;
        return Texture.WHITE;
      }
    } as unknown as ConstructorParameters<typeof LevelUpFxView>[0];
    const view = new LevelUpFxView(renderer);

    expect(view.root.visible).toBe(false);
    expect(textureCalls).toBe(1);
    expect(Object.keys(LEVEL_UP_FX_COLORS)).toHaveLength(6);

    view.open([{ index: 0, x: 360, y: 640, width: 600, height: 190, tone: 'cyan' }]);
    view.handleInteraction('select', 0);
    view.update(0.08);
    expect(view.root.visible).toBe(true);

    view.close();
    expect(view.root.visible).toBe(false);
  });
});
