import { Container, Text, TextStyle } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { ARENA_CENTER, LOGICAL_HEIGHT } from '../config/constants';
import type { CombatRenderState } from '../simulation/combat/CombatRenderState';
import type { PlayerState } from '../simulation/PlayerModel';
import { ArenaView } from './pixi/ArenaView';
import { BossView } from './pixi/BossView';
import { CombatEntitiesView } from './pixi/CombatEntitiesView';
import { HazardView } from './pixi/HazardView';
import { PlayerView } from './pixi/PlayerView';
import { WeaponView } from './pixi/WeaponView';
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
  private readonly playerView = new PlayerView();
  private readonly title: Text;
  private readonly hint: Text;

  public constructor(renderer: Renderer) {
    this.root.addChild(this.world);
    this.entitiesView = new CombatEntitiesView(renderer);
    this.weaponView = new WeaponView(renderer);
    this.world.addChild(
      this.arenaView.root,
      this.entitiesView.root,
      this.weaponView.root,
      this.hazardView.root,
      this.bossView.root,
      this.playerView.root
    );

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

  public renderCombat(combat: CombatRenderState): void {
    this.entitiesView.render(combat);
    this.weaponView.render(combat);
  }

  public renderLaser(state: CombatRenderState['laser'], arenaRadius: number): void {
    this.hazardView.renderLaser(state, arenaRadius);
  }

  public renderBoss(state: CombatRenderState['boss'], arenaRadius: number): void {
    this.bossView.render(state, arenaRadius);
  }

  public renderPlayer(state: PlayerState): void {
    this.playerView.render(state);
  }
}
