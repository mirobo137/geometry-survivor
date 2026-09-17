import {
  getLevelUpChoices,
  getWeaponPathEvolutionOffer,
  getWeaponPathRankChoices,
  getWeaponEvolutionChoices,
  UPGRADE_DEFINITIONS,
  WEAPON_PATH_RANK_DEFINITIONS,
  WEAPON_EVOLUTION_OFFER_DEFINITIONS,
  WEAPON_MASTERY_DEFINITIONS,
  WEAPON_EVOLUTION_DEFINITIONS,
  OVERDRIVE_RESERVE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId,
  type WeaponPathId
} from '../../content/upgrades/UpgradeDefinitions';
import type { WeaponEvolutionId } from '../../content/weapons/WeaponEvolutionDefinitions';
import {
  OVERDRIVE_AUTHORED_STACK_CAPS,
  OVERDRIVE_POWER_MULTIPLIER_CAP,
  type RunMode
} from '../../content/run/OverdriveDefinitions';
import { CombatSimulation } from '../combat/CombatSimulation';
import { PlayerModel } from '../PlayerModel';
import type { UpgradePreview } from './UpgradePreview';

const CAMPAIGN_MAX_ACTIVE_WEAPONS = 3;
const OVERDRIVE_INITIAL_ACTIVE_WEAPONS = 3;
const OVERDRIVE_MAX_ACTIVE_WEAPONS = 6;
const ADDITIONAL_WEAPON_IDS: readonly UpgradeId[] = ['orbit_blade', 'chain_lightning', 'vector_boomerang', 'pulse_ring', 'magnetic_charge'];
const EVOLUTION_FAMILIES: readonly { readonly base: WeaponPathId; readonly ids: readonly WeaponEvolutionId[] }[] = [
  { base: 'projectile', ids: ['rail_lance', 'pulse_volley'] },
  { base: 'orbit', ids: ['solar_crown', 'graviton_halo'] },
  { base: 'chain', ids: ['closed_circuit', 'thunderhead'] },
  { base: 'boomerang', ids: ['twin_comet', 'singularity_return'] },
  { base: 'pulse_ring', ids: ['echo_shock', 'compression_wave'] },
  { base: 'magnetic_charge', ids: ['event_horizon', 'polar_collapse'] }
];

const CAMPAIGN_WEAPON_IDS: readonly UpgradeId[] = [
  'orbit_blade',
  'chain_lightning',
  'vector_boomerang',
  'pulse_ring',
  'magnetic_charge'
];

const CAMPAIGN_PASSIVE_IDS: readonly UpgradeId[] = [
  'swift_step',
  'reinforced_core',
  'resonant_core',
  'regenerative_reactor',
  'vampiric_core',
  'critical_impact',
  'recharging_shield',
  'hardened_shell'
];

const RANKABLE_FAMILIES: readonly WeaponPathId[] = [
  'projectile',
  'orbit',
  'chain',
  'boomerang',
  'pulse_ring',
  'magnetic_charge'
];

const CAMPAIGN_RANDOM_SEED = 0x3c6ef372;
const UNIVERSAL_MASTERY_MAX_STACKS = 3;

const normalizeSeed = (seed: number): number => (seed >>> 0) || CAMPAIGN_RANDOM_SEED;

const createRunSeed = (): number => normalizeSeed(
  (Date.now() & 0xffff_ffff) ^ Math.floor(Math.random() * 0x1_0000_0000)
);

/** Applies authored upgrade effects at the composition boundary. */
export class UpgradeApplier {
  private readonly stacks = new Map<UpgradeId, number>();
  private readonly acquisitionOrder: UpgradeId[] = [];
  private campaignHandIndex = 0;
  private randomState: number;
  private overdriveArsenalExpanded = false;

  public constructor(
    private readonly player: PlayerModel,
    private readonly combat: CombatSimulation,
    seed?: number,
    private readonly runMode: RunMode = 'campaign'
  ) {
    this.randomState = normalizeSeed(seed ?? createRunSeed());
  }

  /** The Overdrive six-weapon gate is intentionally monotonic for one run. */
  public get isOverdriveArsenalExpanded(): boolean {
    return this.overdriveArsenalExpanded;
  }

  public getChoices(level: number): readonly UpgradeDefinition[] {
    void level;
    this.syncOverdriveArsenal();
    const choices = this.composeCampaignChoices(new Set());
    this.campaignHandIndex += 1;
    return choices;
  }

