import { JOYSTICK_RADIUS, type JoystickState } from '../input/InputManager';

/** One decorative DOM control; input stays owned by InputManager. No frame loop. */
export class JoystickView {
  private readonly root = document.createElement('div');
  private readonly thumb = document.createElement('div');

  public constructor() {
    this.root.className = 'touch-joystick';
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');
    this.root.style.setProperty('--joystick-radius', `${JOYSTICK_RADIUS}px`);
    this.thumb.className = 'touch-joystick-thumb';
    this.root.append(this.thumb);
    document.body.append(this.root);
  }

  public render(state: Readonly<JoystickState>): void {
    this.root.hidden = !state.active;
    if (!state.active) return;
    this.root.style.left = `${state.x}px`;
    this.root.style.top = `${state.y}px`;
    this.thumb.style.transform = `translate(${state.dx}px, ${state.dy}px)`;
  }

  public destroy(): void { this.root.remove(); }
}
