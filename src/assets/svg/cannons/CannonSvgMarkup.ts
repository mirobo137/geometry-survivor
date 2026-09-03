import cannonBasicLeftSvg from './cannon-basic-left.svg?raw';
import cannonBasicRightSvg from './cannon-basic-right.svg?raw';
import cannonCurveLeftSvg from './cannon-curve-left.svg?raw';
import cannonCurveRightSvg from './cannon-curve-right.svg?raw';
import cannonSmokeLeftSvg from './cannon-smoke-left.svg?raw';
import cannonSmokeRightSvg from './cannon-smoke-right.svg?raw';
import cannonRainbowLeftSvg from './cannon-rainbow-left.svg?raw';
import cannonRainbowRightSvg from './cannon-rainbow-right.svg?raw';
import projectileBasicSvg from './projectile-basic.svg?raw';
import projectileCurveSvg from './projectile-curve.svg?raw';
import projectileSmokeSvg from './projectile-smoke.svg?raw';
import projectileRainbowSvg from './projectile-rainbow.svg?raw';

export interface CannonBarrelSvgPair {
  readonly left: string;
  readonly right: string;
}

/** Strips the SVG root, title and desc so a piece can be inlined into another document. */
export const extractSvgGraphicMarkup = (svg: string): string => (
  svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>[\s\S]*$/i, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, '')
    .replace(/\s+id="[^"]+"/g, '')
    .trim()
);

export const CANNON_BARREL_SVG = {
  basic: { left: cannonBasicLeftSvg, right: cannonBasicRightSvg },
  curve: { left: cannonCurveLeftSvg, right: cannonCurveRightSvg },
  smoke: { left: cannonSmokeLeftSvg, right: cannonSmokeRightSvg },
  rainbow: { left: cannonRainbowLeftSvg, right: cannonRainbowRightSvg }
} as const satisfies Readonly<Record<string, CannonBarrelSvgPair>>;

export const CANNON_PROJECTILE_SVG = {
  basic: projectileBasicSvg,
  curve: projectileCurveSvg,
  smoke: projectileSmokeSvg,
  rainbow: projectileRainbowSvg
} as const;
