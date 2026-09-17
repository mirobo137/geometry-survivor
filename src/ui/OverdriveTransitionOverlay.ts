import type { OverdriveStageState } from '../content/run/OverdriveDefinitions';

/** Presentation-only three-second handoff between preserved Overdrive stages. */
export class OverdriveTransitionOverlay {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement | null;
  private readonly subtitle: HTMLElement | null;

  public constructor(root: HTMLElement) {
    this.root = root;
    this.title = root.querySelector<HTMLElement>('[data-overdrive-transition-title]');
    this.subtitle = root.querySelector<HTMLElement>('[data-overdrive-transition-subtitle]');
  }

  public open(state: OverdriveStageState): void {
    if (this.title) this.title.textContent = `Vuelta ${state.lap} · Tramo ${state.stageInLap}`;
    if (this.subtitle) this.subtitle.textContent = `Tramo ${state.stage} · Presión ×${state.pressureMultiplier.toFixed(2)}`;
    this.root.hidden = false;
  }

  public close(): void {
    this.root.hidden = true;
  }
}
