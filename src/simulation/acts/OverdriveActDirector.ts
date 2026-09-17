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
    return ACT_DIRECTORS[this.bossActId].bossDefinition;
  }

  public override get bossStartSeconds(): number {
    return ACT_DIRECTORS[this.bossActId].bossStartSeconds;
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
