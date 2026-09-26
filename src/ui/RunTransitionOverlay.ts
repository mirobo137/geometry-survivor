import type { ActId } from '../content/run/ActDefinitions';
import type { OverdriveStageState } from '../content/run/OverdriveDefinitions';
import type { FxQuality } from '../content/visual/VisualTokens';
import radialIcon from '../assets/svg/ui/start/radial.svg?url';
import angularIcon from '../assets/svg/ui/start/angular.svg?url';
import fractureIcon from '../assets/svg/ui/start/fracture.svg?url';
import overdriveIcon from '../assets/svg/ui/start/overdrive.svg?url';
import gateArt from '../assets/svg/ui/run-entry-gate.svg?raw';

export type RunTransitionRoute = ActId | 'overdrive';
export type RunTransitionVariant = 'premium' | 'basic';

const ROUTES: Record<RunTransitionRoute, {
  readonly chapter: string;
  readonly name: string;
  readonly detail: string;
  readonly icon: string;
}> = {
  radial: { chapter: 'ACTO I', name: 'RADIAL', detail: 'EL NÚCLEO DESPIERTA', icon: radialIcon },
  angular: { chapter: 'ACTO II', name: 'ANGULAR', detail: 'LA ARENA CAMBIA DE EJE', icon: angularIcon },
  fracture: { chapter: 'ACTO III', name: 'FRACTURE', detail: 'EL CONTORNO SE ROMPE', icon: fractureIcon },
  overdrive: { chapter: 'INFINITO', name: 'OVERDRIVE', detail: 'EL CICLO COMIENZA', icon: overdriveIcon }
};

/** Presentation-only route announcement. The coordinator owns the frozen run. */
export class RunTransitionOverlay {
  private readonly root: HTMLElement;
  private readonly chapter: HTMLElement;
  private readonly name: HTMLElement;
  private readonly detail: HTMLElement;
  private readonly icon: HTMLImageElement;
  private readonly skip: HTMLButtonElement;

  public constructor(root: HTMLElement, onSkip: () => void, quality: FxQuality) {
    const chapter = root.querySelector<HTMLElement>('[data-run-transition-chapter]');
    const name = root.querySelector<HTMLElement>('[data-run-transition-name]');
    const detail = root.querySelector<HTMLElement>('[data-run-transition-detail]');
    const icon = root.querySelector<HTMLImageElement>('[data-run-transition-icon]');
    const skip = root.querySelector<HTMLButtonElement>('[data-run-transition-skip]');
    if (!chapter || !name || !detail || !icon || !skip) throw new Error('Falta la presentación de entrada');
    this.root = root;
    this.chapter = chapter;
    this.name = name;
    this.detail = detail;
    this.icon = icon;
    this.skip = skip;
    const gate = root.querySelector<HTMLElement>('[data-run-transition-gate]');
    if (!gate) throw new Error('Falta la compuerta de entrada');
    // Trusted, local SVG master, mounted once. Animation only transforms layers.
    gate.innerHTML = gateArt;
    root.dataset.quality = quality;
    skip.addEventListener('click', onSkip);
  }

  public openRoute(route: RunTransitionRoute, variant: RunTransitionVariant): number {
    const copy = ROUTES[route];
    this.chapter.textContent = copy.chapter;
    this.name.textContent = copy.name;
    this.detail.textContent = copy.detail;
    this.icon.src = copy.icon;
    this.root.dataset.route = route;
    this.root.dataset.variant = variant;
    this.skip.hidden = variant !== 'premium';
    this.root.hidden = false;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const duration = reducedMotion ? 0.45 : variant === 'premium' ? 2.6 : 1.3;
    this.root.style.setProperty('--run-transition-duration', `${duration}s`);
    return duration;
  }

  public openOverdriveStage(state: OverdriveStageState): void {
    this.openRoute('overdrive', 'basic');
    this.chapter.textContent = `OVERDRIVE · VUELTA ${state.lap}`;
    this.name.textContent = `TRAMO ${state.stage}`;
    this.detail.textContent = ROUTES[(['radial', 'angular', 'fracture'] as const)[state.stageInLap - 1]!].name;
    this.root.style.setProperty('--run-transition-duration', '3s');
  }

  public setPaused(paused: boolean): void {
    this.root.classList.toggle('is-paused', paused);
  }

  public close(): void {
    this.root.hidden = true;
    this.root.classList.remove('is-paused');
  }
}
