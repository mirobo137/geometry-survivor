import { Container, Graphics } from 'pixi.js';
import { ORBITER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import type { FxQuality } from '../../content/visual/VisualTokens';

interface TelegraphSlot {
  readonly graphics: Graphics;
  enemyIndex: number;
  sequence: number;
}

const createSlot = (): TelegraphSlot => ({ graphics: new Graphics(), enemyIndex: -1, sequence: -1 });

/**
 * Bounded world-space route indicator. It builds a path only when simulation
 * starts a new authored telegraph; normal frames update visibility and alpha.
 */
export class OrbiterTelegraphView {
  public readonly root = new Container();
  private readonly slots: TelegraphSlot[];

  public constructor(quality: FxQuality = 'medium') {
    this.slots = Array.from({ length: ORBITER_DEFINITION.activeCap }, createSlot);
    this.root.eventMode = 'none';
    this.root.visible = false;
    for (const slot of this.slots) {
      slot.graphics.eventMode = 'none';
      slot.graphics.visible = false;
      this.root.addChild(slot.graphics);
    }
    // Low preserves the route and chevrons; only the optional inner rail fades.
    this.root.alpha = quality === 'low' ? 0.9 : 1;
  }

  public render(enemies: readonly EnemyRenderState[]): void {
    let hasVisible = false;
    for (const slot of this.slots) slot.enemyIndex = -1;
    let slotCursor = 0;
    for (let index = 0; index < enemies.length; index += 1) {
      const state = enemies[index];
      if (!state.active || state.kind !== 'orbiter') continue;
      const phase = state.orbiterPhase ?? 'inactive';
      if (phase !== 'telegraph' && phase !== 'commit') continue;
      const slot = this.slots[slotCursor];
      if (!slot) break;
      slotCursor += 1;
      slot.enemyIndex = index;
      const sequence = state.orbiterSequence ?? 0;
      if (slot.sequence !== sequence) {
        slot.sequence = sequence;
        this.draw(slot.graphics, state);
      }
      const progress = state.orbiterProgress ?? 0;
      slot.graphics.visible = true;
      slot.graphics.alpha = phase === 'telegraph'
        ? 0.38 + Math.sin(Math.min(1, progress) * Math.PI) * 0.5
        : 0.58;
      hasVisible = true;
    }
    for (const slot of this.slots) {
      if (slot.enemyIndex !== -1) continue;
      slot.graphics.visible = false;
      slot.sequence = -1;
    }
    this.root.visible = hasVisible;
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.enemyIndex = -1;
      slot.sequence = -1;
      slot.graphics.clear();
      slot.graphics.visible = false;
    }
    this.root.visible = false;
  }

  private draw(graphics: Graphics, state: EnemyRenderState): void {
    const direction = state.orbiterDirection ?? 1;
    const start = state.orbiterStartAngle ?? 0;
    const radius = Math.max(1, state.orbiterBandRadius ?? 0);
    const arcStart = direction > 0 ? start : start - ORBITER_DEFINITION.reservedArcRadians;
    const arcEnd = direction > 0 ? start + ORBITER_DEFINITION.reservedArcRadians : start;
    graphics.clear();
    graphics
      .beginPath()
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, arcStart, arcEnd)
      .stroke({ color: 0x091224, width: 10, alpha: 0.86 })
      .beginPath()
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, radius, arcStart, arcEnd)
      .stroke({ color: 0x65e6ff, width: 3, alpha: 0.96 })
      .beginPath()
      .arc(ARENA_CENTER.x, ARENA_CENTER.y, Math.max(1, radius - 7), arcStart + 0.08, arcEnd - 0.08)
      .stroke({ color: 0xf5d98a, width: 1.2, alpha: 0.8 });

    for (const fraction of [0.24, 0.52, 0.8]) {
      const angle = start + direction * ORBITER_DEFINITION.reservedArcRadians * fraction;
      const tangentX = -Math.sin(angle) * direction;
      const tangentY = Math.cos(angle) * direction;
      const normalX = Math.cos(angle);
      const normalY = Math.sin(angle);
      const x = ARENA_CENTER.x + normalX * radius;
      const y = ARENA_CENTER.y + normalY * radius;
      const size = 7;
      graphics
        .beginPath()
        .moveTo(x - tangentX * size - normalX * size * 0.56, y - tangentY * size - normalY * size * 0.56)
        .lineTo(x + tangentX * size, y + tangentY * size)
        .lineTo(x - tangentX * size + normalX * size * 0.56, y - tangentY * size + normalY * size * 0.56)
        .stroke({ color: 0xf5d98a, width: 2, alpha: 0.94 });
    }
  }
}
