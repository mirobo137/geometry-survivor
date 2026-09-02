import { Container, Graphics, Sprite } from 'pixi.js';
import type { FxQuality } from '../../../../content/visual/VisualTokens';
import { PLAYER_SPEED } from '../../../../config/constants';
import type { PlayerState } from '../../../../simulation/PlayerModel';
import type { ShotRenderState } from '../../../../simulation/combat/CombatRenderState';
import type { CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
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
  private readonly movementTrail: Graphics;
  private readonly ring: Sprite;
  private readonly weapons: Sprite;
  private readonly body: Sprite;
  private readonly core: Sprite;
  private readonly accent: Sprite;
  private readonly damageFlash: Sprite;
  private readonly shotFlash: Graphics;
  private readonly signature: Sprite;
  private skin: PlayerSkinId = 'cyan';
  private cannonSkin: CannonSkinId = 'basic';
  private facing = 0;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private damageAtSeconds = Number.NEGATIVE_INFINITY;
  private damageStrength = 0;
  private shotAtSeconds = Number.NEGATIVE_INFINITY;
  private shotDirectionX = 0;
  private shotDirectionY = -1;
  private shotMuzzleMask = 0;
  private shotLeftOriginX = 0;
  private shotLeftOriginY = 0;
  private shotRightOriginX = 0;
  private shotRightOriginY = 0;
  private defeatProgress = -1;
  private readonly quality: FxQuality;
  private lastAnimationSeconds: number | null = null;
  private movementStrength = 0;
  private movementTilt = 0;

  public constructor(
    textures: PlayerTextureSet,
    skin: PlayerSkinId = 'cyan',
    cannonSkin: CannonSkinId = 'basic',
    quality: FxQuality = 'medium'
  ) {
    this.textures = textures;
    this.quality = quality;
    this.shadow = new Sprite(textures.shadow);
    this.movementTrail = new Graphics();
    this.ring = new Sprite(textures.ring);
    this.weapons = new Sprite(textures.weapons[cannonSkin]);
    this.body = new Sprite(textures.body);
    this.core = new Sprite(textures.core);
    this.accent = new Sprite(textures.accent);
    this.damageFlash = new Sprite(textures.body);
    this.shotFlash = new Graphics();
    this.signature = new Sprite(textures.signature.cyan);
    this.damageFlash.tint = 0xffffff;
    this.damageFlash.alpha = 0;
    for (const part of [this.shadow, this.signature, this.ring, this.weapons, this.body, this.core, this.accent, this.damageFlash]) {
      part.anchor.set(0.5);
    }
    this.root.addChild(this.shadow, this.movementTrail, this.signature, this.ring, this.weapons, this.body, this.core, this.accent, this.damageFlash, this.shotFlash);
    this.setCannonSkin(cannonSkin);
    this.setSkin(skin);
  }

  public setSkin(skin: PlayerSkinId): void {
    this.skin = skin;
    const colors = PLAYER_SKINS[skin];
    this.signature.texture = this.textures.signature[skin];
    this.signature.tint = colors.outer;
    this.shadow.tint = colors.shadow;
    this.ring.tint = colors.outer;
    this.body.tint = colors.body;
    this.core.tint = colors.core;
    this.accent.tint = colors.accent;
  }

  public get skinId(): PlayerSkinId {
    return this.skin;
  }

  public get cannonSkinId(): CannonSkinId {
    return this.cannonSkin;
  }

  /** Cannon cosmetics are independent from the hull skin and only affect presentation. */
  public setCannonSkin(cannonSkin: CannonSkinId): void {
    this.cannonSkin = cannonSkin;
    this.weapons.texture = this.textures.weapons[cannonSkin];
    // Cannon SVGs own their palette so a body skin never recolors the loadout.
    this.weapons.tint = 0xffffff;
  }

  /** Called by the app after the simulation accepts a damage event. */
  public playDamage(amount: number, animationSeconds: number): void {
    this.damageAtSeconds = animationSeconds;
    this.damageStrength = Math.min(1.4, Math.max(0.6, amount / 12));
  }

  /** Presentation-only recoil signal; weapon cadence still belongs to simulation. */
  public playShot(animationSeconds: number, shot: Readonly<ShotRenderState>): void {
    this.shotAtSeconds = animationSeconds;
    this.shotDirectionX = shot.directionX;
    this.shotDirectionY = shot.directionY;
    this.shotMuzzleMask = shot.muzzleMask;
    this.shotLeftOriginX = shot.leftOriginX;
    this.shotLeftOriginY = shot.leftOriginY;
    this.shotRightOriginX = shot.rightOriginX;
    this.shotRightOriginY = shot.rightOriginY;
  }

  public render(state: PlayerState, animationSeconds: number): void {
    const frameDelta = this.lastAnimationSeconds === null
      ? 1 / 60
      : Math.min(0.1, Math.max(1 / 240, animationSeconds - this.lastAnimationSeconds));
    let velocityX = 0;
    let velocityY = 0;
    this.root.position.set(state.x, state.y);
    if (this.lastX !== null && this.lastY !== null) {
      const dx = state.x - this.lastX;
      const dy = state.y - this.lastY;
      velocityX = dx / frameDelta;
      velocityY = dy / frameDelta;
      if (Math.hypot(dx, dy) > 0.01) this.facing = Math.atan2(dy, dx) + Math.PI / 2;
    }
    this.lastX = state.x;
    this.lastY = state.y;
    this.lastAnimationSeconds = animationSeconds;
    this.root.rotation = this.facing;

    const movementSpeed = Math.hypot(velocityX, velocityY);
    const targetMovementStrength = Math.min(1, movementSpeed / PLAYER_SPEED);
    const movementSmoothing = 1 - Math.exp(-frameDelta * 14);
    this.movementStrength += (targetMovementStrength - this.movementStrength) * movementSmoothing;
    const facingCos = Math.cos(this.facing);
    const facingSin = Math.sin(this.facing);
    const localVelocityX = velocityX * facingCos + velocityY * facingSin;
    const targetMovementTilt = Math.min(1, Math.max(-1, localVelocityX / PLAYER_SPEED)) * PLAYER_VISUAL_TOKENS.movementTiltRadians;
    this.movementTilt += (targetMovementTilt - this.movementTilt) * movementSmoothing;

    const pulse = 1 + Math.sin(animationSeconds * 4.2) * PLAYER_VISUAL_TOKENS.idlePulseAmplitude;
    const motion = PLAYER_SKIN_MOTION[this.skin];
    const damageAge = animationSeconds - this.damageAtSeconds;
    const damageProgress = damageAge >= 0
      ? Math.min(1, damageAge / PLAYER_VISUAL_TOKENS.damageFlashSeconds)
      : 1;
    const damagePulse = damageProgress < 1 ? Math.sin(damageProgress * Math.PI) * this.damageStrength : 0;
    const shotAge = animationSeconds - this.shotAtSeconds;
    const shotProgress = shotAge >= 0
      ? Math.min(1, shotAge / PLAYER_VISUAL_TOKENS.shotFlashSeconds)
      : 1;
    const shotPulse = shotProgress < 1 ? Math.sin(shotProgress * Math.PI) : 0;
    const shotAimRotation = Math.atan2(this.shotDirectionY, this.shotDirectionX)
      - this.root.rotation
      + Math.PI / 2;
    const shotAimActive = shotProgress < 1 ? 1 : 0;
    this.root.scale.set(
      pulse * (1 + damagePulse * PLAYER_VISUAL_TOKENS.damageSquash),
      pulse * (1 - damagePulse * PLAYER_VISUAL_TOKENS.damageSquash)
    );
    const defeat = Math.max(0, this.defeatProgress);
    this.body.rotation = this.movementTilt - damagePulse * PLAYER_VISUAL_TOKENS.movementTiltRadians;
    this.weapons.rotation = -this.movementTilt * 0.65 + damagePulse * PLAYER_VISUAL_TOKENS.movementTiltRadians
      + shotAimRotation * shotAimActive
      - shotPulse * 0.025;
    this.signature.rotation = animationSeconds * motion.signatureSpin;
    this.signature.scale.set(1 + Math.sin(animationSeconds * 3.2) * motion.signaturePulse);
    this.ring.rotation = -animationSeconds * motion.signatureSpin * 0.35;
    this.weapons.position.set(defeat * 26, defeat * 8 + shotPulse * PLAYER_VISUAL_TOKENS.shotRecoilDistance);
    this.body.position.set(-defeat * 14, defeat * 12);
    this.core.position.set(0, -defeat * 28);
    this.accent.position.set(defeat * 18, -defeat * 16);
    this.ring.scale.set(1 + defeat * 0.45);
    this.damageFlash.position.set(0, 0);
    this.damageFlash.alpha = damagePulse * 0.72;
    this.damageFlash.scale.set(1 + damagePulse * 0.04);
    this.renderMovementTrail(animationSeconds);
    this.renderShotFlash(shotPulse, state);
    this.root.alpha = defeat > 0 ? 1 - defeat : state.health > 0 ? 1 : 0.72;
  }

  public playDefeat(): void {
    this.defeatProgress = 0;
  }

  public updateDefeat(deltaSeconds: number): void {
    if (this.defeatProgress < 0) return;
    // Keep the composed SVG pieces readable long enough to register the loss.
    // This is presentation timing only; the simulation is already terminal.
    this.defeatProgress = Math.min(1, this.defeatProgress + Math.max(0, deltaSeconds) / 2.2);
  }

  public reset(): void {
    this.lastX = null;
    this.lastY = null;
    this.lastAnimationSeconds = null;
    this.facing = 0;
    this.movementStrength = 0;
    this.movementTilt = 0;
    this.damageAtSeconds = Number.NEGATIVE_INFINITY;
    this.damageStrength = 0;
    this.shotAtSeconds = Number.NEGATIVE_INFINITY;
    this.shotDirectionX = 0;
    this.shotDirectionY = -1;
    this.shotMuzzleMask = 0;
    this.shotLeftOriginX = 0;
    this.shotLeftOriginY = 0;
    this.shotRightOriginX = 0;
    this.shotRightOriginY = 0;
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
    this.movementTrail.clear();
    this.movementTrail.visible = false;
    this.shotFlash.clear();
    this.shotFlash.visible = false;
    this.shotFlash.position.set(0, 0);
    this.shotFlash.rotation = 0;
  }

  private renderShotFlash(pulse: number, state: PlayerState): void {
    this.shotFlash.clear();
    if (pulse <= 0 || this.shotMuzzleMask === 0) {
      this.shotFlash.visible = false;
      return;
    }
    const color = PLAYER_SKINS[this.skin].accent;
    const alpha = pulse * 0.9;
    this.shotFlash.visible = true;
    const inverseRoot = -this.root.rotation;
    this.shotFlash.rotation = Math.atan2(this.shotDirectionY, this.shotDirectionX)
      + Math.PI / 2
      + inverseRoot;
    this.renderMuzzleFlash(
      this.shotLeftOriginX,
      this.shotLeftOriginY,
      state,
      color,
      pulse,
      alpha,
      (this.shotMuzzleMask & 1) !== 0
    );
    this.renderMuzzleFlash(
      this.shotRightOriginX,
      this.shotRightOriginY,
      state,
      color,
      pulse,
      alpha,
      (this.shotMuzzleMask & 2) !== 0
    );
  }

  private renderMovementTrail(animationSeconds: number): void {
    this.movementTrail.clear();
    const qualityAlpha = this.quality === 'high' ? 0.44 : this.quality === 'medium' ? 0.3 : 0;
    if (qualityAlpha <= 0 || this.movementStrength <= 0.01) {
      this.movementTrail.visible = false;
      return;
    }

    const thrust = 0.78 + Math.sin(animationSeconds * 22) * 0.22;
    const alpha = qualityAlpha * this.movementStrength * thrust;
    const length = 7 + this.movementStrength * 15;
    const width = 1.3 + this.movementStrength * 1.5;
    const color = PLAYER_SKINS[this.skin].accent;
    for (let index = 0; index < 2; index += 1) {
      const x = index === 0 ? -5 : 5;
      this.movementTrail
        .beginPath()
        .moveTo(x, 13)
        .lineTo(x, 13 + length)
        .stroke({ color, width, alpha });
    }
    this.movementTrail.visible = true;
  }

  private renderMuzzleFlash(
    originX: number,
    originY: number,
    state: PlayerState,
    color: number,
    pulse: number,
    alpha: number,
    visible: boolean
  ): void {
    if (!visible) return;
    const relativeX = originX - state.x;
    const relativeY = originY - state.y;
    const cos = Math.cos(-this.root.rotation);
    const sin = Math.sin(-this.root.rotation);
    const localX = relativeX * cos - relativeY * sin;
    const localY = relativeX * sin + relativeY * cos;
    const length = 8 + pulse * 10;
    this.shotFlash
      .beginPath()
      .moveTo(localX - 2, localY)
      .lineTo(localX, localY - length)
      .lineTo(localX + 2, localY)
      .lineTo(localX, localY - length * 0.42)
      .lineTo(localX - 2, localY)
      .stroke({ color, width: 2.4 + pulse * 1.6, alpha });
    this.shotFlash
      .beginPath()
      .circle(localX, localY, 1.6 + pulse * 1.8)
      .fill({ color: 0xffffff, alpha: alpha * 0.85 });
  }
}
