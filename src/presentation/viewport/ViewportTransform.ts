import { LOGICAL_HEIGHT, LOGICAL_WIDTH, MAX_DEVICE_PIXEL_RATIO } from '../../config/constants';

export interface ViewportState {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class ViewportTransform {
  public readonly logicalWidth = LOGICAL_WIDTH;
  public readonly logicalHeight = LOGICAL_HEIGHT;
  public state: ViewportState = {
    cssWidth: LOGICAL_WIDTH,
    cssHeight: LOGICAL_HEIGHT,
    dpr: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  public resize(cssWidth: number, cssHeight: number, devicePixelRatio = 1): ViewportState {
    const width = Math.max(1, cssWidth);
    const height = Math.max(1, cssHeight);
    const scale = Math.min(width / this.logicalWidth, height / this.logicalHeight);

    this.state = {
      cssWidth: width,
      cssHeight: height,
      dpr: Math.min(Math.max(devicePixelRatio, 1), MAX_DEVICE_PIXEL_RATIO),
      scale,
      offsetX: (width - this.logicalWidth * scale) / 2,
      offsetY: (height - this.logicalHeight * scale) / 2
    };
    return this.state;
  }

  public toLogical(clientX: number, clientY: number, rect?: DOMRect): { x: number; y: number } {
    const bounds = rect ?? { left: 0, top: 0 };
    return {
      x: (clientX - bounds.left - this.state.offsetX) / this.state.scale,
      y: (clientY - bounds.top - this.state.offsetY) / this.state.scale
    };
  }

  public logicalToCss(x: number, y: number): { x: number; y: number } {
    return {
      x: this.state.offsetX + x * this.state.scale,
      y: this.state.offsetY + y * this.state.scale
    };
  }
}
