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
  it('joystick: origen libre, zona muerta, fuerza gradual y límite diagonal', () => {
    const surface = new FakeSurface();
    const viewport = new ViewportTransform();
    viewport.resize(390, 844, 3);
    const player = vi.fn(() => ({ x: 640, y: 360 }));
    const visual = vi.fn();
    const input = new InputManager(surface as unknown as HTMLElement, viewport, player, undefined, 'joystick', visual);
    input.attach();
    surface.listeners.get('pointerdown')?.(pointer(1, 100, 650));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    surface.listeners.get('pointermove')?.(pointer(1, 107, 650));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    surface.listeners.get('pointermove')?.(pointer(1, 130, 650));
    expect(input.getMovement()).toEqual({ x: 0.5, y: 0 });
    surface.listeners.get('pointerdown')?.(pointer(2, 300, 300));
    surface.listeners.get('pointermove')?.(pointer(2, 50, 50));
    expect(input.getMovement().x).toBe(0.5);
    surface.listeners.get('pointermove')?.(pointer(1, 300, 850));
    expect(Math.hypot(input.getMovement().x, input.getMovement().y)).toBeCloseTo(1);
    expect(player).not.toHaveBeenCalled();
    expect(visual.mock.lastCall?.[0].x).toBe(100);
    surface.listeners.get('pointercancel')?.(pointer(1, 300, 850));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    expect(visual.mock.lastCall?.[0].active).toBe(false);
  });

  it('no hereda un gesto tras cambiar de modo, pausar o perder captura', () => {
    const surface = new FakeSurface();
    const viewport = new ViewportTransform();
    viewport.resize(1280, 720, 1);
    let playing = true;
    const input = new InputManager(surface as unknown as HTMLElement, viewport,
      () => ({ x: 640, y: 360 }), undefined, 'joystick', undefined, () => playing);
    input.attach();
    const start = () => {
      surface.listeners.get('pointerdown')?.(pointer(1, 100, 100));
      surface.listeners.get('pointermove')?.(pointer(1, 152, 100));
    };
    start();
    input.setControlScheme('touch');
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    input.setControlScheme('joystick');
    start();
    playing = false;
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    start(); // Ignore gestures on an overlay.
    playing = true;
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    start();
    surface.listeners.get('lostpointercapture')?.(pointer(1, 152, 100));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
    start();
    input.detach();
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
  });

  it('mantiene joystick y cancelación con Touch Events fallback', () => {
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const surface = new FakeSurface();
    const viewport = new ViewportTransform();
    viewport.resize(1280, 720, 1);
    const input = new InputManager(surface as unknown as HTMLElement, viewport,
      () => ({ x: 640, y: 360 }), undefined, 'joystick');
    input.attach();
    const event = (x: number) => {
      const touches = Object.assign([{ identifier: 3, clientX: x, clientY: 200 }], {
        item: () => ({ identifier: 3, clientX: x, clientY: 200 })
      });
      return { touches, changedTouches: touches, target: null, preventDefault: vi.fn() };
    };
    surface.listeners.get('touchstart')?.(event(100));
    surface.listeners.get('touchmove')?.(event(152));
    expect(input.getMovement()).toEqual({ x: 1, y: 0 });
    surface.listeners.get('touchcancel')?.(event(152));
    expect(input.getMovement()).toEqual({ x: 0, y: 0 });
  });

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
