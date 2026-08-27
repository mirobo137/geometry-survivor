import {
  getLevelUpChoices,
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId
} from '../../content/upgrades/UpgradeDefinitions';
import { CombatSimulation } from '../combat/CombatSimulation';
import { PlayerModel } from '../PlayerModel';
import type { UpgradePreview } from './UpgradePreview';

/** Applies authored upgrade effects at the composition boundary. */
export class UpgradeApplier {
  private readonly stacks = new Map<UpgradeId, number>();

  public constructor(
    private readonly player: PlayerModel,
    private readonly combat: CombatSimulation
  ) {}

  public getChoices(level: number): readonly UpgradeDefinition[] {
    return getLevelUpChoices(level, (upgrade) => this.canApply(upgrade));
  }

  public getStacks(upgradeId: UpgradeId): number {
    return this.stacks.get(upgradeId) ?? 0;
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
      case 'projectileSpeed':
        return {
          stat: 'projectileSpeed',
          before: this.combat.currentProjectileSpeed,
          after: this.combat.currentProjectileSpeed + definition.effect.amount
        };
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
    }
  }

  public canApply(upgrade: UpgradeDefinition | UpgradeId): boolean {
    const definition = this.resolveDefinition(upgrade);
    if (!definition) return false;
    const currentStacks = this.getStacks(definition.id);
    if (definition.maxStacks !== undefined && currentStacks >= definition.maxStacks) return false;
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
        this.combat.increaseProjectileDamage(definition.effect.amount);
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
      case 'projectileCooldown':
        this.combat.decreaseProjectileCooldown(definition.effect.amount);
        break;
      case 'projectileSpeed':
        this.combat.increaseProjectileSpeed(definition.effect.amount);
        break;
      case 'orbitRadius':
        this.combat.increaseOrbitRadius(definition.effect.amount);
        break;
      case 'chainDamage':
        this.combat.increaseChainDamage(definition.effect.amount);
        break;
      case 'armor':
        this.player.increaseArmor(definition.effect.amount);
        break;
    }
    if (!applied) return false;
    this.stacks.set(upgradeId, this.getStacks(upgradeId) + 1);
    return true;
  }

  private resolveDefinition(upgrade: UpgradeDefinition | UpgradeId): UpgradeDefinition | undefined {
    return typeof upgrade === 'string'
      ? UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgrade)
      : upgrade;
  }
}
