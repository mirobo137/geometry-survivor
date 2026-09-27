import deepSpaceUrl from '../../assets/images/backgrounds/deep-space.webp?url';
import ionStormUrl from '../../assets/images/backgrounds/ion-storm.webp?url';
import solarDriftUrl from '../../assets/images/backgrounds/solar-drift.webp?url';
import crystalFieldUrl from '../../assets/images/backgrounds/crystal-field.webp?url';
import type { BackgroundId } from '../../content/visual/BackgroundDefinitions';
import { createRasterBackgroundLoader, StaticRasterBackgroundView, type RasterBackgroundLoader } from './StaticRasterBackgroundView';

export type PainterlyBackgroundId = Extract<BackgroundId, 'deep-space' | 'ion-storm' | 'solar-drift' | 'crystal-field'>;

export const loadDeepSpaceBackground = createRasterBackgroundLoader(deepSpaceUrl);
export const loadIonStormBackground = createRasterBackgroundLoader(ionStormUrl);
export const loadSolarDriftBackground = createRasterBackgroundLoader(solarDriftUrl);
export const loadCrystalFieldBackground = createRasterBackgroundLoader(crystalFieldUrl);

const DEFAULT_LOADERS: Readonly<Record<PainterlyBackgroundId, RasterBackgroundLoader>> = {
  'deep-space': loadDeepSpaceBackground,
  'ion-storm': loadIonStormBackground,
  'solar-drift': loadSolarDriftBackground,
  'crystal-field': loadCrystalFieldBackground
};

/** Creates lightweight views; each image is requested only when selected. */
export const createPainterlyBackgroundViews = (
  loaders: Partial<Record<PainterlyBackgroundId, RasterBackgroundLoader>> = {}
): Record<PainterlyBackgroundId, StaticRasterBackgroundView> => ({
  'deep-space': new StaticRasterBackgroundView(loaders['deep-space'] ?? DEFAULT_LOADERS['deep-space']),
  'ion-storm': new StaticRasterBackgroundView(loaders['ion-storm'] ?? DEFAULT_LOADERS['ion-storm']),
  'solar-drift': new StaticRasterBackgroundView(loaders['solar-drift'] ?? DEFAULT_LOADERS['solar-drift']),
  'crystal-field': new StaticRasterBackgroundView(loaders['crystal-field'] ?? DEFAULT_LOADERS['crystal-field'])
});
