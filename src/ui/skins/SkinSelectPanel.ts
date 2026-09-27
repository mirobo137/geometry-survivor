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
import { CosmeticPreviewDialog } from './CosmeticPreviewDialog';

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

/** DOM-only locker: accessible cards and shared SVG/hybrid presentation. */
export class SkinSelectPanel {
  private readonly cards: HTMLElement;
  private readonly dialog: CosmeticPreviewDialog;
  private readonly cardEntries = new Map<PlayerSkinId, SkinCardEntry>();
  private state: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private wallet: WalletSaveData = { nova: 0 };
  private changeHandler: ((state: SkinSaveData) => void) | null = null;
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;

  public constructor(root: HTMLElement, dialog: CosmeticPreviewDialog) {
    const cards = root.querySelector<HTMLElement>('#start-skin-cards');
    if (!cards) {
      throw new Error('Faltan elementos del panel de skins');
    }
    this.cards = cards;
    this.dialog = dialog;
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
      button.addEventListener('click', () => this.inspect(skin.id, button));

      const art = document.createElement('span');
      art.className = 'skin-card-art';
      art.setAttribute('aria-hidden', 'true');
      art.insertAdjacentHTML('afterbegin', createPlayerSkinPreviewSvg(skin.id, { animated: false }));
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
      entry.button.setAttribute('aria-label', unlocked
        ? `Ver ${skin.name}, ${selected ? 'equipada' : 'disponible'}`
        : `Ver ${skin.name}, ${skin.priceNova === 0 ? 'gratis' : `${formatNova(skin.priceNova)} NOVA`}`);
      if (!unlocked && skin.priceNova === 0) {
        entry.action.textContent = 'GRATIS · VER';
      } else if (selected || unlocked) {
        entry.action.textContent = selected ? 'EQUIPADA · VER' : 'VER Y EQUIPAR';
      } else {
        const amount = this.wallet.nova >= skin.priceNova
          ? formatNova(skin.priceNova)
          : `FALTAN ${formatNova(skin.priceNova - this.wallet.nova)}`;
        entry.action.replaceChildren();
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${amount} · VER`));
      }
    }
  }

  private shouldAnimatePreview(): boolean {
    return typeof window === 'undefined'
      || typeof window.matchMedia !== 'function'
      || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private inspect(id: PlayerSkinId, button: HTMLButtonElement): void {
    const definition = getPlayerSkinDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
    const selected = this.state.selected === id;
    const affordable = this.wallet.nova >= definition.priceNova;
    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.insertAdjacentHTML('afterbegin', createPlayerSkinPreviewSvg(id, { animated: this.shouldAnimatePreview() }));
    this.dialog.open({
      kind: 'NAVE / VISTA PREVIA', rarity: definition.rarity, name: definition.name,
      subtitle: definition.subtitle, description: definition.description, preview,
      actionLabel: selected ? 'Equipada' : unlocked ? 'Equipar nave'
        : definition.priceNova === 0 ? 'Desbloquear gratis y equipar'
          : `Desbloquear y equipar · ${formatNova(definition.priceNova)} NOVA`,
      actionDisabled: selected || (!unlocked && !affordable),
      status: selected ? 'Equipada actualmente' : unlocked ? 'Desbloqueada'
        : affordable ? 'Disponible para desbloquear' : `Faltan ${formatNova(definition.priceNova - this.wallet.nova)} NOVA`,
      onAction: () => this.select(id)
    }, button);
  }

  private select(id: PlayerSkinId): void {
    const definition = getPlayerSkinDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
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
