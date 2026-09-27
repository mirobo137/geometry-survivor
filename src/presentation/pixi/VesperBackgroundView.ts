import vesperUrl from '../../assets/images/backgrounds/vesper-bloom.webp?url';
import { createRasterBackgroundLoader, StaticRasterBackgroundView } from './StaticRasterBackgroundView';

export const loadVesperBackground = createRasterBackgroundLoader(vesperUrl);

/** Painterly Vesper plate, lazily loaded and cached like other raster skies. */
export class VesperBackgroundView extends StaticRasterBackgroundView {
  public constructor(load = loadVesperBackground) {
    super(load);
  }
}
