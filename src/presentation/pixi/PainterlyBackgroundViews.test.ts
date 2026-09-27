import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createPainterlyBackgroundViews, type PainterlyBackgroundId } from './PainterlyBackgroundViews';

const IDS: readonly PainterlyBackgroundId[] = ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field'];

describe('painterly legacy background plates', () => {
  it('loads only the selected plate and lays it out with a uniform cover crop', async () => {
    const calls: PainterlyBackgroundId[] = [];
    const views = createPainterlyBackgroundViews(Object.fromEntries(IDS.map(id => [id, async () => {
      calls.push(id);
      return Texture.WHITE;
    }])) as Partial<Record<PainterlyBackgroundId, () => Promise<Texture>>>);

    for (const view of Object.values(views)) view.render(false, 1280, 720);
    expect(calls).toEqual([]);

    views['ion-storm'].render(true, 720, 1280);
    await Promise.resolve();
    expect(calls).toEqual(['ion-storm']);
    expect(views['ion-storm'].root.visible).toBe(true);
    expect(views['ion-storm'].root.width).toBeCloseTo(1280 * 1.025);
    expect(views['ion-storm'].root.height).toBeCloseTo(1280 * 1.025);

    views['ion-storm'].render(false, 720, 1280);
    views['ion-storm'].render(true, 1280, 720);
    expect(calls).toEqual(['ion-storm']);
    for (const id of IDS.filter(candidate => candidate !== 'ion-storm')) views[id].root.destroy();
    views['ion-storm'].root.destroy();
  });
});
