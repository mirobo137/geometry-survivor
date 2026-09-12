import { Container, Graphics } from 'pixi.js';
import { ORBITER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import type { FxQuality } from '../../content/visual/VisualTokens';

const SEGMENTS = 8;

/** Open, tapered route feathers. Their gaps distinguish movement from a laser. */
function feather(g: Graphics, radius: number, start: number, span: number,
  direction: number, halfWidth: number, color: number, alpha: number): void {
  for (const side of [1, -1]) {
    for (let j = 0; j <= 8; j += 1) {
      const t = side === 1 ? j / 8 : 1 - j / 8;
      const angle = start + direction * span * t;
      const width = Math.sin(Math.PI * t) * halfWidth;
      const r = radius + side * width;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (side === 1 && j === 0) g.beginPath().moveTo(x, y);
      else g.lineTo(x, y);
    }
  }
  g.closePath().fill({ color, alpha });
}

export class OrbiterTelegraphView {
  public readonly root = new Container();
  private readonly slots = Array.from({ length: ORBITER_DEFINITION.activeCap }, () => ({
    root: new Container(),
    feathers: Array.from({ length: SEGMENTS }, () => new Graphics()),
    state: null as EnemyRenderState | null, sequence: -1,
    radius: -1, angle: 0, direction: 0
  }));

  public constructor(_quality: FxQuality = 'medium') {
    this.root.eventMode = 'none';
    this.root.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    for (const slot of this.slots) {
      slot.root.addChild(...slot.feathers);
      slot.root.visible = false;
      this.root.addChild(slot.root);
    }
  }

  public render(enemies: readonly EnemyRenderState[]): void {
    let cursor = 0;
    for (const state of enemies) {
      if (!state.active || state.kind !== 'orbiter') continue;
      const phase = state.orbiterPhase;
      if (phase !== 'telegraph' && phase !== 'commit') continue;
      const slot = this.slots[cursor++];
      if (!slot) break;
      const radius = Math.max(1, state.orbiterBandRadius ?? 1);
      const angle = state.orbiterStartAngle ?? 0;
      const direction = state.orbiterDirection ?? 1;
      // Include identity and geometry: sequences repeat when pooled slots recycle.
      if (slot.state !== state || slot.sequence !== state.orbiterSequence
        || slot.radius !== radius || slot.angle !== angle || slot.direction !== direction) {
        slot.state = state; slot.sequence = state.orbiterSequence ?? 0;
        slot.radius = radius; slot.angle = angle; slot.direction = direction;
        const span = ORBITER_DEFINITION.reservedArcRadians / SEGMENTS;
        for (let i = 0; i < SEGMENTS; i += 1) {
          const g = slot.feathers[i];
          const a = angle + direction * span * (i + 0.1);
          g.clear();
          feather(g, radius, a, span * 0.7, direction, 3.8, 0x101d30, 0.7);
          feather(g, radius, a, span * 0.7, direction, 2, 0x64bdcb, 0.65);
          feather(g, radius - 0.55, a, span * 0.58, direction, 0.55, 0xd0ece5, 0.85);
          // Short swept barb establishes direction without dots or endpoint diamonds.
          const tip = a + direction * span * 0.68;
          const rear = tip - direction * span * 0.23;
          g.beginPath().moveTo(Math.cos(tip) * radius, Math.sin(tip) * radius)
            .lineTo(Math.cos(rear) * (radius + 6), Math.sin(rear) * (radius + 6))
            .lineTo(Math.cos(rear) * (radius + 3), Math.sin(rear) * (radius + 3))
            .closePath().fill({ color: 0xe1c28d, alpha: 0.8 });
        }
      }
      const p = Math.max(0, Math.min(1, state.orbiterProgress ?? 0));
      slot.root.visible = true;
      for (let i = 0; i < SEGMENTS; i += 1) {
        const fraction = (i + 0.5) / SEGMENTS;
        slot.feathers[i].alpha = phase === 'telegraph'
          ? 0.34 + 0.66 * Math.max(0, Math.min(1, p * 2 - fraction))
          : Math.max(0, Math.min(0.65, (fraction - p) * 5 + 0.22));
      }
    }
    for (let index = cursor; index < this.slots.length; index += 1) {
      this.slots[index].root.visible = false;
      this.slots[index].state = null;
    }
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.root.visible = false;
      slot.state = null;
      slot.sequence = -1;
    }
  }
}
