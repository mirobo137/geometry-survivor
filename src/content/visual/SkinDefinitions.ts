import {
  PLAYER_SKINS,
  type PlayerSkinId,
  type PlayerSkinTokens
} from './VisualTokens';
import type { CosmeticTier } from '../meta/EconomyDefinitions';

export type SkinAcquisition = 'default' | 'nova' | 'event' | 'daily-wheel';
export type PlayerSkinSignature = 'aurora' | 'prism' | 'solar' | 'verdant' | 'quasar' | 'supernova' | 'manta';

export interface PlayerSkinDefinition {
  readonly id: PlayerSkinId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: string;
  readonly tier: CosmeticTier;
  readonly priceNova: number;
  readonly palette: PlayerSkinTokens;
  readonly acquisition: SkinAcquisition;
  readonly signature: PlayerSkinSignature;
}

/**
 * Presentation content for the skin locker. Cosmetic ownership is local and
 * data-driven; the Nova wallet remains independent from gameplay balance.
 */
export const PLAYER_SKIN_DEFINITIONS: readonly PlayerSkinDefinition[] = [
  {
    id: 'spearhead',
    name: 'Ivory Spear',
    subtitle: 'Nave base de marfil',
    description: 'La nave original: blindaje de marfil, reactor cian y dos cañones vinculados e intercambiables.',
    rarity: 'NAVE BASE · GRATIS',
    tier: 'starter',
    priceNova: 0,
    palette: PLAYER_SKINS.spearhead,
    acquisition: 'default',
    signature: 'aurora'
  },
  {
    id: 'cyan',
    name: 'Aurora Strider',
    subtitle: 'La señal original',
    description: 'Un corredor azul acero que atraviesa el vacío con dos alas de media luna abiertas.',
    rarity: 'INICIAL',
    tier: 'starter',
    priceNova: 0,
    palette: PLAYER_SKINS.cyan,
    acquisition: 'default',
    signature: 'aurora'
  },
  {
    id: 'violet',
    name: 'Eclipse Prism',
    subtitle: 'Energía de eclipse',
    description: 'Armadura facetada de amatista que encierra un prisma dentro de un eclipse angular.',
    rarity: 'DESBLOQUEABLE',
    palette: PLAYER_SKINS.violet,
    acquisition: 'nova',
    tier: 'common',
    priceNova: 250,
    signature: 'prism'
  },
  {
    id: 'amber',
    name: 'Solar Bastion',
    subtitle: 'Núcleo de forja',
    description: 'Un bastión hexagonal de bronce y cerámica que protege un reactor solar incandescente.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.amber,
    acquisition: 'nova',
    tier: 'rare',
    priceNova: 600,
    signature: 'solar'
  },
  {
    id: 'emerald',
    name: 'Verdant Vector',
    subtitle: 'Pulso biocristalino',
    description: 'Cuatro aletas biocristalinas enmarcan un núcleo verde vivo y una quilla precisa.',
    rarity: 'NUEVA · DEMO',
    palette: PLAYER_SKINS.emerald,
    acquisition: 'nova',
    tier: 'epic',
    priceNova: 1200,
    signature: 'verdant'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Relay',
    subtitle: 'Señal de vacío',
    description: 'Una nave furtiva de obsidiana con tres antenas y una señal rosa encendida.',
    rarity: 'NUEVA · DEMO',
    tier: 'epic',
    priceNova: 1800,
    palette: PLAYER_SKINS.obsidian,
    acquisition: 'nova',
    signature: 'quasar'
  },
  {
    id: 'nova',
    name: 'Nova Warden',
    subtitle: 'Núcleo de supernova',
    description: 'Un guardián plateado de seis escudos alrededor de una estrella azul y dorada.',
    rarity: 'NUEVA · PREMIUM',
    tier: 'epic',
    priceNova: 3000,
    palette: PLAYER_SKINS.nova,
    acquisition: 'nova',
    signature: 'supernova'
  },
  {
    id: 'manta',
    name: 'Manta Veil',
    subtitle: 'Porcelana de las mareas',
    description: 'Un ala de nácar continua, ancha y silenciosa, con reflejos de mar y una perla turquesa.',
    rarity: 'NUEVA · HÍBRIDA',
    tier: 'epic',
    priceNova: 0,
    palette: PLAYER_SKINS.manta,
    acquisition: 'nova',
    signature: 'manta'
  },
  {
    id: 'corsair', name: 'Scarlet Corsair', subtitle: 'Dos proas, una señal',
    description: 'Un catamarán de cerámica escarlata: dos pontones abiertos y motores gemelos de hielo.',
    rarity: 'NUEVA · PREMIUM', tier: 'epic', priceNova: 3600,
    palette: PLAYER_SKINS.corsair, acquisition: 'nova', signature: 'aurora'
  },
  {
    id: 'nautilus', name: 'Nautilus Ark', subtitle: 'La espiral del abismo',
    description: 'Una concha blindada de cobalto y latón abraza un reactor turquesa excéntrico.',
    rarity: 'NUEVA · PREMIUM', tier: 'epic', priceNova: 4200,
    palette: PLAYER_SKINS.nautilus, acquisition: 'nova', signature: 'quasar'
  },
  {
    id: 'asterion', name: 'Asterion Courier', subtitle: 'Mensajero de la última órbita',
    description: 'Una nave de escolta de marfil y titanio oscuro, unida por aletas abiertas alrededor de un reactor verde menta.',
    rarity: 'RETO SEMANAL · EXCLUSIVA', tier: 'epic', priceNova: 0,
    palette: PLAYER_SKINS.asterion, acquisition: 'event', signature: 'aurora'
  },
  {
    id: 'solstice', name: 'Solstice Regent', subtitle: 'Corona del eclipse',
    description: 'Tres proas de obsidiana y oro abrazan un reactor carmesí. Exclusiva de la ruleta: gratis o con video. Probabilidad creciente de 1% a 20%, sin ventajas de combate.',
    rarity: 'RULETA DIARIA · EXCLUSIVA', tier: 'epic', priceNova: 0,
    palette: PLAYER_SKINS.solstice, acquisition: 'daily-wheel', signature: 'solar'
  }
] as const;

export const isPlayerSkinId = (value: unknown): value is PlayerSkinId => (
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLAYER_SKINS, value)
);

export const getPlayerSkinDefinition = (id: PlayerSkinId): PlayerSkinDefinition => (
  PLAYER_SKIN_DEFINITIONS.find((definition) => definition.id === id) ?? PLAYER_SKIN_DEFINITIONS[0]
);
