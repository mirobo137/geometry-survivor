import { Container, Graphics } from 'pixi.js';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';

const INK = 0x071426;
const CYAN = 0x72ebff;
const ROSE = 0xff70b4;
const GOLD = 0xffd36e;
const VIOLET = 0xc795ff;
const IVORY = 0xe7fbf4;

/** Premium but bounded presentation for Act III ordnance and telegraphs. */
export class FractureThreatView {
  public readonly root = new Container();
  private readonly projectiles: Graphics[];
  private readonly mines: Graphics[];
  private readonly signals = new Graphics();
  private readonly bossSignal = new Graphics();
  private readonly quality: FxQuality;

  public constructor(quality: FxQuality = 'medium') {
    this.quality = quality;
    this.projectiles = Array.from({ length: 48 }, () => {
      const graphics = new Graphics();
      graphics.visible = false;
      this.root.addChild(graphics);
      return graphics;
    });
    this.mines = Array.from({ length: 12 }, () => {
      const graphics = new Graphics();
      graphics.visible = false;
      this.root.addChild(graphics);
      return graphics;
    });
    this.root.addChild(this.signals, this.bossSignal);
    this.root.visible = false;
  }

  public render(combat: Pick<CombatRenderState, 'fractureProjectiles' | 'fractureMines' | 'enemies' | 'boss'>, arenaRadius: number): void {
    let visible = false;
    for (let index = 0; index < this.projectiles.length; index += 1) {
      const state = combat.fractureProjectiles[index];
      const graphics = this.projectiles[index];
      graphics.visible = state.active;
      if (!state.active) continue;
      visible = true;
      const speed = Math.max(1, Math.hypot(state.vx, state.vy));
      const nx = state.vx / speed;
      const ny = state.vy / speed;
      graphics.clear();
      graphics.beginPath().moveTo(state.x - nx * 16, state.y - ny * 16)
        .lineTo(state.x, state.y).stroke({ color: CYAN, width: this.quality === 'low' ? 2 : 4, alpha: 0.24 });
      graphics.beginPath().poly([
        state.x + nx * 8, state.y + ny * 8,
        state.x - ny * 5, state.y + nx * 5,
        state.x - nx * 5, state.y - ny * 5,
        state.x + ny * 5, state.y - nx * 5
      ]).fill({ color: INK, alpha: 0.95 }).stroke({ color: CYAN, width: 1.4, alpha: 0.96 });
      graphics.beginPath().circle(state.x + nx * 2, state.y + ny * 2, 2.2).fill({ color: IVORY, alpha: 0.96 });
    }
    for (let index = 0; index < this.mines.length; index += 1) {
      const state = combat.fractureMines[index];
      const graphics = this.mines[index];
      graphics.visible = state.active;
      if (!state.active) continue;
      visible = true;
      const armed = state.ageSeconds >= state.armSeconds;
      const progress = armed
        ? Math.min(1, (state.ageSeconds - state.armSeconds) / Math.max(0.01, state.detonateSeconds - state.armSeconds))
        : state.ageSeconds / Math.max(0.01, state.armSeconds);
      const pulse = armed ? 1 + Math.sin(progress * Math.PI * 8) * 0.05 : 1;
      graphics.clear();
      graphics.beginPath().circle(state.x, state.y, state.damageRadius * (armed ? 1 : 0.78))
        .stroke({ color: armed ? ROSE : VIOLET, width: armed ? 2.2 : 1.2, alpha: armed ? 0.22 : 0.36 });
      graphics.beginPath().circle(state.x, state.y, state.radius * pulse)
        .fill({ color: INK, alpha: 0.96 }).stroke({ color: armed ? GOLD : VIOLET, width: 1.8, alpha: 0.96 });
      graphics.beginPath().moveTo(state.x - 5, state.y).lineTo(state.x + 5, state.y)
        .moveTo(state.x, state.y - 5).lineTo(state.x, state.y + 5)
        .stroke({ color: armed ? ROSE : IVORY, width: 1.4, alpha: 0.9 });
    }

    this.signals.clear();
    for (const enemy of combat.enemies) {
      if (!enemy.active || !isFractureEnemy(enemy)) continue;
      this.renderEnemySignal(enemy);
    }
    this.bossSignal.clear();
    if (combat.boss.active && combat.boss.bossId === 'fracture-engine') {
      this.renderBossSignal(combat.boss, arenaRadius);
    }
    this.root.visible = visible || combat.boss.bossId === 'fracture-engine';
  }

  public reset(): void {
    for (const graphics of [...this.projectiles, ...this.mines]) {
      graphics.clear();
      graphics.visible = false;
    }
    this.signals.clear();
    this.bossSignal.clear();
    this.root.visible = false;
  }

