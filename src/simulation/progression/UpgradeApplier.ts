import { UPGRADE_DEFINITIONS, type UpgradeId } from '../../content/upgrades/UpgradeDefinitions';
import { CombatSimulation } from '../combat/CombatSimulation';
import { PlayerModel } from '../PlayerModel';

/** Applies authored upgrade effects at the composition boundary. */
export class UpgradeApplier {
  public constructor(
    private readonly player: PlayerModel,
    private readonly combat: CombatSimulation
  ) {}

  public apply(upgradeId: UpgradeId): boolean {
    const definition = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === upgradeId);
    if (!definition) return false;

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
        this.combat.addOrbitBlade();
        break;
      case 'chainLightning':
        this.combat.unlockChainLightning();
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
    return true;
  }
}
