import nacreUrl from '../../assets/svg/backgrounds/nacre-orbit.svg?url';
import { createSvgBackgroundLoader, StaticSvgBackgroundView } from './StaticSvgBackgroundView';

export const loadNacreBackground = createSvgBackgroundLoader(nacreUrl);

/** Compatibility name for the first approved static SVG atmosphere. */
export class NacreBackgroundView extends StaticSvgBackgroundView {
  public constructor(load = loadNacreBackground) {
    super(load);
  }
}
