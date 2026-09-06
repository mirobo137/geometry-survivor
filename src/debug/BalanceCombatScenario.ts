import { ENEMY_DEFINITIONS } from '../content/enemies/EnemyDefinitions';
import { getPermanentCombatBonuses } from '../content/meta/PermanentUpgradeDefinitions';
import { WEAPON_DEFINITIONS } from '../content/weapons/WeaponDefinitions';
import { PlayerModel } from '../simulation/PlayerModel';
import { EnemyPool } from '../simulation/combat/EntityPools';
import { CombatWeaponSystem } from '../simulation/combat/CombatWeaponSystem';
import { EnemySystem } from '../simulation/enemies/EnemySystem';
import { SpatialGrid } from '../simulation/spatial/SpatialGrid';

export type BalanceWeapon = 'projectile' | 'orbit' | 'chain';
export type BalanceLayout = 'single' | 'dispersed' | 'dense';
export type BalanceMetaLevel = 0 | 5;

export const BALANCE_SCENARIO_SEED = 0x51a7e;
export const BALANCE_DURATION_SECONDS = 20;
export const BALANCE_TARGET_HEALTH = 72;
export const BALANCE_SUSTAINED_TARGET_HEALTH = 100_000;
export const BALANCE_FIXED_STEP_SECONDS = 1 / 60;

const TARGET_KIND = 'tank' as const;
const TARGET_RADIUS = ENEMY_DEFINITIONS[TARGET_KIND].radius;
const PLAYER = new PlayerModel().state;

const LAYOUT_POSITIONS: Readonly<Record<BalanceLayout, readonly { x: number; y: number }[]>> = {
  single: [{ x: 58, y: 0 }],
  dispersed: [
    { x: 180, y: 0 },
    { x: -180, y: 0 },
    { x: 0, y: 180 }
  ],
  dense: [
    { x: 58, y: 0 },
    { x: -29, y: 50.23 },
    { x: -29, y: -50.23 }
  ]
};

const BALANCE_WEAPONS: readonly BalanceWeapon[] = ['projectile', 'orbit', 'chain'];
const BALANCE_LAYOUTS: readonly BalanceLayout[] = ['single', 'dispersed', 'dense'];
const BALANCE_META_LEVELS: readonly BalanceMetaLevel[] = [0, 5];

export interface BalanceMeasurement {
  readonly seed: number;
  readonly weapon: BalanceWeapon;
  readonly layout: BalanceLayout;
  readonly metaLevel: BalanceMetaLevel;
  readonly cardIds: readonly string[];
  readonly durationSeconds: number;
  readonly targetCount: number;
  readonly configuredDamage: number;
  readonly minimumCooldownSeconds: number;
  readonly kill: BalanceKillMeasurement;
  readonly sustained: BalanceSustainedMeasurement;
}

export interface BalanceKillMeasurement {
  readonly damageApplied: number;
  readonly hits: number;
  readonly kills: number;
  readonly timeToFirstEliminationSeconds: number | null;
}

export interface BalanceSustainedMeasurement {
  readonly damageApplied: number;
  readonly hits: number;
  readonly damagePerSecond: number;
}

interface ScenarioRunResult {
  readonly damageApplied: number;
  readonly hits: number;
  readonly kills: number;
  readonly timeToFirstEliminationSeconds: number | null;
}

/**
 * Runs a deterministic, simulation-only matrix for EX-02a.
 *
 * Each meta comparison keeps seed, player position, target layout, duration and
 * authored weapon card fixed. It intentionally does not roll criticals or run
 * the director, so the result isolates weapon contribution from wave pressure.
 */
export const runBalanceMatrix = (): readonly BalanceMeasurement[] => (
  BALANCE_WEAPONS.flatMap((weapon) => BALANCE_LAYOUTS.flatMap((layout) => (
    BALANCE_META_LEVELS.map((metaLevel) => runMeasurement(weapon, layout, metaLevel))
  )))
);

export const formatBalanceMatrix = (measurements: readonly BalanceMeasurement[]): string => {
  const lines = [
    'Geometry Survivor | EX-02a Laboratorio',
    `seed ${BALANCE_SCENARIO_SEED} | ${BALANCE_DURATION_SECONDS}s | fijo ${BALANCE_FIXED_STEP_SECONDS}s`,
    ''
  ];
  for (const measurement of measurements) {
    lines.push(
      `${measurement.weapon} / ${measurement.layout} / meta ${measurement.metaLevel}`,
      `  cards ${measurement.cardIds.length > 0 ? measurement.cardIds.join(', ') : '--'} | targets ${measurement.targetCount}`,
      `  configured damage ${measurement.configuredDamage.toFixed(2)} | min cooldown ${measurement.minimumCooldownSeconds.toFixed(4)}s`,
      `  kill damage ${measurement.kill.damageApplied.toFixed(2)} | hits ${measurement.kill.hits} | kills ${measurement.kill.kills} | first kill ${formatSeconds(measurement.kill.timeToFirstEliminationSeconds)}`,
      `  sustained damage ${measurement.sustained.damageApplied.toFixed(2)} | hits ${measurement.sustained.hits} | DPS ${measurement.sustained.damagePerSecond.toFixed(2)}`,
      ''
    );
  }
  return lines.join('\n').trim();
};

