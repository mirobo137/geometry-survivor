import { Container, Graphics } from 'pixi.js';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import {
  getBackgroundDefinition,
  type BackgroundDefinition,
  type BackgroundId
} from '../../content/visual/BackgroundDefinitions';
import type { FxQuality } from '../../content/visual/VisualTokens';

const STAR_POINTS = [
  [0.08, 0.16, 1.2], [0.17, 0.74, 1.6], [0.25, 0.29, 0.9], [0.32, 0.86, 1.3],
  [0.39, 0.12, 1.7], [0.47, 0.68, 1], [0.54, 0.24, 1.25], [0.61, 0.9, 0.8],
  [0.68, 0.11, 1.45], [0.74, 0.57, 1.1], [0.81, 0.22, 0.75], [0.9, 0.77, 1.55],
  [0.94, 0.38, 0.9], [0.12, 0.48, 0.75], [0.22, 0.1, 1.15], [0.36, 0.49, 0.7],
  [0.43, 0.78, 1.45], [0.58, 0.52, 0.8], [0.65, 0.34, 1.05], [0.77, 0.88, 0.75],
  [0.86, 0.08, 1.2], [0.97, 0.62, 0.65], [0.05, 0.9, 0.8], [0.52, 0.07, 0.7],
  [0.72, 0.38, 1.3], [0.29, 0.63, 0.85], [0.89, 0.51, 0.95], [0.15, 0.22, 0.65],
  [0.48, 0.42, 1.1], [0.63, 0.76, 0.7], [0.34, 0.23, 0.75], [0.83, 0.68, 1.15],
  [0.1, 0.61, 0.65], [0.57, 0.14, 0.9]
] as const;

const QUALITY_STAR_LIMIT: Readonly<Record<FxQuality, number>> = {
  low: 12,
  medium: 24,
  high: STAR_POINTS.length
};

const drawCircle = (graphics: Graphics, x: number, y: number, radius: number, color: number, alpha: number): void => {
  graphics.beginPath().circle(x, y, radius).fill({ color, alpha });
};

const drawLine = (graphics: Graphics, startX: number, startY: number, endX: number, endY: number, color: number, width: number, alpha: number): void => {
  graphics.beginPath().moveTo(startX, startY).lineTo(endX, endY).stroke({ color, width, alpha });
};

/**
 * Static, presentation-only atmosphere. It is rebuilt only on theme/viewport
 * changes, never in the ticker, and remains one display object in the scene.
 */
export class BackgroundView {
  public readonly root = new Container();
  private readonly art = new Graphics();
  private readonly quality: FxQuality;
  private width = LOGICAL_WIDTH;
  private height = LOGICAL_HEIGHT;
  private _backgroundId: BackgroundId = 'deep-space';

  public constructor(backgroundId: BackgroundId = 'deep-space', quality: FxQuality = 'medium') {
    this.quality = quality;
    this.root.eventMode = 'none';
    this.root.addChild(this.art);
    this.setBackground(backgroundId);
  }

  public get backgroundId(): BackgroundId {
    return this._backgroundId;
  }

  public resize(width: number, height: number): void {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    if (nextWidth === this.width && nextHeight === this.height) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.render(getBackgroundDefinition(this._backgroundId));
  }

  public setBackground(backgroundId: BackgroundId): void {
    if (this._backgroundId === backgroundId && this.art.context.instructions.length > 0) return;
    this._backgroundId = backgroundId;
    this.render(getBackgroundDefinition(backgroundId));
  }

  private render(definition: BackgroundDefinition): void {
    const { tokens } = definition;
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const scale = Math.max(this.width, this.height);

    this.art.clear();
    this.art.beginPath().rect(0, 0, this.width, this.height).fill({ color: tokens.base, alpha: 1 });
    drawCircle(this.art, this.width * 0.22, this.height * 0.2, scale * 0.32, tokens.glow, 0.16);
    drawCircle(this.art, this.width * 0.8, this.height * 0.76, scale * 0.38, tokens.secondary, 0.07);
    drawCircle(this.art, centerX, centerY, scale * 0.25, tokens.glow, 0.05);

    this.drawPattern(tokens.pattern, tokens.accent, tokens.secondary);
    this.drawStars(tokens.accent, tokens.secondary);
  }

  private drawStars(primary: number, secondary: number): void {
    const limit = QUALITY_STAR_LIMIT[this.quality];
    for (let index = 0; index < limit; index += 1) {
      const [x, y, radius] = STAR_POINTS[index];
      const color = index % 4 === 0 ? secondary : primary;
      const alpha = 0.2 + (index % 3) * 0.08;
      drawCircle(this.art, x * this.width, y * this.height, radius, color, alpha);
    }
  }

  private drawPattern(pattern: BackgroundDefinition['tokens']['pattern'], primary: number, secondary: number): void {
    if (pattern === 'constellation') {
      const points = [
        [0.08, 0.16], [0.25, 0.29], [0.39, 0.12], [0.54, 0.24], [0.68, 0.11], [0.81, 0.22]
      ] as const;
      for (let index = 0; index < points.length - 1; index += 1) {
        const [startX, startY] = points[index];
        const [endX, endY] = points[index + 1];
        drawLine(this.art, startX * this.width, startY * this.height, endX * this.width, endY * this.height, primary, 1, 0.11);
      }
      return;
    }

    if (pattern === 'nebula') {
      drawCircle(this.art, this.width * 0.28, this.height * 0.54, this.width * 0.22, primary, 0.08);
      drawCircle(this.art, this.width * 0.72, this.height * 0.32, this.width * 0.2, secondary, 0.07);
      drawCircle(this.art, this.width * 0.58, this.height * 0.84, this.width * 0.18, primary, 0.06);
      return;
    }

    if (pattern === 'solar') {
      const centerX = this.width * 0.78;
      const centerY = this.height * 0.48;
      for (const radius of [0.2, 0.31, 0.42] as const) {
        this.art.beginPath()
          .arc(centerX, centerY, this.width * radius, Math.PI * 0.7, Math.PI * 1.72)
          .stroke({ color: primary, width: 2, alpha: 0.16 });
      }
      drawCircle(this.art, centerX, centerY, this.width * 0.045, secondary, 0.13);
      return;
    }

    for (let index = -2; index < 11; index += 1) {
      const offset = index * this.width * 0.12;
      drawLine(this.art, offset, 0, offset + this.height, this.height, primary, 1, 0.08);
    }
    for (let index = 1; index < 6; index += 1) {
      const y = this.height * index / 6;
      drawLine(this.art, 0, y, this.width, y, secondary, 1, 0.06);
    }
  }
}
