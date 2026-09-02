import { Container } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { type FxQuality, type PlayerSkinId } from '../content/visual/VisualTokens';
import type { CannonSkinId } from '../content/visual/CannonSkinDefinitions';
import type { BackgroundId } from '../content/visual/BackgroundDefinitions';
import type { CombatRenderState, ShotRenderState } from '../simulation/combat/CombatRenderState';
import type { PlayerState } from '../simulation/PlayerModel';
import { ArenaView } from './pixi/ArenaView';
import { BackgroundView } from './pixi/BackgroundView';
import { BossView } from './pixi/BossView';
import { CombatEntitiesView } from './pixi/CombatEntitiesView';
import { HazardView } from './pixi/HazardView';
import { ImpactFxView } from './pixi/fx/ImpactFxView';
import { ScreenFxView } from './pixi/fx/ScreenFxView';
import { TerminalFxView } from './pixi/fx/TerminalFxView';
import { PlayerView } from './pixi/characters/player/PlayerView';
import { createPlayerTextures } from './pixi/characters/player/PlayerVisualAssets';
import { LevelUpFxView, type LevelUpCardAnchor } from './pixi/ui/level-up/LevelUpFxView';
import { WeaponView } from './pixi/WeaponView';
import type { LevelUpCardInteractionKind } from '../ui/level-up/LevelUpCardInteraction';
import type { ViewportState } from './viewport/ViewportTransform';

/** Small presentation facade; domain rules stay in simulation systems. */
export class PixiGameView {
  public readonly root = new Container();
  private readonly backgroundView: BackgroundView;
  private readonly world = new Container();
  private readonly arenaView = new ArenaView();
  private readonly bossView = new BossView();
  private readonly entitiesView: CombatEntitiesView;
  private readonly weaponView: WeaponView;
  private readonly hazardView = new HazardView();
  private readonly playerView: PlayerView;
  private readonly impactFxView: ImpactFxView;
  private readonly terminalFxView: TerminalFxView;
  private readonly levelUpFxView: LevelUpFxView;
  private readonly screenFxView: ScreenFxView;
  private lastArenaRadius = -1;
  private worldOffsetX = 0;
  private worldOffsetY = 0;

  public constructor(
    renderer: Renderer,
    playerSkin: PlayerSkinId = 'cyan',
    quality: FxQuality = 'medium',
    cannonSkin: CannonSkinId = 'basic',
    background: BackgroundId = 'deep-space'
  ) {
    this.backgroundView = new BackgroundView(background, quality);
    this.root.addChild(this.backgroundView.root, this.world);
    this.screenFxView = new ScreenFxView(quality);
    this.entitiesView = new CombatEntitiesView(renderer, quality, cannonSkin);
    this.weaponView = new WeaponView(renderer, () => this.screenFxView.play('chain-hit'));
    this.levelUpFxView = new LevelUpFxView(renderer);
    this.playerView = new PlayerView(createPlayerTextures(renderer), playerSkin, cannonSkin, quality);
    this.impactFxView = new ImpactFxView(renderer, quality);
    this.terminalFxView = new TerminalFxView(renderer, quality);
    this.world.addChild(
      this.arenaView.root,
      this.entitiesView.root,
      this.weaponView.root,
      this.hazardView.root,
      this.bossView.root,
      this.playerView.root,
      this.impactFxView.root,
      this.terminalFxView.root
    );
    this.root.addChild(this.levelUpFxView.root);

  }

  public resize(viewport: ViewportState): void {
    this.root.scale.set(viewport.scale);
    this.root.position.set(viewport.offsetX, viewport.offsetY);
    this.backgroundView.resize(viewport.logicalWidth, viewport.logicalHeight);
    this.worldOffsetX = viewport.worldOffsetX;
    this.worldOffsetY = viewport.worldOffsetY;
    this.applyWorldOffset();
    this.root.hitArea = undefined;
  }

