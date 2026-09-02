import type { CannonTrailKind } from '../../../content/visual/CannonSkinDefinitions';
import { PROJECTILE_VISUAL_TOKENS } from '../../../content/visual/VisualTokens';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';

const FULL_PI = Math.PI;

const getProgress = (
  state: ProjectileRenderState,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  const duration = Math.max(0.001, ageSeconds + lifetimeSeconds);
  return Math.min(1, Math.max(0, ageSeconds / duration));
};

/** Returns the presentation-only lateral arc in logical pixels. */
export const getProjectileCurveOffset = (
  state: ProjectileRenderState,
  trailKind: CannonTrailKind,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  if (trailKind !== 'curve') return 0;
  const progress = getProgress(state, ageSeconds, lifetimeSeconds);
  const side = state.muzzle === 0 ? 1 : -1;
  return Math.sin(progress * FULL_PI) * PROJECTILE_VISUAL_TOKENS.curveAmplitude * side;
};

/** Returns the lateral speed of the visual arc for tangent-aligned sprites. */
export const getProjectileCurveVelocity = (
  state: ProjectileRenderState,
  trailKind: CannonTrailKind,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  if (trailKind !== 'curve') return 0;
  const duration = Math.max(0.001, ageSeconds + lifetimeSeconds);
  const progress = getProgress(state, ageSeconds, lifetimeSeconds);
  const side = state.muzzle === 0 ? 1 : -1;
  return Math.cos(progress * FULL_PI)
    * (FULL_PI / duration)
    * PROJECTILE_VISUAL_TOKENS.curveAmplitude
    * side;
};
