import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { BossRenderState } from '../../simulation/combat/CombatRenderState';
import { BOSS_VISUAL_COLORS } from './BossVisualTokens';
import { WardenAttackView } from './WardenAttackView';
import type { FxQuality } from '../../content/visual/VisualTokens';

const FULL_CIRCLE = Math.PI * 2;
const HEALTH_BAR_WIDTH = 120;
const HEALTH_BAR_HEIGHT = 7;
type Pattern = 'sweep' | 'ring' | 'charge' | 'curve' | 'replicas' | null;
type StrokeStyle = Readonly<{ color: number; width: number; alpha: number }>;

/**
 * Renders boss identity and telegraphs without owning damage or collision.
 * The boss attacks use the Solar Rail language, but keep their own geometry:
 * the sweep is a command rail, Charge is a directional commit, Curve is a
 * bounded orbit and Ring is a moving safe corridor.
 */
export class BossView {
  public readonly root = new Container();
  private readonly attack = new Graphics();
  private readonly detail = new Graphics();
  private readonly safeGuide = new Graphics();
  private readonly health = new Graphics();
  private readonly label: Text;
  private lastPattern: Pattern = null;
  private readonly warden: WardenAttackView;

  public constructor(quality: FxQuality = 'medium') {
    this.warden = new WardenAttackView(quality);
    this.label = new Text({
      text: 'BOSS',
      style: new TextStyle({
        fill: BOSS_VISUAL_COLORS.outline,
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 2
      })
    });
    this.label.anchor.set(0.5, 1);
    this.root.addChild(this.attack, this.detail, this.safeGuide, this.warden.root, this.health, this.label);
    this.root.visible = false;
  }

  public render(state: Readonly<BossRenderState>, arenaRadius: number): void {
    if (!state.active) {
      if (this.root.visible) this.clearVisuals();
      this.root.visible = false;
      return;
    }

    this.root.visible = true;
    this.attack.clear();
    this.detail.clear();
    this.safeGuide.clear();
    this.health.clear();
    this.safeGuide.visible = false;
    this.label.text = state.bossId === 'orbital-warden' ? 'ORBITAL WARDEN' : 'BOSS';
    this.label.position.set(state.x, state.y - state.radius - 28);
    this.label.alpha = state.phase === 'intro' ? 0.45 + state.progress * 0.55 : 1;
    this.renderHealth(state);
    this.warden.render(state);

    if (state.phase === 'sweep-telegraph' || state.phase === 'sweep-active') {
      this.lastPattern = 'sweep';
      this.renderSweep(state, arenaRadius, state.phase === 'sweep-active');
    } else if (state.phase === 'charge-telegraph' || state.phase === 'charge-active') {
      this.lastPattern = 'charge';
    } else if (state.phase === 'curve-telegraph' || state.phase === 'curve-active') {
      this.lastPattern = 'curve';
    } else if (state.phase === 'replicas-telegraph' || state.phase === 'replicas-active') {
      this.lastPattern = 'replicas';
    } else if (state.phase === 'ring-telegraph' || state.phase === 'ring-active') {
      this.lastPattern = 'ring';
      this.renderRing(state, state.phase === 'ring-active');
    } else if (state.phase === 'recovery') {
      if (this.lastPattern === 'sweep') this.renderSweepRecovery(state, arenaRadius);
      if (this.lastPattern === 'ring') this.renderRingRecovery(state);
    }
  }

  private clearVisuals(): void {
    this.attack.clear();
    this.detail.clear();
    this.safeGuide.clear();
    this.health.clear();
    this.safeGuide.visible = false;
    this.lastPattern = null;
  }

  private renderHealth(state: Readonly<BossRenderState>): void {
    const left = state.x - HEALTH_BAR_WIDTH * 0.5;
    const top = state.y - state.radius - 17;
    const ratio = state.maxHealth > 0 ? Math.max(0, Math.min(1, state.health / state.maxHealth)) : 0;
    this.health
      .beginPath()
      .rect(left, top, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT)
      .fill({ color: BOSS_VISUAL_COLORS.healthTrack, alpha: 0.95 })
      .beginPath()
      .rect(left, top, HEALTH_BAR_WIDTH * ratio, HEALTH_BAR_HEIGHT)
      .fill({ color: BOSS_VISUAL_COLORS.boss, alpha: 0.95 })
      .beginPath()
      .rect(left, top, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT)
      .stroke({ color: BOSS_VISUAL_COLORS.outline, width: 1, alpha: 0.8 });
  }

