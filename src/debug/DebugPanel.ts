export class DebugPanel {
  private readonly element: HTMLElement;

  public constructor(element: HTMLElement) {
    this.element = element;
  }

  public update(values: Record<string, string | number>): void {
    if (new URLSearchParams(window.location.search).get('debug') !== '1') return;
    this.element.hidden = false;
    this.element.textContent = Object.entries(values)
      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
      .join('\n');
  }
}
