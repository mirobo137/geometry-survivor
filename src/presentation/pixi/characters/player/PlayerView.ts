import { Container, Graphics } from 'pixi.js';
import type { PlayerState } from '../../../../simulation/PlayerModel';

export class PlayerView {
  public readonly root = new Container();
  private readonly player = new Graphics();

  public constructor() {
    this.root.addChild(this.player);
    this.player.circle(0, 0, 22).fill({ color: 0x75e6ff }).stroke({ color: 0xf4ffff, width: 3 });
    this.player.circle(0, 0, 7).fill({ color: 0x10213d });
  }

  public render(state: PlayerState): void {
    this.player.position.set(state.x, state.y);
  }
}
