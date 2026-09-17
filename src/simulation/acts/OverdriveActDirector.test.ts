import { describe, expect, it } from 'vitest';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { AngularActDirector } from './AngularActDirector';
import { FractureActDirector } from './FractureActDirector';
import { RadialActDirector } from './RadialActDirector';
import { OverdriveActDirector } from './OverdriveActDirector';

describe('OverdriveActDirector', () => {
  it('reuses each authored act unchanged during the first lap', () => {
    const stages = [
      { stage: 1, arena: 'radial', boss: 'core-sentinel', enemy: 'chaser', health: 1 },
      { stage: 2, arena: 'angular', boss: 'orbital-warden', enemy: 'orbiter', health: 3 },
      { stage: 3, arena: 'fracture', boss: 'fracture-engine', enemy: 'fracture-gunner', health: 6 }
    ] as const;

    for (const expected of stages) {
      const director = new OverdriveActDirector(expected.stage, 0x1234);
      expect(director.arenaActId).toBe(expected.arena);
      expect(director.bossDefinition.id).toBe(expected.boss);
      expect(director.selectEnemyKind(0, 1)).toBe(expected.enemy);
      expect(director.stageState.healthMultiplier).toBe(expected.health);
    }
  });

  it('matches authored enemy timelines and cadences during the first lap', () => {
    const authored = [
      new RadialActDirector(),
      new AngularActDirector(),
      new FractureActDirector()
    ];
    for (const [index, director] of authored.entries()) {
      const overdrive = new OverdriveActDirector(index + 1, 0x1234);
      for (const elapsed of [0, 60, 180, 240]) {
        for (const spawnIndex of [0, 1, 7, 14]) {
          expect(overdrive.selectEnemyKind(elapsed, spawnIndex))
            .toBe(director.selectEnemyKind(elapsed, spawnIndex));
        }
        expect(overdrive.getSpawnIntervalSeconds(elapsed))
          .toBe(director.getSpawnIntervalSeconds(elapsed));
      }
    }
  });

  it('keeps the approved arena and boss rotation independent in later laps', () => {
    expect(new OverdriveActDirector(4, 0x1234)).toMatchObject({
      arenaActId: 'angular',
      bossActId: 'radial',
      primaryEnemyActId: 'radial',
      stageState: { lap: 2, stageInLap: 1, healthMultiplier: 9, pressureMultiplier: 1.15 }
    });
    expect(new OverdriveActDirector(6, 0x1234)).toMatchObject({
      arenaActId: 'fracture',
      bossActId: 'fracture',
      primaryEnemyActId: 'fracture'
    });
    expect(new OverdriveActDirector(10, 0x1234)).toMatchObject({
      arenaActId: 'fracture',
      bossActId: 'radial',
      stageState: { lap: 4, stageInLap: 1, healthMultiplier: 27, pressureMultiplier: 1.4 }
    });
  });

  it('selects the same seeded guest sequence and never admits bosses or replicas', () => {
    const first = new OverdriveActDirector(4, 0xdecafbad);
    const second = new OverdriveActDirector(4, 0xdecafbad);
    const sequenceA = Array.from({ length: 80 }, (_, index) => first.selectEnemyKind(180, index));
    const sequenceB = Array.from({ length: 80 }, (_, index) => second.selectEnemyKind(180, index));
    expect(sequenceA).toEqual(sequenceB);
    expect(sequenceA.some((kind) => kind !== 'chaser' && kind !== 'fast' && kind !== 'tank' && kind !== 'elite')).toBe(true);
    expect(sequenceA.every((kind) => kind !== 'boss' && kind !== 'warden-replica')).toBe(true);
  });

  it('uses a uniform normal-family pool from stage 10 onward', () => {
    const director = new OverdriveActDirector(10, 0xdecafbad);
    const allowed = new Set<EnemyKind>([
      'chaser', 'fast', 'tank', 'elite',
      'orbiter', 'charger', 'splitter', 'prism-weaver',
      'fracture-gunner', 'thorn-bastion', 'zigzag-reaver', 'rift-miner'
    ]);
    const sequence = Array.from({ length: 240 }, (_, index) => director.selectEnemyKind(0, index));
    expect(sequence.every((kind) => allowed.has(kind))).toBe(true);
    expect(sequence.every((kind) => kind !== 'boss' && kind !== 'warden-replica')).toBe(true);
    expect(Math.max(...sequence.map((kind) => ENEMY_DEFINITIONS[kind].spawnCost))).toBe(5);
  });

  it('raises pressure by interval without violating the hard minimum', () => {
    const director = new OverdriveActDirector(4, 0x1);
    // Stage 4 has an Angular arena but an Act I primary family. The cadence
    // follows that family; arena hazards remain owned by the Angular profile.
    expect(director.getSpawnIntervalSeconds(0)).toBeCloseTo(0.85 / 1.15);
    const late = new OverdriveActDirector(10, 0x1);
    expect(late.getSpawnIntervalSeconds(0)).toBeCloseTo(0.78 / 1.4);
    expect(late.getSpawnIntervalSeconds(300)).toBeGreaterThanOrEqual(0.2);
  });

  it('keeps boss timing owned by the rotated boss definition', () => {
    expect(new OverdriveActDirector(4, 0x1).bossStartSeconds).toBe(260);
    expect(new OverdriveActDirector(6, 0x1).bossStartSeconds).toBe(250);
  });

  it('rebinds the stage profile without replacing the director instance', () => {
    const director = new OverdriveActDirector(1, 0x1234);
    const identity = director;

    director.setStage(4);

    expect(director).toBe(identity);
    expect(director.stageState).toMatchObject({ stage: 4, healthMultiplier: 9, pressureMultiplier: 1.15 });
    expect(director.definition.id).toBe('angular');
    expect(director.enemyHealthMultiplier).toBe(9);
  });
});
