import { Container, Sprite } from 'pixi.js';
import type { PlayerState } from '../../../../simulation/PlayerModel';
import {
  PLAYER_SKINS,
  PLAYER_SKIN_MOTION,
  PLAYER_VISUAL_TOKENS,
  type PlayerSkinId
} from '../../../../content/visual/VisualTokens';
import type { PlayerTextureSet } from './PlayerVisualAssets';

/**
 * Modular player presentation. Every piece shares the SVG frame and is
 * animated with transforms; no gameplay rule or collision is changed here.
 */
export class PlayerView {
  public readonly root = new Container();
  private readonly textures: PlayerTextureSet;
  private readonly shadow: Sprite;
  private readonly ring: Sprite;
  private readonly weapons: Sprite;
  private readonly body: Sprite;
  private readonly core: Sprite;
  private readonly accent: Sprite;
  private readonly damageFlash: Sprite;
  private readonly signature: Sprite;
  private skin: PlayerSkinId = 'cyan';
  private facing = 0;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private damageAtSeconds = Number.NEGATIVE_INFINITY;
  private damageStrength = 0;
  private defeatProgress = -1;

  public constructor(textures: PlayerTextureSet, skin: PlayerSkinId = 'cyan') {
    this.textures = textures;
    this.shadow = new Sprite(textures.shadow);
    this.ring = new Sprite(textures.ring);
    this.weapons = new Sprite(textures.weapons);
    this.body = new Sprite(textures.body);
    this.core = new Sprite(textures.core);
    this.accent = new Sprite(textures.accent);
    this.damageFlash = new Sprite(textures.body);
    this.signature = new Sprite(textures.signature.cyan);
    this.damageFlash.tint = 0xffffff;
    this.damageFlash.alpha = 0;
    for (const part of [this.shadow, this.signature, this.ring, this.weapons, this.body, this.core, this.accent, this.damageFlash]) {
      part.anchor.set(0.5);
    }
    this.root.addChild(this.shadow, this.signature, this.ring, this.weapons, this.body, this.core, this.accent, this.damageFlash);
    this.setSkin(skin);
  }

  public setSkin(skin: PlayerSkinId): void {
    this.skin = skin;
    const colors = PLAYER_SKINS[skin];
    this.signature.texture = this.textures.signature[skin];
    this.signature.tint = colors.outer;
    this.shadow.tint = colors.shadow;
    this.ring.tint = colors.outer;
    this.weapons.tint = colors.weapon;
    this.body.tint = colors.body;
    this.core.tint = colors.core;
    this.accent.tint = colors.accent;
  }

  public get skinId(): PlayerSkinId {
    return this.skin;
  }

  /** Called by the app after the simulation accepts a damage event. */
  public playDamage(amount: number, animationSeconds: number): void {
    this.damageAtSeconds = animationSeconds;
    this.damageStrength = Math.min(1.4, Math.max(0.6, amount / 12));
  }

  public render(state: PlayerState, animationSeconds: number): void {
    this.root.position.set(state.x, state.y);
    if (this.lastX !== null && this.lastY !== null) {
      const dx = state.x - this.lastX;
      const dy = state.y - this.lastY;
      if (Math.hypot(dx, dy) > 0.01) this.facing = Math.atan2(dy, dx) + Math.PI / 2;
    }
    this.lastX = state.x;
    this.lastY = state.y;
    this.root.rotation = this.facing;

    const pulse = 1 + Math.sin(animationSeconds * 4.2) * PLAYER_VISUAL_TOKENS.idlePulseAmplitude;
    const motion = PLAYER_SKIN_MOTION[this.skin];
    const damageAge = animationSeconds - this.damageAtSeconds;
    const damageProgress = damageAge >= 0
      ? Math.min(1, damageAge / PLAYER_VISUAL_TOKENS.damageFlashSeconds)
      : 1;
    const damagePulse = damageProgress < 1 ? Math.sin(damageProgress * Math.PI) * this.damageStrength : 0;
    this.root.scale.set(
      pulse * (1 + damagePulse * PLAYER_VISUAL_TOKENS.damageSquash),
      pulse * (1 - damagePulse * PLAYER_VISUAL_TOKENS.damageSquash)
    );
    const defeat = Math.max(0, this.defeatProgress);
    this.body.rotation = -damagePulse * PLAYER_VISUAL_TOKENS.movementTiltRadians;
    this.weapons.rotation = damagePulse * PLAYER_VISUAL_TOKENS.movementTiltRadians;
    this.signature.rotation = animationSeconds * motion.signatureSpin;
    this.signature.scale.set(1 + Math.sin(animationSeconds * 3.2) * motion.signaturePulse);
    this.ring.rotation = -animationSeconds * motion.signatureSpin * 0.35;
    this.weapons.position.set(defeat * 26, defeat * 8);
    this.body.position.set(-defeat * 14, defeat * 12);
    this.core.position.set(0, -defeat * 28);
    this.accent.position.set(defeat * 18, -defeat * 16);
    this.ring.scale.set(1 + defeat * 0.45);
    this.damageFlash.position.set(0, 0);
    this.damageFlash.alpha = damagePulse * 0.72;
    this.damageFlash.scale.set(1 + damagePulse * 0.04);
    this.root.alpha = defeat > 0 ? 1 - defeat : state.health > 0 ? 1 : 0.72;
  }

  public playDefeat(): void {
    this.defeatProgress = 0;
  }

  public updateDefeat(deltaSeconds: number): void {
    if (this.defeatProgress < 0) return;
    this.defeatProgress = Math.min(1, this.defeatProgress + Math.max(0, deltaSeconds) / 0.9);
  }

  public reset(): void {
    this.lastX = null;
    this.lastY = null;
    this.facing = 0;
    this.damageAtSeconds = Number.NEGATIVE_INFINITY;
    this.damageStrength = 0;
    this.defeatProgress = -1;
    this.root.rotation = 0;
    this.root.scale.set(1);
    this.signature.rotation = 0;
    this.signature.scale.set(1);
    this.ring.rotation = 0;
    this.ring.scale.set(1);
    this.weapons.position.set(0, 0);
    this.body.position.set(0, 0);
    this.core.position.set(0, 0);
    this.accent.position.set(0, 0);
    this.damageFlash.alpha = 0;
  }
}
