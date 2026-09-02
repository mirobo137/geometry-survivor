import {
  BACKGROUND_DEFINITIONS,
  getBackgroundDefinition,
  type BackgroundId
} from '../../content/visual/BackgroundDefinitions';
import type { BackgroundSaveData } from '../../platform/save/SaveStore';

export interface BackgroundSelectPanelOptions {
  readonly state: BackgroundSaveData;
  readonly onStateChange: (state: BackgroundSaveData) => void;
}

interface BackgroundCardEntry {
  readonly card: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly action: HTMLElement;
}

/** DOM-only locker for selectable, presentation-only arena atmospheres. */
export class BackgroundSelectPanel {
  private readonly cards: HTMLElement;
  private readonly preview: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedStatus: HTMLElement;
  private readonly cardEntries = new Map<BackgroundId, BackgroundCardEntry>();
  private state: BackgroundSaveData = { selected: 'deep-space', unlocked: ['deep-space'] };
  private changeHandler: ((state: BackgroundSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const cards = root.querySelector<HTMLElement>('#start-background-cards');
    const preview = root.querySelector<HTMLElement>('#start-background-preview');
    const selectedName = root.querySelector<HTMLElement>('#start-background-selected-name');
    const selectedStatus = root.querySelector<HTMLElement>('#start-background-selected-status');
    if (!cards || !preview || !selectedName || !selectedStatus) {
      throw new Error('Faltan elementos del panel de fondos');
    }
    this.cards = cards;
    this.preview = preview;
    this.selectedName = selectedName;
    this.selectedStatus = selectedStatus;
  }

  public open(options: BackgroundSelectPanelOptions): void {
    this.state = this.normalize(options.state);
    this.changeHandler = options.onStateChange;
    this.cards.scrollTop = 0;
    this.render();
  }

  public close(): void {
    this.changeHandler = null;
  }

  private normalize(state: BackgroundSaveData): BackgroundSaveData {
    const unlocked = Array.from(new Set<BackgroundId>(['deep-space', ...state.unlocked]));
    const selected = unlocked.includes(state.selected) ? state.selected : 'deep-space';
    return { selected, unlocked };
  }

  private render(): void {
    const definition = getBackgroundDefinition(this.state.selected);
    this.preview.dataset.background = definition.id;
    this.selectedName.textContent = definition.name;
    this.selectedStatus.textContent = `EQUIPADO · ${definition.subtitle}`;
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
      button.addEventListener('click', () => this.select(background.id, this.state.unlocked.includes(background.id)));

      const art = document.createElement('span');
      art.className = 'background-card-art';
      art.dataset.background = background.id;
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
      copy.append(meta, title, description, action);
      button.append(art, copy);
      card.append(button);
      this.cards.append(card);
      this.cardEntries.set(background.id, { card, button, action });
    }
  }

  private updateCards(): void {
    for (const background of BACKGROUND_DEFINITIONS) {
      const entry = this.cardEntries.get(background.id);
      if (!entry) continue;
      const unlocked = this.state.unlocked.includes(background.id);
      const selected = this.state.selected === background.id;
      entry.card.classList.toggle('is-selected', selected);
      entry.card.classList.toggle('is-locked', !unlocked);
      entry.button.setAttribute('aria-pressed', String(selected));
      entry.button.setAttribute('aria-label', unlocked
        ? `${selected ? 'Equipado: ' : 'Equipar: '}${background.name}`
        : `Adquirir ${background.name}`);
      entry.action.textContent = selected ? 'EQUIPADO' : unlocked ? 'EQUIPAR' : 'ADQUIRIR · DEMO';
    }
  }

  private select(id: BackgroundId, unlocked: boolean): void {
    const next: BackgroundSaveData = unlocked
      ? { ...this.state, selected: id }
      : { selected: id, unlocked: Array.from(new Set<BackgroundId>([...this.state.unlocked, id])) };
    this.state = this.normalize(next);
    this.changeHandler?.(this.state);
    this.render();
  }
}
