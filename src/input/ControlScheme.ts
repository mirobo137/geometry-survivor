export type ControlScheme = 'auto' | 'touch' | 'relative-touch' | 'joystick' | 'keyboard';

/** Legacy saves remain readable; only two choices are presented or executed. */
export const normalizeControlScheme = (value: ControlScheme): 'touch' | 'joystick' =>
  value === 'joystick' || value === 'relative-touch' ? 'joystick' : 'touch';

export const isControlScheme = (value: unknown): value is ControlScheme => (
  value === 'auto'
  || value === 'touch'
  || value === 'relative-touch'
  || value === 'joystick'
  || value === 'keyboard'
);