  /**
   * Target screen for the rare post-evolution mastery card. It is intentionally
   * a second choice, not another evolution prompt: both branches share this
   * power channel and the player chooses which evolved family to reinforce.
   */
  public getUniversalMasteryChoices(): readonly UpgradeDefinition[] {
    return WEAPON_MASTERY_DEFINITIONS.filter((definition) => (
      definition.effect.type === 'weaponMastery'
      && definition.effect.channel === 'power'
      && this.canApply(definition)
    ));
  }

  /** Applies the rare marker through one explicit evolved-family target. */
  public applyUniversalMastery(targetUpgradeId: UpgradeId): boolean {
    const marker = this.resolveDefinition('universal_weapon_mastery');
    const target = this.resolveDefinition(targetUpgradeId);
    if (marker === undefined || !this.canApply(marker)) return false;
    if (target?.effect.type !== 'weaponMastery' || target.effect.channel !== 'power' || !this.canApply(target)) return false;
    if (!this.apply(targetUpgradeId)) return false;
    this.stacks.set(marker.id, this.getStacks(marker.id) + 1);
    this.acquisitionOrder.push(marker.id);
    return true;
  }

  private composeCampaignChoices(excluded: ReadonlySet<UpgradeId>): readonly UpgradeDefinition[] {
    const selected: UpgradeDefinition[] = [];
    const takeRandom = (pool: readonly UpgradeDefinition[]): UpgradeDefinition | null => {
      const available = pool.filter((definition) => (
        !excluded.has(definition.id)
        && !selected.some((choice) => choice.id === definition.id)
        && this.canApply(definition)
      ));
      if (available.length === 0) return null;
      const choice = available[Math.floor(this.nextRandom() * available.length)];
      if (choice) selected.push(choice);
      return choice ?? null;
    };

    // The arsenal is its own slot. Every still-available family has the same
    // weight and the fill phase never receives this pool, so a hand cannot
    // contain a second acquisition.
    const weaponOffers = this.getAvailableWeaponOfferDefinitions();
    takeRandom(weaponOffers);

    const evolution = this.getRotatedFamilyChoice(this.getCampaignEvolutionDefinitions(), excluded, selected);
    const rank = evolution === null
      ? this.getRotatedFamilyChoice(this.getCampaignRankDefinitions(), excluded, selected)
      : null;
    const universal = this.getScheduledUniversalMastery();
    if (universal !== null) takeRandom([universal]);
    else if (evolution !== null) selected.push(evolution);
    else if (rank !== null) selected.push(rank);

    const allEvolved = this.hasThreeEvolvedFamilies();
    const specificMastery = universal === null
      ? takeRandom(this.getCampaignMasteryDefinitions())
      : null;
    takeRandom(this.getCampaignPassiveDefinitions());

    // Only authored campaign sources are allowed to fill an incomplete hand.
    // Legacy v1 weapon cards never re-enter the rotation.
    const fillPool = [
      ...this.getCampaignPassiveDefinitions(),
      ...this.getCampaignRankDefinitions(),
      ...(allEvolved || specificMastery === null ? this.getCampaignMasteryDefinitions() : [])
    ];
    while (selected.length < 3 && takeRandom(fillPool) !== null) {
      // takeRandom owns filtering and selection.
    }

    // In Overdrive, reserve cards are reached only after every authored
    // acquisition, rank, evolution, mastery and passive has been exhausted.
    // They are deliberately outside the campaign pools and never leak into a
    // normal run or its rerolls.
    if (this.runMode === 'overdrive' && selected.length < 3) {
      const selectedIds = new Set([
        ...excluded,
        ...selected.map((choice) => choice.id)
      ]);
      const ordinaryRemaining = [
        ...weaponOffers,
        ...this.getCampaignEvolutionDefinitions(),
        ...this.getCampaignRankDefinitions(),
        ...this.getCampaignMasteryDefinitions(),
        ...this.getCampaignPassiveDefinitions()
      ].some((definition) => !selectedIds.has(definition.id) && this.canApply(definition));
      if (!ordinaryRemaining && this.getScheduledUniversalMastery() === null) {
        const reserves = this.getOverdriveReserveDefinitions();
        const repair = reserves.find((definition) => definition.effect.type === 'overdriveRepair');
        const powerReserves = reserves.filter((definition) => definition.effect.type === 'overdrivePower');
        // Repair is a guaranteed defensive slot when health is incomplete;
        // the remaining slots stay random among evolved weapon families.
        if (repair !== undefined) takeRandom([repair]);
        while (selected.length < 3 && takeRandom(powerReserves) !== null) {
          // A reserve card may be absent when its family reached the cap or
          // when Repair has already restored the player to full health.
        }
      }
    }

    return this.shuffle(selected).slice(0, 3);
  }

