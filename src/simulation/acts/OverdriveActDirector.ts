import type { BossDefinition } from '../../content/bosses/BossDefinition';
import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';
import type { ActId } from '../../content/run/ActDefinitions';
import {
  createOverdriveStageState,
  getFirstLapActId,
  OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS,
  type OverdriveStageState
} from '../../content/run/OverdriveDefinitions';
import { AngularActDirector } from './AngularActDirector';
import { FractureActDirector } from './FractureActDirector';
import { RadialActDirector } from './RadialActDirector';

const ACT_ORDER: readonly ActId[] = ['radial', 'angular', 'fracture'];
const BOSS_ORDER = ['core-sentinel', 'orbital-warden', 'fracture-engine'] as const;

export type OverdriveBossPair = 'core-warden' | 'core-fracture' | 'warden-fracture';
const ACT_DIRECTORS: Readonly<Record<ActId, RadialActDirector>> = {
  radial: new RadialActDirector(),
  angular: new AngularActDirector(),
  fracture: new FractureActDirector()
};

/** Only normal authored families may be selected as Overdrive guests. */
const NORMAL_ENEMIES: Readonly<Record<ActId, readonly EnemyKind[]>> = {
  radial: ['chaser', 'fast', 'tank', 'elite'],
  angular: ['orbiter', 'charger', 'splitter', 'prism-weaver'],
  fracture: ['fracture-gunner', 'thorn-bastion', 'zigzag-reaver', 'rift-miner']
};

const stageArenaAct = (stage: number): ActId => {
  const normalized = createOverdriveStageState(stage, 1).stage;
  const firstLapAct = getFirstLapActId(normalized);
  if (firstLapAct !== null) return firstLapAct;
  if (normalized >= 10) return 'fracture';
  return normalized % 3 === 0 ? 'fracture' : 'angular';
};

const stageBossAct = (stage: number): ActId => (
  getFirstLapActId(stage) ?? ACT_ORDER[(createOverdriveStageState(stage, 1).stage - 1) % ACT_ORDER.length] ?? 'radial'
);

const stagePrimaryEnemyAct = (stage: number): ActId => (
  getFirstLapActId(stage)
    ?? ACT_ORDER[(createOverdriveStageState(stage, 1).stage - 1) % ACT_ORDER.length]
    ?? 'radial'
);

/** Small stateless mixer keeps guest selection reproducible without allocations. */
const sample = (seed: number, spawnIndex: number, salt: number): number => {
  let value = (seed ^ Math.imul(Math.max(0, Math.floor(spawnIndex)) + 1, 0x9e3779b9) ^ salt) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
};

const normalizeSpawnIndex = (spawnIndex: number): number => (
  Number.isFinite(spawnIndex) ? Math.max(0, Math.floor(spawnIndex)) : 0
);

const pairToBossIds = (pair: OverdriveBossPair): readonly BossDefinition['id'][] => {
  if (pair === 'core-warden') return ['core-sentinel', 'orbital-warden'];
  if (pair === 'core-fracture') return ['core-sentinel', 'fracture-engine'];
  return ['orbital-warden', 'fracture-engine'];
};

/**
 * Composes authored act directors for an Overdrive stage. It deliberately
 * extends the existing director contract so EnemySystem, ArenaModel and the
 * hazard systems can consume it without knowing about Overdrive.
 */
export class OverdriveActDirector extends RadialActDirector {
  public stageState: OverdriveStageState;
  public arenaActId: ActId;
  public bossActId: ActId;
  public primaryEnemyActId: ActId;
  private primaryEnemyDirector: RadialActDirector;
  private pairHistoryStage = 9;
  private pairHistorySeed = 0;
  private pairHistoryPrevious = false;
  private pairHistoryBeforePrevious = false;
  private pairHistoryCurrent = false;

  public constructor(stage: number, seed: unknown) {
    const stageState = createOverdriveStageState(stage, seed);
    const arenaActId = stageArenaAct(stageState.stage);
    super(ACT_DIRECTORS[arenaActId].definition);
    this.stageState = stageState;
    this.arenaActId = arenaActId;
    this.bossActId = stageBossAct(stageState.stage);
    this.primaryEnemyActId = stagePrimaryEnemyAct(stageState.stage);
    this.primaryEnemyDirector = ACT_DIRECTORS[this.primaryEnemyActId];
  }

  public override get enemyHealthMultiplier(): number {
    return this.stageState.healthMultiplier;
  }

  /** Changes only the authored stage profile; run-owned build state lives on. */
  public setStage(stage: number, seed: unknown = this.stageState.seed): void {
    const nextState = createOverdriveStageState(stage, seed);
    this.stageState = nextState;
    this.arenaActId = stageArenaAct(nextState.stage);
    this.bossActId = stageBossAct(nextState.stage);
    this.primaryEnemyActId = stagePrimaryEnemyAct(nextState.stage);
    this.primaryEnemyDirector = ACT_DIRECTORS[this.primaryEnemyActId];
    this.definition = ACT_DIRECTORS[this.arenaActId].definition;
  }

  public override get bossDefinition(): BossDefinition {
    const definition = ACT_DIRECTORS[this.bossActId].bossDefinition;
    // The fourth stage onward uses the Fracture boss window for every
    // rotated boss. Keep campaign definitions immutable and override only
    // the stage-owned entry time consumed by BossSystem.
    return this.stageState.stage >= 10
      ? { ...definition, startSeconds: 250 }
      : definition;
  }

