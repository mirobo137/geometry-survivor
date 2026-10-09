import { observeVisibleImages, stopObservingImages } from '../ImageReadiness';
import { formatNova, getCosmeticDiscountQuote } from '../../content/meta/EconomyDefinitions';
import type { CosmeticUnlockResult } from '../../app/CosmeticPurchase';

export interface CosmeticPreviewOptions {
  readonly kind: string;
  readonly rarity: string;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly preview: HTMLElement;
  readonly actionLabel: string;
  readonly actionDisabled: boolean;
  readonly status: string;
  readonly onAction: () => void;
  readonly purchase?: {
    readonly priceNova: number;
    readonly walletNova: number;
    readonly videoAvailable: boolean;
    readonly onDiscountPurchase: () => Promise<CosmeticUnlockResult>;
  };
}

/** One focused preview for the three cosmetic collections. Art exists only while open. */
export class CosmeticPreviewDialog {
  private readonly dialog: HTMLDialogElement;
  private readonly preview: HTMLElement;
  private readonly kind: HTMLElement;
  private readonly rarity: HTMLElement;
  private readonly name: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly description: HTMLElement;
  private readonly status: HTMLElement;
  private readonly action: HTMLButtonElement;
  private opener: HTMLButtonElement | null = null;
  private onAction: (() => void) | null = null;
  private readonly purchaseInfo = document.createElement('div');
  private readonly discountAction = document.createElement('button');
  private readonly keepSaving = document.createElement('button');
  private purchase: CosmeticPreviewOptions['purchase'];
  private pending = false;
  private requestToken = 0;

