import type { CosmeticUnlockTarget, CosmeticUnlockResult } from '../../app/CosmeticPurchase';
import {
  BACKGROUND_DEFINITIONS,
  getBackgroundDefinition,
  type BackgroundId
} from '../../content/visual/BackgroundDefinitions';
import type { BackgroundSaveData } from '../../platform/save/SaveStore';
import type { WalletSaveData } from '../../platform/save/SaveStore';
import { formatNova, getCosmeticDiscountQuote } from '../../content/meta/EconomyDefinitions';
import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import { CosmeticPreviewDialog } from './CosmeticPreviewDialog';
import { getRewardCatalogAction } from './RewardCatalogAction';
import { REWARD_COSMETIC_IMAGES } from '../../assets/skins/RewardCosmeticAssets';
import { getRewardCosmetic, type RewardCosmeticSource } from '../../content/retention/RewardCosmeticDefinitions';

export interface BackgroundSelectPanelOptions {
  readonly discountAvailable?: boolean;
  readonly onDiscountPurchase?: (target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>;
  readonly state: BackgroundSaveData;
  readonly wallet: WalletSaveData;
  readonly onStateChange: (state: BackgroundSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
  readonly onRewardNavigate?: (source: RewardCosmeticSource) => void;
}

interface BackgroundCardEntry {
  readonly card: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly action: HTMLElement;
  readonly offer: HTMLElement;
}

/** DOM-only locker for selectable, presentation-only arena atmospheres. */
export class BackgroundSelectPanel {
  private readonly cards: HTMLElement;
  private readonly dialog: CosmeticPreviewDialog;
  private readonly cardEntries = new Map<BackgroundId, BackgroundCardEntry>();
  private state: BackgroundSaveData = { selected: 'deep-space', unlocked: ['deep-space'] };
  private wallet: WalletSaveData = { nova: 0 };
  private discountAvailable = false;
  private discountHandler: ((target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>) | null = null;
  private changeHandler: ((state: BackgroundSaveData) => void) | null = null;
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;
  private rewardNavigateHandler: ((source: RewardCosmeticSource) => void) | null = null;

  public constructor(root: HTMLElement, dialog: CosmeticPreviewDialog) {
    const cards = root.querySelector<HTMLElement>('#start-background-cards');
    if (!cards) {
      throw new Error('Faltan elementos del panel de fondos');
    }
    this.cards = cards;
    this.dialog = dialog;
  }

  public open(options: BackgroundSelectPanelOptions): void {
    this.discountAvailable = options.discountAvailable ?? false;
    this.discountHandler = options.onDiscountPurchase ?? null;
    this.state = this.normalize(options.state);
    this.wallet = { nova: Math.max(0, Math.floor(options.wallet.nova)) };
    this.changeHandler = options.onStateChange;
    this.walletHandler = options.onWalletChange;
    this.rewardNavigateHandler = options.onRewardNavigate ?? null;
    this.cards.scrollTop = 0;
    this.render();
  }

  public close(): void {
    this.discountAvailable = false;
    this.discountHandler = null;
    this.changeHandler = null;
    this.walletHandler = null;
    this.rewardNavigateHandler = null;
  }

  private normalize(state: BackgroundSaveData): BackgroundSaveData {
    const unlocked = Array.from(new Set<BackgroundId>(['deep-space', ...state.unlocked]));
    const selected = unlocked.includes(state.selected) ? state.selected : 'deep-space';
    return { selected, unlocked };
  }

  private render(): void {
    if (this.cardEntries.size === 0) this.mountCards();
    this.updateCards();
  }

  private mountCards(): void {
    this.cards.replaceChildren();
    for (const background of BACKGROUND_DEFINITIONS) {
      const card = document.createElement('article');
      card.className = 'background-card';
      card.dataset.background = background.id;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'background-card-hitarea';
      button.addEventListener('click', () => this.inspect(background.id, button));

      const art = document.createElement('span');
      art.className = 'background-card-art';
      art.dataset.background = background.id;
      const reward = getRewardCosmetic(background.id);
      if (reward) {
        art.dataset.reward = 'true';
        art.style.backgroundImage = `url("${REWARD_COSMETIC_IMAGES[reward.id]}")`;
      }
      art.setAttribute('aria-hidden', 'true');

      const copy = document.createElement('span');
      copy.className = 'background-card-copy';
      const meta = document.createElement('span');
      meta.className = 'background-card-meta';
      meta.textContent = background.rarity;
      const title = document.createElement('strong');
      title.textContent = background.name;
      const description = document.createElement('span');
      description.textContent = background.description;
      const action = document.createElement('span');
      action.className = 'background-card-action';
      const offer = document.createElement('span');
      offer.className = 'cosmetic-discount-badge';
      offer.textContent = 'OFERTA −25% · VIDEO + NOVA';
      copy.append(meta, title, description, offer, action);
      button.append(art, copy);
      card.append(button);
      this.cards.append(card);
      this.cardEntries.set(background.id, { card, button, action, offer });
    }
  }

  private updateCards(): void {
    for (const background of BACKGROUND_DEFINITIONS) {
      const entry = this.cardEntries.get(background.id);
      if (!entry) continue;
      const unlocked = this.state.unlocked.includes(background.id);
      const selected = this.state.selected === background.id;
      entry.offer.hidden = unlocked || !this.discountAvailable || !!getRewardCatalogAction(background.id)
        || !getCosmeticDiscountQuote(background.priceNova, this.wallet.nova).eligible;
      entry.card.classList.toggle('is-selected', selected);
      const reward = getRewardCatalogAction(background.id);
      const challengeRewardOwned = reward?.source === 'weekly-logbook' && unlocked;
      entry.card.classList.toggle('is-challenge-reward-owned', challengeRewardOwned);
      entry.card.dataset.challengeRewardOwned = String(challengeRewardOwned);
      const free = background.priceNova === 0 && !reward;
      entry.card.classList.toggle('is-locked', !unlocked && !free);
      entry.button.setAttribute('aria-label', unlocked
        ? `Ver ${background.name}, ${selected ? 'equipado' : 'disponible'}`
        : free ? `Ver ${background.name}, gratis` : `Ver ${background.name}, ${formatNova(background.priceNova)} NOVA`);
      if (challengeRewardOwned) {
        entry.action.textContent = 'RETO · ADQUIRIDA';
        entry.button.setAttribute('aria-label', `Ver ${background.name}, recompensa de reto adquirida`);
      } else if (!unlocked && reward) {
        entry.action.textContent = reward.card;
        entry.button.setAttribute('aria-label', `Ver ${background.name}, ${reward.status}`);
      } else if (selected || unlocked || free) {
        entry.action.textContent = selected ? 'EQUIPADO · VER' : free && !unlocked ? 'GRATIS · VER' : 'VER Y EQUIPAR';
      } else {
        const amount = this.wallet.nova >= background.priceNova
          ? formatNova(background.priceNova)
          : `FALTAN ${formatNova(background.priceNova - this.wallet.nova)}`;
        entry.action.replaceChildren();
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${amount} · VER`));
      }
    }
  }

  private inspect(id: BackgroundId, button: HTMLButtonElement): void {
    const definition = getBackgroundDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
    const selected = this.state.selected === id;
    const affordable = this.wallet.nova >= definition.priceNova;
    const reward = !unlocked ? getRewardCatalogAction(id) : null;
    const preview = document.createElement('div');
    preview.className = 'cosmetic-background-frame';
    preview.dataset.background = id;
    preview.setAttribute('role', 'img');
    preview.setAttribute('aria-label', `Vista previa de ${definition.name}`);
    const plate = document.createElement('div');
    plate.className = 'background-preview';
    plate.dataset.background = id;
    const cosmetic = getRewardCosmetic(id);
    if (cosmetic) {
      plate.style.backgroundImage = `url("${REWARD_COSMETIC_IMAGES[cosmetic.id]}")`;
      preview.style.setProperty('--current-opacity', '.78');
    }
    plate.setAttribute('aria-hidden', 'true');
    const atmosphere = document.createElement('div');
    atmosphere.className = 'cosmetic-background-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 4; index++) {
      const current = document.createElement('span');
      current.className = 'cosmetic-background-current';
      atmosphere.append(current);
    }
    preview.append(plate, atmosphere);
    this.dialog.open({
      kind: 'FONDO / VISTA PREVIA', rarity: definition.rarity, name: definition.name,
      subtitle: definition.subtitle, description: definition.description, preview,
      actionLabel: reward ? reward.label : selected ? 'Equipado' : unlocked ? 'Equipar fondo'
        : definition.priceNova === 0 ? 'Desbloquear gratis y equipar'
          : `Desbloquear y equipar · ${formatNova(definition.priceNova)} NOVA`,
      actionDisabled: selected || (reward ? !reward.available : !unlocked && !affordable),
      status: reward ? reward.status : selected ? 'Equipado actualmente' : unlocked ? 'Desbloqueado'
        : affordable ? 'Disponible para desbloquear' : `Faltan ${formatNova(definition.priceNova - this.wallet.nova)} NOVA`,
      purchase: !unlocked && !reward && definition.priceNova > 0 ? {
        priceNova: definition.priceNova, walletNova: this.wallet.nova,
        videoAvailable: this.discountAvailable,
        onDiscountPurchase: async () => {
          const response = await this.discountHandler?.({ kind: 'background', id }) ?? { result: 'unavailable' as const };
          if (response.result === 'rewarded' || response.result === 'unavailable') this.discountAvailable = false;
          if (response.data) {
            this.state = this.normalize(response.data.backgrounds);
            this.wallet = response.data.wallet;
          }
          this.updateCards();
          return response;
        }
      } : undefined,
      onAction: () => { if (reward?.available) this.rewardNavigateHandler?.(reward.source); else if (!reward) this.select(id); }
    }, button);
  }

  private select(id: BackgroundId): void {
    const definition = getBackgroundDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
    if (!unlocked && (getRewardCatalogAction(id) || this.wallet.nova < definition.priceNova)) return;
    const next: BackgroundSaveData = unlocked
      ? { ...this.state, selected: id }
      : { selected: id, unlocked: Array.from(new Set<BackgroundId>([...this.state.unlocked, id])) };
    if (!unlocked && definition.priceNova > 0) {
      this.wallet = { nova: this.wallet.nova - definition.priceNova };
      this.walletHandler?.(this.wallet);
    }
    this.state = this.normalize(next);
    this.changeHandler?.(this.state);
    this.render();
  }
}
