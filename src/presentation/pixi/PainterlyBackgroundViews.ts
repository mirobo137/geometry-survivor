import deepSpaceUrl from '../../assets/images/backgrounds/deep-space.webp?url';
import ionStormUrl from '../../assets/images/backgrounds/ion-storm.webp?url';
import solarDriftUrl from '../../assets/images/backgrounds/solar-drift.webp?url';
import crystalFieldUrl from '../../assets/images/backgrounds/crystal-field.webp?url';
import silentArchiveUrl from '../../assets/images/backgrounds/silent-archive.webp?url';
import lunarFaultUrl from '../../assets/images/backgrounds/lunar-fault.webp?url';
import leviathanWakeUrl from '../../assets/images/backgrounds/leviathan-wake.webp?url';
import type { BackgroundId } from '../../content/visual/BackgroundDefinitions';
import { REWARD_BACKGROUND_URLS } from '../../assets/skins/RewardCosmeticAssets';
import type { RewardBackgroundId } from '../../content/retention/RewardCosmeticDefinitions';
import { createRasterBackgroundLoader, StaticRasterBackgroundView, type RasterBackgroundLoader } from './StaticRasterBackgroundView';

export type PainterlyBackgroundId = Exclude<BackgroundId, 'nacre-orbit' | 'vesper-bloom' | 'tidal-veil'>;

export const loadDeepSpaceBackground = createRasterBackgroundLoader(deepSpaceUrl);
export const loadIonStormBackground = createRasterBackgroundLoader(ionStormUrl);
export const loadSolarDriftBackground = createRasterBackgroundLoader(solarDriftUrl);
export const loadCrystalFieldBackground = createRasterBackgroundLoader(crystalFieldUrl);
export const loadSilentArchiveBackground = createRasterBackgroundLoader(silentArchiveUrl);
export const loadLunarFaultBackground = createRasterBackgroundLoader(lunarFaultUrl);
export const loadLeviathanWakeBackground = createRasterBackgroundLoader(leviathanWakeUrl);

const DEFAULT_LOADERS: Readonly<Record<PainterlyBackgroundId, RasterBackgroundLoader>> = {
  ...Object.fromEntries(Object.entries(REWARD_BACKGROUND_URLS).map(([id, url]) => [id, createRasterBackgroundLoader(url)])) as Record<RewardBackgroundId, RasterBackgroundLoader>,
  'deep-space': loadDeepSpaceBackground,
  'ion-storm': loadIonStormBackground,
  'solar-drift': loadSolarDriftBackground,
  'crystal-field': loadCrystalFieldBackground,
  'silent-archive': loadSilentArchiveBackground,
  'lunar-fault': loadLunarFaultBackground,
  'leviathan-wake': loadLeviathanWakeBackground
};

/** Creates lightweight views; each image is requested only when selected. */
export const createPainterlyBackgroundViews = (
  loaders: Partial<Record<PainterlyBackgroundId, RasterBackgroundLoader>> = {}
): Record<PainterlyBackgroundId, StaticRasterBackgroundView> => ({
  ...Object.fromEntries(Object.keys(REWARD_BACKGROUND_URLS).map(id => [id, new StaticRasterBackgroundView(loaders[id as RewardBackgroundId] ?? DEFAULT_LOADERS[id as RewardBackgroundId])])) as Record<RewardBackgroundId, StaticRasterBackgroundView>,
  'deep-space': new StaticRasterBackgroundView(loaders['deep-space'] ?? DEFAULT_LOADERS['deep-space']),
  'ion-storm': new StaticRasterBackgroundView(loaders['ion-storm'] ?? DEFAULT_LOADERS['ion-storm']),
  'solar-drift': new StaticRasterBackgroundView(loaders['solar-drift'] ?? DEFAULT_LOADERS['solar-drift']),
  'crystal-field': new StaticRasterBackgroundView(loaders['crystal-field'] ?? DEFAULT_LOADERS['crystal-field']),
  'silent-archive': new StaticRasterBackgroundView(loaders['silent-archive'] ?? DEFAULT_LOADERS['silent-archive']),
  'lunar-fault': new StaticRasterBackgroundView(loaders['lunar-fault'] ?? DEFAULT_LOADERS['lunar-fault']),
  'leviathan-wake': new StaticRasterBackgroundView(loaders['leviathan-wake'] ?? DEFAULT_LOADERS['leviathan-wake'])
});
