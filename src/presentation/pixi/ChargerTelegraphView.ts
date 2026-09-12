import { Container, Graphics } from 'pixi.js';
import { CHARGER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import type { FxQuality } from '../../content/visual/VisualTokens';

const INK = 0x111e2e;
const GOLD = 0xe9ab64;
const HOT = 0xffedc2;

/** Short launch vanes, attached to the ship. Length never encodes dash distance. */
export class ChargerTelegraphView {
  public readonly root = new Container();
  private readonly slots = Array.from({ length: CHARGER_DEFINITION.activeCap }, () => ({
    root: new Container(), vanes: new Graphics(), tip: new Graphics(),
    state: null as EnemyRenderState | null, sequence: -1, angle: 0
  }));

  public constructor(_quality: FxQuality = 'medium') {
    this.root.eventMode = 'none';
    for (const slot of this.slots) {
      for (const sign of [-1, 1]) {
        // Two open, tapered vanes converge toward the launch axis.
        slot.vanes.beginPath().moveTo(29, sign * 13).lineTo(40, sign * 19)
          .lineTo(66, sign * 12).lineTo(87, sign * 2)
          .lineTo(59, sign * 8).lineTo(39, sign * 12)
          .closePath().fill({ color: INK, alpha: 0.85 });
        slot.vanes.beginPath().moveTo(32, sign * 14).lineTo(41, sign * 17)
          .lineTo(64, sign * 11).lineTo(85, sign * 3)
          .lineTo(60, sign * 9).lineTo(40, sign * 14)
          .closePath().fill({ color: GOLD, alpha: 0.8 });
        slot.vanes.beginPath().moveTo(41, sign * 17).lineTo(64, sign * 11)
          .lineTo(55, sign * 12).lineTo(41, sign * 15)
          .closePath().fill({ color: HOT, alpha: 0.7 });
      }
      slot.tip.beginPath().moveTo(0, -5).lineTo(10, 0).lineTo(0, 5)
        .lineTo(3, 0).closePath().fill({ color: INK, alpha: 0.9 });
      slot.tip.beginPath().moveTo(2, -3).lineTo(9, 0).lineTo(2, 3)
        .lineTo(4, 0).closePath().fill({ color: HOT, alpha: 0.95 });
      slot.root.addChild(slot.vanes, slot.tip);
      slot.root.visible = false;
      this.root.addChild(slot.root);
    }
  }

  public render(enemies: readonly EnemyRenderState[]): void {
    let cursor = 0;
    for (const state of enemies) {
      if (!state.active || state.kind !== 'charger') continue;
      if (state.chargerPhase !== 'telegraph' && state.chargerPhase !== 'charge') continue;
      const slot = this.slots[cursor++];
      if (!slot) break;
      if (slot.state !== state || slot.sequence !== state.chargerSequence) {
        slot.state = state;
        slot.sequence = state.chargerSequence ?? 0;
        const dx = (state.chargerAimX ?? state.x) - state.x;
        const dy = (state.chargerAimY ?? state.y) - state.y;
        slot.angle = Math.atan2(dy, dx);
      }
      const p = Math.max(0, Math.min(1, state.chargerProgress ?? 0));
      const warning = state.chargerPhase === 'telegraph';
      slot.root.visible = warning || p < 0.3;
      slot.root.position.set(state.x, state.y);
      slot.root.rotation = slot.angle;
      slot.root.alpha = warning ? 0.45 + p * 0.55 : Math.max(0, 1 - p / 0.3);
      // Compression communicates anticipation without sliding the announced axis.
      slot.vanes.scale.set(1, warning ? 1.25 - p * 0.25 : 1 - p);
      slot.tip.position.set(warning ? 66 + p * 15 : 81, 0);
    }
    for (let index = cursor; index < this.slots.length; index += 1) {
      const slot = this.slots[index];
      slot.root.visible = false;
      slot.state = null;
      slot.sequence = -1;
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
