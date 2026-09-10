import vesperUrl from '../../assets/svg/backgrounds/vesper-bloom.svg?url';
import { createSvgBackgroundLoader, StaticSvgBackgroundView } from './StaticSvgBackgroundView';

export const loadVesperBackground = createSvgBackgroundLoader(vesperUrl);

/** Compatibility wrapper for the Vesper Bloom atmosphere. */
export class VesperBackgroundView extends StaticSvgBackgroundView {
  public constructor(load = loadVesperBackground) {
    super(load);
  }
}
