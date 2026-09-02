import {
  getPlayerSkinDefinition,
  PLAYER_SKIN_DEFINITIONS
} from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import type { SkinSaveData } from '../../platform/save/SaveStore';
import type { WalletSaveData } from '../../platform/save/SaveStore';
import { formatNova } from '../../content/meta/EconomyDefinitions';
import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

export interface SkinSelectPanelOptions {
  readonly state: SkinSaveData;
  readonly wallet: WalletSaveData;
  readonly onStateChange: (state: SkinSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
}

interface SkinCardEntry {
  readonly card: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly action: HTMLElement;
}

/** DOM-only locker: cards stay accessible HTML, while previews remain SVG. */
export class SkinSelectPanel {
  private readonly cards: HTMLElement;
  private readonly preview: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedStatus: HTMLElement;
  private readonly cardEntries = new Map<PlayerSkinId, SkinCardEntry>();
  private state: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private wallet: WalletSaveData = { nova: 0 };
  private changeHandler: ((state: SkinSaveData) => void) | null = null;
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const cards = root.querySelector<HTMLElement>('#start-skin-cards');
    const preview = root.querySelector<HTMLElement>('#start-skin-preview');
    const selectedName = root.querySelector<HTMLElement>('#start-skin-selected-name');
    const selectedStatus = root.querySelector<HTMLElement>('#start-skin-selected-status');
    if (!cards || !preview || !selectedName || !selectedStatus) {
      throw new Error('Faltan elementos del panel de skins');
    }
    this.cards = cards;
    this.preview = preview;
    this.selectedName = selectedName;
    this.selectedStatus = selectedStatus;
  }

  public open(options: SkinSelectPanelOptions): void {
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

  private normalize(state: SkinSaveData): SkinSaveData {
    const unlocked = Array.from(new Set<PlayerSkinId>(['cyan', ...state.unlocked]));
    const selected = unlocked.includes(state.selected) ? state.selected : 'cyan';
    return { selected, unlocked };
  }

  private render(): void {
    const definition = getPlayerSkinDefinition(this.state.selected);
    this.preview.replaceChildren();
    this.preview.insertAdjacentHTML('afterbegin', createPlayerSkinPreviewSvg(this.state.selected));
    this.selectedName.textContent = definition.name;
    this.selectedStatus.textContent = `EQUIPADA \u00b7 ${definition.subtitle}`;

    // Cards and their SVGs are mounted once. Replacing the whole collection on
    // every selection made mobile browsers rerasterize four animated SVGs in
    // the same frame, which can flash the panel on GPU-constrained devices.
    if (this.cardEntries.size === 0) this.mountCards();
    this.updateCards();
  }

  private mountCards(): void {
    this.cards.replaceChildren();

    for (const skin of PLAYER_SKIN_DEFINITIONS) {
      const card = document.createElement('article');
      card.className = 'skin-card';
      card.dataset.skin = skin.id;
      card.dataset.tone = skin.id;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'skin-card-hitarea';
      button.addEventListener('click', () => this.select(skin.id, this.state.unlocked.includes(skin.id)));

      const art = document.createElement('span');
      art.className = 'skin-card-art';
      art.setAttribute('aria-hidden', 'true');
      art.insertAdjacentHTML('afterbegin', createPlayerSkinPreviewSvg(skin.id));
      button.append(art);

      const copy = document.createElement('span');
      copy.className = 'skin-card-copy';
      const meta = document.createElement('span');
      meta.className = 'skin-card-meta';
      meta.textContent = skin.rarity;
      const title = document.createElement('strong');
      title.textContent = skin.name;
      const description = document.createElement('span');
      description.textContent = skin.description;
      const action = document.createElement('span');
      action.className = 'skin-card-action';
      copy.append(meta, title, description, action);
      button.append(copy);
      card.append(button);
      this.cards.append(card);
      this.cardEntries.set(skin.id, { card, button, action });
    }
  }

  private updateCards(): void {
    for (const skin of PLAYER_SKIN_DEFINITIONS) {
      const entry = this.cardEntries.get(skin.id);
      if (!entry) continue;
      const unlocked = this.state.unlocked.includes(skin.id);
      const selected = this.state.selected === skin.id;
      entry.card.classList.toggle('is-selected', selected);
      entry.card.classList.toggle('is-locked', !unlocked);
      entry.button.setAttribute('aria-pressed', String(selected));
      entry.button.setAttribute('aria-label', unlocked
        ? `${selected ? 'Equipada: ' : 'Equipar: '}${skin.name}`
        : `Adquirir ${skin.name} por ${formatNova(skin.priceNova)} NOVA`);
      if (selected || unlocked) {
        entry.action.textContent = selected ? 'EQUIPADA' : 'EQUIPAR';
      } else {
        const amount = this.wallet.nova >= skin.priceNova
          ? formatNova(skin.priceNova)
          : `FALTAN ${formatNova(skin.priceNova - this.wallet.nova)}`;
        entry.action.replaceChildren();
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${amount}`));
      }
    }
  }

  private select(id: PlayerSkinId, unlocked: boolean): void {
    const definition = getPlayerSkinDefinition(id);
    if (!unlocked && this.wallet.nova < definition.priceNova) return;
    const next: SkinSaveData = unlocked
      ? { ...this.state, selected: id }
      : { selected: id, unlocked: Array.from(new Set<PlayerSkinId>([...this.state.unlocked, id])) };
    if (!unlocked && definition.priceNova > 0) {
      this.wallet = { nova: this.wallet.nova - definition.priceNova };
      this.walletHandler?.(this.wallet);
    }
    this.state = this.normalize(next);
    this.changeHandler?.(this.state);
    this.render();
  }
}