  public constructor(root: HTMLElement) {
    const dialog = root.querySelector<HTMLDialogElement>('#start-cosmetic-dialog');
    const preview = root.querySelector<HTMLElement>('#start-cosmetic-preview');
    const kind = root.querySelector<HTMLElement>('#start-cosmetic-kind');
    const rarity = root.querySelector<HTMLElement>('#start-cosmetic-rarity');
    const name = root.querySelector<HTMLElement>('#start-cosmetic-title');
    const subtitle = root.querySelector<HTMLElement>('#start-cosmetic-subtitle');
    const description = root.querySelector<HTMLElement>('#start-cosmetic-description');
    const status = root.querySelector<HTMLElement>('#start-cosmetic-status');
    const action = root.querySelector<HTMLButtonElement>('#start-cosmetic-action');
    const close = root.querySelector<HTMLButtonElement>('#start-cosmetic-close');
    if (!dialog || !preview || !kind || !rarity || !name || !subtitle || !description || !status || !action || !close) {
      throw new Error('Faltan elementos de la vista previa de cosméticos');
    }
    this.dialog = dialog;
    this.preview = preview;
    this.kind = kind;
    this.rarity = rarity;
    this.name = name;
    this.subtitle = subtitle;
    this.description = description;
    this.status = status;
    this.action = action;
    this.purchaseInfo.id = 'start-cosmetic-price-summary';
    this.purchaseInfo.className = 'cosmetic-price-summary';
    status.before(this.purchaseInfo);
    this.discountAction.id = 'start-cosmetic-discount-action';
    this.discountAction.type = 'button';
    this.keepSaving.id = 'start-cosmetic-keep-saving';
    this.keepSaving.type = 'button';
    this.keepSaving.textContent = 'Seguir ahorrando';
    const actions = document.createElement('div');
    actions.className = 'cosmetic-dialog-actions';
    action.before(actions);
    actions.append(action, this.discountAction, this.keepSaving);
    this.discountAction.addEventListener('click', () => { void this.purchaseWithVideo(); });
    this.keepSaving.addEventListener('click', () => { if (!this.pending) this.close(); });
    close.addEventListener('click', () => { if (!this.pending) this.close(); });
    dialog.addEventListener('cancel', event => { if (this.pending) event.preventDefault(); });
    action.addEventListener('click', () => {
      if (this.pending) return;
      this.onAction?.();
      this.close();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog && !this.pending) this.close();
    });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      stopObservingImages(this.preview);
      this.preview.replaceChildren();
      this.onAction = null;
      this.purchase = undefined;
      this.pending = false;
      this.requestToken += 1;
      if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
      this.opener = null;
    });
  }

  public open(options: CosmeticPreviewOptions, opener: HTMLButtonElement): void {
    if (this.dialog.open) this.close();
    this.opener = opener;
    this.kind.textContent = options.kind;
    this.rarity.textContent = options.rarity;
    this.name.textContent = options.name;
    this.subtitle.textContent = options.subtitle;
    this.description.textContent = options.description;
    this.status.textContent = options.status;
    this.action.textContent = options.actionLabel;
    this.action.disabled = options.actionDisabled;
    this.preview.replaceChildren(options.preview);
    this.onAction = options.onAction;
    this.purchase = options.purchase;
    this.pending = false;
    this.renderPurchase();
    this.dialog.showModal();
    observeVisibleImages(this.preview);
  }

  public close(): void {
    this.requestToken += 1;
    stopObservingImages(this.preview);
    if (this.dialog.open) this.dialog.close();
  }

  private renderPurchase(): void {
    this.purchaseInfo.replaceChildren();
    const purchase = this.purchase;
    const quote = purchase ? getCosmeticDiscountQuote(purchase.priceNova, purchase.walletNova) : null;
    const offer = !!quote?.eligible && !!purchase?.videoAvailable;
    this.dialog.classList.toggle('has-discount-offer', offer);
    this.purchaseInfo.hidden = !quote;
    this.action.hidden = offer;
    this.discountAction.hidden = !offer;
    this.discountAction.disabled = false;
    this.keepSaving.hidden = !offer;
    this.keepSaving.textContent = 'Seguir ahorrando';
    this.keepSaving.disabled = false;
    if (!quote) return;
    const row = (label: string, amount: number, className = ''): void => {
      const line = document.createElement('div');
      line.className = className;
      const title = document.createElement('span');
      title.textContent = label;
      const value = document.createElement('strong');
      value.textContent = `${formatNova(amount)} NOVA`;
      line.append(title, value);
      this.purchaseInfo.append(line);
    };
    row('Precio normal', quote.priceNova);
    row('Tu saldo', quote.balanceNova);
    row('Te falta al precio normal', quote.missingNova);
    if (!offer) return;
    row('Descuento por video · 25%', quote.discountNova, 'cosmetic-price-discount');
    row('Pagarás con NOVA', quote.payNova, 'cosmetic-price-total');
    const explanation = document.createElement('p');
    explanation.textContent = 'El video cubre el descuento, no la skin completa. Se cobrará la NOVA indicada solo después de completar el video.';
    this.purchaseInfo.append(explanation);
    this.discountAction.replaceChildren();
    const label = document.createElement('span');
    label.textContent = 'Ver video y pagar';
    this.discountAction.append(label, document.createTextNode(` · ${formatNova(quote.payNova)} NOVA`));
    this.status.textContent = 'Oferta opcional: video + NOVA. Si cancelas el video, no se cobra nada.';
  }

  private async purchaseWithVideo(): Promise<void> {
    const purchase = this.purchase;
    if (!purchase || this.pending || !purchase.videoAvailable
      || !getCosmeticDiscountQuote(purchase.priceNova, purchase.walletNova).eligible) return;
    const token = ++this.requestToken;
    this.pending = true;
    this.discountAction.disabled = true;
    this.keepSaving.disabled = true;
    this.discountAction.textContent = 'Anuncio en curso';
    this.status.textContent = 'No se cobrará NOVA hasta completar el video.';
    let response: CosmeticUnlockResult;
    try { response = await purchase.onDiscountPurchase(); } catch { response = { result: 'error' }; }
    if (token !== this.requestToken || !this.dialog.open) return;
    this.pending = false;
    this.keepSaving.disabled = false;
    if (response.result === 'rewarded') {
      this.purchase = undefined;
      this.discountAction.textContent = 'Comprada y equipada';
      this.status.textContent = 'Compra guardada. Se cobró la NOVA indicada y la skin ya está equipada.';
      this.keepSaving.textContent = 'Cerrar vista previa';
    } else {
      if (response.data) {
        this.purchase = { ...purchase, walletNova: response.data.wallet.nova };
        this.action.disabled = response.data.wallet.nova < purchase.priceNova;
      }
      this.renderPurchase();
      this.status.textContent = response.result === 'dismissed'
        ? 'Video cancelado. No se cobró NOVA ni se desbloqueó la skin.'
        : response.result === 'unavailable'
          ? 'Video no disponible. No se cobró NOVA. Puedes seguir ahorrando.'
          : 'No se pudo guardar la compra o completar el video. No se cobró NOVA. Inténtalo de nuevo.';
      if (response.result === 'unavailable') this.discountAction.disabled = true;
    }
  }
}
