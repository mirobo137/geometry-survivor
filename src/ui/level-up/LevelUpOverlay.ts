import type { UpgradeDefinition, UpgradeId } from '../../content/upgrades/UpgradeDefinitions';
import type { UpgradePreview, UpgradePreviewStat } from '../../simulation/progression/UpgradePreview';
import cardFrameSvg from '../../assets/svg/ui/level-up/card-frame.svg?raw';
import upgradeIconsSvg from '../../assets/svg/ui/level-up/icons.svg?raw';
import { getUpgradeCardVisual } from './UpgradeCardVisual';

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
    this.mountIconSprite();
  }

  private mountIconSprite(): void {
    if (this.root.querySelector('#ui-upgrade-icons')) return;
    this.root.insertAdjacentHTML('afterbegin', upgradeIconsSvg);
  }

  public open(
    level: number,
    choices: readonly UpgradeDefinition[],
    onSelection: UpgradeSelectionHandler,
    getPreview: UpgradePreviewProvider = () => null
  ): void {
    this.title.textContent = `Nivel ${level}`;
    this.options.replaceChildren();
    choices.forEach((choice, index) => {
      const visual = getUpgradeCardVisual(choice.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-card';
      button.dataset.upgradeId = choice.id;
      button.dataset.tone = visual.tone;
      button.dataset.category = visual.category;

      const frame = document.createElement('span');
      frame.className = 'upgrade-card-frame';
      frame.setAttribute('aria-hidden', 'true');
      frame.innerHTML = cardFrameSvg;

      const content = document.createElement('span');
      content.className = 'upgrade-card-content';

      const meta = document.createElement('span');
      meta.className = 'upgrade-card-meta';
      const category = document.createElement('span');
      category.className = 'upgrade-card-category';
      category.textContent = visual.category;
      const indexElement = document.createElement('span');
      indexElement.className = 'upgrade-card-index';
      indexElement.textContent = `0${index + 1}`;
      meta.append(category, indexElement);

      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.classList.add('upgrade-card-icon');
      icon.setAttribute('viewBox', '0 0 48 48');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', `#ui-upgrade-icon-${visual.icon}`);
      icon.appendChild(use);

      const title = document.createElement('strong');
      title.className = 'upgrade-card-title';
      title.textContent = choice.title;
      const description = document.createElement('span');
      description.className = 'upgrade-card-description';
      description.textContent = choice.description;
      content.append(meta, icon, title, description);
      const preview = getPreview(choice);
      if (preview) {
        const values = document.createElement('small');
        values.textContent = `${STAT_LABELS[preview.stat]} ${formatValue(preview.before)} → ${formatValue(preview.after)}`;
        values.setAttribute('aria-label', `Valor actual ${formatValue(preview.before)}, siguiente ${formatValue(preview.after)}`);
        values.className = 'upgrade-card-preview';
        content.append(values);
      }
      button.addEventListener('click', () => {
        this.close();
        onSelection(choice.id);
      }, { once: true });
      button.append(frame, content);
      this.options.appendChild(button);
    });
    this.root.hidden = false;
  }

  public close(): void {
    this.root.hidden = true;
  }
}
