import { LOGICAL_HEIGHT, LOGICAL_WIDTH, MAX_DEVICE_PIXEL_RATIO } from '../../config/constants';

export interface ViewportState {
  orientation: 'portrait' | 'landscape';
  logicalWidth: number;
  logicalHeight: number;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  worldOffsetX: number;
  worldOffsetY: number;
}

export class ViewportTransform {
  public state: ViewportState = {
    orientation: 'landscape',
    logicalWidth: LOGICAL_WIDTH,
    logicalHeight: LOGICAL_HEIGHT,
    cssWidth: LOGICAL_WIDTH,
    cssHeight: LOGICAL_HEIGHT,
    dpr: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    worldOffsetX: 0,
    worldOffsetY: 0
  };

  public resize(cssWidth: number, cssHeight: number, devicePixelRatio = 1): ViewportState {
    const width = Math.max(1, cssWidth);
    const height = Math.max(1, cssHeight);
    const orientation = height > width ? 'portrait' : 'landscape';
    const logicalWidth = orientation === 'portrait' ? LOGICAL_HEIGHT : LOGICAL_WIDTH;
    const logicalHeight = orientation === 'portrait' ? LOGICAL_WIDTH : LOGICAL_HEIGHT;
    const scale = Math.min(width / logicalWidth, height / logicalHeight);

    this.state = {
      orientation,
      logicalWidth,
      logicalHeight,
      cssWidth: width,
      cssHeight: height,
      dpr: Math.min(Math.max(devicePixelRatio, 1), MAX_DEVICE_PIXEL_RATIO),
      scale,
      offsetX: (width - logicalWidth * scale) / 2,
      offsetY: (height - logicalHeight * scale) / 2,
      // The simulation remains in the existing 1280x720 world. In portrait,
      // center that world inside a 720x1280 presentation viewport so the arena
      // stays large and playable instead of being reduced to a tiny letterbox.
      worldOffsetX: (logicalWidth - LOGICAL_WIDTH) / 2,
      worldOffsetY: (logicalHeight - LOGICAL_HEIGHT) / 2
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

  public toWorld(clientX: number, clientY: number, rect?: DOMRect): { x: number; y: number } {
    const logical = this.toLogical(clientX, clientY, rect);
    return {
      x: logical.x - this.state.worldOffsetX,
      y: logical.y - this.state.worldOffsetY
    };
  }

  public logicalToCss(x: number, y: number): { x: number; y: number } {
    return {
      x: this.state.offsetX + x * this.state.scale,
      y: this.state.offsetY + y * this.state.scale
    };
  }
}
