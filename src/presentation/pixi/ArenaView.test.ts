import { describe, expect, it } from 'vitest';
import { ArenaModel } from '../../simulation/ArenaModel';
import { ArenaView } from './ArenaView';

describe('ArenaView', () => {
  it('shows a geometric target during the Act I telegraph and hides it when stable', () => {
    const model = new ArenaModel();
    const view = new ArenaView();
    const shapeSignal = view.root.children[1];

    model.update(132);
    view.render(model.state);
    expect(shapeSignal.visible).toBe(true);

    model.update(2.25);
    view.render(model.state);
    expect(shapeSignal.visible).toBe(false);

    view.reset();
    view.root.destroy({ children: true });
  });
});
