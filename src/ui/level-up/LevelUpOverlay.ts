import type { UpgradeDefinition, UpgradeId } from '../../content/upgrades/UpgradeDefinitions';
import type { UpgradePreview, UpgradePreviewStat } from '../../simulation/progression/UpgradePreview';
import cardFrameSvg from '../../assets/svg/ui/level-up/premium-card-frame.svg?raw';
import upgradeIconsSvg from '../../assets/svg/ui/level-up/premium-icons.svg?raw';
import { getUpgradeCardVisual } from './UpgradeCardVisual';
import type { LevelUpCardInteraction, LevelUpCardLayout } from './LevelUpCardInteraction';
import type { WeaponPathId } from '../../content/upgrades/UpgradeDefinitions';
import type { WeaponEvolutionId } from '../../content/weapons/WeaponEvolutionDefinitions';

export type UpgradeSelectionHandler = (upgradeId: UpgradeId) => void;
export type UpgradePreviewProvider = (upgrade: UpgradeDefinition) => UpgradePreview | null;
export type LevelUpInteractionHandler = (interaction: LevelUpCardInteraction) => void;
export type RerollHandler = () => void;

export interface LevelUpRewardedOptions {
  readonly rerollAvailable?: boolean;
  readonly onReroll?: RerollHandler;
}

export interface LevelUpNavigationOptions {
  readonly onBack?: () => void;
}

const CARD_SELECTION_DELAY_MS = 220;

const STAT_LABELS: Record<UpgradePreviewStat, string> = {
  movementSpeed: 'Velocidad',
  projectileDamage: 'Daño de proyectil',
  maxHealth: 'Vida máxima',
  projectileCooldown: 'Intervalo',
  experienceGain: 'Experiencia',
  healthRecovery: 'Recuperaci\u00f3n',
  vampirism: 'Vampirismo',
  criticalChance: 'Cr\u00edtico',
  orbitRadius: 'Radio de órbita',
  chainDamage: 'Daño de cadena',
  armor: 'Armadura'
};

