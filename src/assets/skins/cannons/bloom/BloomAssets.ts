import bloomTrailUrl from './bloom-trail.png?url';

/** Hybrid Bloomwake trail: one decoded image shared by the bounded projectile pool. */
export const BLOOM_TRAIL_ASSET = {
  id: 'cannon-bloom-trail',
  url: bloomTrailUrl,
  width: 128,
  height: 128,
  anchor: { x: 0.5, y: 0.5 },
  renderMode: 'pixi-texture',
  maxInstances: 32,
  states: ['active', 'fading'] as const
} as const;