  public renderArena(radius: number, resonance = 0): void {
    if (this.lastArenaRadius >= 0 && radius > this.lastArenaRadius + 0.5) {
      this.screenFxView.play('arena-expansion');
    }
    this.lastArenaRadius = radius;
    this.arenaView.render(radius, resonance);
  }

  public renderCombat(combat: CombatRenderState, animationSeconds = 0): void {
    this.entitiesView.render(combat, animationSeconds);
    this.weaponView.render(combat);
  }

  public playEnemyDefeat(x: number, y: number, kind: CombatRenderState['enemies'][number]['kind']): void {
    this.entitiesView.playEnemyDefeat(x, y, kind);
    if (kind === 'tank' || kind === 'elite') this.screenFxView.play('enemy-defeat');
  }

  public renderLaser(state: CombatRenderState['laser'], arenaRadius: number): void {
    this.hazardView.renderLaser(state, arenaRadius);
  }

  public renderBoss(state: CombatRenderState['boss'], arenaRadius: number): void {
    this.bossView.render(state, arenaRadius);
  }

  public renderPlayer(state: PlayerState, animationSeconds = 0): void {
    this.playerView.render(state, animationSeconds);
  }

  public playPlayerShot(animationSeconds: number, shot: Readonly<ShotRenderState>): void {
    this.playerView.playShot(animationSeconds, shot);
  }

  public setPlayerSkin(skin: PlayerSkinId): void {
    this.playerView.setSkin(skin);
  }

  public setCannonSkin(skin: CannonSkinId): void {
    this.playerView.setCannonSkin(skin);
    this.entitiesView.setCannonSkin(skin);
  }

  public setBackground(background: BackgroundId): void {
    this.backgroundView.setBackground(background);
  }

  public playPlayerDamage(x: number, y: number, amount: number, animationSeconds: number): void {
    this.playerView.playDamage(amount, animationSeconds);
    this.impactFxView.playPlayerDamage(x, y, amount);
    this.screenFxView.play('player-damage');
  }

  public playPlayerGuard(kind: 'shield' | 'phase', animationSeconds: number): void {
    this.playerView.playGuard(kind, animationSeconds);
  }

  public playPlayerDefeat(x: number, y: number): void {
    this.playerView.playDefeat();
    this.terminalFxView.playPlayerDefeat(x, y);
    this.screenFxView.play('player-defeat');
  }

  public playBossDefeat(x: number, y: number, radius: number): void {
    this.terminalFxView.playBossDefeat(x, y, radius);
    this.screenFxView.play('boss-defeat');
  }

  public renderImpactFx(deltaSeconds: number): void {
    this.impactFxView.update(deltaSeconds);
    this.entitiesView.updateFx(deltaSeconds);
  }

  public updatePresentationFx(deltaSeconds: number): void {
    this.arenaView.update(deltaSeconds);
    this.screenFxView.update(deltaSeconds);
    this.applyWorldOffset();
  }

  public updateTerminalFx(deltaSeconds: number): void {
    this.playerView.updateDefeat(deltaSeconds);
    this.terminalFxView.update(deltaSeconds);
  }

  public resetPresentation(): void {
    this.playerView.reset();
    this.impactFxView.clear();
    this.terminalFxView.clear();
    this.entitiesView.reset();
    this.arenaView.reset();
    this.hazardView.reset();
    this.weaponView.reset();
    this.screenFxView.reset();
    this.lastArenaRadius = -1;
  }

  private applyWorldOffset(): void {
    this.world.position.set(this.worldOffsetX + this.screenFxView.x, this.worldOffsetY + this.screenFxView.y);
  }

  public openLevelUpFx(anchors: readonly LevelUpCardAnchor[]): void {
    this.levelUpFxView.open(anchors);
  }

  public handleLevelUpInteraction(kind: LevelUpCardInteractionKind, index: number): void {
    this.levelUpFxView.handleInteraction(kind, index);
  }

  public renderLevelUpFx(deltaSeconds: number): void {
    this.levelUpFxView.update(deltaSeconds);
  }

  public closeLevelUpFx(): void {
    this.levelUpFxView.close();
  }
}
