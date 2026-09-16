import { ARENA_CENTER } from '../config/constants';
import type { ArenaShape } from '../content/run/ArenaShapeDefinitions';

export type { ArenaShape } from '../content/run/ArenaShapeDefinitions';

export interface ArenaBoundary {
  readonly radius: number;
  readonly shapeFrom: ArenaShape;
  readonly shapeTo: ArenaShape;
  /** 0..1 interpolation from shapeFrom to shapeTo. */
  readonly morphProgress: number;
  /** Optional runtime context used by authored hazard pressure. */
  readonly shape?: ArenaShape;
  readonly shapeIndex?: number;
}

export type ArenaBoundaryInput = number | Readonly<ArenaBoundary>;

const FULL_CIRCLE = Math.PI * 2;
const HEXAGON_SIDES = 6;
const HEXAGON_SECTOR = FULL_CIRCLE / HEXAGON_SIDES;
const HALF_HEXAGON_SECTOR = HEXAGON_SECTOR / 2;
const HEXAGON_APOTHEM_FACTOR = Math.cos(Math.PI / HEXAGON_SIDES);
const SQUARE_SIDES = 4;
const SQUARE_SECTOR = FULL_CIRCLE / SQUARE_SIDES;
const HALF_SQUARE_SECTOR = SQUARE_SECTOR / 2;
const SQUARE_APOTHEM_FACTOR = Math.cos(Math.PI / SQUARE_SIDES);
// Keep the Act II square's closest wall at the same distance as the hexagon's
// closest wall. This preserves a known escape margin while its corners open
// a new diagonal route instead of making the transformation a hidden squeeze.
const SQUARE_CIRCUMRADIUS_FACTOR = HEXAGON_APOTHEM_FACTOR / SQUARE_APOTHEM_FACTOR;
const OCTAGON_APOTHEM_FACTOR = Math.cos(Math.PI / 8);
const RECTANGLE_LONG_HALF_EXTENT_FACTOR = 1.08;
const RECTANGLE_SHORT_HALF_EXTENT_FACTOR = 0.72;

export const asArenaBoundary = (input: ArenaBoundaryInput): ArenaBoundary => (
  typeof input === 'number'
    ? {
      radius: Math.max(0, input),
      shapeFrom: 'circle',
      shapeTo: 'circle',
      morphProgress: 0,
      shape: 'circle',
      shapeIndex: 0
    }
    : input
);

/** Returns the playable boundary distance at a world-space angle. */
export const getArenaRadiusAtAngle = (input: ArenaBoundaryInput, angle: number): number => {
  const boundary = asArenaBoundary(input);
  const progress = Math.min(1, Math.max(0, boundary.morphProgress));
  const fromRadius = getShapeRadius(boundary.radius, boundary.shapeFrom, angle);
  const toRadius = getShapeRadius(boundary.radius, boundary.shapeTo, angle);
  return fromRadius + (toRadius - fromRadius) * progress;
};

/** Clamps a circular player body inside the active convex arena boundary. */
export const clampPointToArena = (
  x: number,
  y: number,
  bodyRadius: number,
  input: ArenaBoundaryInput
): { readonly x: number; readonly y: number } => {
  const boundary = asArenaBoundary(input);
  const dx = x - ARENA_CENTER.x;
  const dy = y - ARENA_CENTER.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return { x, y };
  const maxDistance = Math.max(0, getArenaRadiusAtAngle(boundary, Math.atan2(dy, dx)) - Math.max(0, bodyRadius));
  if (distance <= maxDistance) return { x, y };
  const factor = maxDistance / distance;
  return {
    x: ARENA_CENTER.x + dx * factor,
    y: ARENA_CENTER.y + dy * factor
  };
};

/** Generates a fixed-size perimeter suitable for one dynamic Graphics path. */
export const getArenaBoundaryPoints = (
  input: ArenaBoundaryInput,
  segments = 36
): readonly { readonly x: number; readonly y: number }[] => {
  const safeSegments = Math.max(6, Math.floor(segments));
  const points: Array<{ readonly x: number; readonly y: number }> = [];
  for (let index = 0; index < safeSegments; index += 1) {
    const angle = (index / safeSegments) * FULL_CIRCLE;
    const radius = getArenaRadiusAtAngle(input, angle);
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return points;
};

const getShapeRadius = (radius: number, shape: ArenaShape, angle: number): number => {
  const safeRadius = Math.max(0, radius);
  if (shape === 'circle') return safeRadius;
  // A regular hexagon with vertices at 0, 60, ... degrees. This keeps its
  // vertices on the authored radius while exposing meaningful flat sides.
  if (shape === 'hexagon') {
    const sideNormalOffset = getSideNormalOffset(angle, HEXAGON_SECTOR, Math.PI / HEXAGON_SIDES, HALF_HEXAGON_SECTOR);
    return safeRadius * HEXAGON_APOTHEM_FACTOR / Math.cos(sideNormalOffset);
  }
  if (shape === 'octagon') {
    const sideNormalOffset = getSideNormalOffset(angle, FULL_CIRCLE / 8, 0, Math.PI / 8);
    return safeRadius * OCTAGON_APOTHEM_FACTOR / Math.cos(sideNormalOffset);
  }
  if (shape === 'diamond') {
    const sideNormalOffset = getSideNormalOffset(angle, SQUARE_SECTOR, Math.PI / 4, HALF_SQUARE_SECTOR);
    return safeRadius * SQUARE_CIRCUMRADIUS_FACTOR * SQUARE_APOTHEM_FACTOR / Math.cos(sideNormalOffset);
  }
  if (shape === 'rectangle-horizontal' || shape === 'rectangle-vertical') {
    const horizontal = shape === 'rectangle-horizontal';
    const halfWidth = safeRadius * (horizontal ? RECTANGLE_LONG_HALF_EXTENT_FACTOR : RECTANGLE_SHORT_HALF_EXTENT_FACTOR);
    const halfHeight = safeRadius * (horizontal ? RECTANGLE_SHORT_HALF_EXTENT_FACTOR : RECTANGLE_LONG_HALF_EXTENT_FACTOR);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const denominator = Math.sqrt(
      (cosine / Math.max(1, halfWidth)) ** 2 + (sine / Math.max(1, halfHeight)) ** 2
    );
    return denominator <= 0 ? safeRadius : 1 / denominator;
  }
  // Axis-aligned square: it reads as a square while keeping its minimum
  // clearance compatible with the opening hexagon.
  const sideNormalOffset = getSideNormalOffset(angle, SQUARE_SECTOR, 0, HALF_SQUARE_SECTOR);
  return safeRadius * SQUARE_CIRCUMRADIUS_FACTOR * SQUARE_APOTHEM_FACTOR / Math.cos(sideNormalOffset);
};

const getSideNormalOffset = (
  angle: number,
  sector: number,
  firstSideNormal: number,
  halfSector: number
): number => ((angle - firstSideNormal + halfSector) % sector + sector) % sector - halfSector;
