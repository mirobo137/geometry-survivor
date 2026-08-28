import type { UpgradeId } from '../../content/upgrades/UpgradeDefinitions';
import type { UpgradeCardTone } from './UpgradeCardVisual';

export type LevelUpCardInteractionKind = 'focus' | 'blur' | 'press' | 'select';

/** Semantic interaction emitted by the accessible HTML card. */
export interface LevelUpCardInteraction {
  readonly kind: LevelUpCardInteractionKind;
  readonly index: number;
  readonly upgradeId: UpgradeId;
}

/** Card bounds in the level-up root's CSS coordinate space. */
export interface LevelUpCardLayout {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tone: UpgradeCardTone;
}
