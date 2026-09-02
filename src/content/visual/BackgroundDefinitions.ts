export type BackgroundId = 'deep-space' | 'ion-storm' | 'solar-drift' | 'crystal-field';
export type BackgroundPattern = 'constellation' | 'nebula' | 'solar' | 'crystal';

export interface BackgroundTokens {
  readonly base: number;
  readonly glow: number;
  readonly accent: number;
  readonly secondary: number;
  readonly pattern: BackgroundPattern;
}

export interface BackgroundDefinition {
  readonly id: BackgroundId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly acquisition: 'default' | 'prototype-free';
  readonly tokens: BackgroundTokens;
}

/** Presentation-only themes. They never alter arena, enemies, damage or difficulty. */
export const BACKGROUND_DEFINITIONS: readonly BackgroundDefinition[] = [
  {
    id: 'deep-space',
    name: 'Vacío profundo',
    subtitle: 'La señal original',
    description: 'Un campo estelar sobrio para leer cada amenaza sin ruido.',
    rarity: 'INICIAL',
    acquisition: 'default',
    tokens: { base: 0x080b17, glow: 0x18315d, accent: 0x75e6ff, secondary: 0xaab7d8, pattern: 'constellation' }
  },
  {
    id: 'ion-storm',
    name: 'Tormenta iónica',
    subtitle: 'Nubes de carga',
    description: 'Nebulosas frías y pulsos mint para una arena más eléctrica.',
    rarity: 'DESBLOQUEABLE',
    acquisition: 'prototype-free',
    tokens: { base: 0x071321, glow: 0x174c5a, accent: 0x65f2c2, secondary: 0x75e6ff, pattern: 'nebula' }
  },
  {
    id: 'solar-drift',
    name: 'Deriva solar',
    subtitle: 'Ruta de forja',
    description: 'Arcos cálidos y polvo solar para cambiar el ritmo visual.',
    rarity: 'NUEVA · DEMO',
    acquisition: 'prototype-free',
    tokens: { base: 0x170d0d, glow: 0x5b2b1f, accent: 0xffb86b, secondary: 0xffe39a, pattern: 'solar' }
  },
  {
    id: 'crystal-field',
    name: 'Campo cristal',
    subtitle: 'Geometría suspendida',
    description: 'Una retícula violeta que hace eco de la identidad geométrica.',
    rarity: 'NUEVA · DEMO',
    acquisition: 'prototype-free',
    tokens: { base: 0x100b20, glow: 0x38205b, accent: 0xd2a8ff, secondary: 0x75e6ff, pattern: 'crystal' }
  }
] as const;

export const isBackgroundId = (value: unknown): value is BackgroundId => (
  value === 'deep-space' || value === 'ion-storm' || value === 'solar-drift' || value === 'crystal-field'
);

export const getBackgroundDefinition = (id: BackgroundId): BackgroundDefinition => (
  BACKGROUND_DEFINITIONS.find((definition) => definition.id === id) ?? BACKGROUND_DEFINITIONS[0]
);
