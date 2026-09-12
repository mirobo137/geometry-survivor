import { ANGULAR_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import { RadialActDirector } from './RadialActDirector';

/** Simulation-facing director for the first playable Angular composition. */
export class AngularActDirector extends RadialActDirector {
  public constructor() {
    super(ANGULAR_ACT_DEFINITION);
  }
}

export const ANGULAR_ACT_DIRECTOR = new AngularActDirector();
