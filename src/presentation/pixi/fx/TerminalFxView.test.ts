import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { TerminalFxView } from './TerminalFxView';

const renderer = { generateTexture: () => Texture.WHITE } as unknown as ConstructorParameters<typeof TerminalFxView>[0];

describe('TerminalFxView', () => {
  it('keeps the player closure and summary wash without duplicating enemy deaths', () => {
    const view = new TerminalFxView(renderer, 'medium');
    view.playPlayerDefeat(320, 240);
    expect(view.root.visible).toBe(true);
    for (let index = 0; index < 10; index += 1) view.update(0.1);
    expect(view.root.visible).toBe(true);
    for (let index = 0; index < 14; index += 1) view.update(0.1);
    expect(view.root.visible).toBe(true);
    for (let index = 0; index < 8; index += 1) view.update(0.1);
    expect(view.root.visible).toBe(false);
    view.playPlayerDefeat(640, 180);
    for (let index = 0; index < 100; index += 1) view.update(0);
    expect(view.root.visible).toBe(true);
    for (let index = 0; index < 32; index += 1) view.update(0.1);
    expect(view.root.visible).toBe(false);
  });
});
