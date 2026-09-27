import nacreUrl from '../../assets/images/backgrounds/nacre-orbit.webp?url';
import { createRasterBackgroundLoader, StaticRasterBackgroundView } from './StaticRasterBackgroundView';

export const loadNacreBackground = createRasterBackgroundLoader(nacreUrl);

/** Painterly Nacre plate, lazily loaded and cached like other raster skies. */
export class NacreBackgroundView extends StaticRasterBackgroundView {
  public constructor(load = loadNacreBackground) {
    super(load);
  }
}
