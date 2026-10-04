import { Container, Sprite, Texture } from 'pixi.js';
import { CastArt } from './weapons/CastArt';
import { prepareArsenalTextures } from './weapons/ArsenalTextures';
import { getProjectileSkinArtIds, PROJECTILE_HEAD_SIZE, PROJECTILE_SKIN_ART } from '../../assets/fx/projectiles/ProjectileRasterAssets';
import type { Renderer } from 'pixi.js';
import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';
import type { BossId } from '../../content/bosses/BossDefinition';
import { ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import { FX_QUALITY, type FxQuality } from '../../content/visual/VisualTokens';
import { getCannonSkinDefinition, type CannonSkinId } from '../../content/visual/CannonSkinDefinitions';
import type { CombatRenderState, EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import chaserSvg from '../../assets/svg/enemies/chaser/chaser.svg?raw';
import fastSvg from '../../assets/svg/enemies/fast/fast.svg?raw';
import tankSvg from '../../assets/svg/enemies/tank/tank.svg?raw';
import eliteSvg from '../../assets/svg/enemies/elite/elite.svg?raw';
import bossSvg from '../../assets/svg/enemies/boss/boss.svg?raw';
import bossRearSvg from '../../assets/svg/enemies/boss/boss-rear.svg?raw';
import bossWingsSvg from '../../assets/svg/enemies/boss/boss-wings.svg?raw';
import bossHullSvg from '../../assets/svg/enemies/boss/boss-hull.svg?raw';
import bossCockpitSvg from '../../assets/svg/enemies/boss/boss-cockpit.svg?raw';
import { BossShipVisual, type BossShipTextures } from './enemies/BossShipVisual';
import orbiterSvg from '../../assets/svg/enemies/orbiter/orbiter.svg?raw';
import chargerSvg from '../../assets/svg/enemies/charger/charger.svg?raw';
import splitterSvg from '../../assets/svg/enemies/splitter/splitter.svg?raw';
import prismWeaverSvg from '../../assets/svg/enemies/prism-weaver/prism-weaver.svg?raw';
import wardenReplicaSvg from '../../assets/svg/enemies/warden-replica/warden-replica.svg?raw';
import orbitalWardenSvg from '../../assets/svg/enemies/boss/orbital-warden.svg?raw';
import orbitalWardenRearSvg from '../../assets/svg/enemies/boss/orbital-warden-rear.svg?raw';
import orbitalWardenWingsSvg from '../../assets/svg/enemies/boss/orbital-warden-wings.svg?raw';
import orbitalWardenHullSvg from '../../assets/svg/enemies/boss/orbital-warden-hull.svg?raw';
import orbitalWardenCockpitSvg from '../../assets/svg/enemies/boss/orbital-warden-cockpit.svg?raw';
import { FRACTURE_BOSS_SVGS, FRACTURE_ENEMY_SVGS } from '../../assets/svg/enemies/FractureEnemySvgMarkup';
import {
  ENEMY_RASTER_BOSS_IDS,
  ENEMY_RASTER_COMMON_IDS,
  loadEnemyRasterTextures,
  type EnemyRasterAssetId
} from './enemies/EnemyRasterTextures';
import { EnemyDefeatFxView } from './enemies/EnemyDefeatFxView';
import { EnemyShipVisual, type EnemyShipTextureMap, type EnemyShipTextureSet } from './enemies/EnemyShipVisual';
import { createSvgTexture, type SvgTextureFrame } from './SvgTextureFactory';
import { EnemyImpactFxView } from './fx/EnemyImpactFxView';
import { DamageNumberView } from './fx/DamageNumberView';
import { HealthBarView } from './entities/HealthBarView';
import { ProjectileTrailView } from './fx/ProjectileTrailView';
import { getProjectileCurveOffset, getProjectileCurveVelocity } from './fx/ProjectileMotionVisual';
import { OrbiterTelegraphView } from './OrbiterTelegraphView';
import { ChargerTelegraphView } from './ChargerTelegraphView';
import { PrismWeaverTelegraphView } from './PrismWeaverTelegraphView';
import { SpawnPortalView } from './enemies/SpawnPortalView';

import { CANNON_PROJECTILE_SVG, getCannonFallbackId } from '../../assets/svg/cannons/CannonSvgMarkup';

const ENEMY_TEXTURE_FRAME: SvgTextureFrame = {
  x: -32,
  y: -32,
  width: 64,
  height: 64
};

const PROJECTILE_TEXTURE_FRAME: SvgTextureFrame = {
  x: -16,
  y: -16,
  width: 32,
  height: 32
};

interface EnemyTextureSet {
  readonly ships: EnemyShipTextureMap;
  readonly boss: Readonly<Record<BossId, BossShipTextures>>;
}

const createEnemyFallback = (renderer: Renderer, svg: string): EnemyShipTextureSet => {
  const body = createSvgTexture(renderer, svg, ENEMY_TEXTURE_FRAME);
  // Common enemies already render as one image. Aliasing keeps their SVG body
  // as a fallback without embedding or rasterizing four unused component SVGs.
  return { flat: body, rear: body, wings: body, hull: body, cockpit: body };
};

const createEnemyTextures = (renderer: Renderer): EnemyTextureSet => ({
  ships: {
    chaser: createEnemyFallback(renderer, chaserSvg),
    fast: createEnemyFallback(renderer, fastSvg),
    tank: createEnemyFallback(renderer, tankSvg),
    elite: createEnemyFallback(renderer, eliteSvg),
    orbiter: createEnemyFallback(renderer, orbiterSvg),
    charger: createEnemyFallback(renderer, chargerSvg),
    splitter: createEnemyFallback(renderer, splitterSvg),
    'prism-weaver': createEnemyFallback(renderer, prismWeaverSvg),
    'warden-replica': createEnemyFallback(renderer, wardenReplicaSvg),
    'fracture-gunner': createEnemyFallback(renderer, FRACTURE_ENEMY_SVGS['fracture-gunner'].flat),
    'thorn-bastion': createEnemyFallback(renderer, FRACTURE_ENEMY_SVGS['thorn-bastion'].flat),
    'zigzag-reaver': createEnemyFallback(renderer, FRACTURE_ENEMY_SVGS['zigzag-reaver'].flat),
    'rift-miner': createEnemyFallback(renderer, FRACTURE_ENEMY_SVGS['rift-miner'].flat)
  },
  boss: {
    'core-sentinel': {
      flat: createSvgTexture(renderer, bossSvg, { x: -56, y: -56, width: 112, height: 112 }),
      parts: [bossRearSvg, bossWingsSvg, bossHullSvg, bossCockpitSvg].map(svg =>
        createSvgTexture(renderer, svg, { x: -56, y: -56, width: 112, height: 112 })
      ) as [Texture, Texture, Texture, Texture]
    },
    'orbital-warden': {
      flat: createSvgTexture(renderer, orbitalWardenSvg, { x: -56, y: -56, width: 112, height: 112 }),
      parts: [orbitalWardenRearSvg, orbitalWardenWingsSvg, orbitalWardenHullSvg, orbitalWardenCockpitSvg].map(svg =>
        createSvgTexture(renderer, svg, { x: -56, y: -56, width: 112, height: 112 })
      ) as [Texture, Texture, Texture, Texture]
    },
    'fracture-engine': {
      flat: createSvgTexture(renderer, FRACTURE_BOSS_SVGS.flat, { x: -56, y: -56, width: 112, height: 112 }),
      parts: [FRACTURE_BOSS_SVGS.rear, FRACTURE_BOSS_SVGS.wings, FRACTURE_BOSS_SVGS.hull, FRACTURE_BOSS_SVGS.cockpit].map(svg =>
        createSvgTexture(renderer, svg, { x: -56, y: -56, width: 112, height: 112 })
      ) as [Texture, Texture, Texture, Texture]
    }
  }
});

class EnemyVisual {
  public readonly root = new Container();
  private readonly ship: EnemyShipVisual;
  private hitAtSeconds = Number.NEGATIVE_INFINITY;
  private generation = -1;
  private readonly motionReduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(
    textures: EnemyTextureSet,
    phaseSeed: number,
    quality: FxQuality,
    private readonly bosses: Readonly<Record<BossId, BossShipVisual>>
  ) {
    this.ship = new EnemyShipVisual(textures.ships, phaseSeed, quality);
    this.root.addChild(this.ship.root);
  }

  public render(
    state: EnemyRenderState,
    animationSeconds: number,
    entranceProgress = 1,
    bossIntroProgress = 1
  ): void {
    this.root.visible = state.active;
    if (!state.active) {
      this.root.scale.set(1);
      return;
    }
    this.root.position.set(state.x, state.y);
    this.generation = state.generation ?? 0;
    const hitAge = animationSeconds - this.hitAtSeconds;
    const hitProgress = hitAge >= 0 ? Math.min(1, hitAge / 0.12) : 1;
    const punch = hitProgress < 1 ? 1 + Math.sin(hitProgress * Math.PI) * 0.045 : 1;
    this.root.scale.set(punch * (this.motionReduced ? 1 : 0.55 + 0.45 * entranceProgress));
    this.root.alpha = this.motionReduced ? 1 : 0.4 + 0.6 * entranceProgress;
    if (state.kind === 'boss') {
      this.root.visible = false;
      const boss = this.bosses[state.bossId ?? 'core-sentinel'];
      boss?.render(state, animationSeconds,
        hitProgress < 1 ? Math.sin(hitProgress * Math.PI) : 0, bossIntroProgress);
      return;
    }
    this.ship.render(state, animationSeconds, hitProgress < 1 ? Math.sin(hitProgress * Math.PI) : 0);
  }

  public playHit(animationSeconds: number): void {
    this.hitAtSeconds = animationSeconds;
  }

  public captureDefeatPose(kind: EnemyKind, generation?: number) {
    if (!this.root.visible || this.ship.currentKind !== kind || generation !== this.generation) return undefined;
    return this.ship.captureDefeatPose(this.root.scale.x, this.root.alpha);
  }

  public reset(): void {
    this.hitAtSeconds = Number.NEGATIVE_INFINITY;
    this.generation = -1;
    this.root.visible = false;
    this.root.scale.set(1);
    this.ship.reset();
  }
}

export class CombatEntitiesView {
  private readonly projectileArt = new CastArt();
  public readonly root = new Container();
  private readonly enemyLayer = new Container();
  private readonly projectileLayer = new Container();
  private readonly enemyTextures: EnemyTextureSet;
  private readonly bosses: Readonly<Record<BossId, BossShipVisual>>;
  private readonly enemyVisuals: EnemyVisual[] = [];
  private readonly projectileSprites: Sprite[] = [];
  private readonly projectileGlows: Sprite[] = [];
  private readonly enemyImpactFx: EnemyImpactFxView;
  private readonly enemyDefeatFx: EnemyDefeatFxView;
  private readonly spawnPortals: SpawnPortalView;
  private readonly orbiterTelegraphs: OrbiterTelegraphView;
  private readonly chargerTelegraphs: ChargerTelegraphView;
  private readonly prismWeaverTelegraphs: PrismWeaverTelegraphView;
  private readonly damageNumbers: DamageNumberView;
  private readonly healthBars: HealthBarView;
  private readonly projectileTrails: ProjectileTrailView;
  private readonly projectileTextures = new Map<CannonSkinId, Texture>();
  private cannonSkin: CannonSkinId;
  private readonly projectileGlowLimit: number;
  private destroyed = false;
  private readonly previousActive = Array.from({ length: ENEMY_POOL_CAPACITY }, () => false);
  private readonly previousHealth = Array.from({ length: ENEMY_POOL_CAPACITY }, () => 0);
  private readonly previousGeneration = Array.from({ length: ENEMY_POOL_CAPACITY }, () => 0);
  private readonly entranceAt = Array.from({ length: ENEMY_POOL_CAPACITY }, () => Number.NEGATIVE_INFINITY);

  public constructor(private readonly renderer: Renderer, quality: FxQuality = 'medium', cannonSkin: CannonSkinId = 'basic') {
    this.cannonSkin = cannonSkin;
    this.projectileGlowLimit = FX_QUALITY[quality].projectileGlowLimit;
    this.projectileLayer.label = 'player-projectiles';
    this.enemyImpactFx = new EnemyImpactFxView(renderer, quality);
    this.damageNumbers = new DamageNumberView(quality);
    this.healthBars = new HealthBarView(ENEMY_POOL_CAPACITY, quality);
    // Only the selected cosmetic enters the shared decoder/cache, never the gallery.
    this.projectileTrails = new ProjectileTrailView(PROJECTILE_POOL_CAPACITY, quality, cannonSkin);
    this.projectileTrails.root.label = 'player-projectile-trails';
    void prepareArsenalTextures(getProjectileSkinArtIds(cannonSkin, this.projectileGlowLimit > 0));
    this.enemyTextures = createEnemyTextures(renderer);
    this.bosses = {
      'core-sentinel': new BossShipVisual(this.enemyTextures.boss, quality),
      'orbital-warden': new BossShipVisual(this.enemyTextures.boss, quality),
      'fracture-engine': new BossShipVisual(this.enemyTextures.boss, quality)
    };
    this.bosses['core-sentinel'].setBossId('core-sentinel');
    this.bosses['orbital-warden'].setBossId('orbital-warden');
    this.bosses['fracture-engine'].setBossId('fracture-engine');
    for (const boss of Object.values(this.bosses)) this.enemyLayer.addChild(boss.root);
    this.enemyDefeatFx = new EnemyDefeatFxView(this.enemyTextures.ships, quality);
    this.spawnPortals = new SpawnPortalView(renderer, quality);
    this.orbiterTelegraphs = new OrbiterTelegraphView(quality);
    this.chargerTelegraphs = new ChargerTelegraphView(quality);
    this.prismWeaverTelegraphs = new PrismWeaverTelegraphView(quality);
    this.root.addChild(
      this.projectileLayer,
      this.projectileTrails.root,
      this.spawnPortals.root,
      this.enemyLayer,
      this.orbiterTelegraphs.root,
      this.chargerTelegraphs.root,
      this.prismWeaverTelegraphs.root,
      this.enemyDefeatFx.root,
      this.healthBars.root,
      this.enemyImpactFx.root,
      this.damageNumbers.root
    );
    // Put energy ribbons behind their heads, never over the white focal core.
    this.root.swapChildren(this.projectileLayer, this.projectileTrails.root);
    const fallback = this.getProjectileFallback(cannonSkin);
    for (let index = 0; index < ENEMY_POOL_CAPACITY; index += 1) {
      const visual = new EnemyVisual(this.enemyTextures, index * 0.713, quality, this.bosses);
      this.enemyVisuals.push(visual);
      this.enemyLayer.addChild(visual.root);
    }
    for (let index = 0; index < PROJECTILE_POOL_CAPACITY; index += 1) {
      if (index < this.projectileGlowLimit) {
        const glow = new Sprite(fallback);
        glow.label = 'projectile-glow';
        glow.anchor.set(0.5);
        glow.visible = false;
        glow.alpha = 0.28;
        glow.scale.set(1.9);
        this.projectileGlows.push(glow);
        this.projectileLayer.addChild(glow);
      }
      const sprite = new Sprite(fallback);
      sprite.label = 'projectile-head';
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.projectileSprites.push(sprite);
      this.projectileLayer.addChild(sprite);
    }
    this.root.once('destroyed', () => { this.destroyed = true; });
    void loadEnemyRasterTextures().then(textures => this.applyEnemyRasterTextures(textures));
  }

  private applyEnemyRasterTextures(textures: Partial<Record<EnemyRasterAssetId, Texture>>): void {
    if (this.destroyed) return;
    let commonTexturesChanged = false;
    for (const kind of ENEMY_RASTER_COMMON_IDS) {
      const raster = textures[kind];
      const set = this.enemyTextures.ships[kind];
      if (!raster || !set || set.flat === raster) continue;
      set.flat = raster;
      commonTexturesChanged = true;
    }
    if (commonTexturesChanged) this.enemyDefeatFx.refreshTextures();

    for (const bossId of ENEMY_RASTER_BOSS_IDS) {
      const raster = textures[bossId];
      const set = this.enemyTextures.boss[bossId];
      if (!raster || !set || set.flat === raster) continue;
      const previousFlat = set.flat;
      set.flat = raster;
      this.bosses[bossId].refreshBodyTexture(previousFlat);
    }
  }

  public setCannonSkin(cannonSkin: CannonSkinId): void {
    this.cannonSkin = cannonSkin;
    this.projectileTrails.setCannonSkin(cannonSkin);
    this.projectileArt.clear();
    void prepareArsenalTextures(getProjectileSkinArtIds(cannonSkin, this.projectileGlowLimit > 0));
    const texture = this.getProjectileFallback(cannonSkin);
    for (const sprite of this.projectileSprites) sprite.texture = texture;
    for (const glow of this.projectileGlows) glow.texture = texture;
  }

  /** Keep the authored vector fallback, rasterized only when its skin is selected. */
  private getProjectileFallback(skin: CannonSkinId): Texture {
    const id = getCannonFallbackId(skin);
    const existing = this.projectileTextures.get(id);
    if (existing) return existing;
    const texture = createSvgTexture(this.renderer, CANNON_PROJECTILE_SVG[id], PROJECTILE_TEXTURE_FRAME);
    this.projectileTextures.set(id, texture);
    return texture;
  }

  /** Bounded presentation count used by the local baseline profiler. */
  public get activeFxCount(): number {
    return this.enemyImpactFx.activeParticleCount
      + this.enemyImpactFx.activeBurstCount
      + this.enemyDefeatFx.activeCount
      + Number(this.bosses['core-sentinel'].isDefeatActive)
      + Number(this.bosses['orbital-warden'].isDefeatActive)
      + Number(this.bosses['fracture-engine'].isDefeatActive)
      + this.spawnPortals.activeCount
      + this.damageNumbers.activeCount
      + this.projectileTrails.activeSegmentCount;
  }

  public render(
    combat: Pick<CombatRenderState, 'enemies' | 'projectiles' | 'boss' | 'bosses'>,
    animationSeconds = 0,
    bossId: BossId = 'core-sentinel'
  ): void {
    void bossId;
    for (const boss of Object.values(this.bosses)) boss.beginFrame();
    this.projectileTrails.render(combat.projectiles);
    this.orbiterTelegraphs.render(combat.enemies);
    this.chargerTelegraphs.render(combat.enemies);
    this.prismWeaverTelegraphs.render(combat.enemies, animationSeconds);
    const cannonDefinition = getCannonSkinDefinition(this.cannonSkin);
    const trailKind = cannonDefinition.trail;
    for (let index = 0; index < this.enemyVisuals.length; index += 1) {
      const state = combat.enemies[index];
      const wasActive = this.previousActive[index];
      const generation = state.generation ?? 0;
      if (state.active) {
        if (!wasActive || this.previousGeneration[index] !== generation) {
          this.entranceAt[index] = state.kind !== 'boss'
            && this.spawnPortals.playEnemy(state.x, state.y, state.radius, state.kind, animationSeconds)
            ? animationSeconds : Number.NEGATIVE_INFINITY;
        }
        if (wasActive && state.health < this.previousHealth[index] - 0.001) {
          const amount = this.previousHealth[index] - state.health;
          this.enemyImpactFx.playHit(state.x, state.y, state.radius, state.kind);
          this.damageNumbers.playHit(index, state.x, state.y, state.radius, amount, state.kind);
          this.healthBars.noteDamage(index, animationSeconds);
          this.enemyVisuals[index].playHit(animationSeconds);
        }
      }
      const entranceAge = animationSeconds - this.entranceAt[index];
      const entranceProgress = Number.isFinite(entranceAge)
        ? Math.max(0, Math.min(1, entranceAge / 0.26)) : 1;
      const bossIntro = state.kind === 'boss'
        ? combat.bosses?.find(candidate => candidate.active && candidate.bossId === state.bossId)
          ?? combat.boss
        : undefined;
      this.enemyVisuals[index].render(state, animationSeconds, entranceProgress,
        bossIntro?.phase === 'intro' ? bossIntro.progress : 1);
      this.previousActive[index] = state.active;
      this.previousHealth[index] = state.health;
      this.previousGeneration[index] = generation;
    }
    this.spawnPortals.render(animationSeconds, combat.boss, combat.bosses);
    this.healthBars.render(combat.enemies, animationSeconds);

    for (let index = 0; index < this.projectileSprites.length; index += 1) {
      const state = combat.projectiles[index];
      const sprite = this.projectileSprites[index];
      const glow = this.projectileGlows[index] ?? null;
      this.projectileArt.begin(index, state.active, state.ageSeconds);
      sprite.visible = state.active;
      if (glow) glow.visible = state.active;
      if (!state.active) continue;
      const speed = Math.hypot(state.vx, state.vy);
      const directionX = speed > 0.5 ? state.vx / speed : 1;
      const directionY = speed > 0.5 ? state.vy / speed : 0;
      const normalX = -directionY;
      const normalY = directionX;
      const curveOffset = getProjectileCurveOffset(state, trailKind);
      const px = state.x + normalX * curveOffset;
      const py = state.y + normalY * curveOffset;
      sprite.position.set(px, py);
      const curveVelocity = getProjectileCurveVelocity(state, trailKind);
      const rot = Math.atan2(state.vy + normalY * curveVelocity, state.vx + normalX * curveVelocity);
      sprite.rotation = rot;
      const pulse = 1 + Math.sin(state.ageSeconds * 28) * 0.09;
      const evolutionScale = state.radius / 7;
      const evolutionTint = state.evolution === 'rail_lance'
        ? 0xffd978 : state.evolution === 'pulse_volley' ? 0x9fffe8 : 0xffffff;
      // Evolution bodies keep their approved art; base shots use the chosen pack.
      const art = this.projectileArt.get(index, state.evolution ?? PROJECTILE_SKIN_ART[this.cannonSkin].headId);
      const width = state.evolution ? 32 : PROJECTILE_HEAD_SIZE.width;
      const scale = pulse * evolutionScale * (art ? width / art.width : 1);
      sprite.texture = art ?? this.getProjectileFallback(this.cannonSkin);
      sprite.tint = art ? 0xffffff : evolutionTint;
      sprite.scale.set(scale);
      if (glow) {
        glow.position.set(px, py);
        glow.rotation = rot;
        glow.texture = sprite.texture;
        glow.tint = art ? cannonDefinition.accent : evolutionTint;
        glow.scale.set(scale * (art ? 1.5 : 1.9));
        glow.alpha = art ? 0.1 + Math.sin(state.ageSeconds * 14) * 0.025 : 0.22 + Math.sin(state.ageSeconds * 14) * 0.06;
      }
    }
  }

  public playEnemyDefeat(x: number, y: number, kind: EnemyKind, enemyIndex?: number, generation?: number): void {
    this.enemyImpactFx.playDefeat(x, y, kind);
    if (kind !== 'boss') {
      const pose = enemyIndex !== undefined
        ? this.enemyVisuals[enemyIndex]?.captureDefeatPose(kind, generation) : undefined;
      this.enemyDefeatFx.play(x, y, kind, pose);
    }
  }

  public playBossDefeat(x: number, y: number, bossId: BossId = 'core-sentinel', radius?: number): void {
    this.bosses[bossId].playDefeat(x, y);
    this.enemyImpactFx.playDefeat(x, y, 'boss', radius);
  }

  public setVisibleWorldBounds(left: number, top: number, right: number, bottom: number): void {
    this.spawnPortals.setVisibleWorldBounds(left, top, right, bottom);
  }

  public updateBossDefeat(deltaSeconds: number): void {
    for (const boss of Object.values(this.bosses)) boss.update(deltaSeconds);
  }

  public updateFx(deltaSeconds: number): void {
    this.enemyImpactFx.update(deltaSeconds);
    this.enemyDefeatFx.update(deltaSeconds);
    this.damageNumbers.update(deltaSeconds);
  }

  public reset(preserveDefeatFx = false): void {
    this.projectileArt.clear();
    for (const boss of Object.values(this.bosses)) {
      if (!preserveDefeatFx || !boss.isDefeatActive) boss.reset();
    }
    if (!preserveDefeatFx) {
      this.enemyImpactFx.clear();
      this.enemyDefeatFx.clear();
    }
    this.spawnPortals.reset();
    this.orbiterTelegraphs.reset();
    this.chargerTelegraphs.reset();
    this.prismWeaverTelegraphs.reset();
    this.damageNumbers.clear();
    this.healthBars.clear();
    this.projectileTrails.clear();
    for (let index = 0; index < this.enemyVisuals.length; index += 1) {
      this.previousActive[index] = false;
      this.previousHealth[index] = 0;
      this.previousGeneration[index] = 0;
      this.entranceAt[index] = Number.NEGATIVE_INFINITY;
      this.enemyVisuals[index].reset();
    }
    for (const sprite of this.projectileSprites) sprite.visible = false;
    for (const glow of this.projectileGlows) glow.visible = false;
  }
}