  public override get bossStartSeconds(): number {
    return this.stageState.stage >= 10
      ? 250
      : ACT_DIRECTORS[this.bossActId].bossStartSeconds;
  }

  /**
   * Returns the bounded boss encounter for the current stage. The first nine
   * stages remain single-boss authored content; from stage ten onward the
   * seeded 50% roll can add one of the other two models. A pair override is
   * intentionally available to the reproducible QA routes only.
   */
  public getBossEncounter(pairOverride?: OverdriveBossPair): readonly BossDefinition[] {
    const primary = ACT_DIRECTORS[this.bossActId].bossDefinition;
    const pair = pairOverride === undefined ? this.shouldUseDoubleBoss() : pairOverride;
    const ids = pair === false
      ? [primary.id]
      : pair === true
        ? [primary.id, this.pickSecondaryBossId(primary.id)]
        : pairToBossIds(pair);
    return ids.map((id) => {
      const authored = id === 'core-sentinel'
        ? ACT_DIRECTORS.radial.bossDefinition
        : id === 'orbital-warden'
          ? ACT_DIRECTORS.angular.bossDefinition
          : ACT_DIRECTORS.fracture.bossDefinition;
      return this.stageState.stage >= 10 ? { ...authored, startSeconds: 250 } : authored;
    });
  }

  private pickSecondaryBossId(primary: BossDefinition['id']): BossDefinition['id'] {
    const alternatives = BOSS_ORDER.filter((id) => id !== primary);
    return alternatives[Math.floor(sample(this.stageState.seed, this.stageState.stage, 0x51ed270b) * alternatives.length)]
      ?? alternatives[0] ?? 'orbital-warden';
  }

  private shouldUseDoubleBoss(): boolean {
    if (this.stageState.stage < 10) return false;
    // Only the last two outcomes affect the forced-pair rule. Reconstruct the
    // deterministic suffix once, then advance one bounded state per stage so
    // a long sequential run does not replay the whole history on every stage.
    if (this.pairHistorySeed !== this.stageState.seed
      || this.pairHistoryStage > this.stageState.stage) {
      this.pairHistoryStage = 9;
      this.pairHistorySeed = this.stageState.seed;
      this.pairHistoryPrevious = false;
      this.pairHistoryBeforePrevious = false;
      this.pairHistoryCurrent = false;
    }
    for (let stage = this.pairHistoryStage + 1; stage <= this.stageState.stage; stage += 1) {
      const forced: boolean = !this.pairHistoryPrevious && !this.pairHistoryBeforePrevious;
      this.pairHistoryCurrent = forced || sample(this.stageState.seed, stage, 0x4c1f0a2d) < 0.5;
      this.pairHistoryBeforePrevious = this.pairHistoryPrevious;
      this.pairHistoryPrevious = this.pairHistoryCurrent;
      this.pairHistoryStage = stage;
    }
    return this.pairHistoryCurrent;
  }

  /**
   * Stage 1–3 use the authored boss timeline. Later stages retain the same
   * Act I→II→III boss rotation while the arena can stay on the Fracture
   * profile. Double-boss selection belongs to the later boss-system phase.
   */
  public override selectEnemyKind(elapsedSeconds: number, spawnIndex: number): EnemyKind {
    const index = normalizeSpawnIndex(spawnIndex);
    const { lap, stage } = this.stageState;
    if (lap === 1) return this.primaryEnemyDirector.selectEnemyKind(elapsedSeconds, index);

    if (stage >= 10) {
      const actIndex = Math.min(
        ACT_ORDER.length - 1,
        Math.floor(sample(this.stageState.seed, index, 0x4f1bbcdc) * ACT_ORDER.length)
      );
      const act = ACT_ORDER[actIndex] ?? 'radial';
      const enemies = NORMAL_ENEMIES[act];
      return enemies[Math.floor(sample(this.stageState.seed, index, 0x7f4a7c15) * enemies.length)] ?? enemies[0];
    }

    const mainWeight = lap === 2 ? 0.8 : 0.65;
    if (sample(this.stageState.seed, index, 0x1b873593) < mainWeight) {
      return this.primaryEnemyDirector.selectEnemyKind(elapsedSeconds, index);
    }
    const guestActs = ACT_ORDER.filter((act) => act !== this.primaryEnemyActId);
    const guestAct = guestActs[Math.floor(sample(this.stageState.seed, index, 0x6a09e667) * guestActs.length)] ?? guestActs[0] ?? 'radial';
    const enemies = NORMAL_ENEMIES[guestAct];
    return enemies[Math.floor(sample(this.stageState.seed, index, 0xbb67ae85) * enemies.length)] ?? enemies[0];
  }

  /** Pressure raises spawn frequency while preserving the authored timeline. */
  public override getSpawnIntervalSeconds(elapsedSeconds: number): number {
    // Stage 10+ adopts the Act III chronology for the shared arena. Earlier
    // mixed stages keep the cadence of their primary enemy family.
    const cadenceDirector = this.stageState.stage >= 10
      ? ACT_DIRECTORS[this.arenaActId]
      : this.primaryEnemyDirector;
    return Math.max(
      OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS,
      cadenceDirector.getSpawnIntervalSeconds(elapsedSeconds)
        / this.stageState.pressureMultiplier
    );
  }
}
