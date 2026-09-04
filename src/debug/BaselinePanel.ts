import {
  BASELINE_TARGET_RUNS,
  BaselineRunRecorder
} from './BaselineRunRecorder';

/** Small DOM-only diagnostics panel, enabled exclusively by ?baseline=1. */
export class BaselinePanel {
  private readonly root: HTMLElement;
  private readonly count: HTMLElement;
  private readonly output: HTMLElement;
  private readonly status: HTMLElement;
  private readonly copyButton: HTMLButtonElement;
  private readonly clearButton: HTMLButtonElement;

  public constructor(root: HTMLElement, recorder: BaselineRunRecorder) {
    const count = root.querySelector<HTMLElement>('#baseline-count');
    const output = root.querySelector<HTMLElement>('#baseline-output');
    const status = root.querySelector<HTMLElement>('#baseline-status');
    const copyButton = root.querySelector<HTMLButtonElement>('#baseline-copy');
    const clearButton = root.querySelector<HTMLButtonElement>('#baseline-clear');
    if (!count || !output || !status || !copyButton || !clearButton) {
      throw new Error('Faltan elementos de la linea base');
    }
    this.root = root;
    this.count = count;
    this.output = output;
    this.status = status;
    this.copyButton = copyButton;
    this.clearButton = clearButton;
    this.copyButton.addEventListener('click', () => { void this.copyReport(recorder); });
    this.clearButton.addEventListener('click', () => {
      recorder.clear();
      this.status.textContent = 'Datos borrados en este dispositivo.';
      this.render(recorder);
    });
  }

  public render(recorder: BaselineRunRecorder): void {
    this.root.hidden = false;
    this.count.textContent = `${recorder.records.length}/${BASELINE_TARGET_RUNS} runs`;
    this.output.textContent = recorder.report();
  }

  private async copyReport(recorder: BaselineRunRecorder): Promise<void> {
    const report = recorder.report();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else if (typeof document !== 'undefined') {
        const helper = document.createElement('textarea');
        helper.value = report;
        helper.setAttribute('readonly', 'true');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      } else {
        throw new Error('Clipboard unavailable');
      }
      this.status.textContent = 'Reporte copiado.';
    } catch {
      this.status.textContent = 'No se pudo copiar; mantén pulsado el reporte para seleccionarlo.';
    }
  }
}
