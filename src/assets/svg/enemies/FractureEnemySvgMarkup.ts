/** Five authored silhouettes. Contract: docs/design/FLOTA_FRACTURE.md.
 * Share assembly, never a recolored ship template. Low uses the same geometry.
 */
type Plates = Readonly<Record<'rear' | 'wings' | 'hull' | 'cockpit', string>>;
const path = (id: string, d: string, fill: string): string =>
  `<path id="${id}" d="${d}" fill="${fill}"/>`;

const assemble = (id: string, name: string, description: string, plates: Plates, size = 64) => {
  const wrap = (part: string, body: string): string => (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-size / 2} ${-size / 2} ${size} ${size}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="${id}-${part}-title ${id}-${part}-desc">`
    + `<title id="${id}-${part}-title">${name} — ${part}</title>`
    + `<desc id="${id}-${part}-desc">${description} Frente -Y, centro de masa (0,0).</desc>`
    + body + '</svg>'
  );
  return {
    flat: wrap('master', plates.rear + plates.wings + plates.hull + plates.cockpit),
    rear: wrap('rear', plates.rear), wings: wrap('wings', plates.wings),
    hull: wrap('hull', plates.hull), cockpit: wrap('cockpit', plates.cockpit)
  } as const;
};

// OFFSET BATTERY: starboard barrel counterbalanced by a port magazine.
const g = (id: string, d: string, color: string) => path(`enemy-fracture-gunner-${id}`, d, color);
const gunner = assemble('enemy-fracture-gunner', 'Fracture Gunner',
  'Batería asimétrica de acero azul; cargador lateral, cañón adelantado y óptica cian.', {
    rear:
      g('chassis', 'M-17-9L12-12 20 6 12 20-8 23-20 10Z', '#101c2c')
      + g('drive-cases', 'M-13 12H-4V26L-11 28-16 22ZM5 12H13L16 23 9 27 4 23Z', '#304b61')
      + g('drive-bevels', 'M-13 12H-10V23L-13 24-16 22ZM5 12H8V23L9 27 4 23Z', '#718f9b')
      + g('exhaust', 'M-12 23H-6V26L-11 27ZM7 23H13L9 26 7 25Z', '#6dd6e0'),
    wings:
      g('magazine', 'M-25-15L-15-19-9-12-10 10-21 14-27 7Z', '#24364b')
      + g('magazine-face', 'M-24-13L-16-16-13-11-14 7-21 10-24 5Z', '#638999')
      + g('magazine-bevel', 'M-25-15L-15-19-9-12-13-11-16-16-24-13Z', '#c0d3d5')
      + g('feed-cells', 'M-23-9L-16-11V-7L-23-5ZM-23-2L-16-4V0L-23 2ZM-22 5L-16 3V6L-21 8Z', '#172739')
      + g('barrel', 'M7-29H17L21-23V7L16 13 5 9 4-17Z', '#1b2a3c')
      + g('barrel-face', 'M9-26H15L17-22V6L12 9 8 6Z', '#7a9aa5')
      + g('barrel-channel', 'M11-24H14V-5H11ZM9 0H16V3H9Z', '#0b1527')
      + g('muzzle-lip', 'M7-29H17L19-25H6ZM12-21H14V-15H12Z', '#80e6e5'),
    hull:
      g('breech', 'M-10-13L4-15 10-7 8 12-3 20-13 9Z', '#142335')
      + g('breech-plane', 'M-8-10L2-12 6-6 4 10-3 15-9 7Z', '#41647a')
      + g('breech-bevel', 'M-10-13L4-15 10-7 6-6 2-12-8-10Z', '#a4c2c8')
      + g('feed-bridge', 'M-19-1L-7-5 3-2V2L-7 0-19 4Z', '#8d9b94')
      + g('aft-return', 'M-13 9L-9 7-3 15 4 10 8 12-3 20Z', '#233a51')
      + g('registration', 'M-10 5L-7 4V8L-10 9Z', '#e2b76a'),
    cockpit:
      g('optic-well', 'M-5-9L1-10 5-5 4 3-2 7-7 2Z', '#071422')
      + g('optic-lens', 'M-3-7L0-7 2-4 1 2-2 4-4 1Z', '#48aabd')
      + g('optic-light', 'M-3-7H0L2-4-2-2-4 1Z', '#c1f4ee')
      + g('optic-depth', 'M-2-2L2-4 1 2-2 4Z', '#2b667f')
  });

// IRON URCHIN: scalloped pressure shell and six retractable perimeter teeth.
const t = (id: string, d: string, color: string) => path(`enemy-thorn-bastion-${id}`, d, color);
const thorn = assemble('enemy-thorn-bastion', 'Thorn Bastion',
  'Coraza de seis escamas de cobre oscuro; dientes cortos y cámara de presión coral.', {
    rear:
      t('underbody', 'M-12-21H12L23-10 24 9 12 22H-12L-24 9-23-10Z', '#201b27')
      + t('stern-pistons', 'M-14 15H-5V25L-11 28-17 23ZM5 15H14L17 23 11 28 5 25Z', '#63404b')
      + t('piston-rims', 'M-14 15H-11V24L-14 25-17 23ZM5 15H8V24L11 28 5 25Z', '#a66b67')
      + t('exhaust', 'M-12 24L-7 23V26L-11 27ZM7 23L12 24 11 27 7 26Z', '#ed9182'),
    wings:
      t('teeth', 'M-8-20L0-29 8-20ZM16-17L27-19 23-6ZM22 5L30 12 18 16ZM7 20L0 30-7 20ZM-18 16L-30 12-22 5ZM-23-6L-27-19-16-17Z', '#80585c')
      + t('teeth-bevels', 'M-8-20L0-29 0-24ZM16-17L27-19 22-15ZM22 5L30 12 25 10ZM7 20L0 30 1 24ZM-18 16L-30 12-24 12ZM-23-6L-27-19-23-14Z', '#e0b9a4')
      + t('perimeter-scales', 'M-18-19L-9-21-7-11-15-4-25-7ZM9-21L18-19 25-7 15-4 7-11ZM-26-4L-16 0-14 11-23 16-28 6ZM16 0L26-4 28 6 23 16 14 11ZM-20 19L-11 12-2 16-4 25-14 25ZM11 12L20 19 14 25 4 25 2 16Z', '#4d343f')
      + t('scale-lit-planes', 'M-18-19L-9-21-9-17-17-15-23-7-25-7ZM9-21L18-19 25-7 21-10 16-16 9-17ZM-26-4L-16 0-17 4-25 0-27 7-28 6ZM16 0L26-4 28 6 25 0 17 4ZM-20 19L-11 12-2 16-5 18-11 16-18 21ZM11 12L20 19 18 21 11 16 5 18 2 16Z', '#bb8477')
      + t('scale-insets', 'M-18-12L-13-14-12-11-17-8ZM13-14L18-12 17-8 12-11ZM-23 4L-19 5-18 10-22 11ZM19 5L23 4 22 11 18 10Z', '#281d2c')
      + t('pressure-slots', 'M-17-10L-14-12-13-10-16-8ZM14-12L17-10 16-8 13-10ZM-10 19L-6 20V23L-11 22ZM6 20L10 19 11 22 6 23Z', '#ed8b80'),
    hull:
      t('pressure-vessel', 'M-7-21H7L16-12 18 5 10 18H-10L-18 5-16-12Z', '#382832')
      + t('port-carapace', 'M-7-21L-16-12-18 5-10 18-5 12-10 3-9-10 0-16Z', '#93635f')
      + t('starboard-carapace', 'M7-21L16-12 18 5 10 18 5 12 10 3 9-10 0-16Z', '#68434c')
      + t('prow-bevel', 'M-7-21H7L16-12 11-13 5-17H-5L-11-13-16-12Z', '#e4c0a9')
      + t('stern-collar', 'M-10 18L-5 12H5L10 18 4 21H-4Z', '#b08070')
      + t('socket-well', 'M-7-9H7L11-3V5L6 11H-6L-11 5V-3Z', '#160f20'),
    cockpit:
      t('pressure-mount', 'M-5-6H5L8-2V4L4 8H-4L-8 4V-2Z', '#743f51')
      + t('pressure-glass', 'M-4-4H4L5 0 3 5H-3L-5 0Z', '#da6b7a')
      + t('pressure-facet', 'M-4-4H4L5 0H-5Z', '#ffd3ba')
      + t('pressure-slit', 'M-1-2H1V4H-1Z', '#fff0dc')
  });

// SWITCHBACK: diagonal control surfaces imply lateral cuts, not a straight ram.
const z = (id: string, d: string, color: string) => path(`enemy-zigzag-reaver-${id}`, d, color);
const zigzag = assemble('enemy-zigzag-reaver', 'Zigzag Reaver',
  'Interceptor de alas escalonadas en Z; cerámica oliva y propulsores ámbar.', {
    rear:
      z('keel', 'M-8-12L4-18 11-4 4 14-3 26-10 20-12 3Z', '#18232b')
      + z('offset-drives', 'M-16 3L-9-1-6 10-11 22-17 18ZM10-16L16-20 21-9 17 0 11-3Z', '#364947')
      + z('drive-planes', 'M-16 3L-13 2-11 14-14 18-17 18ZM16-20L21-9 17 0 16-6 17-10Z', '#93a38a')
      + z('exhaust', 'M-14 16L-9 15-11 22-15 20ZM14-4L19-7 17 0 14-1Z', '#ffc96c'),
    wings:
      z('forward-sickle', 'M-29-5L-15-24 5-21 11-12 3-11-4-16-14-17Z', '#3f514e')
      + z('forward-plane', 'M-29-5L-15-24 5-21 7-17-14-20Z', '#c6c9a2')
      + z('forward-bevel', 'M-29-5L-15-24 5-21-3-21-14-22Z', '#f0e5b6')
      + z('forward-return', 'M-14-17L-4-16 3-11 11-12 6-7-5-12-13-13Z', '#233c3e')
      + z('aft-sickle', 'M-11 12L-3 11 4 16 14 17 29 5 15 24-5 21Z', '#405854')
      + z('aft-plane', 'M4 16L14 17 29 5 16 21-4 19-5 16Z', '#98af96')
      + z('aft-bevel', 'M14 17L29 5 15 24-5 21-4 19 16 21Z', '#d4d7ae')
      + z('control-insets', 'M-18-16L-13-20-8-19-13-17ZM13 19L19 14 17 19 13 22Z', '#152b32'),
    hull:
      z('fuselage', 'M4-29L11-17 7-5 0 5-2 23-8 29-12 14-7-2-2-9Z', '#263b3e')
      + z('port-plane', 'M4-29L-2-9-7-2-12 14-8 29-7 15-2 1 3-8Z', '#90aa94')
      + z('starboard-plane', 'M4-29L11-17 7-5 0 5-2 23-8 29-4 17-3 3 4-9 7-17Z', '#536f64')
      + z('nose-bevel', 'M4-29L11-17 7-17 3-23-2-9Z', '#f1e8bf')
      + z('spine-inset', 'M-4 9L-1 7-3 20-7 24Z', '#14292e')
      + z('spine-energy', 'M-4 12L-2 10-4 19-6 21Z', '#e5ad51'),
    cockpit:
      z('optic-well', 'M1-14L6-10 3-1-3 6-7 2-3-8Z', '#0d2028')
      + z('optic-glass', 'M1-11L3-9 0-1-3 2-4 0-1-7Z', '#e3aa4d')
      + z('optic-facet', 'M1-11L3-9 0-3-2-4Z', '#fff1c2')
      + z('optic-depth', 'M-2-4L0-3-3 2-4 0Z', '#8b7040')
  });

// TWIN SILO: two cylindrical magazines, horizontal bridge and a recessed visor.
const m = (id: string, d: string, color: string) => path(`enemy-rift-miner-${id}`, d, color);
const miner = assemble('enemy-rift-miner', 'Rift Miner',
  'Minador industrial de doble silo, puente transversal y compartimentos violetas.', {
    rear:
      m('cross-frame', 'M-23-9H23V12H-23ZM-9 6H9V25H-9Z', '#181d33')
      + m('stern-drive', 'M-10 17H10V25L5 29H-5L-10 25Z', '#424865')
      + m('drive-face', 'M-10 17H10V20H-7V25L-10 25Z', '#8a91aa')
      + m('exhaust', 'M-5 24H5V27H-5Z', '#bba1f3'),
    wings:
      m('silo-cases', 'M-26-17L-21-23H-15L-11-17V18L-16 24H-23L-28 18ZM11-17L15-23H21L26-17 28 18 23 24H16L11 18Z', '#30364f')
      + m('silo-faces', 'M-24-16L-20-20H-16L-14-15V17L-17 20H-22L-25 16ZM14-15L16-20H20L24-16 25 16 22 20H17L14 17Z', '#707996')
      + m('silo-lit-edges', 'M-26-17L-21-23H-15L-11-17-15-17-17-20H-20L-23-16-24 15-28 18ZM11-17L15-23H21L26-17 23-16 19-20H16L14-16V17L11 18Z', '#b9c4cd')
      + m('silo-doors', 'M-22-13H-16V13H-22ZM16-13H22V13H16Z', '#20243f')
      + m('stored-charges', 'M-21-10H-17V-6H-21ZM-21-2H-17V2H-21ZM-21 6H-17V10H-21ZM17-10H21V-6H17ZM17-2H21V2H17ZM17 6H21V10H17Z', '#9782b9')
      + m('release-ports', 'M-22 15H-16V18H-22ZM16 15H22V18H16Z', '#d6b5ff'),
    hull:
      m('bridge-chassis', 'M-9-19H9L16-10V8L8 16H-8L-16 8V-10Z', '#222b43')
      + m('bridge-roof', 'M-8-17H8L13-10 9-4H-9L-13-10Z', '#929baa')
      + m('roof-bevel', 'M-9-19H9L16-10 13-10 7-15H-7L-13-10-16-10Z', '#dae1d8')
      + m('bridge-return', 'M-13-10L-9-4H9L13-10 16-10 12 2H-12L-16-10Z', '#4d536e')
      + m('loading-apron', 'M-12 4H12L7 12H-7Z', '#646880')
      + m('apron-seams', 'M-8 4H-6V9H-8ZM-2 4H0V11H-2ZM4 4H6V9H4Z', '#262b45'),
    cockpit:
      m('visor-well', 'M-9-10H9L7-3H-7Z', '#10152a')
      + m('visor-glass', 'M-6-8H6L5-5H-5Z', '#c1a0f0')
      + m('visor-reflection', 'M-6-8H0L-2-5H-5Z', '#eee2ff')
      + m('bridge-lock', 'M-3 1H3V5H-3Z', '#c4a766')
  });

export const FRACTURE_ENEMY_SVGS = {
  'fracture-gunner': gunner, 'thorn-bastion': thorn,
  'zigzag-reaver': zigzag, 'rift-miner': miner
} as const;

// SIEGE FOUNDRY: transverse hammer, furnaces and a rectangular reactor.
// 28 primitives; neither a circular crown nor a three-arm Warden.
const b = (id: string, d: string, color: string) => path(`enemy-fracture-engine-${id}`, d, color);
export const FRACTURE_BOSS_SVGS = assemble('enemy-fracture-engine', 'Fracture Engine',
  'Máquina de asedio de proa transversal, hornos, dientes de titanio y reactor rectangular rojo.', {
    rear:
      b('load-frame', 'M-39-14H39V18L24 30H-24L-39 18ZM-13 11H13V45H-13Z', '#1a1c2a')
      + b('aft-furnaces', 'M-30 15H-14V37L-21 46-32 37ZM14 15H30L32 37 21 46 14 37Z', '#3d3d4f')
      + b('furnace-faces', 'M-28 18H-21V36L-25 39-30 35ZM16 18H23V39L18 35Z', '#727785')
      + b('furnace-collars', 'M-30 29H-14V33H-30ZM14 29H31V33H14Z', '#bfa785')
      + b('aft-exhaust', 'M-27 36H-18L-21 42-26 39ZM18 36H27L26 39 21 42Z', '#ed827e')
      + b('keel-return', 'M-10 32H10V46L0 51-10 46Z', '#5c5867'),
    wings:
      b('siege-arms', 'M-51-24L-32-36-12-28H12L32-36 51-24 54-9 44 4 31 0 23-11 12-7H-12L-23-11-31 0-44 4-54-9Z', '#303346')
      + b('arm-lit-planes', 'M-51-24L-32-36-12-28H12L32-36 51-24 45-23 32-30 13-23H-13L-32-30-46-21-49-9-44 4-54-9Z', '#a4a4a5')
      + b('arm-shadow-planes', 'M-46-21L-32-30-26-26-29-15-38-11-43-1-49-9ZM26-26L32-30 46-21 49-9 43-1 38-11 29-15Z', '#606477')
      + b('leading-bevels', 'M-51-24L-32-36-12-28H12L32-36 51-24 47-24 32-33 13-25H-13L-32-33-47-24Z', '#ede0c3')
      + b('battery-recesses', 'M-41-22L-34-27-31-24-34-14-39-13ZM31-24L34-27 41-22 39-13 34-14Z', '#101828')
      + b('battery-rails', 'M-38-21L-34-23-36-15-38-15ZM34-23L38-21V-15H36Z', '#eaa995')
      + b('spike-sockets', 'M-52-10L-45-12-42-4-48-1ZM45-12L52-10 48-1 42-4ZM-34-6L-27-9-25-4-29 2ZM27-9L34-6 29 2 25-4Z', '#252839')
      + b('retracted-teeth', 'M-48-10L-54-7-44-3ZM48-10L54-7 44-3ZM-30-5L-35 6-25-2ZM30-5L35 6 25-2Z', '#c0b6a6'),
    hull:
      b('foundry-chassis', 'M-20-30H20L25-19V21L12 34H-12L-25 21V-19Z', '#26283b')
      + b('brow-armor', 'M-20-30H20L25-19 16-12H-16L-25-19Z', '#a9a8a1')
      + b('brow-bevel', 'M-20-30H20L25-19 20-21 17-25H-17L-20-21-25-19Z', '#f0e2c8')
      + b('brow-return', 'M-25-19L-16-12H16L25-19 21-9H-21Z', '#57576a')
      + b('port-cheek', 'M-25-5H-17V17L-8 28H-12L-25 21Z', '#96979d')
      + b('starboard-cheek', 'M17-5H25V21L12 34H-12L-8 28H8L17 17Z', '#57566d')
      + b('service-grilles', 'M-23 0H-19V5H-23ZM-23 9H-19V14H-23ZM19 0H23V5H19ZM19 9H23V14H19Z', '#172033')
      + b('stern-mine-ports', 'M-10 22H-3V27H-10ZM3 22H10V27H3Z', '#c48cc7'),
    cockpit:
      b('reactor-well', 'M-14-17H14V15L8 21H-8L-14 15Z', '#0c1423')
      + b('reactor-rim', 'M-11-14H11V12L6 17H-6L-11 12ZM-8-11V10L-4 14H4L8 10V-11Z', '#816071')
      + b('reactor-glass', 'M-7-10H7V9L3 13H-3L-7 9Z', '#c45877')
      + b('reactor-lit-plane', 'M-7-10H7V-6H-3V8L-7 9Z', '#ffc6a5')
      + b('reactor-divider', 'M-7-2H7V1H-7ZM-7 6H7V8H-7Z', '#35233c')
      + b('reactor-heart', 'M-1-8H2V-3H-1ZM-1 2H2V5H-1Z', '#ffebd4')
  }, 112);