  private renderSweep(state: Readonly<BossRenderState>, arenaRadius: number, active: boolean): void {
    const length = arenaRadius + 22;
    const startX = ARENA_CENTER.x - Math.cos(state.sweepAngle) * length;
    const startY = ARENA_CENTER.y - Math.sin(state.sweepAngle) * length;
    const endX = ARENA_CENTER.x + Math.cos(state.sweepAngle) * length;
    const endY = ARENA_CENTER.y + Math.sin(state.sweepAngle) * length;

    if (active) {
      this.drawLine(this.attack, startX, startY, endX, endY, {
        color: BOSS_VISUAL_COLORS.danger,
        width: 18,
        alpha: 0.28
      });
      this.drawLine(this.detail, startX, startY, endX, endY, {
        color: BOSS_VISUAL_COLORS.activeCore,
        width: 7,
        alpha: 0.96
      });
      this.drawLine(this.detail, startX, startY, endX, endY, {
        color: BOSS_VISUAL_COLORS.outline,
        width: 2,
        alpha: 0.95
      });
      this.drawRailEmitter(this.detail, startX, startY, state.sweepAngle, 1);
      this.drawRailEmitter(this.detail, endX, endY, state.sweepAngle, -1);
      if (state.progress < 0.22) {
        this.drawLine(this.detail, startX, startY, endX, endY, {
          color: BOSS_VISUAL_COLORS.outline,
          width: 25,
          alpha: Math.max(0, 1 - state.progress / 0.22) * 0.3
        });
      }
      return;
    }

    const directionX = Math.cos(state.sweepAngle);
    const directionY = Math.sin(state.sweepAngle);
    for (let index = 0; index < 16; index += 1) {
      const from = -1 + index * 0.125;
      const to = from + 0.06;
      this.drawLine(
        this.attack,
        ARENA_CENTER.x + directionX * length * from,
        ARENA_CENTER.y + directionY * length * from,
        ARENA_CENTER.x + directionX * length * to,
        ARENA_CENTER.y + directionY * length * to,
        { color: BOSS_VISUAL_COLORS.warning, width: 3, alpha: 0.5 + state.progress * 0.35 }
      );
    }
    this.drawLine(this.detail, startX, startY, endX, endY, {
      color: BOSS_VISUAL_COLORS.warningCore,
      width: 1.5,
      alpha: 0.8
    });
    this.drawRailEmitter(this.detail, startX, startY, state.sweepAngle, 1);
    this.drawRailEmitter(this.detail, endX, endY, state.sweepAngle, -1);
  }

  private renderSweepRecovery(state: Readonly<BossRenderState>, arenaRadius: number): void {
    const length = arenaRadius + 22;
    const directionX = Math.cos(state.sweepAngle);
    const directionY = Math.sin(state.sweepAngle);
    const fade = (1 - state.progress) * 0.28;
    for (let index = 0; index < 7; index += 1) {
      const from = -0.9 + index * 0.28;
      const to = from + 0.1;
      this.drawLine(
        this.detail,
        ARENA_CENTER.x + directionX * length * from,
        ARENA_CENTER.y + directionY * length * from,
        ARENA_CENTER.x + directionX * length * to,
        ARENA_CENTER.y + directionY * length * to,
        { color: BOSS_VISUAL_COLORS.activeCore, width: 3, alpha: fade }
      );
    }
  }


  private renderRing(state: Readonly<BossRenderState>, active: boolean): void {
    const start = state.safeGapAngle - state.safeGapHalfAngle;
    const end = state.safeGapAngle + state.safeGapHalfAngle;
    const dangerStyle: StrokeStyle = active
      ? { color: BOSS_VISUAL_COLORS.danger, width: 18, alpha: 0.28 }
      : { color: BOSS_VISUAL_COLORS.warning, width: 7, alpha: 0.58 };
    const coreStyle: StrokeStyle = active
      ? { color: BOSS_VISUAL_COLORS.activeCore, width: 6, alpha: 0.96 }
      : { color: BOSS_VISUAL_COLORS.warningCore, width: 2, alpha: 0.9 };

    // The dangerous band is interrupted physically at the safe gap.
    this.strokeArcExcept(this.attack, start, end, state.ringRadius, dangerStyle);
    this.strokeArcExcept(this.detail, start, end, state.ringRadius, coreStyle);
    this.renderSafeCorridor(state, start, end, active);
  }

  private renderRingRecovery(state: Readonly<BossRenderState>): void {
    const start = state.safeGapAngle - state.safeGapHalfAngle;
    const end = state.safeGapAngle + state.safeGapHalfAngle;
    this.strokeDashedArcExcept(
      this.detail,
      start,
      end,
      state.ringRadius,
      { color: BOSS_VISUAL_COLORS.activeCore, width: 3, alpha: (1 - state.progress) * 0.32 }
    );
    this.renderSafeCorridor(state, start, end, false);
  }

