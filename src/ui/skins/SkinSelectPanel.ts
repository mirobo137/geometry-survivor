import {
  getPlayerSkinDefinition,
  PLAYER_SKIN_DEFINITIONS
} from '../../content/visual/SkinDefinitions';
import type { PlayerSkinId } from '../../content/visual/VisualTokens';
import type { SkinSaveData } from '../../platform/save/SaveStore';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

export interface SkinSelectPanelOptions {
  readonly state: SkinSaveData;
  readonly onStateChange: (state: SkinSaveData) => void;
}

/** DOM-only locker: cards stay accessible HTML, while previews remain SVG. */
export class SkinSelectPanel {
  private readonly root: HTMLElement;
  private readonly cards: HTMLElement;
  private readonly preview: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedStatus: HTMLElement;
  private state: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private changeHandler: ((state: SkinSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const cards = root.querySelector<HTMLElement>('#start-skin-cards');
    const preview = root.querySelector<HTMLElement>('#start-skin-preview');
    const selectedName = root.querySelector<HTMLElement>('#start-skin-selected-name');
    const selectedStatus = root.querySelector<HTMLElement>('#start-skin-selected-status');
    if (!cards || !preview || !selectedName || !selectedStatus) {
      throw new Error('Faltan elementos del panel de skins');
    }
    this.root = root;
    this.cards = cards;
    this.preview = preview;
    this.selectedName = selectedName;
    this.selectedStatus = selectedStatus;
  }

  public open(options: SkinSelectPanelOptions): void {
    this.state = this.normalize(options.state);
    this.changeHandler = options.onStateChange;
    this.root.hidden = false;
    this.render();
  }

  public close(): void {
    this.root.hidden = true;
    this.changeHandler = null;
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
    this.selectedStatus.textContent = `EQUIPADA · ${definition.subtitle}`;
    this.cards.replaceChildren();

    for (const skin of PLAYER_SKIN_DEFINITIONS) {
      const unlocked = this.state.unlocked.includes(skin.id);
      const selected = this.state.selected === skin.id;
      const card = document.createElement('article');
      card.className = 'skin-card';
      card.dataset.skin = skin.id;
      card.dataset.tone = skin.id;
      if (selected) card.classList.add('is-selected');
      if (!unlocked) card.classList.add('is-locked');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'skin-card-hitarea';
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', unlocked
        ? `${selected ? 'Equipada: ' : 'Equipar: '}${skin.name}`
        : `Adquirir ${skin.name}`);
      button.addEventListener('click', () => this.select(skin.id, unlocked));

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
      action.textContent = selected ? 'EQUIPADA' : unlocked ? 'EQUIPAR' : 'ADQUIRIR · DEMO';
      copy.append(meta, title, description, action);
      button.append(copy);
      card.append(button);
      this.cards.append(card);
    }
  }

  private select(id: PlayerSkinId, unlocked: boolean): void {
    const next: SkinSaveData = unlocked
      ? { ...this.state, selected: id }
      : { selected: id, unlocked: Array.from(new Set<PlayerSkinId>([...this.state.unlocked, id])) };
    this.state = this.normalize(next);
    this.changeHandler?.(this.state);
    this.render();
  }
}
