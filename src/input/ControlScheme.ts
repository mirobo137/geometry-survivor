export type ControlScheme = 'auto' | 'touch' | 'relative-touch' | 'keyboard';

export const isControlScheme = (value: unknown): value is ControlScheme => (
  value === 'auto'
  || value === 'touch'
  || value === 'relative-touch'
  || value === 'keyboard'
);
