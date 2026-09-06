import type { CannonTrailKind } from '../../../content/visual/CannonSkinDefinitions';
import { PROJECTILE_VISUAL_TOKENS } from '../../../content/visual/VisualTokens';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';

const FULL_PI = Math.PI;

const getDuration = (
  trailKind: CannonTrailKind,
  ageSeconds: number,
  lifetimeSeconds: number
): number => {
  const maximum = trailKind === 'curve'
    ? PROJECTILE_VISUAL_TOKENS.curveDurationSeconds
    : trailKind === 'helix'
      ? PROJECTILE_VISUAL_TOKENS.helixDurationSeconds
      : 0;
  return Math.max(0.001, Math.min(maximum, ageSeconds + lifetimeSeconds));
};

const getProgress = (
  state: ProjectileRenderState,
  trailKind: CannonTrailKind,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  const duration = getDuration(trailKind, ageSeconds, lifetimeSeconds);
  return Math.min(1, Math.max(0, ageSeconds / duration));
};

/** Returns the presentation-only lateral arc in logical pixels. */
export const getProjectileCurveOffset = (
  state: ProjectileRenderState,
  trailKind: CannonTrailKind,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  if (trailKind !== 'curve' && trailKind !== 'helix') return 0;
  const progress = getProgress(state, trailKind, ageSeconds, lifetimeSeconds);
  const side = state.muzzle === 0 ? 1 : -1;
  if (trailKind === 'curve') {
    return Math.sin(progress * FULL_PI) ** 2 * PROJECTILE_VISUAL_TOKENS.curveAmplitude * side;
  }
  // Two signed lobes create an S/helix gesture, then settle exactly on-axis.
  return Math.sin(progress * 2 * FULL_PI)
    * Math.sin(progress * FULL_PI)
    * PROJECTILE_VISUAL_TOKENS.helixAmplitude
    * side;
};

/** Returns the lateral speed of the visual arc for tangent-aligned sprites. */
export const getProjectileCurveVelocity = (
  state: ProjectileRenderState,
  trailKind: CannonTrailKind,
  ageSeconds = state.ageSeconds,
  lifetimeSeconds = state.lifetimeSeconds
): number => {
  if (trailKind !== 'curve' && trailKind !== 'helix') return 0;
  const duration = getDuration(trailKind, ageSeconds, lifetimeSeconds);
  if (ageSeconds >= duration) return 0;
  const progress = getProgress(state, trailKind, ageSeconds, lifetimeSeconds);
  const side = state.muzzle === 0 ? 1 : -1;
  if (trailKind === 'curve') {
    return Math.sin(2 * progress * FULL_PI)
      * (FULL_PI / duration)
      * PROJECTILE_VISUAL_TOKENS.curveAmplitude
      * side;
  }
  const firstDerivative = 2 * FULL_PI * Math.cos(2 * progress * FULL_PI) * Math.sin(progress * FULL_PI);
  const secondDerivative = FULL_PI * Math.sin(2 * progress * FULL_PI) * Math.cos(progress * FULL_PI);
  return (firstDerivative + secondDerivative)
    * (PROJECTILE_VISUAL_TOKENS.helixAmplitude / duration)
    * side;
};
