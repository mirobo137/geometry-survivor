import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import {
  formatNova
} from '../../content/meta/EconomyDefinitions';
import {
  PERMANENT_UPGRADE_DEFINITIONS,
  type PermanentUpgradeId
} from '../../content/meta/PermanentUpgradeDefinitions';
import type { MetaUpgradeSaveData, WalletSaveData } from '../../platform/save/SaveStore';

export interface MetaProgressionPanelOptions {
  readonly wallet: WalletSaveData;
  readonly upgrades: MetaUpgradeSaveData;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
  readonly onUpgradesChange: (upgrades: MetaUpgradeSaveData) => void;
}
interface CardEntry {
  readonly card: HTMLElement;
  readonly level: HTMLElement;
  readonly effect: HTMLElement;
  readonly action: HTMLButtonElement;
}

/** DOM-only meta shop. It never mutates the active run or simulation. */
export class MetaProgressionPanel {
  private readonly walletValue: HTMLElement;
  private readonly cards: HTMLElement;
  private readonly cardEntries = new Map<PermanentUpgradeId, CardEntry>();
  private wallet: WalletSaveData = { nova: 0 };
  private upgrades: MetaUpgradeSaveData = { levels: {} };
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;
  private upgradesHandler: ((upgrades: MetaUpgradeSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const walletValue = root.querySelector<HTMLElement>('#start-meta-nova-value');
    const cards = root.querySelector<HTMLElement>('#start-meta-cards');
    if (!walletValue || !cards) throw new Error('Faltan elementos del laboratorio de mejoras');
    this.walletValue = walletValue;
    this.cards = cards;
  }

  public open(options: MetaProgressionPanelOptions): void {
    this.wallet = { nova: Math.max(0, Math.floor(options.wallet.nova)) };
    this.upgrades = this.normalize(options.upgrades);
    this.walletHandler = options.onWalletChange;
    this.upgradesHandler = options.onUpgradesChange;
    if (this.cardEntries.size === 0) this.mountCards();
    this.render();
  }

  public close(): void {
    this.walletHandler = null;
    this.upgradesHandler = null;
  }

  private normalize(upgrades: MetaUpgradeSaveData): MetaUpgradeSaveData {
    const levels: Partial<Record<PermanentUpgradeId, number>> = {};
    for (const definition of PERMANENT_UPGRADE_DEFINITIONS) {
      const level = Math.min(
        definition.maxLevel,
        Math.max(0, Math.floor(upgrades.levels[definition.id] ?? 0))
      );
      if (level > 0) levels[definition.id] = level;
    }
    return { levels };
  }

  private mountCards(): void {
    this.cards.replaceChildren();
    for (const definition of PERMANENT_UPGRADE_DEFINITIONS) {
      const card = document.createElement('article');
      card.className = 'meta-upgrade-card';
      card.dataset.upgrade = definition.id;

      const header = document.createElement('div');
      header.className = 'meta-upgrade-header';
      const title = document.createElement('strong');
      title.textContent = definition.name;
      const level = document.createElement('span');
      level.className = 'meta-upgrade-level';
      header.append(title, level);

      const description = document.createElement('p');
      description.textContent = definition.description;
      const effect = document.createElement('span');
      effect.className = 'meta-upgrade-effect';
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'meta-upgrade-buy';
      action.addEventListener('click', () => this.purchase(definition.id));
      card.append(header, description, effect, action);
      this.cards.append(card);
      this.cardEntries.set(definition.id, { card, level, effect, action });
    }
  }

  private render(): void {
    this.walletValue.textContent = formatNova(this.wallet.nova);
    for (const definition of PERMANENT_UPGRADE_DEFINITIONS) {
      const entry = this.cardEntries.get(definition.id);
      if (!entry) continue;
      const level = this.upgrades.levels[definition.id] ?? 0;
      const maxed = level >= definition.maxLevel;
      const nextCost = definition.costsNova[level];
      const canBuy = !maxed && nextCost !== undefined && this.wallet.nova >= nextCost;
      entry.card.classList.toggle('is-maxed', maxed);
      entry.card.classList.toggle('is-affordable', canBuy);
      entry.level.textContent = `NIVEL ${level}/${definition.maxLevel}`;
      entry.effect.textContent = definition.effectLabel(level);
      entry.action.disabled = maxed || !canBuy;
      entry.action.setAttribute('aria-label', maxed
        ? `${definition.name}: nivel maximo`
        : `Mejorar ${definition.name} por ${formatNova(nextCost ?? 0)} NOVA`);
      entry.action.replaceChildren();
      if (maxed) {
        entry.action.textContent = 'MÁXIMO';
      } else {
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${formatNova(nextCost ?? 0)}`));
      }
    }
  }

  private purchase(id: PermanentUpgradeId): void {
    const definition = PERMANENT_UPGRADE_DEFINITIONS.find((candidate) => candidate.id === id);
    if (!definition) return;
    const currentLevel = this.upgrades.levels[id] ?? 0;
    const cost = definition.costsNova[currentLevel];
    if (cost === undefined || this.wallet.nova < cost) return;
    this.wallet = { nova: this.wallet.nova - cost };
    this.upgrades = this.normalize({
      levels: { ...this.upgrades.levels, [id]: currentLevel + 1 }
    });
    this.walletHandler?.(this.wallet);
    this.upgradesHandler?.(this.upgrades);
    this.render();
  }
}
