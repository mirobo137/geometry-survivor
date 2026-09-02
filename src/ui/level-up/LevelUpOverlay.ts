import type { UpgradeDefinition, UpgradeId } from '../../content/upgrades/UpgradeDefinitions';
import type { UpgradePreview, UpgradePreviewStat } from '../../simulation/progression/UpgradePreview';
import cardFrameSvg from '../../assets/svg/ui/level-up/card-frame.svg?raw';
import upgradeIconsSvg from '../../assets/svg/ui/level-up/icons.svg?raw';
import { getUpgradeCardVisual } from './UpgradeCardVisual';
import type { LevelUpCardInteraction, LevelUpCardLayout } from './LevelUpCardInteraction';

export type UpgradeSelectionHandler = (upgradeId: UpgradeId) => void;
export type UpgradePreviewProvider = (upgrade: UpgradeDefinition) => UpgradePreview | null;
export type LevelUpInteractionHandler = (interaction: LevelUpCardInteraction) => void;

const CARD_SELECTION_DELAY_MS = 220;

const STAT_LABELS: Record<UpgradePreviewStat, string> = {
  movementSpeed: 'Velocidad',
  projectileDamage: 'Daño de proyectil',
  maxHealth: 'Vida máxima',
  projectileCooldown: 'Intervalo',
  experienceGain: 'Experiencia',
  healthRecovery: 'Recuperaci\u00f3n',
  vampirism: 'Vampirismo',
  orbitRadius: 'Radio de órbita',
  chainDamage: 'Daño de cadena',
  armor: 'Armadura'
};

const PERCENTAGE_STATS: ReadonlySet<UpgradePreviewStat> = new Set([
  'experienceGain',
  'healthRecovery',
  'vampirism'
]);

const formatValue = (value: number, stat: UpgradePreviewStat): string => {
  if (PERCENTAGE_STATS.has(stat)) {
    const percentage = value * 100;
    return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1).replace(/0$/, '')}%`;
  }
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

export class LevelUpOverlay {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly options: HTMLElement;
  private selectionTimer: number | null = null;

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
    getPreview: UpgradePreviewProvider = () => null,
    onInteraction?: LevelUpInteractionHandler
  ): void {
    this.cancelPendingSelection();
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
        values.textContent = `${STAT_LABELS[preview.stat]} ${formatValue(preview.before, preview.stat)} → ${formatValue(preview.after, preview.stat)}`;
        values.setAttribute('aria-label', `Valor actual ${formatValue(preview.before, preview.stat)}, siguiente ${formatValue(preview.after, preview.stat)}`);
        values.className = 'upgrade-card-preview';
        content.append(values);
      }
      button.addEventListener('pointerenter', () => {
        onInteraction?.({ kind: 'focus', index, upgradeId: choice.id });
      });
      button.addEventListener('pointerleave', () => {
        onInteraction?.({ kind: 'blur', index, upgradeId: choice.id });
      });
      button.addEventListener('focus', () => {
        onInteraction?.({ kind: 'focus', index, upgradeId: choice.id });
      });
      button.addEventListener('blur', () => {
        onInteraction?.({ kind: 'blur', index, upgradeId: choice.id });
      });
      button.addEventListener('pointerdown', () => {
        onInteraction?.({ kind: 'press', index, upgradeId: choice.id });
      });
      button.addEventListener('click', () => {
        if (this.selectionTimer !== null) return;
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
        for (const other of this.options.querySelectorAll<HTMLButtonElement>('button')) {
          other.disabled = true;
          if (other !== button) other.classList.add('is-dimmed');
        }
        onInteraction?.({ kind: 'select', index, upgradeId: choice.id });
        this.selectionTimer = window.setTimeout(() => {
          this.selectionTimer = null;
          this.close();
          onSelection(choice.id);
        }, CARD_SELECTION_DELAY_MS);
      }, { once: true });
      button.append(frame, content);
      this.options.appendChild(button);
    });
    this.root.hidden = false;
  }

  /**
   * Returns card centers and sizes relative to the overlay root. The game
   * coordinator converts these CSS coordinates into its logical Pixi space
   * only when opening or resizing, never on every frame.
   */
  public getCardLayouts(): readonly LevelUpCardLayout[] {
    if (this.root.hidden) return [];
    const rootRect = this.root.getBoundingClientRect();
    return Array.from(this.options.querySelectorAll<HTMLButtonElement>('button.upgrade-card'))
      .map((button, index) => {
        const rect = button.getBoundingClientRect();
        const tone = button.dataset.tone;
        if (tone !== 'cyan' && tone !== 'gold' && tone !== 'violet' && tone !== 'amber' && tone !== 'rose' && tone !== 'mint') {
          throw new Error(`Tono de carta invalido: ${tone ?? 'vacío'}`);
        }
        return {
          index,
          x: rect.left - rootRect.left + rect.width * 0.5,
          y: rect.top - rootRect.top + rect.height * 0.5,
          width: rect.width,
          height: rect.height,
          tone
        };
      });
  }

  public close(): void {
    this.cancelPendingSelection();
    this.root.hidden = true;
  }

  private cancelPendingSelection(): void {
    if (this.selectionTimer === null) return;
    window.clearTimeout(this.selectionTimer);
    this.selectionTimer = null;
  }
}
