import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import { InputManager } from './InputManager';

class FakeSurface {
  public readonly listeners = new Map<string, (event: any) => void>();

  public addEventListener(type: string, listener: (event: any) => void): void {
    this.listeners.set(type, listener);
  }

  public removeEventListener(type: string): void {
    this.listeners.delete(type);
  }

  public getBoundingClientRect(): DOMRect {
    return { left: 0, top: 0, width: 1280, height: 720 } as DOMRect;
  }

  public setPointerCapture(): void {
    // The browser-only capture behavior is not relevant to movement math.
  }
}

const pointer = (pointerId: number, clientX: number, clientY: number) => ({
  pointerId,
  clientX,
  clientY,
  target: null,
  preventDefault: vi.fn()
});

describe('InputManager', () => {
  beforeEach(() => {
    vi.stubGlobal('Element', class {
      public closest(): null {
        return null;
      }
    });
    vi.stubGlobal('window', {
      PointerEvent: class {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  it('interpreta el arrastre relativo sin consultar la posicion del jugador', () => {
    const surface = new FakeSurface();
    const viewport = new ViewportTransform();
    viewport.resize(1280, 720, 1);
    const getPlayerPosition = vi.fn(() => ({ x: 640, y: 360 }));
    const input = new InputManager(
      surface as unknown as HTMLElement,
      viewport,
      getPlayerPosition,
      undefined,
      'relative-touch'
    );
    input.attach();

    surface.listeners.get('pointerdown')?.(pointer(7, 120, 120));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    surface.listeners.get('pointermove')?.(pointer(7, 250, 120));

    expect(input.getMovement().x).toBeGreaterThan(0.9);
    expect(Math.abs(input.getMovement().y)).toBeLessThan(0.01);
    expect(getPlayerPosition).not.toHaveBeenCalled();

    surface.listeners.get('pointerup')?.(pointer(7, 250, 120));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
  });

  it('conserva el modo tactil directo para el control existente', () => {
    const surface = new FakeSurface();
    const viewport = new ViewportTransform();
    viewport.resize(1280, 720, 1);
    const input = new InputManager(
      surface as unknown as HTMLElement,
      viewport,
      () => ({ x: 640, y: 360 }),
      undefined,
      'touch'
    );
    input.attach();

    surface.listeners.get('pointerdown')?.(pointer(8, 900, 360));
    expect(input.getMovement()).toEqual({ x: 1, y: 0 });
  });
});
