export type ResumeHandler = () => void;

export class PauseOverlay {
  private readonly root: HTMLElement;
  private readonly messageElement: HTMLElement;
  private readonly resumeButton: HTMLButtonElement;
  private resumeHandler: ResumeHandler | null = null;

  public constructor(root: HTMLElement) {
    const messageElement = root.querySelector<HTMLElement>('#pause-message');
    const resumeButton = root.querySelector<HTMLButtonElement>('#pause-resume');
    if (!messageElement || !resumeButton) throw new Error('Faltan elementos de pausa');
    this.root = root;
    this.messageElement = messageElement;
    this.resumeButton = resumeButton;
    this.resumeButton.addEventListener('click', () => this.resumeHandler?.());
  }

  public open(message: string, resumeHandler: ResumeHandler): void {
    this.messageElement.textContent = message;
    this.resumeHandler = resumeHandler;
    this.root.hidden = false;
    this.resumeButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.root.hidden = true;
    this.resumeHandler = null;
  }
}