  private getAvailableWeaponDefinitions(): readonly UpgradeDefinition[] {
    return CAMPAIGN_WEAPON_IDS
      .map((id) => this.resolveDefinition(id))
      .filter((definition): definition is UpgradeDefinition => (
        definition !== undefined
        && this.getStacks(definition.id) === 0
        && this.canApply(definition)
      ));
  }

  private getAvailableWeaponOfferDefinitions(): readonly UpgradeDefinition[] {
    if (this.activeWeaponCount() >= this.getActiveWeaponLimit()) return [];
    const projectileRankTwo = this.combat.currentProjectileRank === 1
      ? WEAPON_PATH_RANK_DEFINITIONS.projectile.find((definition) => definition.id === 'projectile_rank_2')
      : undefined;
    return [
      ...(projectileRankTwo && this.canApply(projectileRankTwo) ? [projectileRankTwo] : []),
      ...this.getAvailableWeaponDefinitions()
    ];
  }

  private getCampaignRankDefinitions(): readonly UpgradeDefinition[] {
    const ranks: UpgradeDefinition[] = [];
    for (const family of RANKABLE_FAMILIES) {
      if (!this.isFamilyActive(family)) continue;
      const rank = this.combat.getWeaponPathRank(family);
      if (rank < 7) {
        const nextRank = WEAPON_PATH_RANK_DEFINITIONS[family].find((definition) => (
          definition.effect.type === 'weaponRank'
          && definition.effect.rank === rank + 1
          && this.canApply(definition)
        ));
        if (nextRank && !this.getAvailableWeaponOfferDefinitions().some((offer) => offer.id === nextRank.id)) {
          ranks.push(nextRank);
        }
      }
    }
    return ranks;
  }

  private getCampaignEvolutionDefinitions(): readonly UpgradeDefinition[] {
    const evolutions: UpgradeDefinition[] = [];
    for (const family of RANKABLE_FAMILIES) {
      if (!this.isFamilyActive(family)) continue;
      if (this.combat.getWeaponPathRank(family) >= 7 && !this.hasEvolution(family)) {
        const offer = WEAPON_EVOLUTION_OFFER_DEFINITIONS.find((definition) => (
          definition.effect.type === 'evolutionOffer'
          && definition.effect.family === family
          && this.canApply(definition)
        ));
        if (offer) evolutions.push(offer);
      }
    }
    return evolutions;
  }

  private getCampaignMasteryDefinitions(): readonly UpgradeDefinition[] {
    return WEAPON_MASTERY_DEFINITIONS.filter((definition) => (
      definition.effect.type === 'weaponMastery' && this.canApply(definition)
    ));
  }

  private getCampaignPassiveDefinitions(): readonly UpgradeDefinition[] {
    return CAMPAIGN_PASSIVE_IDS
      .map((id) => this.resolveDefinition(id))
      .filter((definition): definition is UpgradeDefinition => definition !== undefined && this.canApply(definition));
  }

  private getScheduledUniversalMastery(): UpgradeDefinition | null {
    if (!this.hasThreeEvolvedFamilies() || this.campaignHandIndex % 3 !== 0) return null;
    const marker = WEAPON_MASTERY_DEFINITIONS.find((definition) => definition.effect.type === 'universalWeaponMastery');
    return marker !== undefined && this.canApply(marker) ? marker : null;
  }

  private getRotatedFamilyChoice(
    definitions: readonly UpgradeDefinition[],
    excluded: ReadonlySet<UpgradeId>,
    selected: readonly UpgradeDefinition[]
  ): UpgradeDefinition | null {
    const available = definitions.filter((definition) => (
      !excluded.has(definition.id)
      && !selected.some((choice) => choice.id === definition.id)
      && this.canApply(definition)
    ));
    if (available.length === 0) return null;
    const start = this.campaignHandIndex % RANKABLE_FAMILIES.length;
    for (let offset = 0; offset < RANKABLE_FAMILIES.length; offset += 1) {
      const family = RANKABLE_FAMILIES[(start + offset) % RANKABLE_FAMILIES.length];
      const definition = available.find((candidate) => (
        (candidate.effect.type === 'weaponRank' || candidate.effect.type === 'evolutionOffer')
        && candidate.effect.family === family
      ));
      if (definition !== undefined) return definition;
    }
    return available[0] ?? null;
  }

  private hasThreeEvolvedFamilies(): boolean {
    const activeFamilies = RANKABLE_FAMILIES.filter((family) => this.isFamilyActive(family));
    return activeFamilies.length === CAMPAIGN_MAX_ACTIVE_WEAPONS
      && activeFamilies.every((family) => this.hasEvolution(family));
  }