const runMeasurement = (
  weapon: BalanceWeapon,
  layout: BalanceLayout,
  metaLevel: BalanceMetaLevel
): BalanceMeasurement => {
  const permanentBonuses = getPermanentCombatBonuses({
    weapon_damage: metaLevel,
    weapon_cadence: metaLevel
  });
  const cardIds = getFixedCardIds(weapon);
  const killRun = runScenario(weapon, layout, permanentBonuses, BALANCE_TARGET_HEALTH);
  const sustainedRun = runScenario(
    weapon,
    layout,
    permanentBonuses,
    BALANCE_SUSTAINED_TARGET_HEALTH
  );

  return {
    seed: BALANCE_SCENARIO_SEED,
    weapon,
    layout,
    metaLevel,
    cardIds,
    durationSeconds: BALANCE_DURATION_SECONDS,
    targetCount: LAYOUT_POSITIONS[layout].length,
    configuredDamage: getConfiguredDamage(weapon, permanentBonuses),
    minimumCooldownSeconds: getMinimumCooldown(weapon, permanentBonuses),
    kill: {
      damageApplied: killRun.damageApplied,
      hits: killRun.hits,
      kills: killRun.kills,
      timeToFirstEliminationSeconds: killRun.timeToFirstEliminationSeconds
    },
    sustained: {
      damageApplied: sustainedRun.damageApplied,
      hits: sustainedRun.hits,
      damagePerSecond: sustainedRun.damageApplied / BALANCE_DURATION_SECONDS
    }
  };
};

const runScenario = (
  weapon: BalanceWeapon,
  layout: BalanceLayout,
  permanentBonuses: ReturnType<typeof getPermanentCombatBonuses>,
  targetHealth: number
): ScenarioRunResult => {
  const player = new PlayerModel();
  const enemies = new EnemyPool(LAYOUT_POSITIONS[layout].length);
  const enemySystem = new EnemySystem(enemies, new SpatialGrid(1280, 720));
  let defeatedCount = 0;
  const weaponSystem = new CombatWeaponSystem(
    enemySystem,
    (enemy) => {
      defeatedCount += 1;
      enemies.release(enemy);
    },
    permanentBonuses
  );
  applyFixedCards(weaponSystem, weapon);
  prepareTargets(enemies, layout, targetHealth);
  enemySystem.rebuildGrid();

  const previousHealth = enemies.states.map((enemy) => enemy.health);
  let damageApplied = 0;
  let hits = 0;
  let firstElimination: number | null = null;
  const steps = Math.round(BALANCE_DURATION_SECONDS / BALANCE_FIXED_STEP_SECONDS);

  for (let step = 0; step < steps; step += 1) {
    enemySystem.update(BALANCE_FIXED_STEP_SECONDS, player.state);
    enemySystem.rebuildGrid();
    weaponSystem.update(BALANCE_FIXED_STEP_SECONDS, player.state, {
      projectileEnabled: weapon === 'projectile',
      orbitEnabled: weapon === 'orbit',
      chainEnabled: weapon === 'chain'
    });
    const elapsedSeconds = (step + 1) * BALANCE_FIXED_STEP_SECONDS;
    for (let index = 0; index < enemies.states.length; index += 1) {
      const enemy = enemies.states[index];
      const delta = previousHealth[index] - enemy.health;
      if (delta <= 0) continue;
      damageApplied += delta;
      hits += 1;
      previousHealth[index] = enemy.health;
      if (!enemy.active && firstElimination === null) firstElimination = elapsedSeconds;
    }
  }

  return {
    damageApplied,
    hits,
    kills: defeatedCount,
    timeToFirstEliminationSeconds: firstElimination
  };
};

const prepareTargets = (
  pool: EnemyPool,
  layout: BalanceLayout,
  targetHealth: number
): void => {
  const positions = LAYOUT_POSITIONS[layout];
  for (let index = 0; index < positions.length; index += 1) {
    const enemy = pool.acquire();
    if (!enemy) throw new Error('Balance scenario target pool exhausted');
    enemy.kind = TARGET_KIND;
    enemy.x = PLAYER.x + positions[index].x;
    enemy.y = PLAYER.y + positions[index].y;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.radius = TARGET_RADIUS;
    enemy.speed = 0;
    enemy.health = targetHealth;
    enemy.maxHealth = targetHealth;
    enemy.contactDamage = 0;
    enemy.orbitHitCooldown = 0;
  }
};

const applyFixedCards = (weaponSystem: CombatWeaponSystem, weapon: BalanceWeapon): void => {
  if (weapon === 'orbit') weaponSystem.addOrbitBlade();
  if (weapon === 'chain') weaponSystem.unlockChainLightning();
};

const getFixedCardIds = (weapon: BalanceWeapon): readonly string[] => {
  if (weapon === 'orbit') return ['orbit_blade'];
  if (weapon === 'chain') return ['chain_lightning'];
  return [];
};

const getConfiguredDamage = (
  weapon: BalanceWeapon,
  permanentBonuses: ReturnType<typeof getPermanentCombatBonuses>
): number => {
  if (weapon === 'projectile') return WEAPON_DEFINITIONS.projectile.damage * permanentBonuses.projectileDamageMultiplier;
  if (weapon === 'orbit') return WEAPON_DEFINITIONS.orbit.damage;
  return WEAPON_DEFINITIONS.chainLightning.damage;
};

const getMinimumCooldown = (
  weapon: BalanceWeapon,
  permanentBonuses: ReturnType<typeof getPermanentCombatBonuses>
): number => {
  if (weapon === 'projectile') {
    return Math.max(0.18, WEAPON_DEFINITIONS.projectile.cooldownSeconds * permanentBonuses.projectileCooldownMultiplier);
  }
  if (weapon === 'orbit') return WEAPON_DEFINITIONS.orbit.hitCooldownSeconds;
  return WEAPON_DEFINITIONS.chainLightning.cooldownSeconds;
};

const formatSeconds = (seconds: number | null): string => (
  seconds === null ? '--' : `${seconds.toFixed(3)}s`
);
