import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { TerminalFxView } from './TerminalFxView';

const renderer = { generateTexture: () => Texture.WHITE } as unknown as ConstructorParameters<typeof TerminalFxView>[0];

describe('TerminalFxView', () => {
  it('plays bounded player and boss closures without owning terminal state', () => {
    const view = new TerminalFxView(renderer, 'medium');
    view.playPlayerDefeat(320, 240);
    expect(view.root.visible).toBe(true);
    view.update(0.1);
    view.playBossDefeat(640, 180, 48);
    for (let index = 0; index < 10; index += 1) view.update(0.1);
    expect(view.root.visible).toBe(false);
  });
});