  private getOverdriveReserveDefinitions(): readonly UpgradeDefinition[] {
    if (this.runMode !== 'overdrive') return [];
    return OVERDRIVE_RESERVE_DEFINITIONS.filter((definition) => (
      definition.effect.type === 'overdrivePower'
        ? this.isFamilyActive(definition.effect.family) && this.hasEvolution(definition.effect.family)
        : definition.effect.type === 'overdriveRepair'
          ? this.player.isAlive && this.player.state.health < this.player.state.maxHealth
          : false
    )).filter((definition) => this.canApply(definition));
  }

  /**
   * Overdrive starts with the same three-family ceiling as campaign. Once all
   * three active families have evolved, the six-family ceiling opens and can
   * never close again when a fourth weapon is acquired.
   */
  private syncOverdriveArsenal(): void {
    if (this.runMode !== 'overdrive' || this.overdriveArsenalExpanded) return;
    const activeFamilies = RANKABLE_FAMILIES.filter((family) => this.isFamilyActive(family));
    if (activeFamilies.length === OVERDRIVE_INITIAL_ACTIVE_WEAPONS
      && activeFamilies.every((family) => this.hasEvolution(family))) {
      this.overdriveArsenalExpanded = true;
    }
  }

  private getActiveWeaponLimit(): number {
    this.syncOverdriveArsenal();
    return this.runMode === 'overdrive' && this.overdriveArsenalExpanded
      ? OVERDRIVE_MAX_ACTIVE_WEAPONS
      : CAMPAIGN_MAX_ACTIVE_WEAPONS;
  }

  private isFamilyActive(family: WeaponPathId): boolean {
    switch (family) {
      case 'projectile': return true;
      case 'orbit': return this.getStacks('orbit_blade') > 0;
      case 'chain': return this.getStacks('chain_lightning') > 0;
      case 'boomerang': return this.getStacks('vector_boomerang') > 0;
      case 'pulse_ring': return this.getStacks('pulse_ring') > 0;
      case 'magnetic_charge': return this.getStacks('magnetic_charge') > 0;
    }
  }

  private hasEvolution(family: WeaponPathId): boolean {
    if (family === 'projectile') return this.combat.currentProjectileEvolution !== null;
    if (family === 'orbit') return this.combat.currentOrbitEvolution !== null;
    if (family === 'chain') return this.combat.currentChainEvolution !== null;
    if (family === 'boomerang') return this.combat.currentBoomerangEvolution !== null;
    if (family === 'pulse_ring') return this.combat.currentPulseRingEvolution !== null;
    return this.combat.currentMagneticChargeEvolution !== null;
  }

  private nextRandom(): number {
    let state = this.randomState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.randomState = state >>> 0;
    return this.randomState / 0x1_0000_0000;
  }

