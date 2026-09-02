import {
  CANNON_SKIN_DEFINITIONS,
  getCannonSkinDefinition,
  type CannonSkinId
} from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinSaveData } from '../../platform/save/SaveStore';
import type { WalletSaveData } from '../../platform/save/SaveStore';
import { formatNova } from '../../content/meta/EconomyDefinitions';
import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import { createCannonPreviewSvg } from './CannonPreviewSvg';

export interface CannonSelectPanelOptions {
  readonly state: CannonSkinSaveData;
  readonly wallet: WalletSaveData;
  readonly onStateChange: (state: CannonSkinSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
}

interface CannonCardEntry {
  readonly card: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly action: HTMLElement;
}

/** DOM-only locker for complete cannon + projectile + trail cosmetic packages. */
export class CannonSelectPanel {
  private readonly cards: HTMLElement;
  private readonly preview: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedStatus: HTMLElement;
  private readonly cardEntries = new Map<CannonSkinId, CannonCardEntry>();
  private state: CannonSkinSaveData = { selected: 'basic', unlocked: ['basic'] };
  private wallet: WalletSaveData = { nova: 0 };
  private changeHandler: ((state: CannonSkinSaveData) => void) | null = null;
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const cards = root.querySelector<HTMLElement>('#start-cannon-cards');
    const preview = root.querySelector<HTMLElement>('#start-cannon-preview');
    const selectedName = root.querySelector<HTMLElement>('#start-cannon-selected-name');
    const selectedStatus = root.querySelector<HTMLElement>('#start-cannon-selected-status');
    if (!cards || !preview || !selectedName || !selectedStatus) {
      throw new Error('Faltan elementos del panel de canones');
    }
    this.cards = cards;
    this.preview = preview;
    this.selectedName = selectedName;
    this.selectedStatus = selectedStatus;
  }

  public open(options: CannonSelectPanelOptions): void {
    this.state = this.normalize(options.state);
    this.wallet = { nova: Math.max(0, Math.floor(options.wallet.nova)) };
    this.changeHandler = options.onStateChange;
    this.walletHandler = options.onWalletChange;
    this.cards.scrollTop = 0;
    this.render();
  }

  public close(): void {
    this.changeHandler = null;
    this.walletHandler = null;
  }

  private normalize(state: CannonSkinSaveData): CannonSkinSaveData {
    const unlocked = Array.from(new Set<CannonSkinId>(['basic', ...state.unlocked]));
    const selected = unlocked.includes(state.selected) ? state.selected : 'basic';
    return { selected, unlocked };
  }

  private render(): void {
    const definition = getCannonSkinDefinition(this.state.selected);
    this.preview.replaceChildren();
    const reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.preview.insertAdjacentHTML('afterbegin', createCannonPreviewSvg(this.state.selected, { animated: !reducedMotion }));
    this.selectedName.textContent = definition.name;
    this.selectedStatus.textContent = `EQUIPADO · ${definition.subtitle}`;
    if (this.cardEntries.size === 0) this.mountCards();
    this.updateCards();
  }

  private mountCards(): void {
    this.cards.replaceChildren();
    for (const cannon of CANNON_SKIN_DEFINITIONS) {
      const card = document.createElement('article');
      card.className = 'cannon-card';
      card.dataset.cannon = cannon.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cannon-card-hitarea';
      button.addEventListener('click', () => this.select(cannon.id, this.state.unlocked.includes(cannon.id)));

      const art = document.createElement('span');
      art.className = 'cannon-card-art';
      art.setAttribute('aria-hidden', 'true');
      art.insertAdjacentHTML('afterbegin', createCannonPreviewSvg(cannon.id, { animated: false }));
      button.append(art);

      const copy = document.createElement('span');
      copy.className = 'cannon-card-copy';
      const meta = document.createElement('span');
      meta.className = 'cannon-card-meta';
      meta.textContent = cannon.rarity;
      const title = document.createElement('strong');
      title.textContent = cannon.name;
      const description = document.createElement('span');
      description.textContent = cannon.description;
      const action = document.createElement('span');
      action.className = 'cannon-card-action';
      copy.append(meta, title, description, action);
      button.append(copy);
      card.append(button);
      this.cards.append(card);
      this.cardEntries.set(cannon.id, { card, button, action });
    }
  }

  private updateCards(): void {
    for (const cannon of CANNON_SKIN_DEFINITIONS) {
      const entry = this.cardEntries.get(cannon.id);
      if (!entry) continue;
      const unlocked = this.state.unlocked.includes(cannon.id);
      const selected = this.state.selected === cannon.id;
      entry.card.classList.toggle('is-selected', selected);
      entry.card.classList.toggle('is-locked', !unlocked);
      entry.button.setAttribute('aria-pressed', String(selected));
      entry.button.setAttribute('aria-label', unlocked
        ? `${selected ? 'Equipado: ' : 'Equipar: '}${cannon.name}`
        : `Adquirir ${cannon.name} por ${formatNova(cannon.priceNova)} NOVA`);
      if (selected || unlocked) {
        entry.action.textContent = selected ? 'EQUIPADO' : 'EQUIPAR';
      } else {
        const amount = this.wallet.nova >= cannon.priceNova
          ? formatNova(cannon.priceNova)
          : `FALTAN ${formatNova(cannon.priceNova - this.wallet.nova)}`;
        entry.action.replaceChildren();
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${amount}`));
      }
    }
  }

  private select(id: CannonSkinId, unlocked: boolean): void {
    const definition = getCannonSkinDefinition(id);
    if (!unlocked && this.wallet.nova < definition.priceNova) return;
    const next: CannonSkinSaveData = unlocked
      ? { ...this.state, selected: id }
      : { selected: id, unlocked: Array.from(new Set<CannonSkinId>([...this.state.unlocked, id])) };
    if (!unlocked && definition.priceNova > 0) {
      this.wallet = { nova: this.wallet.nova - definition.priceNova };
      this.walletHandler?.(this.wallet);
    }
    this.state = this.normalize(next);
    this.changeHandler?.(this.state);
    this.render();
  }
}
