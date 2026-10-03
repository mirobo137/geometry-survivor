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
      : trailKind === 'gyre'
        ? PROJECTILE_VISUAL_TOKENS.gyreDurationSeconds
        : trailKind === 'razor' ? PROJECTILE_VISUAL_TOKENS.razorDurationSeconds : 0;
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
  if (trailKind !== 'curve' && trailKind !== 'helix' && trailKind !== 'gyre' && trailKind !== 'razor') return 0;
  const progress = getProgress(state, trailKind, ageSeconds, lifetimeSeconds);
  const side = state.muzzle === 0 ? 1 : -1;
  if (trailKind === 'curve') {
    return Math.sin(progress * FULL_PI) ** 2 * PROJECTILE_VISUAL_TOKENS.curveAmplitude * side;
  }
  if (trailKind === 'gyre' || trailKind === 'razor') {
    const phase = progress * FULL_PI;
    const wave = trailKind === 'gyre' ? Math.sin(6 * phase)
      : (Math.sin(8 * phase) + Math.sin(24 * phase) / 9) / (10 / 9);
    const amplitude = trailKind === 'gyre' ? PROJECTILE_VISUAL_TOKENS.gyreAmplitude : PROJECTILE_VISUAL_TOKENS.razorAmplitude;
    return wave * Math.sin(phase) ** 2 * amplitude * side;
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
  if (trailKind !== 'curve' && trailKind !== 'helix' && trailKind !== 'gyre' && trailKind !== 'razor') return 0;
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
  if (trailKind === 'gyre' || trailKind === 'razor') {
    const phase = progress * FULL_PI;
    const wave = trailKind === 'gyre' ? Math.sin(6 * phase)
      : (Math.sin(8 * phase) + Math.sin(24 * phase) / 9) / (10 / 9);
    const derivative = trailKind === 'gyre' ? 6 * Math.cos(6 * phase)
      : (8 * Math.cos(8 * phase) + 24 * Math.cos(24 * phase) / 9) / (10 / 9);
    const amplitude = trailKind === 'gyre' ? PROJECTILE_VISUAL_TOKENS.gyreAmplitude : PROJECTILE_VISUAL_TOKENS.razorAmplitude;
    return (derivative * Math.sin(phase) ** 2 + wave * Math.sin(2 * phase))
      * FULL_PI / duration * amplitude * side;
  }
  const firstDerivative = 2 * FULL_PI * Math.cos(2 * progress * FULL_PI) * Math.sin(progress * FULL_PI);
  const secondDerivative = FULL_PI * Math.sin(2 * progress * FULL_PI) * Math.cos(progress * FULL_PI);
  return (firstDerivative + secondDerivative)
    * (PROJECTILE_VISUAL_TOKENS.helixAmplitude / duration)
    * side;
};
