import type { EnemyKind } from '../../content/enemies/EnemyDefinitions';
import {
  RADIAL_ACT_DEFINITION,
  type ActDefinition
} from '../../content/run/ActDefinitions';
import type { ArenaLaserPressure, ArenaShape, ArenaShapeChangeDefinition } from '../../content/run/ArenaShapeDefinitions';
import { getActIArenaLaserPressure } from '../../content/run/ArenaShapeDefinitions';
import type { BossDefinition } from '../../content/bosses/BossDefinition';
import type { RadialPulseDefinition } from '../../content/hazards/RadialPulseDefinition';
import type { PulseRingDefinition } from '../../content/hazards/PulseRingDefinition';
import type { AngularSweepDefinition } from '../../content/hazards/AngularSweepDefinition';

/**
 * The single simulation-facing consumer of ActDefinition for Act I.
 * Systems receive this narrow authored director instead of importing an act
 * registry or embedding the Radial timeline themselves.
 */
export class RadialActDirector {
  public constructor(public readonly definition: ActDefinition = RADIAL_ACT_DEFINITION) {}

  public get bossDefinition(): BossDefinition {
    return this.definition.boss;
  }

  public get bossStartSeconds(): number {
    return this.definition.bossStartSeconds;
  }

  public get radialPulseDefinition(): RadialPulseDefinition {
    return this.definition.radialPulse;
  }

  public get pulseRingDefinition(): PulseRingDefinition {
    return this.definition.pulseRing;
  }

  public get angularSweepDefinition(): AngularSweepDefinition {
    return this.definition.angularSweep;
  }

  public get arenaShapeChanges(): readonly ArenaShapeChangeDefinition[] {
    return this.definition.arenaShapeChanges;
  }

  public get initialArenaShape(): ArenaShape {
    return this.definition.initialArenaShape;
  }

  public getSpawnIntervalSeconds(elapsedSeconds: number): number {
    const elapsed = Math.max(0, elapsedSeconds);
    for (let index = this.definition.spawnPhases.length - 1; index >= 0; index -= 1) {
      const phase = this.definition.spawnPhases[index];
      if (elapsed >= phase.startSeconds) return phase.spawnIntervalSeconds;
    }
    return this.definition.spawnPhases[0].spawnIntervalSeconds;
  }

  /** Selects the authored enemy mix without randomness or hidden adaptation. */
  public selectEnemyKind(elapsedSeconds: number, spawnIndex: number): EnemyKind {
    const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
    let profile = this.definition.spawnProfiles[0];
    for (let index = this.definition.spawnProfiles.length - 1; index >= 0; index -= 1) {
      const candidate = this.definition.spawnProfiles[index];
      if (elapsed >= candidate.startSeconds) {
        profile = candidate;
        break;
      }
    }
    if (profile.eliteKind && profile.eliteEvery && spawnIndex % profile.eliteEvery === 0) {
      return profile.eliteKind;
    }
    if (profile.supportKind && profile.supportEvery && spawnIndex > 0 && spawnIndex % profile.supportEvery === 0) {
      return profile.supportKind;
    }
    if (profile.overrideKind && profile.overrideEvery && spawnIndex % profile.overrideEvery === 0) {
      return profile.overrideKind;
    }
    if (profile.alternateKind && profile.alternateEvery && spawnIndex % profile.alternateEvery === 0) {
      return profile.alternateKind;
    }
    return profile.defaultKind;
  }

  /** Keeps the current Act I laser pressure available to the same boundary. */
  public getLaserPressure(shape: ArenaShape, shapeIndex: number): ArenaLaserPressure {
    return getActIArenaLaserPressure(shape, shapeIndex);
  }
}

/** Read-only entry point for non-simulation debug/bootstrap consumers. */
export const RADIAL_ACT_DIRECTOR = new RadialActDirector();
