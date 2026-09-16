import { describe, expect, it } from 'vitest';
import { FRACTURE_ENGINE_DEFINITION } from '../../content/bosses/BossDefinition';
import { FRACTURE_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import { FractureActDirector } from './FractureActDirector';

describe('FractureActDirector', () => {
  it('composes the Act III arena, four enemy families and the authored boss', () => {
    const director = new FractureActDirector();

    expect(director.definition).toBe(FRACTURE_ACT_DEFINITION);
    expect(director.initialArenaShape).toBe('octagon');
    expect(director.bossStartSeconds).toBe(FRACTURE_ENGINE_DEFINITION.startSeconds);
    expect(director.definition.hazardIds).toEqual([
      'laser', 'radial-pulse', 'pulse-ring', 'angular-sweep'
    ]);
    expect(director.selectEnemyKind(0, 0)).toBe('fracture-gunner');
    expect(director.selectEnemyKind(100, 2)).toBe('zigzag-reaver');
    expect(director.selectEnemyKind(210, 1)).toBe('rift-miner');
  });

  it('returns to a circular boss arena on the final pre-boss morph', () => {
    const director = new FractureActDirector();
    const finalChange = director.arenaShapeChanges.at(-1);

    expect(finalChange?.startSeconds).toBe(248.05);
    expect(finalChange?.to).toBe('circle');
    expect(finalChange?.startSeconds ?? 0).toBeLessThan(director.bossStartSeconds);
  });
});
