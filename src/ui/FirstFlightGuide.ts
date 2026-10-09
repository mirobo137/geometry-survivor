import { firstFlightStep } from '../app/FirstFlight';

/** Three contextual hints, sampled by the existing game loop; no extra timers. */
export class FirstFlightGuide {
  private readonly root: HTMLElement | null;
  private readonly cardHint: HTMLElement | null;
  private active = false;
  private seconds = 0;
  private moved = false;
  private step = '';

  public constructor(container: HTMLElement, levelUp: HTMLElement) {
    if (typeof document === 'undefined' || typeof container.appendChild !== 'function') {
      this.root = this.cardHint = null;
      return;
    }
    this.root = document.createElement('aside');
    this.root.className = 'first-flight-guide';
    this.root.setAttribute('role', 'status');
    this.root.hidden = true;
    this.root.innerHTML = `
      <span class="first-flight-guide-mark" aria-hidden="true">✦</span>
      <p></p>
      <button type="button"></button>`;
    this.root.querySelector('button')!.textContent = 'Omitir guía';
    this.root.addEventListener('pointerdown', event => event.stopPropagation());
    this.root.querySelector('button')!.addEventListener('click', () => this.close());
    container.appendChild(this.root);
    this.cardHint = document.createElement('p');
    this.cardHint.className = 'first-flight-card-hint';
    this.cardHint.textContent = 'Elige una de las tres cartas. La mejora se aplica durante esta partida.';
    this.cardHint.hidden = true;
    levelUp.querySelector('.level-up-subtitle')?.after(this.cardHint);
  }

  public start(): void { this.active = true; this.seconds = 0; this.moved = false; this.step = ''; }
  public noteMovement(x: number, y: number): void {
    if (this.active && (x !== 0 || y !== 0)) this.moved = true;
  }
  public update(delta: number, playing: boolean, choosing: boolean): void {
    if (!this.active || !this.root || !this.cardHint) return;
    if (playing) this.seconds += delta;
    this.root.hidden = !playing;
    this.cardHint.hidden = !choosing;
    if (!playing && !choosing) return;
    const step = firstFlightStep(this.seconds, this.moved, choosing);
    if (step === this.step) return;
    this.step = step;
    this.root.querySelector('p')!.textContent = step === 'move'
      ? 'Muévete para esquivar. Tus armas disparan automáticamente.'
      : 'Destruye enemigos para ganar experiencia automáticamente, subir de nivel y mejorar tu nave.';
  }
  public close(): void {
    this.active = false;
    if (this.root) this.root.hidden = true;
    if (this.cardHint) this.cardHint.hidden = true;
  }
  public destroy(): void { this.close(); this.root?.remove(); this.cardHint?.remove(); }
}
