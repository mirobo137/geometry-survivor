import { Rectangle, Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';

export const ENEMY_DEFEAT_SECONDS = 0.42;
const REGIONS = [
  [0, 0, 0.3125, 1, -1, 0.18, -0.38],
  [0.6875, 0, 0.3125, 1, 1, 0.26, 0.42],
  [0.3125, 0, 0.375, 0.625, -0.12, -0.8, -0.16],
  [0.3125, 0.625, 0.375, 0.375, 0.18, 0.9, 0.24]
] as const;

/** Exact image partition. Caller owns the views, never their shared source. */
export const createDefeatFragments = (body: Texture): readonly Texture[] => REGIONS.map(([u, v, width, height]) =>
  new Texture({ source: body.source, frame: new Rectangle(
    body.frame.x + u * body.frame.width, body.frame.y + v * body.frame.height,
    width * body.frame.width, height * body.frame.height
  ) }));

export const defeatCompression = (progress: number): number => progress < 0.12
  ? 1 - Math.sin(progress / 0.12 * Math.PI) * 0.06 : 1;

/** Same motion/timing for every hull; only its logical size differs. */
export const poseDefeatFragments = (parts: readonly Sprite[], body: Texture, progress: number): void => {
  const flight = Math.max(0, (progress - 0.12) / 0.88);
  const distance = 16 * (1 - Math.exp(-flight * 3)) * Math.max(body.width, body.height) / 64;
  const channel = Math.round(255 - flight * 160);
  const tint = (channel << 16) | (channel << 8) | channel;
  for (let index = 0; index < parts.length; index += 1) {
    const [u, v, width, height, dx, dy, spin] = REGIONS[index];
    const part = parts[index];
    part.position.set((u + width / 2 - 0.5) * body.width + dx * distance,
      (v + height / 2 - 0.5) * body.height + dy * distance);
    part.rotation = spin * flight;
    part.scale.set(1);
    part.tint = tint;
    part.alpha = 1;
  }
};
