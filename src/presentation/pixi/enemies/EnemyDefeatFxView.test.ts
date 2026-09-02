import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { EnemyShipTextureMap } from './EnemyShipVisual';
import { EnemyDefeatFxView } from './EnemyDefeatFxView';

const textures: EnemyShipTextureMap = {
  chaser: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  fast: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  tank: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE },
  elite: { rear: Texture.WHITE, wings: Texture.WHITE, hull: Texture.WHITE, cockpit: Texture.WHITE }
};

describe('EnemyDefeatFxView', () => {
  it('reuses pooled pieces for every ship family and expires them', () => {
    const view = new EnemyDefeatFxView(textures, 'medium');
    view.play(320, 240, 'tank');
    expect(view.activeCount).toBe(1);
    view.update(0.1);
    expect(view.activeCount).toBe(1);
    view.play(400, 260, 'elite');
    expect(view.activeCount).toBe(2);
    for (let index = 0; index < 5; index += 1) view.update(0.1);
    expect(view.activeCount).toBe(0);
  });

  it('keeps Low quality free of modular defeat sprites', () => {
    const view = new EnemyDefeatFxView(textures, 'low');
    view.play(320, 240, 'chaser');
    expect(view.activeCount).toBe(0);
    expect(view.root.visible).toBe(false);
  });
});
