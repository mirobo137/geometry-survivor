import { FRACTURE_ACT_DEFINITION } from '../../content/run/ActDefinitions';
import { RadialActDirector } from './RadialActDirector';

/** Simulation-facing director for the Act III Fracture composition. */
export class FractureActDirector extends RadialActDirector {
  public constructor() {
    super(FRACTURE_ACT_DEFINITION);
  }
}

export const FRACTURE_ACT_DIRECTOR = new FractureActDirector();