  private renderSafeCorridor(
    state: Readonly<BossRenderState>,
    start: number,
    end: number,
    active: boolean
  ): void {
    const outer = state.ringRadius + 18;
    const alpha = active ? 0.075 : 0.04;
    this.safeGuide.visible = true;
    this.safeGuide
      .beginPath()
      .moveTo(ARENA_CENTER.x, ARENA_CENTER.y)
      .lineTo(ARENA_CENTER.x + Math.cos(start) * outer, ARENA_CENTER.y + Math.sin(start) * outer)
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, outer, start, end)
      .lineTo(ARENA_CENTER.x, ARENA_CENTER.y)
      .fill({ color: BOSS_VISUAL_COLORS.safe, alpha });
    this.strokeArc(this.safeGuide, start, end, state.ringRadius, {
      color: active ? BOSS_VISUAL_COLORS.safe : BOSS_VISUAL_COLORS.safeTelegraph,
      width: active ? 7 : 4,
      alpha: active ? 0.92 : 0.72
    });
    this.drawGapBracket(this.safeGuide, start, state.ringRadius, active);
    this.drawGapBracket(this.safeGuide, end, state.ringRadius, active);
    for (let index = 1; index <= 3; index += 1) {
      const angle = start + (end - start) * (index / 4);
      this.drawRadialTick(this.safeGuide, angle, state.ringRadius, active);
    }
  }

  private strokeArcExcept(graphics: Graphics, safeStart: number, safeEnd: number, radius: number, style: StrokeStyle): void {
    const normalizedStart = normalizeAngle(safeStart);
    const normalizedEnd = normalizedStart + Math.max(0, safeEnd - safeStart);
    this.strokeArcSegment(graphics, normalizedEnd, normalizedStart + FULL_CIRCLE, radius, style);
  }

  private strokeDashedArcExcept(
    graphics: Graphics,
    safeStart: number,
    safeEnd: number,
    radius: number,
    style: StrokeStyle
  ): void {
    const start = normalizeAngle(safeEnd);
    const span = FULL_CIRCLE - Math.max(0, safeEnd - safeStart);
    for (let index = 0; index < 12; index += 1) {
      const from = start + span * (index / 12);
      const to = from + span * 0.55 / 12;
      this.strokeArcSegment(graphics, from, to, radius, style);
    }
  }

  private strokeArc(graphics: Graphics, start: number, end: number, radius: number, style: StrokeStyle): void {
    const normalizedStart = normalizeAngle(start);
    const span = Math.max(0, end - start);
    const normalizedEnd = normalizedStart + span;
    if (normalizedEnd <= FULL_CIRCLE) {
      this.strokeArcSegment(graphics, normalizedStart, normalizedEnd, radius, style);
      return;
    }
    this.strokeArcSegment(graphics, normalizedStart, FULL_CIRCLE, radius, style);
    this.strokeArcSegment(graphics, 0, normalizedEnd - FULL_CIRCLE, radius, style);
  }

  private strokeArcSegment(graphics: Graphics, start: number, end: number, radius: number, style: StrokeStyle): void {
    if (end <= start) return;
    graphics
      .beginPath()
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, start, end)
      .stroke(style);
  }

  private drawLine(graphics: Graphics, x1: number, y1: number, x2: number, y2: number, style: StrokeStyle): void {
    graphics.beginPath().moveTo(x1, y1).lineTo(x2, y2).stroke(style);
  }

  private drawRailEmitter(graphics: Graphics, x: number, y: number, angle: number, sign: 1 | -1): void {
    const tangentX = -Math.sin(angle) * sign;
    const tangentY = Math.cos(angle) * sign;
    const forwardX = Math.cos(angle) * sign;
    const forwardY = Math.sin(angle) * sign;
    graphics
      .beginPath()
      .moveTo(x + forwardX * 9, y + forwardY * 9)
      .lineTo(x + tangentX * 8, y + tangentY * 8)
      .lineTo(x - forwardX * 4, y - forwardY * 4)
      .lineTo(x - tangentX * 8, y - tangentY * 8)
      .closePath()
      .fill({ color: BOSS_VISUAL_COLORS.healthTrack, alpha: 0.96 })
      .stroke({ color: BOSS_VISUAL_COLORS.outline, width: 1, alpha: 0.85 });
    this.drawLine(graphics, x - tangentX * 5, y - tangentY * 5, x + tangentX * 5, y + tangentY * 5, {
      color: BOSS_VISUAL_COLORS.activeCore,
      width: 1.5,
      alpha: 0.85
    });
  }

  private drawGapBracket(graphics: Graphics, angle: number, radius: number, active: boolean): void {
    const inner = radius - 15;
    const outer = radius + 15;
    this.drawLine(
      graphics,
      ARENA_CENTER.x + Math.cos(angle) * inner,
      ARENA_CENTER.y + Math.sin(angle) * inner,
      ARENA_CENTER.x + Math.cos(angle) * outer,
      ARENA_CENTER.y + Math.sin(angle) * outer,
      { color: active ? BOSS_VISUAL_COLORS.safe : BOSS_VISUAL_COLORS.safeTelegraph, width: 2, alpha: 0.9 }
    );
  }

  private drawRadialTick(graphics: Graphics, angle: number, radius: number, active: boolean): void {
    const inner = radius - 7;
    const outer = radius + 7;
    this.drawLine(
      graphics,
      ARENA_CENTER.x + Math.cos(angle) * inner,
      ARENA_CENTER.y + Math.sin(angle) * inner,
      ARENA_CENTER.x + Math.cos(angle) * outer,
      ARENA_CENTER.y + Math.sin(angle) * outer,
      { color: active ? BOSS_VISUAL_COLORS.safe : BOSS_VISUAL_COLORS.safeTelegraph, width: 1.5, alpha: 0.72 }
    );
  }
}

const normalizeAngle = (angle: number): number => ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
