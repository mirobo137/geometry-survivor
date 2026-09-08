import type { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import type { MovementVector } from '../simulation/MovementVector';
import type { ControlScheme } from './ControlScheme';

export type InputVector = MovementVector;

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

const RELATIVE_TOUCH_DEAD_ZONE = 10;
const RELATIVE_TOUCH_MAX_DISTANCE = 120;

export class InputManager {
  private readonly keys = new Set<string>();
  private readonly supportsPointerEvents = 'PointerEvent' in window;
  private pointerId: number | null = null;
  private touchId: number | null = null;
  private pointerPosition = { x: 0, y: 0 };
  private pointerStartPosition = { x: 0, y: 0 };
  private firstInputNotified = false;
  private controlScheme: ControlScheme;
  private readonly onKeyDownBound = (event: KeyboardEvent): void => this.onKeyDown(event);
  private readonly onKeyUpBound = (event: KeyboardEvent): void => this.onKeyUp(event);
  private readonly onPointerDownBound = (event: PointerEvent): void => this.onPointerDown(event);
  private readonly onPointerMoveBound = (event: PointerEvent): void => this.onPointerMove(event);
  private readonly onPointerEndBound = (event: PointerEvent): void => this.onPointerEnd(event);
  private readonly onTouchStartBound = (event: TouchEvent): void => this.onTouchStart(event);
  private readonly onTouchMoveBound = (event: TouchEvent): void => this.onTouchMove(event);
  private readonly onTouchEndBound = (event: TouchEvent): void => this.onTouchEnd(event);

  public constructor(
    private readonly element: HTMLElement,
    private readonly viewport: ViewportTransform,
    private readonly getPlayerPosition: () => { x: number; y: number },
    private readonly onFirstInput: () => void = () => undefined,
    controlScheme: ControlScheme = 'auto'
  ) {
    this.controlScheme = controlScheme;
  }

  public setControlScheme(controlScheme: ControlScheme): void {
    if (this.controlScheme === controlScheme) return;
    this.controlScheme = controlScheme;
    this.clearPointerState();
  }

  public get currentControlScheme(): ControlScheme {
    return this.controlScheme;
  }

  public attach(): void {
    window.addEventListener('keydown', this.onKeyDownBound, { passive: false });
    window.addEventListener('keyup', this.onKeyUpBound, { passive: false });
    if (this.supportsPointerEvents) {
      this.element.addEventListener('pointerdown', this.onPointerDownBound, { passive: false });
      this.element.addEventListener('pointermove', this.onPointerMoveBound, { passive: false });
      this.element.addEventListener('pointerup', this.onPointerEndBound, { passive: false });
      this.element.addEventListener('pointercancel', this.onPointerEndBound, { passive: false });
      this.element.addEventListener('lostpointercapture', this.onPointerEndBound, { passive: false });
    } else {
      this.element.addEventListener('touchstart', this.onTouchStartBound, { passive: false });
      this.element.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
      this.element.addEventListener('touchend', this.onTouchEndBound, { passive: false });
      this.element.addEventListener('touchcancel', this.onTouchEndBound, { passive: false });
    }
  }

  public detach(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    if (this.supportsPointerEvents) {
      this.element.removeEventListener('pointerdown', this.onPointerDownBound);
      this.element.removeEventListener('pointermove', this.onPointerMoveBound);
      this.element.removeEventListener('pointerup', this.onPointerEndBound);
      this.element.removeEventListener('pointercancel', this.onPointerEndBound);
      this.element.removeEventListener('lostpointercapture', this.onPointerEndBound);
    } else {
      this.element.removeEventListener('touchstart', this.onTouchStartBound);
      this.element.removeEventListener('touchmove', this.onTouchMoveBound);
      this.element.removeEventListener('touchend', this.onTouchEndBound);
      this.element.removeEventListener('touchcancel', this.onTouchEndBound);
    }
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

    if (this.controlScheme !== 'keyboard' && (this.pointerId !== null || this.touchId !== null)) {
      if (this.controlScheme === 'relative-touch') {
        const relative = this.getRelativePointerMovement();
        x += relative.x;
        y += relative.y;
      } else {
        const player = this.getPlayerPosition();
        x += this.pointerPosition.x - player.x;
        y += this.pointerPosition.y - player.y;
      }
    }

    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  }

  public reset(): void {
    this.keys.clear();
    this.clearPointerState();
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea'));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.isInteractiveTarget(event.target)) return;
    if (MOVEMENT_KEYS[event.code]) {
      event.preventDefault();
      this.notifyFirstInput();
    }
    this.keys.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.isInteractiveTarget(event.target)) return;
    if (this.pointerId !== null) return;
    this.notifyFirstInput();
    this.pointerId = event.pointerId;
    this.updatePointer(event);
    this.pointerStartPosition = { ...this.pointerPosition };
    try {
      this.element.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile WebViews expose Pointer Events but reject pointer capture.
    }
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

  private onTouchStart(event: TouchEvent): void {
    if (this.isInteractiveTarget(event.target)) return;
    if (this.touchId !== null || event.changedTouches.length === 0) return;
    this.notifyFirstInput();
    const touch = event.changedTouches[0];
    this.touchId = touch.identifier;
    this.updateTouch(touch);
    this.pointerStartPosition = { ...this.pointerPosition };
    event.preventDefault();
  }

  private onTouchMove(event: TouchEvent): void {
    const touch = this.findTouch(event.touches);
    if (!touch) return;
    this.updateTouch(touch);
    event.preventDefault();
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.findTouch(event.changedTouches)) return;
    this.touchId = null;
    event.preventDefault();
  }

  private findTouch(touches: TouchList): Touch | null {
    if (this.touchId === null) return null;
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === this.touchId) return touch;
    }
    return null;
  }

  private updateTouch(touch: Touch): void {
    this.pointerPosition = this.viewport.toWorld(
      touch.clientX,
      touch.clientY,
      this.element.getBoundingClientRect()
    );
  }

  private getRelativePointerMovement(): InputVector {
    const x = this.pointerPosition.x - this.pointerStartPosition.x;
    const y = this.pointerPosition.y - this.pointerStartPosition.y;
    const distance = Math.hypot(x, y);
    if (distance <= RELATIVE_TOUCH_DEAD_ZONE) return { x: 0, y: 0 };
    const strength = Math.min(
      1,
      (distance - RELATIVE_TOUCH_DEAD_ZONE) / (RELATIVE_TOUCH_MAX_DISTANCE - RELATIVE_TOUCH_DEAD_ZONE)
    );
    return { x: (x / distance) * strength, y: (y / distance) * strength };
  }

  private clearPointerState(): void {
    this.pointerId = null;
    this.touchId = null;
    this.pointerPosition = { x: 0, y: 0 };
    this.pointerStartPosition = { x: 0, y: 0 };
  }

  private notifyFirstInput(): void {
    if (this.firstInputNotified) return;
    this.firstInputNotified = true;
    this.onFirstInput();
  }
}
