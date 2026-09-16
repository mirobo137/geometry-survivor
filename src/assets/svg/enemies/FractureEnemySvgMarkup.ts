/**
 * Code-first Act III SVG family. Each layer is intentionally a complete
 * bounded 64px plate so Pixi can animate it independently and Low can use the
 * same silhouette as a single texture. The shapes are broad and high contrast
 * at 32px; micro-detail is reserved for bevels and the focal core.
 */
const svg = (desc: string, body: string, viewBox = '-32 -32 64 64'): string => (
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><title>${desc}</title><desc>${desc}; pieza SVG code-first con fondo transparente.</desc>${body}</svg>`
);

const FRACTURE_COLORS = {
  ink: '#081426',
  steel: '#355266',
  bevel: '#c8e9e5',
  cyan: '#66eaff',
  rose: '#ff6da9',
  gold: '#ffd16b',
  violet: '#c18cff'
} as const;

const makeEnemy = (name: string, accentKey: 'cyan' | 'rose' | 'gold' | 'violet') => {
  const accent = FRACTURE_COLORS[accentKey];
  const rear = svg(`${name} rear`, `<path d="M-19 7L-9 4 0 16 9 4 19 7 8 19 0 22-8 19z" fill="${FRACTURE_COLORS.ink}" stroke="${FRACTURE_COLORS.steel}" stroke-width="1.4"/><path d="M-12 9L-5 8 0 17 5 8 12 9 5 14 0 19-5 14z" fill="${accent}" opacity=".72"/>`);
  const wings = svg(`${name} wings`, `<path d="M-28 3L-13-8-3-5 0 2-8 7-20 12zM28 3L13-8 3-5 0 2 8 7 20 12z" fill="${FRACTURE_COLORS.ink}" stroke="${FRACTURE_COLORS.bevel}" stroke-width="1.1"/><path d="M-24 3L-13-5-6-4-10 2-19 8zM24 3L13-5 6-4 10 2 19 8z" fill="${accent}" opacity=".86"/><path d="M-19 3L-9-2M19 3L9-2" stroke="${accent}" stroke-width="1.6"/>`);
  const hull = svg(`${name} hull`, `<path d="M0-28L9-17 12-3 7 16 0 24-7 16-12-3-9-17z" fill="${FRACTURE_COLORS.ink}" stroke="${FRACTURE_COLORS.bevel}" stroke-width="1.3"/><path d="M0-23L5-14 7-3 4 13 0 18-4 13-7-3-5-14z" fill="${FRACTURE_COLORS.steel}"/><path d="M0-19L3-13 4-5 0 0-4-5-3-13z" fill="${accent}" opacity=".72"/><path d="M-5 11L0 17 5 11" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".9"/>`);
  const cockpit = svg(`${name} cockpit`, `<path d="M0-17L6-9 5 2 0 8-5 2-6-9z" fill="${FRACTURE_COLORS.ink}" stroke="${accent}" stroke-width="1.4"/><path d="M0-12L3-7 2-1 0 2-2-1-3-7z" fill="${FRACTURE_COLORS.bevel}"/><circle cy="-5" r="2" fill="${accent}"/><path d="M-9-13L-6-16M9-13L6-16" stroke="${accent}" stroke-width="1.2"/>`);
  // Keep a full master for defeat/preview tooling while runtime composes the
  // four plates above.
  const flat = svg(`${name} master`, `${rear.replace(/^<svg[^>]*>|<\/svg>$/g, '')}${wings.replace(/^<svg[^>]*>|<\/svg>$/g, '')}${hull.replace(/^<svg[^>]*>|<\/svg>$/g, '')}${cockpit.replace(/^<svg[^>]*>|<\/svg>$/g, '')}`);
  return { flat, rear, wings, hull, cockpit } as const;
};

export const FRACTURE_ENEMY_SVGS = {
  'fracture-gunner': makeEnemy('Fracture Gunner', 'cyan'),
  'thorn-bastion': makeEnemy('Thorn Bastion', 'rose'),
  'zigzag-reaver': makeEnemy('Zigzag Reaver', 'gold'),
  'rift-miner': makeEnemy('Rift Miner', 'violet')
} as const;

const bossSvg = (desc: string, body: string): string => svg(desc, body, '-56 -56 112 112');
const BOSS_INK = '#07111f';
const BOSS_STEEL = '#43627b';
const BOSS_BEVEL = '#d8edf2';
const BOSS_ACCENT = '#ff6dbe';
const BOSS_ENERGY = '#72ebff';

export const FRACTURE_BOSS_SVGS = {
  flat: bossSvg('Fracture Engine master', `<path d="M0-50L18-38 39-40 51-20 44 0 51 20 39 40 18 38 0 50-18 38-39 40-51 20-44 0-51-20-39-40-18-38z" fill="${BOSS_INK}" stroke="${BOSS_BEVEL}" stroke-width="2"/><path d="M0-38L14-26 33-29 39-12 32 0 39 12 33 29 14 26 0 38-14 26-33 29-39 12-32 0-39-12-33-29-14-26z" fill="${BOSS_STEEL}" stroke="${BOSS_ACCENT}" stroke-width="2"/><circle r="17" fill="${BOSS_INK}" stroke="${BOSS_BEVEL}" stroke-width="2"/><circle r="10" fill="${BOSS_ENERGY}" opacity=".92"/><circle r="4" fill="${BOSS_ACCENT}"/>`),
  rear: bossSvg('Fracture Engine rear', `<path d="M-42 13L-25 8-8 28 0 36 8 28 25 8 42 13 22 39 0 48-22 39z" fill="${BOSS_INK}" stroke="${BOSS_STEEL}" stroke-width="2"/><path d="M-30 17L-20 15-7 31 0 39 7 31 20 15 30 17 16 33 0 42-16 33z" fill="${BOSS_ACCENT}" opacity=".7"/>`),
  wings: bossSvg('Fracture Engine wings', `<path d="M-53-8L-31-34-8-27 0-12-18 3-42 19zM53-8L31-34 8-27 0-12 18 3 42 19z" fill="${BOSS_INK}" stroke="${BOSS_BEVEL}" stroke-width="2"/><path d="M-46-7L-29-27-14-23-8-13-22-1-38 11zM46-7L29-27 14-23 8-13 22-1 38 11z" fill="${BOSS_STEEL}"/><path d="M-39-7L-27-20-19-18M39-7L27-20 19-18" fill="none" stroke="${BOSS_ENERGY}" stroke-width="2"/>`),
  hull: bossSvg('Fracture Engine hull', `<path d="M0-42L19-28 27-3 20 28 0 44-20 28-27-3-19-28z" fill="${BOSS_INK}" stroke="${BOSS_BEVEL}" stroke-width="2"/><path d="M0-34L12-23 18-3 12 21 0 33-12 21-18-3-12-23z" fill="${BOSS_STEEL}"/><path d="M0-26L8-18 10-4 0 8-10-4-8-18z" fill="${BOSS_ACCENT}" opacity=".68"/>`),
  cockpit: bossSvg('Fracture Engine cockpit', `<path d="M0-25L13-14 14 5 0 18-14 5-13-14z" fill="${BOSS_INK}" stroke="${BOSS_ACCENT}" stroke-width="2"/><path d="M0-17L7-10 7 1 0 8-7 1-7-10z" fill="${BOSS_ENERGY}"/><circle cy="-4" r="4" fill="${BOSS_BEVEL}"/><path d="M-21-18L-16-23M21-18L16-23" stroke="${BOSS_ACCENT}" stroke-width="2"/>`)
} as const;
