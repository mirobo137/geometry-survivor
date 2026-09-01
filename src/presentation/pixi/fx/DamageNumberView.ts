import { Container, Text, TextStyle } from 'pixi.js';
import type { EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';

const GROUP_WINDOW_SECONDS = 0.08;
const LIFETIME_SECONDS = 0.48;

interface DamageNumberSlot {
  readonly label: Text;
  active: boolean;
  enemyIndex: number;
  amount: number;
  lifeSeconds: number;
  driftX: number;
}

/**
 * Fixed text pool for readable enemy damage. It groups a burst from one pooled
 * enemy slot instead of allowing weapon fire to create a DOM node per hit.
 */
export class DamageNumberView {
  public readonly root = new Container();
  private readonly slots: DamageNumberSlot[];
  private readonly reducedMotion: boolean;

  public constructor(quality: FxQuality = 'medium') {
    const style = new TextStyle({
      fill: 0xfff1bf,
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: '700'
    });
    this.slots = Array.from({ length: FX_QUALITY[quality].damageNumberLimit }, (_, index) => {
      const label = new Text({ text: '', style });
      label.anchor.set(0.5);
      label.visible = false;
      this.root.addChild(label);
      return {
        label,
        active: false,
        enemyIndex: -1,
        amount: 0,
        lifeSeconds: 0,
        driftX: index % 2 === 0 ? -12 : 12
      };
    });
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public get activeCount(): number {
    return this.slots.reduce((count, slot) => count + (slot.active ? 1 : 0), 0);
  }

  public playHit(
    enemyIndex: number,
    x: number,
    y: number,
    radius: number,
    amount: number,
    kind: EnemyKind
  ): void {
    if (this.slots.length === 0 || amount <= 0 || kind === 'boss') return;
    const grouped = this.slots.find((slot) => slot.active
      && slot.enemyIndex === enemyIndex
      && slot.lifeSeconds >= LIFETIME_SECONDS - GROUP_WINDOW_SECONDS);
    const slot = grouped ?? this.slots.find((candidate) => !candidate.active);
    if (!slot) return;

    if (grouped) {
      slot.amount += amount;
      slot.label.text = `${Math.round(slot.amount)}`;
      slot.lifeSeconds = Math.max(slot.lifeSeconds, LIFETIME_SECONDS - GROUP_WINDOW_SECONDS * 0.25);
      return;
    }

    slot.active = true;
    slot.enemyIndex = enemyIndex;
    slot.amount = amount;
    slot.lifeSeconds = LIFETIME_SECONDS;
    slot.label.text = `${Math.round(amount)}`;
    slot.label.position.set(x, y - Math.max(28, radius + 22));
    slot.label.alpha = 1;
    slot.label.scale.set(1);
    slot.label.visible = true;
    this.root.visible = true;
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;
    let hasActive = false;
    for (const slot of this.slots) {
      if (!slot.active) continue;
      slot.lifeSeconds -= delta;
      if (slot.lifeSeconds <= 0) {
        slot.active = false;
        slot.label.visible = false;
        continue;
      }
      hasActive = true;
      const progress = 1 - slot.lifeSeconds / LIFETIME_SECONDS;
      slot.label.alpha = 1 - progress * progress;
      if (!this.reducedMotion) {
        slot.label.y -= 30 * delta;
        slot.label.x += slot.driftX * delta;
        slot.label.scale.set(1 + (1 - progress) * 0.08);
      }
    }
    this.root.visible = hasActive;
  }

  public clear(): void {
    for (const slot of this.slots) {
      slot.active = false;
      slot.label.visible = false;
      slot.label.text = '';
    }
    this.root.visible = false;
  }
}