  private shuffle<T>(values: readonly T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.nextRandom() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  /**
   * At level 7+, the first fully eligible weapon family gets its two routes.
   * The caller may select a family explicitly for a development drill.
   */
  public getEvolutionChoices(level: number, preferredId?: UpgradeId): readonly UpgradeDefinition[] {
    if (level < 7) return [];
    const preferredFamily = preferredId === undefined
      ? undefined
      : EVOLUTION_FAMILIES.find((family) => family.ids.includes(preferredId as WeaponEvolutionId));
    const family = preferredFamily ?? EVOLUTION_FAMILIES.find((candidate) => (
      candidate.ids.every((id) => this.canApply(id))
    ));
    if (!family || !family.ids.every((id) => this.canApply(id))) return [];
    return getWeaponEvolutionChoices((upgrade) => (
      family.ids.includes(upgrade.id as WeaponEvolutionId) && this.canApply(upgrade)
    ));
  }

  /** Returns the two route choices for the isolated focused-weapon path. */
  public getWeaponPathEvolutionChoices(path: WeaponPathId): readonly UpgradeDefinition[] {
    const family = EVOLUTION_FAMILIES.find((candidate) => candidate.base === path);
    if (!family) return [];
    return getWeaponEvolutionChoices((upgrade) => (
      family.ids.includes(upgrade.id as WeaponEvolutionId)
    ));
  }

  /** Returns the single no-stat evolution gate for the focused test path. */
  public getWeaponPathEvolutionOfferChoices(path: WeaponPathId): readonly UpgradeDefinition[] {
    return [getWeaponPathEvolutionOffer(path)];
  }

  /** Returns the next deterministic rank card for a focused weapon route. */
  public getWeaponPathRankChoices(path: WeaponPathId, rank: number): readonly UpgradeDefinition[] {
    if (!WEAPON_PATH_RANK_DEFINITIONS[path]) return [];
    return getWeaponPathRankChoices(path, rank, (upgrade) => !this.stacks.has(upgrade.id));
  }

  /**
   * Developer-entry helper: keeps the normal three-card layout while placing
   * one valid card first. It does not bypass prerequisites or the weapon cap.
   */
  public getChoicesWithPriority(level: number, preferredUpgradeId: UpgradeId): readonly UpgradeDefinition[] {
    const preferred = this.resolveDefinition(preferredUpgradeId);
    if (!preferred || !this.canApply(preferred)) return this.getChoices(level);
    const fallback = getLevelUpChoices(
      level,
      (upgrade) => upgrade.id !== preferredUpgradeId && this.canApply(upgrade)
    );
    return [preferred, ...fallback].slice(0, 3);
  }

  /** Returns the next deterministic cards, excluding the current offer. */
  public getRerollChoices(level: number, currentChoices: readonly UpgradeDefinition[]): readonly UpgradeDefinition[] {
    const excluded = new Set(currentChoices.map((choice) => choice.id));
    void level;
    return this.composeCampaignChoices(excluded);
  }

  public getStacks(upgradeId: UpgradeId): number {
    return this.stacks.get(upgradeId) ?? 0;
  }

  public reset(seed?: number): void {
    this.stacks.clear();
    this.acquisitionOrder.length = 0;
    this.campaignHandIndex = 0;
    this.overdriveArsenalExpanded = false;
    this.randomState = normalizeSeed(seed ?? createRunSeed());
  }

  /** Ordered snapshot kept for diagnostics; Act II entry intentionally does not consume it. */
  public snapshot(): readonly UpgradeId[] {
    return [...this.acquisitionOrder];
  }

  public getPreview(upgrade: UpgradeDefinition | UpgradeId): UpgradePreview | null {
    const definition = this.resolveDefinition(upgrade);
    if (!definition) return null;

    switch (definition.effect.type) {
      case 'movementSpeed':
        return {
          stat: 'movementSpeed',
          before: this.player.currentMovementSpeed,
          after: this.player.currentMovementSpeed + definition.effect.amount
        };
      case 'projectileDamage':
        return {
          stat: 'projectileDamage',
          before: this.combat.currentProjectileDamage,
          after: this.combat.currentProjectileDamage + definition.effect.amount
        };
      case 'twinEmitters':
        return null;
      case 'maxHealth':
        return {
          stat: 'maxHealth',
          before: this.player.state.maxHealth,
          after: this.player.state.maxHealth + definition.effect.amount
        };
      case 'projectileCooldown':
        return {
          stat: 'projectileCooldown',
          before: this.combat.currentProjectileCooldown,
          after: Math.max(0.18, this.combat.currentProjectileCooldown - definition.effect.amount)
        };
      case 'experienceGain':
        return {
          stat: 'experienceGain',
          before: this.combat.currentExperienceBonus,
          after: this.combat.currentExperienceBonus + definition.effect.amount
        };
      case 'healthRecovery':
        return {
          stat: 'healthRecovery',
          before: this.player.currentHealthRecovery,
          after: this.player.currentHealthRecovery + definition.effect.amount
        };
      case 'vampirism':
        return {
          stat: 'vampirism',
          before: this.player.currentVampirism,
          after: this.player.currentVampirism + definition.effect.amount
        };
      case 'criticalChance':
        return {
          stat: 'criticalChance',
          before: this.combat.currentCriticalChance,
          after: this.combat.currentCriticalChance + definition.effect.amount
        };
      case 'shield':
        return null;
      case 'orbitRadius':
        return {
          stat: 'orbitRadius',
          before: this.combat.currentOrbitRadius,
          after: this.combat.currentOrbitRadius + definition.effect.amount
        };
      case 'chainDamage':
        return {
          stat: 'chainDamage',
          before: this.combat.currentChainDamage,
          after: this.combat.currentChainDamage + definition.effect.amount
        };
      case 'armor':
        return {
          stat: 'armor',
          before: this.player.state.armor,
          after: this.player.state.armor + definition.effect.amount
        };
      case 'orbitBlade':
      case 'chainLightning':
        return null;
      case 'vectorBoomerang':
        return null;
      case 'pulseRing':
        return null;
      case 'magneticCharge':
        return null;
      case 'overdrivePower':
        return this.getOverdrivePowerPreview(definition.effect.family, definition.effect.amount);
      case 'overdriveRepair':
        return null;
      case 'weaponRank':
        return null;
      case 'evolutionOffer':
        return null;
      case 'weaponEvolution':
        return null;
      case 'universalWeaponMastery':
        return null;
      case 'weaponMastery':
        return this.getWeaponMasteryPreview(definition);
    }
  }

  private getWeaponMasteryPreview(definition: UpgradeDefinition): UpgradePreview | null {
    if (definition.effect.type !== 'weaponMastery') return null;
    const { family, channel } = definition.effect;
    switch (family) {
      case 'projectile':
        return channel === 'power'
          ? { stat: 'projectileDamage', before: this.combat.currentProjectileDamage, after: this.combat.currentProjectileDamage + 4 }
          : channel === 'tempo'
            ? { stat: 'projectileCooldown', before: this.combat.currentProjectileCooldown, after: Math.max(0.18, this.combat.currentProjectileCooldown - 0.05) }
            : { stat: 'projectileSpeed', before: this.combat.currentProjectileSpeed, after: this.combat.currentProjectileSpeed + 45 };
      case 'orbit':
        if (channel === 'power') return { stat: 'orbitDamage', before: this.combat.currentOrbitDamage, after: this.combat.currentOrbitDamage + 4 };
        if (channel === 'tempo') return { stat: 'orbitHitCooldown', before: this.combat.currentOrbitHitCooldown, after: Math.max(0.08, this.combat.currentOrbitHitCooldown - 0.03) };
        return this.combat.currentOrbitEvolution === 'solar_crown'
          ? { stat: 'orbitContactRadius', before: this.combat.currentOrbitContactRadius, after: this.combat.currentOrbitContactRadius + 4 }
          : { stat: 'orbitRadius', before: this.combat.currentOrbitRadius, after: this.combat.currentOrbitRadius + 14 };
      case 'chain':
        return channel === 'power'
          ? { stat: 'chainDamage', before: this.combat.currentChainDamage, after: this.combat.currentChainDamage + 4 }
          : channel === 'tempo'
            ? { stat: 'chainCooldown', before: this.combat.currentChainCooldown, after: Math.max(0.45, this.combat.currentChainCooldown - 0.12) }
            : { stat: 'chainJumpRadius', before: this.combat.currentChainJumpRadius, after: this.combat.currentChainJumpRadius + 30 };
      case 'boomerang':
        return channel === 'power'
          ? { stat: 'boomerangDamage', before: this.combat.currentBoomerangDamage, after: this.combat.currentBoomerangDamage + 4 }
          : channel === 'tempo'
            ? { stat: 'boomerangCooldown', before: this.combat.currentBoomerangCooldown, after: Math.max(0.35, this.combat.currentBoomerangCooldown - 0.08) }
            : { stat: 'boomerangDistance', before: this.combat.currentBoomerangOutboundDistance, after: this.combat.currentBoomerangOutboundDistance + 40 };
      case 'pulse_ring':
        return channel === 'power'
          ? { stat: 'pulseRingDamage', before: this.combat.currentPulseRingDamage, after: this.combat.currentPulseRingDamage + 6 }
          : channel === 'tempo'
            ? { stat: 'pulseRingCooldown', before: this.combat.currentPulseRingCooldown, after: Math.max(0.5, this.combat.currentPulseRingCooldown - 0.25) }
            : { stat: 'pulseRingRadius', before: this.combat.currentPulseRingEndRadius, after: this.combat.currentPulseRingEndRadius + 22 };
      case 'magnetic_charge':
        return channel === 'power'
          ? { stat: 'magneticChargeDamage', before: this.combat.currentMagneticChargeDamage, after: this.combat.currentMagneticChargeDamage + 5 }
          : channel === 'tempo'
            ? { stat: 'magneticChargeCooldown', before: this.combat.currentMagneticChargeCooldown, after: Math.max(0.45, this.combat.currentMagneticChargeCooldown - 0.45) }
            : { stat: 'magneticChargeRadius', before: this.combat.currentMagneticChargeOuterRadius, after: this.combat.currentMagneticChargeOuterRadius + 24 };
    }
  }

  private getOverdrivePowerPreview(
    family: WeaponPathId,
    amount: number
  ): UpgradePreview | null {
    const multiplier = this.combat.getOverdrivePowerMultiplier(family);
    const afterMultiplier = Math.min(OVERDRIVE_POWER_MULTIPLIER_CAP, multiplier + amount);
    switch (family) {
      case 'projectile':
        return { stat: 'projectileDamage', before: this.combat.currentProjectileDamage, after: this.combat.currentProjectileDamage * afterMultiplier / multiplier };
      case 'orbit':
        return { stat: 'orbitDamage', before: this.combat.currentOrbitDamage, after: this.combat.currentOrbitDamage * afterMultiplier / multiplier };
      case 'chain':
        return { stat: 'chainDamage', before: this.combat.currentChainDamage, after: this.combat.currentChainDamage * afterMultiplier / multiplier };
      case 'boomerang':
        return { stat: 'boomerangDamage', before: this.combat.currentBoomerangDamage, after: this.combat.currentBoomerangDamage * afterMultiplier / multiplier };
      case 'pulse_ring':
        return { stat: 'pulseRingDamage', before: this.combat.currentPulseRingDamage, after: this.combat.currentPulseRingDamage * afterMultiplier / multiplier };
      case 'magnetic_charge':
        return { stat: 'magneticChargeDamage', before: this.combat.currentMagneticChargeDamage, after: this.combat.currentMagneticChargeDamage * afterMultiplier / multiplier };
    }
  }

  public canApply(upgrade: UpgradeDefinition | UpgradeId): boolean {
    const definition = this.resolveDefinition(upgrade);
    if (!definition) return false;
    this.syncOverdriveArsenal();
    const currentStacks = this.getStacks(definition.id);
    if (definition.maxStacks !== undefined && currentStacks >= definition.maxStacks) return false;
    const overdriveAuthoredCap = this.runMode === 'overdrive'
      && (definition.id === 'swift_step' || definition.id === 'reinforced_core')
      ? OVERDRIVE_AUTHORED_STACK_CAPS[definition.id]
      : undefined;
    if (overdriveAuthoredCap !== undefined && currentStacks >= overdriveAuthoredCap) return false;
    if (isWeaponUnlock(definition) && currentStacks === 0 && this.activeWeaponCount() >= this.getActiveWeaponLimit()) return false;
    if (definition.effect.type === 'weaponRank') {
      return this.isFamilyActive(definition.effect.family)
        && this.combat.getWeaponPathRank(definition.effect.family) + 1 === definition.effect.rank
        && currentStacks === 0;
    }
    if (definition.effect.type === 'evolutionOffer') {
      return this.isFamilyActive(definition.effect.family)
        && this.combat.getWeaponPathRank(definition.effect.family) >= 7
        && !this.hasEvolution(definition.effect.family);
    }
    if (definition.effect.type === 'weaponMastery') {
      return this.isFamilyActive(definition.effect.family)
        && this.hasEvolution(definition.effect.family);
    }
    if (definition.effect.type === 'universalWeaponMastery') {
      return this.getStacks(definition.id) < UNIVERSAL_MASTERY_MAX_STACKS
        && this.hasThreeEvolvedFamilies()
        && this.getUniversalMasteryChoices().length > 0;
    }
    if (definition.effect.type === 'overdrivePower') {
      return this.runMode === 'overdrive'
        && this.isFamilyActive(definition.effect.family)
        && this.hasEvolution(definition.effect.family)
        && this.combat.getOverdrivePowerMultiplier(definition.effect.family) < OVERDRIVE_POWER_MULTIPLIER_CAP;
    }
    if (definition.effect.type === 'overdriveRepair') {
      return this.runMode === 'overdrive' && this.player.isAlive
        && this.player.state.health < this.player.state.maxHealth;
    }
    return definition.requires?.every((requiredId) => this.getStacks(requiredId) > 0) ?? true;
  }

  public apply(upgradeId: UpgradeId): boolean {
    const definition = this.resolveDefinition(upgradeId);
    if (!definition || !this.canApply(definition)) return false;

    let applied = true;
    switch (definition.effect.type) {
      case 'movementSpeed':
        this.player.increaseMovementSpeed(definition.effect.amount);
        break;
      case 'projectileDamage':
        if (definition.id === 'focused_projectiles' && this.combat.currentProjectileRank === 2) {
          applied = this.combat.setProjectileRank(3);
        } else {
          this.combat.increaseProjectileDamage(definition.effect.amount);
        }
        break;
      case 'twinEmitters':
        applied = this.combat.currentProjectileRank === 1
          ? this.combat.setProjectileRank(2)
          : this.combat.enableTwinEmitters();
        break;
      case 'maxHealth':
        this.player.increaseMaxHealth(definition.effect.amount);
        break;
      case 'orbitBlade':
        applied = this.combat.addOrbitBlade();
        break;
      case 'chainLightning':
        applied = this.combat.unlockChainLightning();
        break;
      case 'vectorBoomerang':
        applied = this.combat.unlockVectorBoomerang();
        break;
      case 'pulseRing':
        applied = this.combat.unlockPulseRing();
        break;
      case 'magneticCharge':
        applied = this.combat.unlockMagneticCharge();
        break;
      case 'projectileCooldown':
        if (definition.id === 'rapid_projectiles' && this.combat.currentProjectileRank === 3) {
          applied = this.combat.setProjectileRank(4);
        } else {
          this.combat.decreaseProjectileCooldown(definition.effect.amount);
        }
        break;
      case 'experienceGain':
        this.combat.increaseExperienceGain(definition.effect.amount);
        break;
      case 'healthRecovery':
        this.player.increaseHealthRecovery(definition.effect.amount);
        break;
      case 'vampirism':
        this.player.increaseVampirism(definition.effect.amount);
        break;
      case 'criticalChance':
        this.combat.increaseCriticalChance(definition.effect.amount);
        break;
      case 'shield':
        this.player.enableShield(definition.effect.rechargeSeconds);
        break;
      case 'orbitRadius':
        applied = this.combat.getWeaponPathRank('orbit') === 1
          ? this.combat.setWeaponRank('orbit', 2)
          : (this.combat.increaseOrbitRadius(definition.effect.amount), true);
        break;
      case 'chainDamage':
        applied = this.combat.getWeaponPathRank('chain') === 1
          ? this.combat.setWeaponRank('chain', 2)
          : (this.combat.increaseChainDamage(definition.effect.amount), true);
        break;
      case 'armor':
        this.player.increaseArmor(definition.effect.amount);
        break;
      case 'weaponEvolution':
        applied = this.applyWeaponEvolution(definition.effect.evolution);
        break;
      case 'weaponRank':
        applied = this.combat.setWeaponRank(definition.effect.family, definition.effect.rank);
        break;
      case 'evolutionOffer':
        applied = false;
        break;
      case 'weaponMastery':
        applied = this.combat.applyWeaponMastery(definition.effect.family, definition.effect.channel);
        break;
      case 'universalWeaponMastery':
        // The game opens a target-selection hand for this marker card. It is
        // never consumed directly and therefore cannot accidentally grant a
        // global bonus without the player naming an evolved family.
        applied = false;
        break;
      case 'overdrivePower':
        applied = this.combat.applyOverdrivePower(definition.effect.family, definition.effect.amount);
        break;
      case 'overdriveRepair':
        applied = this.player.heal(this.player.state.maxHealth * definition.effect.amount) > 0;
        break;
    }
    if (!applied) return false;
    this.stacks.set(upgradeId, this.getStacks(upgradeId) + 1);
    this.acquisitionOrder.push(upgradeId);
    this.syncOverdriveArsenal();
    return true;
  }

  private resolveDefinition(upgrade: UpgradeDefinition | UpgradeId): UpgradeDefinition | undefined {
    return typeof upgrade === 'string'
      ? UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgrade)
        ?? Object.values(WEAPON_PATH_RANK_DEFINITIONS)
          .flat()
          .find((candidate) => candidate.id === upgrade)
        ?? WEAPON_EVOLUTION_OFFER_DEFINITIONS.find((candidate) => candidate.id === upgrade)
        ?? WEAPON_EVOLUTION_DEFINITIONS.find((candidate) => candidate.id === upgrade)
        ?? WEAPON_MASTERY_DEFINITIONS.find((candidate) => candidate.id === upgrade)
        ?? OVERDRIVE_RESERVE_DEFINITIONS.find((candidate) => candidate.id === upgrade)
      : upgrade;
  }

