interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  const audioWindow = window as AudioContextWindow;
  return window.AudioContext ?? audioWindow.webkitAudioContext;
};

const createTone = (context: AudioContext, destination: AudioNode, when: number, frequency: number): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.12, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
  oscillator.connect(gain).connect(destination);
  oscillator.start(when);
  oscillator.stop(when + 0.13);
};

export const runAudioSpike = (host: HTMLElement): (() => void) => {
  const panel = document.createElement('section');
  panel.className = 'spike-panel';
  panel.innerHTML = `
    <h1>Spike de audio móvil</h1>
    <p>Web Audio se desbloquea sólo después de una interacción. Los tonos se generan sin archivos externos.</p>
    <p id="audio-spike-status">AudioContext aún no creado.</p>
    <button type="button" id="audio-spike-unlock">Activar y reproducir SFX</button>
    <button type="button" id="audio-spike-burst" disabled>Probar ráfaga de 24 impactos</button>
    <a href="./">Volver al juego</a>
  `;
  host.appendChild(panel);

  const statusElement = panel.querySelector<HTMLElement>('#audio-spike-status');
  const unlockButton = panel.querySelector<HTMLButtonElement>('#audio-spike-unlock');
  const burstButton = panel.querySelector<HTMLButtonElement>('#audio-spike-burst');
  if (!statusElement || !unlockButton || !burstButton) throw new Error('Faltan controles del spike de audio');

  const AudioContextConstructor = getAudioContextConstructor();
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let unlockedAt = 0;

  const updateStatus = (message: string): void => {
    statusElement.textContent = message;
  };

  const unlock = async (): Promise<void> => {
    if (!AudioContextConstructor) {
      updateStatus('Este navegador no expone Web Audio. El juego debe continuar sin audio.');
      return;
    }
    context ??= new AudioContextConstructor();
    master ??= context.createGain();
    master.gain.value = 0.18;
    master.connect(context.destination);
    const startedAt = performance.now();
    try {
      await context.resume();
    } catch (error) {
      updateStatus(`No se pudo desbloquear Web Audio: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    unlockedAt = performance.now();
    createTone(context, master, context.currentTime, 520);
    const unlockDelay = unlockedAt - startedAt;
    updateStatus(
      `Estado: ${context.state} · latencia base: ${formatLatency(context.baseLatency)} · desbloqueo: ${unlockDelay.toFixed(1)} ms`
    );
    burstButton.disabled = false;
    unlockButton.textContent = 'Reproducir SFX de prueba';
  };

  const playBurst = (): void => {
    if (!context || !master) return;
    const start = context.currentTime + 0.02;
    for (let index = 0; index < 24; index += 1) {
      createTone(context, master, start + index * 0.018, 260 + (index % 6) * 55);
    }
    updateStatus(
      `Ráfaga programada: 24 voces · estado: ${context.state} · latencia base: ${formatLatency(context.baseLatency)}`
    );
  };

  const onVisibilityChange = (): void => {
    if (!context) return;
    updateStatus(`Visibilidad: ${document.visibilityState} · AudioContext: ${context.state}`);
  };

  const formatLatency = (latency: number | undefined): string =>
    typeof latency === 'number' && Number.isFinite(latency) ? `${(latency * 1000).toFixed(1)} ms` : 'n/d';

  const onUnlock = (): void => void unlock();
  const onBurst = (): void => playBurst();
  unlockButton.addEventListener('click', onUnlock);
  burstButton.addEventListener('click', onBurst);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    unlockButton.removeEventListener('click', onUnlock);
    burstButton.removeEventListener('click', onBurst);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    void context?.close();
    context = null;
    master = null;
    unlockedAt = 0;
    panel.remove();
  };
};
