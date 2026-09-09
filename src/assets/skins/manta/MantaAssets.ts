import wingUrl from './manta-wing.png?url';

/** One image, two mirrored fins. Shared logical placement for DOM and Pixi. */
export const MANTA_WING = {
  url: wingUrl,
  width: 34,
  height: 38,
  anchorX: 0.86,
  anchorY: 0.51,
  rootX: 2,
  rootY: 0,
  cycleSeconds: 3.6,
  amplitude: 0.075
} as const;