  private applyWeaponEvolution(evolution: WeaponEvolutionId): boolean {
    switch (evolution) {
      case 'rail_lance':
      case 'pulse_volley':
        return this.combat.applyProjectileEvolution(evolution);
      case 'solar_crown':
      case 'graviton_halo':
        return this.combat.applyOrbitEvolution(evolution);
      case 'closed_circuit':
      case 'thunderhead':
        return this.combat.applyChainEvolution(evolution);
      case 'twin_comet':
      case 'singularity_return':
        return this.combat.applyBoomerangEvolution(evolution);
      case 'echo_shock':
      case 'compression_wave':
        return this.combat.applyPulseRingEvolution(evolution);
      case 'event_horizon':
      case 'polar_collapse':
        return this.combat.applyMagneticChargeEvolution(evolution);
    }
  }

  private activeWeaponCount(): number {
    return 1 + ADDITIONAL_WEAPON_IDS.filter((id) => this.getStacks(id) > 0).length;
  }
}

const isWeaponUnlock = (definition: UpgradeDefinition): boolean => (
  definition.effect.type === 'orbitBlade'
  || definition.effect.type === 'chainLightning'
  || definition.effect.type === 'vectorBoomerang'
  || definition.effect.type === 'pulseRing'
  || definition.effect.type === 'magneticCharge'
);