const PERCENTAGE_STATS: ReadonlySet<UpgradePreviewStat> = new Set([
  'experienceGain',
  'healthRecovery',
  'vampirism',
  'criticalChance'
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
  private readonly subtitle: HTMLElement;
  private readonly options: HTMLElement;
  private readonly rewardedSection: HTMLElement;
  private readonly rewardedMessage: HTMLElement;
  private readonly rerollButton: HTMLButtonElement;
  private readonly backButton: HTMLButtonElement | null;
  private selectionTimer: number | null = null;
  private rerollHandler: RerollHandler | null = null;
  private backHandler: (() => void) | null = null;

  public constructor(root: HTMLElement) {
    const title = root.querySelector<HTMLElement>('#level-up-title');
    const subtitle = root.querySelector<HTMLElement>('.level-up-subtitle');
    const options = root.querySelector<HTMLElement>('#level-up-options');
    const rewardedSection = root.querySelector<HTMLElement>('#level-up-rewarded');
    const rewardedMessage = root.querySelector<HTMLElement>('#level-up-rewarded-message');
    const rerollButton = root.querySelector<HTMLButtonElement>('#level-up-reroll');
    if (!title || !subtitle || !options || !rewardedSection || !rewardedMessage || !rerollButton) {
      throw new Error('Faltan elementos del level-up');
    }
    this.root = root;
    this.title = title;
    this.subtitle = subtitle;
    this.options = options;
    this.rewardedSection = rewardedSection;
    this.rewardedMessage = rewardedMessage;
    this.rerollButton = rerollButton;
    this.backButton = root.querySelector<HTMLButtonElement>('#level-up-back');
    this.mountIconSprite();
    this.rerollButton.addEventListener('click', () => this.rerollHandler?.());
    this.backButton?.addEventListener('click', () => {
      if (this.selectionTimer !== null) return;
      const handler = this.backHandler;
      this.close();
      handler?.();
    });
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
    onInteraction?: LevelUpInteractionHandler,
    rewarded: LevelUpRewardedOptions = {},
    navigation: LevelUpNavigationOptions = {}
  ): void {
    this.cancelPendingSelection();
    const isEvolutionOffer = choices.length === 2
      && choices.every((choice) => choice.effect.type === 'weaponEvolution');
    const isEvolutionGateOffer = choices.some((choice) => choice.effect.type === 'evolutionOffer');
    const evolutionFamily = choices.find((choice) => (
      choice.effect.type === 'weaponEvolution' || choice.effect.type === 'evolutionOffer'
    ));
    const family = evolutionFamily?.effect.type === 'weaponEvolution'
      ? getEvolutionFamily(evolutionFamily.effect.evolution)
      : evolutionFamily?.effect.type === 'evolutionOffer'
        ? evolutionFamily.effect.family
        : null;
    const familyLabel = family === null ? 'arma' : getWeaponFamilyLabel(family);
    this.options.dataset.choiceCount = String(choices.length);
    this.title.textContent = isEvolutionOffer
      ? `Nivel ${level} Â· EVOLUCION`
      : isEvolutionGateOffer
        ? `Nivel ${level} Â· EVOLUCION DISPONIBLE`
        : `Nivel ${level}`;
    this.subtitle.textContent = isEvolutionOffer
      ? `Elige una ruta y confirma como cambia ${familyLabel}`
      : isEvolutionGateOffer
        ? `${familyLabel} esta lista; abre la carta para comparar sus dos rutas`
        : 'Elige una carta para cambiar el destino de esta run';
    this.root.dataset.offerKind = isEvolutionOffer
      ? 'evolution'
      : isEvolutionGateOffer
        ? 'evolution-offer'
        : 'standard';
    this.backHandler = navigation.onBack ?? null;
    if (this.backButton) {
      this.backButton.hidden = !isEvolutionOffer || this.backHandler === null;
      this.backButton.disabled = false;
    }
    this.options.replaceChildren();
    choices.forEach((choice, index) => {
      const visual = getUpgradeCardVisual(choice.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-card';
      button.dataset.upgradeId = choice.id;
      button.dataset.tone = visual.tone;
      button.dataset.category = visual.category;
      button.dataset.cardKind = choice.effect.type === 'evolutionOffer'
        ? 'evolution-offer'
        : choice.effect.type === 'weaponRank' && choice.effect.rank === 7
          ? 'milestone'
          : 'standard';
      if (choice.effect.type === 'evolutionOffer') {
        button.setAttribute('aria-label', `${choice.title}. Abre las dos evoluciones de ${familyLabel}.`);
      }

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
        this.rerollButton.disabled = true;
        if (this.backButton) this.backButton.disabled = true;
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
    this.rerollHandler = rewarded.onReroll ?? null;
    const canReroll = rewarded.rerollAvailable === true && this.rerollHandler !== null;
    this.rewardedSection.hidden = !canReroll;
    this.rewardedMessage.textContent = canReroll
      ? 'Oferta opcional: cambia estas tres cartas por alternativas.'
      : '';
    this.rerollButton.hidden = !canReroll;
    this.rerollButton.disabled = !canReroll;
    this.rerollButton.textContent = 'Ver anuncio · reroll';
    this.root.hidden = false;
  }

  public setRerollPending(): void {
    this.rewardedMessage.textContent = 'Cargando recompensa...';
    this.rerollButton.disabled = true;
    this.rerollButton.textContent = 'Anuncio en curso';
    this.setCardButtonsDisabled(true);
  }

  public setRerollResult(result: 'rewarded' | 'dismissed' | 'unavailable' | 'error'): void {
    if (result === 'rewarded') {
      this.rewardedMessage.textContent = 'Cartas renovadas.';
      this.rewardedSection.hidden = true;
      this.rerollButton.hidden = true;
      this.rerollButton.disabled = true;
      return;
    }
    if (result === 'unavailable') {
      this.rewardedMessage.textContent = 'Anuncio no disponible. Elige una carta actual.';
      this.rewardedSection.hidden = true;
      this.rerollButton.hidden = true;
      this.rerollButton.disabled = true;
      this.setCardButtonsDisabled(false);
      return;
    }
    this.rewardedMessage.textContent = result === 'dismissed'
      ? 'Anuncio cancelado. Puedes elegir una carta o intentarlo otra vez.'
      : 'No se pudo completar el anuncio. Puedes elegir una carta o reintentarlo.';
    this.rerollButton.disabled = false;
    this.rerollButton.textContent = 'Reintentar · reroll';
    this.setCardButtonsDisabled(false);
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
    this.rerollHandler = null;
    this.backHandler = null;
    if (this.backButton) {
      this.backButton.hidden = true;
      this.backButton.disabled = false;
    }
  }

  private cancelPendingSelection(): void {
    if (this.selectionTimer === null) return;
    window.clearTimeout(this.selectionTimer);
    this.selectionTimer = null;
  }

  private setCardButtonsDisabled(disabled: boolean): void {
    for (const button of this.options.querySelectorAll<HTMLButtonElement>('button.upgrade-card')) {
      button.disabled = disabled;
    }
  }
}

const getEvolutionFamily = (evolution: WeaponEvolutionId): WeaponPathId => {
  switch (evolution) {
    case 'rail_lance':
    case 'pulse_volley': return 'projectile';
    case 'solar_crown':
    case 'graviton_halo': return 'orbit';
    case 'closed_circuit':
    case 'thunderhead': return 'chain';
    case 'twin_comet':
    case 'singularity_return': return 'boomerang';
    case 'echo_shock':
    case 'compression_wave': return 'pulse_ring';
    case 'event_horizon':
    case 'polar_collapse': return 'magnetic_charge';
  }
};

const getWeaponFamilyLabel = (family: WeaponPathId): string => {
  switch (family) {
    case 'projectile': return 'Projectile';
    case 'orbit': return 'Órbita';
    case 'chain': return 'Cadena';
    case 'boomerang': return 'Búmeran';
    case 'pulse_ring': return 'Pulso';
    case 'magnetic_charge': return 'Magnética';
  }
};
