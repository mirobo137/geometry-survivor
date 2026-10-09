import type { FxQuality } from '../content/visual/VisualTokens';

/** Screen-space cinematic sampled by the same clock as the player's defeat. */
export class DefeatSceneOverlay {
  private readonly root: HTMLElement | null;
  private readonly title: HTMLElement | null;
  private readonly caption: HTMLElement | null;
  private age = -1;

  public constructor(container: HTMLElement, quality: FxQuality) {
    if (typeof document === 'undefined' || typeof container.appendChild !== 'function') {
      this.root = null;
      this.title = null;
      this.caption = null;
      return;
    }
    this.root = document.createElement('div');
    this.root.className = 'defeat-scene';
    this.root.dataset.quality = quality;
    this.root.setAttribute('aria-hidden', 'true');
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="defeat-scene-shade"></div>
      <div class="defeat-scene-flash"></div>
      <div class="defeat-scene-ripple"></div>
      <div class="defeat-scene-fracture defeat-scene-fracture-left"></div>
      <div class="defeat-scene-fracture defeat-scene-fracture-right"></div>
      <div class="defeat-scene-horizon"></div>
      <div class="defeat-scene-letterbox defeat-scene-letterbox-top"></div>
      <div class="defeat-scene-letterbox defeat-scene-letterbox-bottom"></div>
      <div class="defeat-scene-copy">
        <span class="defeat-scene-kicker">ORBIHEX / SURVIVAL PROTOCOL</span>
        <strong class="defeat-scene-title"></strong>
        <span class="defeat-scene-caption"></span>
        <span class="defeat-scene-signal"><i></i><i></i><i></i><i></i><i></i></span>
      </div>`;
    this.title = this.root.querySelector<HTMLElement>('.defeat-scene-title')!;
    this.caption = this.root.querySelector<HTMLElement>('.defeat-scene-caption')!;
    container.appendChild(this.root);
  }

  public play(weeklyChallenge: boolean, noHitFailure: boolean): void {
    if (!this.root || !this.title || !this.caption) return;
    this.age = 0;
    this.title.textContent = weeklyChallenge ? 'RETO INTERRUMPIDO' : 'SEÑAL PERDIDA';
    this.caption.textContent = noHitFailure ? 'UN IMPACTO · INTENTO TERMINADO'
      : weeklyChallenge ? 'EL DUELO AÚN NO TERMINA' : 'EL VACÍO GUARDA TU ÚLTIMA TRANSMISIÓN';
    this.root.style.setProperty('--defeat-time', '0s');
    this.root.hidden = false;
  }

  public update(deltaSeconds: number): void {
    if (!this.root || this.age < 0 || deltaSeconds <= 0) return;
    this.age = Math.min(3, this.age + deltaSeconds);
    // Paused CSS animations with a negative delay give us deterministic
    // sampling, including lifecycle pause, without a second timer or rAF loop.
    this.root.style.setProperty('--defeat-time', `${-this.age}s`);
    if (this.age >= 3) this.close();
  }

  public close(): void {
    this.age = -1;
    if (this.root) this.root.hidden = true;
  }

  public destroy(): void {
    this.close();
    this.root?.remove();
  }
}
