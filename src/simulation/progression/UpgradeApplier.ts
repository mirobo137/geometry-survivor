import {
  getLevelUpChoices,
  UPGRADE_DEFINITIONS,
  type UpgradeDefinition,
  type UpgradeId
} from '../../content/upgrades/UpgradeDefinitions';
import { CombatSimulation } from '../combat/CombatSimulation';
import { PlayerModel } from '../PlayerModel';

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

  public canApply(upgrade: UpgradeDefinition | UpgradeId): boolean {
    const definition = typeof upgrade === 'string'
      ? UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgrade)
      : upgrade;
    if (!definition) return false;
    const currentStacks = this.getStacks(definition.id);
    if (definition.maxStacks !== undefined && currentStacks >= definition.maxStacks) return false;
    return definition.requires?.every((requiredId) => this.getStacks(requiredId) > 0) ?? true;
  }

  public apply(upgradeId: UpgradeId): boolean {
    const definition = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === upgradeId);
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
}