  private renderEnemySignal(enemy: EnemyRenderState): void {
    const phase = enemy.fracturePhase;
    if (phase !== 'telegraph' && phase !== 'active') return;
    const pulse = phase === 'telegraph' ? Math.sin((enemy.fractureProgress ?? 0) * Math.PI) : 1;
    if (enemy.kind === 'fracture-gunner') {
      this.signals.beginPath().moveTo(enemy.x, enemy.y).lineTo(enemy.fractureAimX ?? enemy.x, enemy.fractureAimY ?? enemy.y)
        .stroke({ color: CYAN, width: 1.5 + pulse * 1.5, alpha: 0.15 + pulse * 0.4 });
      this.drawReticle(this.signals, enemy.fractureAimX ?? enemy.x, enemy.fractureAimY ?? enemy.y, 8 + pulse * 3, CYAN);
    } else if (enemy.kind === 'thorn-bastion') {
      const radius = (enemy.fractureSpikeRadius ?? 58) * (0.88 + pulse * 0.12);
      this.signals.beginPath().circle(enemy.x, enemy.y, radius).stroke({ color: ROSE, width: 2.4, alpha: 0.3 + pulse * 0.45 });
      for (let index = 0; index < 8; index += 1) this.drawSpike(this.signals, enemy.x, enemy.y, index * Math.PI / 4, radius, ROSE);
    } else if (enemy.kind === 'zigzag-reaver') {
      this.drawZigzag(this.signals, enemy.fractureStartX ?? enemy.x, enemy.fractureStartY ?? enemy.y,
        enemy.fractureEndX ?? enemy.x, enemy.fractureEndY ?? enemy.y, 70, GOLD, 0.28 + pulse * 0.35);
    } else if (enemy.kind === 'rift-miner') {
      const radius = 26 + pulse * 8;
      this.signals.beginPath().circle(enemy.x, enemy.y, radius)
        .stroke({ color: VIOLET, width: 1.8 + pulse, alpha: 0.28 + pulse * 0.38 });
      this.drawReticle(this.signals, enemy.x, enemy.y, 7 + pulse * 2, VIOLET);
    }
  }

  private renderBossSignal(boss: CombatRenderState['boss'], arenaRadius: number): void {
    const phase = boss.phase;
    const pulse = phase.endsWith('telegraph') ? Math.sin(boss.progress * Math.PI) : 1;
    if (boss.pattern === 'spikes') {
      const radius = boss.radius + 28;
      this.bossSignal.beginPath().circle(boss.x, boss.y, radius).stroke({ color: ROSE, width: 4, alpha: 0.25 + pulse * 0.42 });
      for (let index = 0; index < 12; index += 1) this.drawSpike(this.bossSignal, boss.x, boss.y, index * Math.PI / 6, radius, ROSE);
    } else if (boss.pattern === 'zigzag') {
      this.drawZigzag(this.bossSignal, boss.chargeStartX, boss.chargeStartY, boss.chargeAimX, boss.chargeAimY, 58, GOLD, 0.34 + pulse * 0.32);
    } else if (boss.pattern === 'battery') {
      const length = arenaRadius + 16;
      const x = boss.x + Math.cos(boss.sweepAngle) * length;
      const y = boss.y + Math.sin(boss.sweepAngle) * length;
      this.drawReticle(this.bossSignal, x, y, 12 + pulse * 4, CYAN);
    } else if (boss.pattern === 'mines') {
      this.bossSignal.beginPath().circle(boss.x, boss.y, boss.radius + 32 + pulse * 8)
        .stroke({ color: VIOLET, width: 2, alpha: 0.25 + pulse * 0.34 });
    }
  }

  private drawZigzag(graphics: Graphics, x1: number, y1: number, x2: number, y2: number, width: number, color: number, alpha: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / length;
    const ny = dx / length;
    graphics.beginPath().moveTo(x1, y1);
    for (let index = 1; index <= 8; index += 1) {
      const t = index / 8;
      const offset = Math.sin(t * Math.PI * 2) * width;
      graphics.lineTo(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
    }
    graphics.stroke({ color, width: 2.5, alpha });
  }

  private drawSpike(graphics: Graphics, x: number, y: number, angle: number, radius: number, color: number): void {
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    graphics.beginPath().moveTo(x + nx * (radius - 4) - ny * 4, y + ny * (radius - 4) + nx * 4)
      .lineTo(x + nx * (radius + 12), y + ny * (radius + 12))
      .lineTo(x + nx * (radius - 4) + ny * 4, y + ny * (radius - 4) - nx * 4)
      .stroke({ color, width: 2.2, alpha: 0.72 });
  }

  private drawReticle(graphics: Graphics, x: number, y: number, radius: number, color: number): void {
    graphics.beginPath().circle(x, y, radius).stroke({ color, width: 1.2, alpha: 0.72 });
    graphics.beginPath().moveTo(x - radius - 4, y).lineTo(x + radius + 4, y)
      .moveTo(x, y - radius - 4).lineTo(x, y + radius + 4)
      .stroke({ color, width: 1, alpha: 0.58 });
  }
}

const isFractureEnemy = (enemy: EnemyRenderState): boolean => (
  enemy.kind === 'fracture-gunner' || enemy.kind === 'thorn-bastion'
    || enemy.kind === 'zigzag-reaver' || enemy.kind === 'rift-miner'
);
