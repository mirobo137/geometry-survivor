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
    close.addEventListener('click', () => this.close());
    action.addEventListener('click', () => {
      this.onAction?.();
      this.close();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) this.close();
    });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      this.preview.replaceChildren();
      this.onAction = null;
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
    this.dialog.showModal();
  }

  public close(): void {
    if (this.dialog.open) this.dialog.close();
  }
}
