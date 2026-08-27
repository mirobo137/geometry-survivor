import type { UpgradeDefinition, UpgradeId } from '../content/upgrades/UpgradeDefinitions';
import type { UpgradePreview, UpgradePreviewStat } from '../simulation/progression/UpgradePreview';

export type UpgradeSelectionHandler = (upgradeId: UpgradeId) => void;
export type UpgradePreviewProvider = (upgrade: UpgradeDefinition) => UpgradePreview | null;

const STAT_LABELS: Record<UpgradePreviewStat, string> = {
  movementSpeed: 'Velocidad',
  projectileDamage: 'Daño de proyectil',
  maxHealth: 'Vida máxima',
  projectileCooldown: 'Intervalo',
  projectileSpeed: 'Velocidad de proyectil',
  orbitRadius: 'Radio de órbita',
  chainDamage: 'Daño de cadena',
  armor: 'Armadura'
};

const formatValue = (value: number): string => Number.isInteger(value)
  ? String(value)
  : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

export class LevelUpOverlay {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly options: HTMLElement;

  public constructor(root: HTMLElement) {
    const title = root.querySelector<HTMLElement>('#level-up-title');
    const options = root.querySelector<HTMLElement>('#level-up-options');
    if (!title || !options) throw new Error('Faltan elementos del level-up');
    this.root = root;
    this.title = title;
    this.options = options;
  }

  public open(
    level: number,
    choices: readonly UpgradeDefinition[],
    onSelection: UpgradeSelectionHandler,
    getPreview: UpgradePreviewProvider = () => null
  ): void {
    this.title.textContent = `Nivel ${level}`;
    this.options.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.upgradeId = choice.id;
      const title = document.createElement('strong');
      title.textContent = choice.title;
      const description = document.createElement('span');
      description.textContent = choice.description;
      button.append(title, description);
      const preview = getPreview(choice);
      if (preview) {
        const values = document.createElement('small');
        values.textContent = `${STAT_LABELS[preview.stat]} ${formatValue(preview.before)} → ${formatValue(preview.after)}`;
        values.setAttribute('aria-label', `Valor actual ${formatValue(preview.before)}, siguiente ${formatValue(preview.after)}`);
        button.append(values);
      }
      button.addEventListener('click', () => {
        this.close();
        onSelection(choice.id);
      }, { once: true });
      this.options.appendChild(button);
    }
    this.root.hidden = false;
  }

  public close(): void {
    this.root.hidden = true;
  }
}
