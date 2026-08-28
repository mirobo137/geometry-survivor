import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';

export interface TurtleTextureSet {
  readonly shell: Texture;
  readonly limbsFront: Texture;
  readonly limbsRear: Texture;
  readonly head: Texture;
}

/**
 * Composes aligned SVG parts once and animates only transforms. The root is
 * oriented with its head on -Y, so a velocity vector can rotate the turtle
 * without changing its source geometry.
 */
export class TurtleVisual {
  public readonly root = new Container();
  private readonly shell: Sprite;
  private readonly limbsFront: Sprite;
  private readonly limbsRear: Sprite;
  private readonly head: Sprite;
  // SVG front is the negative Y axis; rotation 0 is therefore the neutral
  // top-down pose until the first meaningful velocity sample arrives.
  private facing = 0;

  public constructor(textures: TurtleTextureSet) {
    this.limbsRear = new Sprite(textures.limbsRear);
    this.shell = new Sprite(textures.shell);
    this.limbsFront = new Sprite(textures.limbsFront);
    this.head = new Sprite(textures.head);
    for (const part of [this.limbsRear, this.shell, this.limbsFront, this.head]) part.anchor.set(0.5);
    // Both leg groups sit behind the shell; only the directional head remains
    // in front so the layered composition matches the SVG master.
    this.root.addChild(this.limbsRear, this.limbsFront, this.shell, this.head);
  }

  public render(state: EnemyRenderState, animationSeconds: number): void {
    this.root.visible = state.active;
    if (!state.active) return;
    this.root.position.set(state.x, state.y);
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > 0.5) this.facing = Math.atan2(state.vy, state.vx) + Math.PI / 2;
    this.root.rotation = this.facing;
    this.root.alpha = Math.max(0.55, state.health / state.maxHealth);

    const stride = Math.min(1, speed / 90);
    const phase = animationSeconds * (5 + Math.min(90, speed) * 0.025);
    const swing = Math.sin(phase) * 0.13 * stride;
    this.limbsFront.rotation = swing;
    this.limbsRear.rotation = -swing;
    this.head.position.y = Math.sin(phase * 2) * 0.7 * stride;
    this.head.rotation = Math.sin(phase * 2) * 0.035 * stride;
    const breathing = 1 + Math.sin(phase * 2) * 0.008 * stride;
    this.shell.scale.set(breathing, 1 - (breathing - 1) * 0.35);
  }
}
