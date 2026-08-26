import type { ViewportTransform } from '../presentation/viewport/ViewportTransform';

export interface InputVector {
  x: number;
  y: number;
}

const MOVEMENT_KEYS: Record<string, InputVector> = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  KeyZ: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  KeyQ: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 }
};

export class InputManager {
  private readonly keys = new Set<string>();
  private pointerId: number | null = null;
  private pointerPosition = { x: 0, y: 0 };
  private readonly onKeyDownBound = (event: KeyboardEvent): void => this.onKeyDown(event);
  private readonly onKeyUpBound = (event: KeyboardEvent): void => this.onKeyUp(event);
  private readonly onPointerDownBound = (event: PointerEvent): void => this.onPointerDown(event);
  private readonly onPointerMoveBound = (event: PointerEvent): void => this.onPointerMove(event);
  private readonly onPointerEndBound = (event: PointerEvent): void => this.onPointerEnd(event);

  public constructor(
    private readonly element: HTMLElement,
    private readonly viewport: ViewportTransform,
    private readonly getPlayerPosition: () => { x: number; y: number }
  ) {}

  public attach(): void {
    window.addEventListener('keydown', this.onKeyDownBound, { passive: false });
    window.addEventListener('keyup', this.onKeyUpBound, { passive: false });
    this.element.addEventListener('pointerdown', this.onPointerDownBound, { passive: false });
    this.element.addEventListener('pointermove', this.onPointerMoveBound, { passive: false });
    this.element.addEventListener('pointerup', this.onPointerEndBound, { passive: false });
    this.element.addEventListener('pointercancel', this.onPointerEndBound, { passive: false });
    this.element.addEventListener('lostpointercapture', this.onPointerEndBound, { passive: false });
  }

  public detach(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.element.removeEventListener('pointerdown', this.onPointerDownBound);
    this.element.removeEventListener('pointermove', this.onPointerMoveBound);
    this.element.removeEventListener('pointerup', this.onPointerEndBound);
    this.element.removeEventListener('pointercancel', this.onPointerEndBound);
    this.element.removeEventListener('lostpointercapture', this.onPointerEndBound);
  }

  public getMovement(): InputVector {
    let x = 0;
    let y = 0;
    for (const key of this.keys) {
      const direction = MOVEMENT_KEYS[key];
      if (direction) {
        x += direction.x;
        y += direction.y;
      }
    }

    if (this.pointerId !== null) {
      const player = this.getPlayerPosition();
      x += this.pointerPosition.x - player.x;
      y += this.pointerPosition.y - player.y;
    }

    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (MOVEMENT_KEYS[event.code]) event.preventDefault();
    this.keys.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.element.setPointerCapture(event.pointerId);
    this.updatePointer(event);
    event.preventDefault();
  }

  private onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.updatePointer(event);
    event.preventDefault();
  }

  private onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    event.preventDefault();
  }

  private updatePointer(event: PointerEvent): void {
    this.pointerPosition = this.viewport.toWorld(event.clientX, event.clientY, this.element.getBoundingClientRect());
  }
}
