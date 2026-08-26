export class DebugPanel {
  private readonly element: HTMLElement;
  private readonly enabled: boolean;

  public constructor(element: HTMLElement, alwaysVisible = false) {
    this.element = element;
    this.enabled = alwaysVisible || new URLSearchParams(window.location.search).get('debug') === '1';
  }

  public update(values: Record<string, string | number>): void {
    if (!this.enabled) return;
    this.element.hidden = false;
    this.element.textContent = Object.entries(values)
      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
      .join('\n');
  }
}
