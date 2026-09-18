import { Container, Graphics } from 'pixi.js';
import type { FxQuality } from '../../content/visual/VisualTokens';
import { THORN_BASTION_DEFINITION, ZIGZAG_REAVER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { FRACTURE_ENGINE_DEFINITION } from '../../content/bosses/BossDefinition';
import type { CombatRenderState, EnemyRenderState } from '../../simulation/combat/CombatRenderState';

const INK = 0x071426;
const ROSE = 0xff708f;
const GOLD = 0xffc775;
const VIOLET = 0xba9ae5;
const IVORY = 0xffefd6;
const TAU = Math.PI * 2;
const BURST_SECONDS = 0.32;

/** Bounded material layers; clocks and damage always belong to simulation.
 * See docs/design/FRACTURE_ATTACK_FX.md. No filters, random particles or per-cast objects.
 */
export class FractureThreatView {
  public readonly root = new Container();
  private readonly projectiles: Graphics[];
  private readonly mines: Graphics[];
  private readonly signals = new Graphics();
  private readonly bossSignal = new Graphics();
  private readonly mineWasActive = new Uint8Array(12);
  private readonly mineBurstAge = new Float64Array(12).fill(BURST_SECONDS);

  public constructor(private readonly quality: FxQuality = 'medium') {
    this.projectiles = Array.from({ length: 48 }, () => this.createGraphic());
    this.mines = Array.from({ length: 12 }, () => this.createGraphic());
    this.root.addChild(this.signals, this.bossSignal);
    this.root.visible = false;
  }

  private createGraphic(): Graphics {
    const graphic = new Graphics();
    graphic.visible = false;
    this.root.addChild(graphic);
    return graphic;
  }

  public render(combat: Pick<CombatRenderState, 'fractureProjectiles' | 'fractureMines' | 'enemies' | 'boss' | 'bosses'>,
    _arenaRadius: number, deltaSeconds = 0): void {
    let visible = false;
    const dt = Math.min(0.1, Math.max(0, deltaSeconds));
    for (let index = 0; index < this.projectiles.length; index += 1) {
      const state = combat.fractureProjectiles[index];
      const g = this.projectiles[index];
      g.visible = !!state?.active;
      if (!state?.active) {
        // Clear pooled geometry as well as visibility. This is defensive
        // against a renderer retaining a previous command list during a
        // context restore or a rapid slot recycle.
        g.clear();
        continue;
      }
      visible = true;
      g.clear();
      g.position.set(state.x, state.y);
      g.rotation = Math.atan2(state.vy, state.vx);
      // The tail can never extend behind the spawn position on its first frame.
      const tail = Math.min(34, state.ageSeconds * Math.hypot(state.vx, state.vy));
      if (tail > 0) {
        this.facet(g, -tail, 0, 0, -4, 0, 4, ROSE, 0.17);
        this.facet(g, -tail * 0.65, 0, 0, -1.8, 0, 1.8, GOLD, 0.5);
      }
      // Hostile, warm dart: dark separation, coral shell, small incandescent point.
      g.beginPath().moveTo(7, 0).lineTo(0, -5).lineTo(-5, 0).lineTo(0, 5).closePath()
        .fill({ color: INK }).stroke({ color: ROSE, width: 1.5 });
      this.facet(g, 6, 0, -1, -2.5, -1, 2.5, GOLD, 0.95);
      g.beginPath().moveTo(1, 0).lineTo(5, 0).stroke({ color: IVORY, width: 1.4 });
    }

    for (let index = 0; index < this.mines.length; index += 1) {
      const state = combat.fractureMines[index];
      const g = this.mines[index];
      g.clear();
      if (!state) { g.visible = false; continue; }
      if (state.active) {
        this.mineWasActive[index] = 1;
        this.mineBurstAge[index] = BURST_SECONDS;
        g.visible = true;
        visible = true;
        const progress = Math.min(1, state.ageSeconds / state.detonateSeconds);
        const armed = state.ageSeconds >= state.armSeconds;
        const color = armed ? GOLD : VIOLET;
        // Fixed outer boundary is the real damage radius, even before arming.
        this.segmentedRing(g, state.x, state.y, state.damageRadius, 8, color, 0.24 + progress * 0.26, 1.2);
        g.beginPath().arc(state.x, state.y, state.damageRadius - 4, -Math.PI / 2,
          -Math.PI / 2 + progress * TAU).stroke({ color, width: 2, alpha: 0.65 });
        this.emitter(g, state.x, state.y, state.radius, color, progress);
        if (armed) {
          g.beginPath().circle(state.x, state.y, state.damageRadius)
            .fill({ color: ROSE, alpha: 0.018 + progress * 0.025 });
        }
      } else {
        if (this.mineWasActive[index] && state.ageSeconds >= state.detonateSeconds) this.mineBurstAge[index] = 0;
        this.mineWasActive[index] = 0;
        const age = this.mineBurstAge[index];
        g.visible = age < BURST_SECONDS;
        if (g.visible) {
          visible = true;
          const progress = age / BURST_SECONDS;
          const alpha = (1 - progress) ** 2;
          // Residue starts at the hit radius, then fades there. No expanding false hitbox.
          this.segmentedRing(g, state.x, state.y, state.damageRadius, 8, VIOLET, alpha * 0.6, 3);
          this.corona(g, state.x, state.y, state.damageRadius, 10, true, 1 - progress, alpha);
          g.beginPath().circle(state.x, state.y, state.damageRadius)
            .fill({ color: VIOLET, alpha: alpha * 0.075 });
          this.mineBurstAge[index] = Math.min(BURST_SECONDS, age + dt);
        }
      }
    }

    this.signals.clear();
    for (const enemy of combat.enemies) {
      if (!enemy.active || (enemy.fracturePhase !== 'telegraph' && enemy.fracturePhase !== 'active')) continue;
      if (this.renderEnemySignal(enemy)) visible = true;
    }
    this.bossSignal.clear();
    for (const boss of combat.bosses ?? [combat.boss]) {
      if (boss.active && boss.bossId === 'fracture-engine'
        && (boss.phase.endsWith('-telegraph') || boss.phase.endsWith('-active'))) {
        this.renderBossSignal(boss);
        visible = true;
      }
    }
    this.root.visible = visible;
  }

  public reset(): void {
    for (const g of this.projectiles) { g.clear(); g.visible = false; }
    for (const g of this.mines) { g.clear(); g.visible = false; }
    this.mineWasActive.fill(0);
    this.mineBurstAge.fill(BURST_SECONDS);
    this.signals.clear();
    this.bossSignal.clear();
    this.root.visible = false;
  }

  private renderEnemySignal(enemy: EnemyRenderState): boolean {
    const active = enemy.fracturePhase === 'active';
    const progress = enemy.fractureProgress ?? 0;
    const g = this.signals;
    if (enemy.kind === 'fracture-gunner') {
      const angle = Math.atan2((enemy.fractureAimY ?? enemy.y) - enemy.y, (enemy.fractureAimX ?? enemy.x) - enemy.x);
      this.aim(g, enemy.x, enemy.y, angle, 26, progress, active);
    } else if (enemy.kind === 'thorn-bastion') {
      this.corona(g, enemy.x, enemy.y, THORN_BASTION_DEFINITION.spikeRadius ?? 58, 8, active, progress);
    } else if (enemy.kind === 'zigzag-reaver') {
      this.zigzag(g, enemy.fractureStartX ?? enemy.x, enemy.fractureStartY ?? enemy.y,
        enemy.fractureEndX ?? enemy.x, enemy.fractureEndY ?? enemy.y,
        ZIGZAG_REAVER_DEFINITION.zigzagWidth ?? 70, progress, active);
    } else if (enemy.kind === 'rift-miner') {
      this.emitter(g, enemy.x, enemy.y, 29, VIOLET, active ? 1 - progress : progress);
    } else return false;
    return true;
  }

  private renderBossSignal(boss: CombatRenderState['boss']): void {
    const active = boss.phase.endsWith('-active');
    if (boss.pattern === 'spikes') {
      this.corona(this.bossSignal, boss.x, boss.y, FRACTURE_ENGINE_DEFINITION.spikeRadius ?? 84, 12, active, boss.progress);
    } else if (boss.pattern === 'zigzag') {
      this.zigzag(this.bossSignal, boss.chargeStartX, boss.chargeStartY, boss.chargeAimX, boss.chargeAimY, 58, boss.progress, active);
    } else if (boss.pattern === 'battery') {
      this.aim(this.bossSignal, boss.x, boss.y, boss.sweepAngle, boss.radius + 4, boss.progress, active);
    } else if (boss.pattern === 'mines') {
      this.emitter(this.bossSignal, boss.x, boss.y, boss.radius + 8, VIOLET, active ? 1 - boss.progress : boss.progress);
    }
  }

  private aim(g: Graphics, x: number, y: number, angle: number, radius: number, progress: number, active: boolean): void {
    const nx = Math.cos(angle), ny = Math.sin(angle);
    this.segmentedRing(g, x, y, radius, 4, active ? ROSE : GOLD, 0.3 + progress * 0.3, 1.5);
    // Three short induction marks, not a full line implying a hitscan laser.
    for (let i = 0; i < 3; i += 1) {
      const d = radius + 9 + i * 14;
      const alpha = (1 - i * 0.23) * (active ? (1 - progress) : 0.45 + progress * 0.35);
      const px = x + nx * d, py = y + ny * d;
      g.beginPath().moveTo(px - nx * 5 - ny * 4, py - ny * 5 + nx * 4)
        .lineTo(px, py).lineTo(px - nx * 5 + ny * 4, py - ny * 5 - nx * 4)
        .stroke({ color: active ? IVORY : GOLD, width: active ? 2.5 : 1.3, alpha });
    }
    if (active) {
      const px = x + nx * radius, py = y + ny * radius;
      this.facet(g, px + nx * 18, py + ny * 18, px - ny * 7, py + nx * 7,
        px + ny * 7, py - nx * 7, GOLD, (1 - progress) * 0.7);
    }
  }

  private corona(g: Graphics, x: number, y: number, radius: number, count: number,
    active: boolean, progress: number, opacity = 1): void {
    const color = active ? ROSE : GOLD;
    this.segmentedRing(g, x, y, radius, count, color, (active ? 0.8 : 0.4) * opacity, active ? 2.2 : 1.2);
    g.beginPath().circle(x, y, radius).fill({ color, alpha: (active ? 0.055 : 0.018) * opacity });
    for (let i = 0; i < count; i += 1) {
      const angle = i * TAU / count;
      const nx = Math.cos(angle), ny = Math.sin(angle);
      const inner = radius * (active ? 0.42 : 0.72);
      const half = active ? 5 : 3;
      const ax = x + nx * inner - ny * half, ay = y + ny * inner + nx * half;
      const bx = x + nx * inner + ny * half, by = y + ny * inner - nx * half;
      const tx = x + nx * radius, ty = y + ny * radius;
      if (active) {
        this.facet(g, tx, ty, ax, ay, bx, by, INK, 0.9 * opacity);
        this.facet(g, tx, ty, ax, ay, x + nx * inner, y + ny * inner, ROSE, 0.8 * opacity);
        g.beginPath().moveTo(x + nx * (inner + 6), y + ny * (inner + 6)).lineTo(tx, ty)
          .stroke({ color: GOLD, width: this.quality === 'low' ? 1.3 : 2, alpha: (0.65 + 0.25 * (1 - progress)) * opacity });
      } else {
        g.beginPath().moveTo(ax, ay).lineTo(tx, ty).lineTo(bx, by)
          .stroke({ color: GOLD, width: 1.1, join: 'round', alpha: (0.25 + progress * 0.45) * opacity });
      }
    }
  }

  private emitter(g: Graphics, x: number, y: number, radius: number, color: number, progress: number): void {
    this.segmentedRing(g, x, y, radius, 4, color, 0.65, 2);
    for (let i = 0; i < 4; i += 1) {
      const angle = i * Math.PI / 2;
      const nx = Math.cos(angle), ny = Math.sin(angle);
      const d = radius * (1.12 - progress * 0.18);
      const px = x + nx * d, py = y + ny * d;
      this.facet(g, px + nx * 4, py + ny * 4, px - ny * 3, py + nx * 3,
        px + ny * 3, py - nx * 3, color, 0.55 + progress * 0.3);
    }
    if (radius < 15) {
      g.beginPath().circle(x, y, radius * 0.6).fill({ color: INK }).stroke({ color, width: 1.5 });
      this.facet(g, x, y - 4, x - 3, y + 2, x + 3, y + 2, IVORY, 0.9);
    }
  }

  private zigzag(g: Graphics, x1: number, y1: number, x2: number, y2: number,
    width: number, progress: number, active: boolean): void {
    const dx = x2 - x1, dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return;
    const nx = -dy / length, ny = dx / length;
    const count = this.quality === 'low' ? 12 : 20;
    const end = active ? Math.min(1, progress) : 1;
    const start = active ? Math.max(0, end - 0.25) : 0;
    for (let i = 0; i < count; i += 1) {
      const t1 = start + (end - start) * i / count;
      const t2 = start + (end - start) * (i + (active ? 1 : 0.55)) / count;
      const a = Math.sin(t1 * TAU) * width, b = Math.sin(t2 * TAU) * width;
      const ax = x1 + dx * t1 + nx * a, ay = y1 + dy * t1 + ny * a;
      const bx = x1 + dx * t2 + nx * b, by = y1 + dy * t2 + ny * b;
      if (active) {
        const fade = (i + 1) / count;
        g.beginPath().moveTo(ax, ay).lineTo(bx, by).stroke({ color: INK, width: 2 + fade * 9, alpha: fade * 0.45 });
        g.beginPath().moveTo(ax, ay).lineTo(bx, by).stroke({ color: GOLD, width: 0.5 + fade * 4, alpha: fade * 0.55 });
        if (this.quality !== 'low') g.beginPath().moveTo(ax, ay).lineTo(bx, by).stroke({ color: IVORY, width: fade, alpha: fade * 0.7 });
      } else {
        g.beginPath().moveTo(ax, ay).lineTo(bx, by).stroke({ color: GOLD, width: 1.3, alpha: 0.18 + progress * 0.35 });
      }
    }
  }

  private segmentedRing(g: Graphics, x: number, y: number, radius: number, count: number, color: number, alpha: number, width: number): void {
    for (let i = 0; i < count; i += 1) {
      const start = i * TAU / count + 0.09;
      g.beginPath().arc(x, y, radius, start, (i + 1) * TAU / count - 0.09).stroke({ color, alpha, width });
    }
  }

  private facet(g: Graphics, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, color: number, alpha: number): void {
    g.beginPath().moveTo(ax, ay).lineTo(bx, by).lineTo(cx, cy).closePath().fill({ color, alpha });
  }
}
