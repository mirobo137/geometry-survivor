import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';

export type EnemyShipKind = Exclude<EnemyKind, 'boss'>;

export interface EnemyShipTextureSet {
  readonly rear: Texture;
  readonly wings: Texture;
  readonly hull: Texture;
  readonly cockpit: Texture;
}

export type EnemyShipTextureMap = Readonly<Record<EnemyShipKind, EnemyShipTextureSet>>;

interface EnemyShipMotionProfile {
  readonly cycleSeconds: number;
  readonly bobAmplitude: number;
  readonly wingSway: number;
  readonly wingRotation: number;
  readonly cockpitSway: number;
  readonly cockpitLift: number;
  readonly hullPulse: number;
}

const MOTION_PROFILES: Readonly<Record<EnemyShipKind, EnemyShipMotionProfile>> = {
  chaser: {
    cycleSeconds: 4.2,
    bobAmplitude: 0.85,
    wingSway: 1.7,
    wingRotation: 0.06,
    cockpitSway: 0.55,
    cockpitLift: 0.9,
    hullPulse: 0.012
  },
  fast: {
    cycleSeconds: 7.2,
    bobAmplitude: 0.7,
    wingSway: 2.4,
    wingRotation: 0.13,
    cockpitSway: 0.8,
    cockpitLift: 1.4,
    hullPulse: 0.016
  },
  tank: {
    cycleSeconds: 2.5,
    bobAmplitude: 0.42,
    wingSway: 0.65,
    wingRotation: 0.035,
    cockpitSway: 0.25,
    cockpitLift: 0.35,
    hullPulse: 0.009
  },
  elite: {
    cycleSeconds: 3.8,
    bobAmplitude: 1.1,
    wingSway: 1.2,
    wingRotation: 0.095,
    cockpitSway: 0.7,
    cockpitLift: 1.1,
    hullPulse: 0.018
  }
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Composes a pooled enemy ship and animates only its cached SVG pieces. */
export class EnemyShipVisual {
  public readonly root = new Container();
  private readonly rear: Sprite;
  private readonly wings: Sprite;
  private readonly hull: Sprite;
  private readonly cockpit: Sprite;
  private readonly hitFlash: Sprite;
  private kind: EnemyShipKind = 'chaser';
  private facing = 0;

  public constructor(
    private readonly textures: EnemyShipTextureMap,
    private readonly phaseSeed = 0
  ) {
    this.rear = new Sprite(textures.chaser.rear);
    this.wings = new Sprite(textures.chaser.wings);
    this.hull = new Sprite(textures.chaser.hull);
    this.cockpit = new Sprite(textures.chaser.cockpit);
    this.hitFlash = new Sprite(textures.chaser.hull);
    for (const part of [this.rear, this.wings, this.hull, this.cockpit, this.hitFlash]) part.anchor.set(0.5);
    this.hitFlash.tint = 0xffffff;
    this.hitFlash.visible = false;
    this.root.addChild(this.rear, this.wings, this.hull, this.cockpit, this.hitFlash);
  }

  public get currentKind(): EnemyShipKind {
    return this.kind;
  }

  public render(state: EnemyRenderState, animationSeconds: number, hitPulse = 0): void {
    this.root.visible = state.active;
    if (!state.active || state.kind === 'boss') {
      this.root.visible = false;
      return;
    }

    // CombatEntitiesView routes the boss to its dedicated visual. Keeping the
    // guard here makes this component safe if another preview sends a boss.
    const kind = state.kind as EnemyShipKind;
    this.setKind(kind);
    const profile = MOTION_PROFILES[this.kind];
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > 0.5) this.facing = Math.atan2(state.vy, state.vx) + Math.PI / 2;
    this.root.rotation = this.facing;
    this.root.alpha = Math.max(0.55, state.health / state.maxHealth);

    const movement = clamp01(speed / 126);
    const phase = animationSeconds * profile.cycleSeconds + this.phaseSeed;
    const bob = Math.sin(phase) * profile.bobAmplitude * (0.45 + movement * 0.55);
    const pulse = Math.sin(phase * 1.7 + 0.4) * profile.hullPulse;
    const wingWave = Math.sin(phase * 1.22 + 0.8) * profile.wingSway * (0.35 + movement * 0.65);
    const wingRotation = Math.sin(phase * 1.12 + 1.4) * profile.wingRotation * (0.35 + movement * 0.65);

    this.rear.position.set(0, bob * 0.55);
    this.rear.rotation = -wingRotation * 0.7;
    this.rear.alpha = 0.82 + Math.sin(phase * 1.4) * 0.12;

    this.wings.position.set(Math.sin(phase * 0.9) * profile.wingSway * 0.22, bob * 0.28);
    this.wings.rotation = wingRotation;
    this.wings.scale.set(1 + wingWave * 0.008, 1 - wingWave * 0.004);

    this.hull.position.set(0, bob * 0.18);
    this.hull.rotation = Math.sin(phase * 0.7) * profile.wingRotation * 0.18;
    this.hull.scale.set(1 + pulse, 1 - pulse * 0.65);

    this.cockpit.position.set(
      Math.sin(phase * 1.45 + 0.6) * profile.cockpitSway,
      -bob * 0.32 - profile.cockpitLift * movement
    );
    this.cockpit.rotation = Math.sin(phase * 1.35) * profile.wingRotation * 0.5;
    this.hitFlash.position.set(0, bob * 0.18);
    this.hitFlash.rotation = this.hull.rotation;
    this.hitFlash.scale.set(1 + hitPulse * 0.06, 1 - hitPulse * 0.03);
    this.hitFlash.alpha = hitPulse * 0.62;
    this.hitFlash.visible = hitPulse > 0.01;
  }

  public reset(): void {
    this.kind = 'chaser';
    this.facing = 0;
    this.root.visible = false;
    this.root.rotation = 0;
    this.root.alpha = 1;
    this.root.scale.set(1);
    for (const part of [this.rear, this.wings, this.hull, this.cockpit]) {
      part.position.set(0, 0);
      part.rotation = 0;
      part.scale.set(1);
      part.alpha = 1;
    }
    this.hitFlash.visible = false;
    this.hitFlash.alpha = 0;
  }

  private setKind(kind: EnemyShipKind): void {
    if (this.kind === kind) return;
    this.kind = kind;
    const textures = this.textures[kind];
    this.rear.texture = textures.rear;
    this.wings.texture = textures.wings;
    this.hull.texture = textures.hull;
    this.cockpit.texture = textures.cockpit;
    this.hitFlash.texture = textures.hull;
  }
}
