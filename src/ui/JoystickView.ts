import { JOYSTICK_RADIUS, JOYSTICK_DEAD_ZONE, type JoystickState } from '../input/InputManager';

/** One decorative DOM control; input stays owned by InputManager. No frame loop. */
export class JoystickView {
  private readonly root = document.createElement('div');
  private readonly thumb = document.createElement('div');
  private readonly bearing = document.createElement('div');

  public constructor() {
    this.root.className = 'touch-joystick';
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');
    this.root.style.setProperty('--joystick-radius', `${JOYSTICK_RADIUS}px`);
    this.thumb.className = 'touch-joystick-thumb';
    this.bearing.className = 'touch-joystick-bearing';
    this.root.append(this.bearing, this.thumb);
    document.body.append(this.root);
  }

  public render(state: Readonly<JoystickState>): void {
    this.root.hidden = !state.active;
    if (!state.active) return;
    this.root.style.left = `${state.x}px`;
    this.root.style.top = `${state.y}px`;
    this.thumb.style.transform = `translate(${state.dx}px, ${state.dy}px)`;
    const distance = Math.hypot(state.dx, state.dy);
    this.bearing.style.transform = `rotate(${Math.atan2(state.dy, state.dx)}rad)`;
    this.bearing.style.opacity = `${Math.min(1, Math.max(0,
      (distance - JOYSTICK_DEAD_ZONE) / (JOYSTICK_RADIUS - JOYSTICK_DEAD_ZONE)))}`;
  }

  public destroy(): void { this.root.remove(); }
}
