import { Container, Text, TextStyle } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { ARENA_CENTER, LOGICAL_HEIGHT } from '../config/constants';
import { type FxQuality, type PlayerSkinId } from '../content/visual/VisualTokens';
import type { CombatRenderState } from '../simulation/combat/CombatRenderState';
import type { PlayerState } from '../simulation/PlayerModel';
import { ArenaView } from './pixi/ArenaView';
import { BossView } from './pixi/BossView';
import { CombatEntitiesView } from './pixi/CombatEntitiesView';
import { HazardView } from './pixi/HazardView';
import { ImpactFxView } from './pixi/fx/ImpactFxView';
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
  private readonly title: Text;
  private readonly hint: Text;

  public constructor(renderer: Renderer, playerSkin: PlayerSkinId = 'cyan', quality: FxQuality = 'medium') {
    this.root.addChild(this.world);
    this.entitiesView = new CombatEntitiesView(renderer, quality);
    this.weaponView = new WeaponView(renderer);
    this.levelUpFxView = new LevelUpFxView(renderer);
    this.playerView = new PlayerView(createPlayerTextures(renderer), playerSkin);
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

    this.title = new Text({
      text: 'GEOMETRY SURVIVOR',
      style: new TextStyle({
        fill: 0xeaf0ff,
        fontFamily: 'Arial, sans-serif',
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 4
      })
    });
    this.title.anchor.set(0.5, 0);
    this.title.position.set(ARENA_CENTER.x, 34);
    this.world.addChild(this.title);

    this.hint = new Text({
      text: 'Mantén pulsado y mueve para sobrevivir · WASD / flechas',
      style: new TextStyle({
        fill: 0xaab7d8,
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        align: 'center'
      })
    });
    this.hint.anchor.set(0.5, 1);
    this.hint.position.set(ARENA_CENTER.x, LOGICAL_HEIGHT - 26);
    this.world.addChild(this.hint);
  }

  public resize(viewport: ViewportState): void {
    this.root.scale.set(viewport.scale);
    this.root.position.set(viewport.offsetX, viewport.offsetY);
    this.world.position.set(viewport.worldOffsetX, viewport.worldOffsetY);
    this.root.hitArea = undefined;
  }

  public renderArena(radius: number, resonance = 0): void {
    this.arenaView.render(radius, resonance);
  }

  public renderCombat(combat: CombatRenderState, animationSeconds = 0): void {
    this.entitiesView.render(combat, animationSeconds);
    this.weaponView.render(combat);
  }

  public playEnemyDefeat(x: number, y: number, kind: CombatRenderState['enemies'][number]['kind']): void {
    this.entitiesView.playEnemyDefeat(x, y, kind);
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

  public playPlayerShot(animationSeconds: number): void {
    this.playerView.playShot(animationSeconds);
  }

  public setPlayerSkin(skin: PlayerSkinId): void {
    this.playerView.setSkin(skin);
  }

  public playPlayerDamage(x: number, y: number, amount: number, animationSeconds: number): void {
    this.playerView.playDamage(amount, animationSeconds);
    this.impactFxView.playPlayerDamage(x, y, amount);
  }

  public playPlayerDefeat(x: number, y: number): void {
    this.playerView.playDefeat();
    this.terminalFxView.playPlayerDefeat(x, y);
  }

  public playBossDefeat(x: number, y: number, radius: number): void {
    this.terminalFxView.playBossDefeat(x, y, radius);
  }

  public renderImpactFx(deltaSeconds: number): void {
    this.impactFxView.update(deltaSeconds);
    this.entitiesView.updateFx(deltaSeconds);
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
