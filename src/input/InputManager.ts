import type { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import type { MovementVector } from '../simulation/MovementVector';
import type { ControlScheme } from './ControlScheme';
import { normalizeControlScheme } from './ControlScheme';

export type InputVector = MovementVector;
export interface JoystickState {
  active: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
}
export const JOYSTICK_RADIUS = 52;
export const JOYSTICK_DEAD_ZONE = 8;

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
  private readonly supportsPointerEvents = 'PointerEvent' in window;
  private pointerId: number | null = null;
  private touchId: number | null = null;
  private pointerPosition = { x: 0, y: 0 };
  private firstInputNotified = false;
  private controlScheme: ControlScheme;
  private readonly joystick: JoystickState = { active: false, x: 0, y: 0, dx: 0, dy: 0 };
  private readonly onBlurBound = (): void => this.reset();
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
    controlScheme: ControlScheme = 'auto',
    private readonly onJoystickChange: (state: Readonly<JoystickState>) => void = () => undefined,
    private readonly canMove: () => boolean = () => true
  ) {
    this.controlScheme = normalizeControlScheme(controlScheme);
  }

  public setControlScheme(controlScheme: ControlScheme): void {
    const next = normalizeControlScheme(controlScheme);
    if (this.controlScheme === next) return;
    this.controlScheme = next;
    this.clearPointerState();
  }

  public get currentControlScheme(): ControlScheme {
    return this.controlScheme;
  }

  public attach(): void {
    window.addEventListener('blur', this.onBlurBound);
    window.addEventListener('keydown', this.onKeyDownBound, { passive: false });
    window.addEventListener('keyup', this.onKeyUpBound, { passive: false });
    if (this.supportsPointerEvents) {
      window.addEventListener('pointerup', this.onPointerEndBound);
      window.addEventListener('pointercancel', this.onPointerEndBound);
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
    this.reset();
    window.removeEventListener('blur', this.onBlurBound);
    window.removeEventListener('pointerup', this.onPointerEndBound);
    window.removeEventListener('pointercancel', this.onPointerEndBound);
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
    if (!this.canMove()) { this.reset(); return { x: 0, y: 0 }; }
    let x = 0;
    let y = 0;
    for (const key of this.keys) {
      const direction = MOVEMENT_KEYS[key];
      if (direction) {
        x += direction.x;
        y += direction.y;
      }
    }

    if (this.pointerId !== null || this.touchId !== null) {
      if (this.controlScheme === 'joystick') {
        const distance = Math.hypot(this.joystick.dx, this.joystick.dy);
        if (distance > JOYSTICK_DEAD_ZONE) {
          const strength = Math.min(1, (distance - JOYSTICK_DEAD_ZONE) / (JOYSTICK_RADIUS - JOYSTICK_DEAD_ZONE));
          x += this.joystick.dx / distance * strength;
          y += this.joystick.dy / distance * strength;
        }
      } else {
        const player = this.getPlayerPosition();
        x += this.pointerPosition.x - player.x;
        y += this.pointerPosition.y - player.y;
      }
    }

    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    const divisor = this.controlScheme === 'joystick' ? Math.max(1, length) : length;
    return { x: x / divisor, y: y / divisor };
  }

  public reset(): void {
    if (this.keys.size === 0 && this.pointerId === null && this.touchId === null && !this.joystick.active) return;
    this.keys.clear();
    this.clearPointerState();
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea'));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.canMove()) return;
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
    if (!this.canMove() || (event.button !== undefined && event.button !== 0)) return;
    if (this.isInteractiveTarget(event.target)) return;
    if (this.pointerId !== null) return;
    this.notifyFirstInput();
    this.pointerId = event.pointerId;
    this.updatePointer(event);
    this.startJoystick(event.clientX, event.clientY);
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
    this.moveJoystick(event.clientX, event.clientY);
    event.preventDefault();
  }

  private onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.clearPointerState();
    event.preventDefault();
  }

  private updatePointer(event: PointerEvent): void {
    this.pointerPosition = this.viewport.toWorld(event.clientX, event.clientY, this.element.getBoundingClientRect());
  }

  private onTouchStart(event: TouchEvent): void {
    if (!this.canMove()) return;
    if (this.isInteractiveTarget(event.target)) return;
    if (this.touchId !== null || event.changedTouches.length === 0) return;
    this.notifyFirstInput();
    const touch = event.changedTouches[0];
    this.touchId = touch.identifier;
    this.updateTouch(touch);
    this.startJoystick(touch.clientX, touch.clientY);
    event.preventDefault();
  }

  private onTouchMove(event: TouchEvent): void {
    const touch = this.findTouch(event.touches);
    if (!touch) return;
    this.updateTouch(touch);
    this.moveJoystick(touch.clientX, touch.clientY);
    event.preventDefault();
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.findTouch(event.changedTouches)) return;
    this.clearPointerState();
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

  private clearPointerState(): void {
    const capturedId = this.pointerId;
    this.pointerId = null;
    this.touchId = null;
    this.pointerPosition = { x: 0, y: 0 };
    if (this.joystick.active) {
      this.joystick.active = false;
      this.joystick.dx = this.joystick.dy = 0;
      this.onJoystickChange(this.joystick);
    }
    if (capturedId !== null) {
      try { this.element.releasePointerCapture(capturedId); } catch { /* Optional in WebViews. */ }
    }
  }

  private startJoystick(x: number, y: number): void {
    if (this.controlScheme !== 'joystick') return;
    Object.assign(this.joystick, { active: true, x, y, dx: 0, dy: 0 });
    this.onJoystickChange(this.joystick);
  }

  private moveJoystick(x: number, y: number): void {
    if (!this.joystick.active) return;
    if (!this.canMove()) { this.reset(); return; }
    const dx = x - this.joystick.x, dy = y - this.joystick.y;
    const scale = Math.min(1, JOYSTICK_RADIUS / Math.max(1, Math.hypot(dx, dy)));
    // Follow only the excess beyond travel: reversals don't require a long return.
    this.joystick.x = x - dx * scale;
    this.joystick.y = y - dy * scale;
    this.joystick.dx = dx * scale;
    this.joystick.dy = dy * scale;
    this.onJoystickChange(this.joystick);
  }

  private notifyFirstInput(): void {
    if (this.firstInputNotified) return;
    this.firstInputNotified = true;
    this.onFirstInput();
  }
}
