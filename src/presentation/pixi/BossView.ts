import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { BossRenderState } from '../../simulation/combat/CombatRenderState';

const FULL_CIRCLE = Math.PI * 2;
const HEALTH_BAR_WIDTH = 120;
const HEALTH_BAR_HEIGHT = 7;

/** Renders boss identity, telegraphs and health without owning any gameplay rule. */
export class BossView {
  public readonly root = new Container();
  private readonly attack = new Graphics();
  private readonly health = new Graphics();
  private readonly label: Text;

  public constructor() {
    this.label = new Text({
      text: 'BOSS',
      style: new TextStyle({
        fill: 0xffe8ff,
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 2
      })
    });
    this.label.anchor.set(0.5, 1);
    this.root.addChild(this.attack, this.health, this.label);
    this.root.visible = false;
  }

  public render(state: BossRenderState, arenaRadius: number): void {
    if (!state.active) {
      if (this.root.visible) {
        this.root.visible = false;
        this.attack.clear();
        this.health.clear();
      }
      return;
    }

    this.root.visible = true;
    this.attack.clear();
    this.health.clear();
    this.label.position.set(state.x, state.y - state.radius - 28);
    this.label.alpha = state.phase === 'intro' ? 0.45 + state.progress * 0.55 : 1;
    this.renderHealth(state);

    if (state.phase === 'sweep-telegraph' || state.phase === 'sweep-active') {
      this.renderSweep(state, arenaRadius);
    } else if (state.phase === 'ring-telegraph' || state.phase === 'ring-active') {
      this.renderRing(state);
    }
  }

  private renderHealth(state: BossRenderState): void {
    const left = state.x - HEALTH_BAR_WIDTH * 0.5;
    const top = state.y - state.radius - 17;
    const ratio = state.maxHealth > 0 ? Math.max(0, Math.min(1, state.health / state.maxHealth)) : 0;
    this.health
      .rect(left, top, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT)
      .fill({ color: 0x24142e, alpha: 0.95 })
      .rect(left, top, HEALTH_BAR_WIDTH * ratio, HEALTH_BAR_HEIGHT)
      .fill({ color: 0xff6cf2, alpha: 0.95 })
      .rect(left, top, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT)
      .stroke({ color: 0xffe8ff, width: 1, alpha: 0.8 });
  }

  private renderSweep(state: BossRenderState, arenaRadius: number): void {
    const directionX = Math.cos(state.sweepAngle);
    const directionY = Math.sin(state.sweepAngle);
    const startX = ARENA_CENTER.x - directionX * (arenaRadius + 22);
    const startY = ARENA_CENTER.y - directionY * (arenaRadius + 22);
    const endX = ARENA_CENTER.x + directionX * (arenaRadius + 22);
    const endY = ARENA_CENTER.y + directionY * (arenaRadius + 22);
    const active = state.phase === 'sweep-active';
    this.attack
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({
        color: active ? 0xff5f6d : 0xffd166,
        width: active ? 14 : 5,
        alpha: active ? 0.3 : 0.45 + state.progress * 0.35
      })
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({
        color: active ? 0xfff1a8 : 0xfff7cf7a,
        width: active ? 4 : 2,
        alpha: active ? 0.95 : 0.85
      });
  }

  private renderRing(state: BossRenderState): void {
    const active = state.phase === 'ring-active';
    const ringColor = active ? 0xff5f6d : 0xffd166;
    this.attack
      .circle(ARENA_CENTER.x, ARENA_CENTER.y, state.ringRadius)
      .stroke({ color: ringColor, width: active ? 12 : 5, alpha: active ? 0.3 : 0.55 });
    const start = state.safeGapAngle - state.safeGapHalfAngle;
    const end = state.safeGapAngle + state.safeGapHalfAngle;
    this.strokeArc(start, end, state.ringRadius, active ? 0x75e6ff : 0xb8ffd9, active ? 9 : 6);
  }

  private strokeArc(start: number, end: number, radius: number, color: number, width: number): void {
    const normalizedStart = ((start % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
    const span = Math.max(0, end - start);
    const normalizedEnd = normalizedStart + span;
    if (normalizedEnd <= FULL_CIRCLE) {
      this.attack
        .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, normalizedStart, normalizedEnd)
        .stroke({ color, width, alpha: 0.95 });
      return;
    }
    this.attack
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, normalizedStart, FULL_CIRCLE)
      .stroke({ color, width, alpha: 0.95 })
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, 0, normalizedEnd - FULL_CIRCLE)
      .stroke({ color, width, alpha: 0.95 });
  }
}
