import { describe, expect, it } from 'vitest';
import { FractureThreatView } from './FractureThreatView';
import { FractureThreatSystem } from '../../simulation/fracture/FractureThreatSystem';
import { BossSystem } from '../../simulation/bosses/BossSystem';
import { EnemySystem } from '../../simulation/enemies/EnemySystem';
import { EnemyPool } from '../../simulation/combat/EntityPools';
import { SpatialGrid } from '../../simulation/spatial/SpatialGrid';
import { FRACTURE_ENGINE_DEFINITION } from '../../content/bosses/BossDefinition';

const fixture = () => {
  const pool = new EnemyPool(1);
  const threats = new FractureThreatSystem();
  const boss = new BossSystem(new EnemySystem(pool, new SpatialGrid(1280, 720)), FRACTURE_ENGINE_DEFINITION).state;
  return { threats, combat: { fractureProjectiles: threats.projectiles, fractureMines: threats.mines,
    enemies: pool.states, boss } };
};

describe('Fracture attack presentation', () => {
  it('shows an enemy warning even when no Fracture boss or ordnance is active', () => {
    const { combat } = fixture();
    combat.boss.bossId = 'core-sentinel';
    Object.assign(combat.enemies[0], { active: true, kind: 'thorn-bastion', x: 100, y: 100,
      fracturePhase: 'telegraph', fractureProgress: 0.5, fractureSpikeRadius: 0 });
    const view = new FractureThreatView('low');
    view.render(combat, 270);
    expect(view.root.visible).toBe(true);
    // A zero simulation radius during warning must not collapse its telegraph.
    const bounds = view.root.children[60].getLocalBounds();
    expect(bounds.width).toBeGreaterThan(114);
    expect(bounds.width).toBeLessThan(120);
    combat.enemies[0].fracturePhase = 'recovery';
    view.render(combat, 270);
    expect(view.root.visible).toBe(false);
  });

  it('clears boss danger geometry during recovery rather than displaying the old pattern', () => {
    const { combat } = fixture();
    Object.assign(combat.boss, { active: true, phase: 'spikes-active', pattern: 'spikes', x: 100, y: 100, radius: 56 });
    const view = new FractureThreatView();
    view.render(combat, 270);
    expect(view.root.visible).toBe(true);
    const bounds = view.root.children[61].getLocalBounds();
    expect(bounds.width).toBeLessThan(172);
    combat.boss.phase = 'recovery';
    view.render(combat, 270);
    expect(view.root.visible).toBe(false);
  });

  it('plays one bounded mine detonation, freezes it during pause, and clears on reset', () => {
    const { combat, threats } = fixture();
    threats.deployMine(0, 0, 100, 100);
    const view = new FractureThreatView();
    view.render(combat, 270);
    const mine = threats.mines[0];
    mine.active = false;
    mine.ageSeconds = mine.detonateSeconds;
    view.render(combat, 270, 0);
    expect(view.root.children[48].visible).toBe(true);
    for (let i = 0; i < 40; i += 1) view.render(combat, 270, 0);
    expect(view.root.children[48].visible).toBe(true);
    for (let i = 0; i < 8; i += 1) view.render(combat, 270, 0.05);
    expect(view.root.children[48].visible).toBe(false);
    expect(mine.active).toBe(false);
    view.reset();
    view.render(combat, 270, 0.05);
    expect(view.root.visible).toBe(false);
    expect(view.root.children).toHaveLength(62);
  });
});
