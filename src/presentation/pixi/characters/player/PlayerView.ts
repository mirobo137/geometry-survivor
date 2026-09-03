import { Container, Graphics, Sprite } from 'pixi.js';
import type { FxQuality } from '../../../../content/visual/VisualTokens';
import { PLAYER_SPEED } from '../../../../config/constants';
import type { PlayerState } from '../../../../simulation/PlayerModel';
import type { ShotRenderState } from '../../../../simulation/combat/CombatRenderState';
import { getCannonSkinDefinition, type CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
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
  private readonly weapons = new Container();
  private readonly weaponLeft: Sprite;
  private readonly weaponRight: Sprite;
  private readonly body: Sprite;
  private readonly core: Sprite;
  private readonly accent: Sprite;
  private readonly damageFlash: Sprite;
  private readonly guardFx: Graphics;
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
  private guardAtSeconds = Number.NEGATIVE_INFINITY;

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
    this.ring = new Sprite(textures.ring[skin]);
    this.weaponLeft = new Sprite(textures.weapons[cannonSkin].left);
    this.weaponRight = new Sprite(textures.weapons[cannonSkin].right);
    this.weapons.addChild(this.weaponLeft, this.weaponRight);
    this.body = new Sprite(textures.body[skin]);
    this.core = new Sprite(textures.core[skin]);
    this.accent = new Sprite(textures.accent);
    this.damageFlash = new Sprite(textures.body[skin]);
    this.shotFlash = new Graphics();
    this.guardFx = new Graphics();
    this.signature = new Sprite(textures.signature.cyan);
    this.damageFlash.tint = 0xffffff;
    this.damageFlash.alpha = 0;
    for (const part of [this.shadow, this.signature, this.ring, this.weaponLeft, this.weaponRight, this.body, this.core, this.accent, this.damageFlash]) {
      part.anchor.set(0.5);
    }
    this.root.addChild(this.shadow, this.movementTrail, this.signature, this.ring, this.weapons, this.body, this.core, this.accent, this.damageFlash, this.shotFlash, this.guardFx);
    this.setCannonSkin(cannonSkin);
    this.setSkin(skin);
  }

  public setSkin(skin: PlayerSkinId): void {
    this.skin = skin;
    const colors = PLAYER_SKINS[skin];
    this.signature.texture = this.textures.signature[skin];
    this.body.texture = this.textures.body[skin];
    this.ring.texture = this.textures.ring[skin];
    this.core.texture = this.textures.core[skin];
    this.damageFlash.texture = this.textures.body[skin];
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
    const barrels = this.textures.weapons[cannonSkin];
    this.weaponLeft.texture = barrels.left;
    this.weaponRight.texture = barrels.right;
    // Cannon SVGs own their palette so a body skin never recolors the loadout.
    this.weaponLeft.tint = 0xffffff;
    this.weaponRight.tint = 0xffffff;
  }

  /** Called by the app after the simulation accepts a damage event. */
  public playDamage(amount: number, animationSeconds: number): void {
    this.damageAtSeconds = animationSeconds;
    this.damageStrength = Math.min(1.4, Math.max(0.6, amount / 12));
  }

  public playGuard(animationSeconds: number): void {
    this.guardAtSeconds = animationSeconds;
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

  public render(state: PlayerState, animationSeconds: number, shieldChargeProgress = 0): void {
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
    const guardAge = animationSeconds - this.guardAtSeconds;
    const guardProgress = guardAge >= 0 ? Math.min(1, guardAge / 0.42) : 1;
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
      + shotAimRotation * shotAimActive;
    this.animateSkinSignature(animationSeconds, motion, targetMovementStrength);
    this.weapons.position.set(defeat * 26, defeat * 8);
    const kick = shotPulse * PLAYER_VISUAL_TOKENS.shotRecoilDistance;
    const leftKick = (this.shotMuzzleMask & 1) !== 0 ? kick : 0;
    const rightKick = (this.shotMuzzleMask & 2) !== 0 ? kick : 0;
    this.weaponLeft.position.set(leftKick * 0.88, leftKick * 0.47);
    this.weaponRight.position.set(-rightKick * 0.88, rightKick * 0.47);
    this.weaponLeft.rotation = -leftKick * 0.02;
    this.weaponRight.rotation = rightKick * 0.02;
    this.body.position.set(-defeat * 14, defeat * 12);
    this.core.position.set(0, -defeat * 28);
    this.accent.position.set(defeat * 18, -defeat * 16);
    this.ring.scale.set(1 + defeat * 0.45);
    this.damageFlash.position.set(0, 0);
    this.damageFlash.alpha = damagePulse * 0.72;
    this.damageFlash.scale.set(1 + damagePulse * 0.04);
    this.renderGuardFx(guardProgress, shieldChargeProgress, animationSeconds);
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
    this.guardAtSeconds = Number.NEGATIVE_INFINITY;
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
    this.ring.alpha = 1;
    this.core.alpha = 1;
    this.weapons.rotation = 0;
    this.weapons.position.set(0, 0);
    this.weaponLeft.position.set(0, 0);
    this.weaponRight.position.set(0, 0);
    this.weaponLeft.rotation = 0;
    this.weaponRight.rotation = 0;
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

  /**
   * Each skin has a distinctive animation personality. All transforms are
   * presentation-only and use the existing sprites — no allocations.
   */
  private animateSkinSignature(t: number, motion: { signatureSpin: number; signaturePulse: number }, movementStrength: number): void {
    const skin = this.skin;
    if (skin === 'cyan') {
      // Aurora: smooth heartbeat on ring, signature orbits steadily, ring
      // pulses stronger when moving
      const heartbeat = Math.sin(t * 2.8) * 0.5 + 0.5;
      this.signature.rotation = t * motion.signatureSpin;
      this.signature.scale.set(1 + Math.sin(t * 3.2) * motion.signaturePulse);
      this.ring.rotation = -t * motion.signatureSpin * 0.35;
      this.ring.alpha = 0.7 + heartbeat * 0.3 * Math.max(0.3, movementStrength);
    } else if (skin === 'violet') {
      // Eclipse: signature fragments orbit with variable speed, ring counter-
      // rotates and breathes with a crystalline stutter
      const stutter = Math.sin(t * 5.5) * 0.15;
      this.signature.rotation = t * motion.signatureSpin + stutter;
      this.signature.scale.set(1 + Math.sin(t * 2.4) * 0.03 + Math.sin(t * 7.1) * 0.015);
      this.ring.rotation = -t * 0.25;
      this.ring.alpha = 0.6 + Math.sin(t * 3.8) * 0.25;
    } else if (skin === 'amber') {
      // Solar: aspas spin faster, ring throbs with heat, core glows brighter
      // when still (charging up)
      const heat = 1 - movementStrength * 0.5;
      this.signature.rotation = t * motion.signatureSpin * 1.5;
      this.signature.scale.set(1 + Math.sin(t * 4.2) * 0.025 * heat);
      this.ring.rotation = -t * motion.signatureSpin * 0.55;
      this.core.alpha = 0.85 + heat * 0.15 * (0.5 + Math.sin(t * 6) * 0.5);
      this.ring.alpha = 0.55 + heat * 0.35 * (0.5 + Math.sin(t * 3.5) * 0.5);
    } else {
      // Verdant: blades open when moving, close when idle, each rotates
      // independently with organic asymmetry
      const openness = 0.85 + movementStrength * 0.15;
      this.signature.rotation = t * motion.signatureSpin + Math.sin(t * 1.8) * 0.08;
      this.signature.scale.set(openness + Math.sin(t * 2.5) * 0.02);
      this.ring.rotation = -t * motion.signatureSpin * 0.4 + Math.sin(t * 3.3) * 0.04;
      this.ring.alpha = 0.6 + movementStrength * 0.3;
    }
  }

  private renderShotFlash(pulse: number, state: PlayerState): void {
    this.shotFlash.clear();
    if (pulse <= 0 || this.shotMuzzleMask === 0) {
      this.shotFlash.visible = false;
      return;
    }
    const color = getCannonSkinDefinition(this.cannonSkin).accent;
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
    const length = 10 + pulse * 12;
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
      .circle(localX, localY, 2.2 + pulse * 2.4)
      .fill({ color: 0xffffff, alpha: alpha * 0.85 });
  }

  private renderGuardFx(blockProgress: number, shieldChargeProgress: number, animationSeconds: number): void {
    this.guardFx.clear();
    const charge = Math.min(1, Math.max(0, shieldChargeProgress));
    const blockPulse = blockProgress < 1 ? Math.sin(blockProgress * Math.PI) : 0;
    if (charge <= 0 && blockPulse <= 0) {
      this.guardFx.visible = false;
      return;
    }

    const auraPulse = 0.5 + Math.sin(animationSeconds * 4.5) * 0.5;
    const auraRadius = 29 + auraPulse * 1.5;
    if (charge > 0) {
      this.guardFx
        .beginPath()
        .circle(0, 0, auraRadius)
        .stroke({ color: 0x75e6ff, width: 1.2, alpha: 0.12 + charge * 0.12 });
      this.guardFx
        .beginPath()
        .arc(0, 0, auraRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge)
        .stroke({ color: 0x8cecff, width: 2.4 + charge * 1.6, alpha: 0.36 + charge * 0.5 + auraPulse * 0.08 });
      if (charge >= 0.999) {
        this.guardFx
          .beginPath()
          .circle(0, 0, auraRadius - 4)
          .stroke({ color: 0xd8fbff, width: 0.8, alpha: 0.2 + auraPulse * 0.1 });
      }
    }
    if (blockPulse > 0) {
      const impactRadius = 29 + blockProgress * 20;
      this.guardFx
        .beginPath()
        .circle(0, 0, impactRadius)
        .stroke({ color: 0xffd166, width: 2.8 + blockPulse * 2.2, alpha: blockPulse * 0.9 });
      for (let index = 0; index < 4; index += 1) {
        const angle = index * (Math.PI / 2) + Math.PI / 4;
        const inner = impactRadius - 3;
        const outer = impactRadius + 5 + blockProgress * 5;
        this.guardFx
          .beginPath()
          .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
          .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
          .stroke({ color: 0xffe7a1, width: 1.8, alpha: blockPulse * 0.75 });
      }
    }
    this.guardFx.visible = true;
  }
}
