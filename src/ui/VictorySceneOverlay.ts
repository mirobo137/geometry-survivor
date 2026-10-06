import type { FxQuality } from '../content/visual/VisualTokens';

/** Fixed screen-space layers, sampled by the existing terminal presentation clock. */
export class VictorySceneOverlay {
  private readonly root: HTMLElement | null;
  private age = -1;

  public constructor(container: HTMLElement, quality: FxQuality) {
    if (typeof document === 'undefined' || typeof container.appendChild !== 'function') {
      this.root = null;
      return;
    }
    this.root = document.createElement('div');
    this.root.className = 'victory-scene';
    this.root.dataset.quality = quality;
    this.root.setAttribute('aria-hidden', 'true');
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="victory-scene-shade"></div>
      <div class="victory-scene-aura"></div>
      <div class="victory-scene-ring"></div>
      <div class="victory-scene-rays"></div>
      <div class="victory-scene-horizon"></div>
      <div class="victory-scene-copy">
        <span class="victory-scene-emblem">✦</span>
        <strong class="victory-scene-title"></strong>
        <span class="victory-scene-caption"></span>
      </div>`;
    container.appendChild(this.root);
  }

  public play(weeklyChallenge: boolean): void {
    if (!this.root) return;
    this.age = 0;
    // The existing DOM localization observer translates these source phrases
    // and can switch them back to Spanish without replacing the overlay.
    this.root.querySelector('.victory-scene-title')!.textContent = weeklyChallenge ? 'RETO SUPERADO' : 'ACTO COMPLETADO';
    this.root.querySelector('.victory-scene-caption')!.textContent = weeklyChallenge
      ? 'TU HABILIDAD MARCA LA DIFERENCIA' : 'EL CAMINO HACIA LAS ESTRELLAS CONTINÚA';
    this.root.style.setProperty('--victory-time', '0s');
    this.root.hidden = false;
  }

  public update(deltaSeconds: number): void {
    if (!this.root || this.age < 0 || deltaSeconds <= 0) return;
    this.age = Math.min(3, this.age + deltaSeconds);
    this.root.style.setProperty('--victory-time', `${-this.age}s`);
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
