import type { CosmeticUnlockTarget, CosmeticUnlockResult } from '../../app/CosmeticPurchase';
import {
  CANNON_SKIN_DEFINITIONS,
  getCannonSkinDefinition,
  type CannonSkinId
} from '../../content/visual/CannonSkinDefinitions';
import type { CannonSkinSaveData } from '../../platform/save/SaveStore';
import type { WalletSaveData } from '../../platform/save/SaveStore';
import { formatNova, getCosmeticDiscountQuote } from '../../content/meta/EconomyDefinitions';
import novaSvg from '../../assets/svg/ui/nova.svg?raw';
import { createCannonPreviewSvg } from './CannonPreviewSvg';
import { CosmeticPreviewDialog } from './CosmeticPreviewDialog';
import { observeVisibleImages } from '../ImageReadiness';
import { getRewardCatalogAction } from './RewardCatalogAction';
import type { RewardCosmeticSource } from '../../content/retention/RewardCosmeticDefinitions';

export interface CannonSelectPanelOptions {
  readonly discountAvailable?: boolean;
  readonly onDiscountPurchase?: (target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>;
  readonly state: CannonSkinSaveData;
  readonly wallet: WalletSaveData;
  readonly onStateChange: (state: CannonSkinSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
  readonly onRewardNavigate?: (source: RewardCosmeticSource) => void;
}

interface CannonCardEntry {
  readonly card: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly action: HTMLElement;
  readonly offer: HTMLElement;
}

/** DOM-only locker for complete cannon + projectile + trail cosmetic packages. */
export class CannonSelectPanel {
  private readonly cards: HTMLElement;
  private readonly dialog: CosmeticPreviewDialog;
  private readonly cardEntries = new Map<CannonSkinId, CannonCardEntry>();
  private state: CannonSkinSaveData = { selected: 'spearhead', unlocked: ['spearhead'] };
  private wallet: WalletSaveData = { nova: 0 };
  private discountAvailable = false;
  private discountHandler: ((target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>) | null = null;
  private changeHandler: ((state: CannonSkinSaveData) => void) | null = null;
  private walletHandler: ((wallet: WalletSaveData) => void) | null = null;
  private rewardNavigateHandler: ((source: RewardCosmeticSource) => void) | null = null;

  public constructor(root: HTMLElement, dialog: CosmeticPreviewDialog) {
    const cards = root.querySelector<HTMLElement>('#start-cannon-cards');
    if (!cards) {
      throw new Error('Faltan elementos del panel de cañones');
    }
    this.cards = cards;
    this.dialog = dialog;
  }

  public open(options: CannonSelectPanelOptions): void {
    this.discountAvailable = options.discountAvailable ?? false;
    this.discountHandler = options.onDiscountPurchase ?? null;
    this.state = this.normalize(options.state);
    this.wallet = { nova: Math.max(0, Math.floor(options.wallet.nova)) };
    this.changeHandler = options.onStateChange;
    this.walletHandler = options.onWalletChange;
    this.rewardNavigateHandler = options.onRewardNavigate ?? null;
    this.cards.scrollTop = 0;
    this.render();
    observeVisibleImages(this.cards);
  }

  public close(): void {
    this.discountAvailable = false;
    this.discountHandler = null;
    this.changeHandler = null;
    this.walletHandler = null;
    this.rewardNavigateHandler = null;
  }

  private normalize(state: CannonSkinSaveData): CannonSkinSaveData {
    const unlocked = Array.from(new Set<CannonSkinId>(['spearhead', ...state.unlocked]));
    const selected = unlocked.includes(state.selected) ? state.selected : 'spearhead';
    return { selected, unlocked };
  }

  private render(): void {
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
      button.addEventListener('click', () => this.inspect(cannon.id, button));

      const art = document.createElement('span');
      art.className = 'cannon-card-art';
      art.setAttribute('aria-hidden', 'true');
      art.insertAdjacentHTML('afterbegin', createCannonPreviewSvg(cannon.id, { animated: false, layout: 'thumbnail' }));
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
      const offer = document.createElement('span');
      offer.className = 'cosmetic-discount-badge';
      offer.textContent = 'OFERTA −25% · VIDEO + NOVA';
      copy.append(meta, title, description, offer, action);
      button.append(copy);
      card.append(button);
      this.cards.append(card);
      this.cardEntries.set(cannon.id, { card, button, action, offer });
    }
  }

  private updateCards(): void {
    for (const cannon of CANNON_SKIN_DEFINITIONS) {
      const entry = this.cardEntries.get(cannon.id);
      if (!entry) continue;
      const unlocked = this.state.unlocked.includes(cannon.id);
      const selected = this.state.selected === cannon.id;
      entry.offer.hidden = unlocked || !this.discountAvailable || !!getRewardCatalogAction(cannon.id)
        || !getCosmeticDiscountQuote(cannon.priceNova, this.wallet.nova).eligible;
      entry.card.classList.toggle('is-selected', selected);
      entry.card.classList.toggle('is-locked', !unlocked);
      entry.button.setAttribute('aria-label', unlocked
        ? `Ver ${cannon.name}, ${selected ? 'equipado' : 'disponible'}`
        : `Ver ${cannon.name}, ${formatNova(cannon.priceNova)} NOVA`);
      const reward = getRewardCatalogAction(cannon.id);
      const challengeRewardOwned = reward?.source === 'weekly-logbook' && unlocked;
      entry.card.classList.toggle('is-challenge-reward-owned', challengeRewardOwned);
      entry.card.dataset.challengeRewardOwned = String(challengeRewardOwned);
      if (challengeRewardOwned) {
        entry.action.textContent = 'RETO · ADQUIRIDA';
        entry.button.setAttribute('aria-label', `Ver ${cannon.name}, recompensa de reto adquirida`);
      } else if (!unlocked && reward) {
        entry.action.textContent = reward.card;
        entry.button.setAttribute('aria-label', `Ver ${cannon.name}, ${reward.status}`);
      } else if (selected || unlocked) {
        entry.action.textContent = selected ? 'EQUIPADO · VER' : 'VER Y EQUIPAR';
      } else {
        const amount = this.wallet.nova >= cannon.priceNova
          ? formatNova(cannon.priceNova)
          : `FALTAN ${formatNova(cannon.priceNova - this.wallet.nova)}`;
        entry.action.replaceChildren();
        entry.action.insertAdjacentHTML('afterbegin', novaSvg);
        const icon = entry.action.querySelector('svg');
        icon?.setAttribute('aria-hidden', 'true');
        icon?.setAttribute('focusable', 'false');
        entry.action.append(document.createTextNode(` ${amount} · VER`));
      }
    }
  }

  private inspect(id: CannonSkinId, button: HTMLButtonElement): void {
    const definition = getCannonSkinDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
    const selected = this.state.selected === id;
    const affordable = this.wallet.nova >= definition.priceNova;
    const reward = !unlocked ? getRewardCatalogAction(id) : null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const preview = document.createElement('div');
    preview.className = 'cannon-preview';
    preview.insertAdjacentHTML('afterbegin', createCannonPreviewSvg(id, { animated: !reducedMotion }));
    this.dialog.open({
      kind: 'DISPARO / VISTA PREVIA', rarity: definition.rarity, name: definition.name,
      subtitle: definition.subtitle, description: definition.description, preview,
      actionLabel: reward ? reward.label : selected ? 'Equipado' : unlocked ? 'Equipar disparo'
        : `Desbloquear y equipar · ${formatNova(definition.priceNova)} NOVA`,
      actionDisabled: selected || (reward ? !reward.available : !unlocked && !affordable),
      status: reward ? reward.status : selected ? 'Equipado actualmente' : unlocked ? 'Desbloqueado'
        : affordable ? 'Disponible para desbloquear' : `Faltan ${formatNova(definition.priceNova - this.wallet.nova)} NOVA`,
      purchase: !unlocked && !reward && definition.priceNova > 0 ? {
        priceNova: definition.priceNova, walletNova: this.wallet.nova,
        videoAvailable: this.discountAvailable,
        onDiscountPurchase: async () => {
          const response = await this.discountHandler?.({ kind: 'cannon', id }) ?? { result: 'unavailable' as const };
          if (response.result === 'rewarded' || response.result === 'unavailable') this.discountAvailable = false;
          if (response.data) {
            this.state = this.normalize(response.data.cannonSkins);
            this.wallet = response.data.wallet;
          }
          this.updateCards();
          return response;
        }
      } : undefined,
      onAction: () => { if (reward?.available) this.rewardNavigateHandler?.(reward.source); else if (!reward) this.select(id); }
    }, button);
  }

  private select(id: CannonSkinId): void {
    const definition = getCannonSkinDefinition(id);
    const unlocked = this.state.unlocked.includes(id);
    if (!unlocked && (getRewardCatalogAction(id) || this.wallet.nova < definition.priceNova)) return;
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
