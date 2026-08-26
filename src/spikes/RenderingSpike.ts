import { Application, Container, Graphics, GraphicsContext, Sprite } from 'pixi.js';

const ENTITY_COUNT = 500;
const PHASE_SECONDS = 5;
const WARMUP_SECONDS = 1;

type RenderingVariant = 'sprite' | 'graphics-context' | 'sprite-pool';

interface PhaseResult {
  readonly variant: RenderingVariant;
  readonly averageFrameMs: number;
  readonly p95FrameMs: number;
  readonly averageFps: number;
  readonly measuredFrames: number;
}

const VARIANT_LABELS: Record<RenderingVariant, string> = {
  sprite: 'Sprite compartido',
  'graphics-context': 'GraphicsContext compartido',
  'sprite-pool': 'Sprite pool (reutilizado)'
};

const formatNumber = (value: number): string => value.toFixed(2);

const createSpriteTexture = (app: Application) => {
  const template = new Graphics()
    .circle(0, 0, 7)
    .fill({ color: 0x75e6ff })
    .stroke({ color: 0xf4ffff, width: 2 });
  const texture = app.renderer.generateTexture({
    target: template,
    resolution: 1,
    antialias: false,
    defaultAnchor: { x: 0.5, y: 0.5 }
  });
  template.destroy();
  return texture;
};

const placeEntity = (entity: Sprite | Graphics, index: number, elapsedSeconds: number): void => {
  const orbit = 170 + (index % 25) * 8;
  const baseAngle = index * 2.399963229728653 + elapsedSeconds * (0.35 + (index % 7) * 0.025);
  entity.position.set(
    640 + Math.cos(baseAngle) * orbit + Math.cos(baseAngle * 0.37) * 35,
    360 + Math.sin(baseAngle) * orbit + Math.sin(baseAngle * 0.29) * 35
  );
};

const clearEntities = (scene: Container, entities: Array<Sprite | Graphics>): void => {
  for (const entity of entities) {
    scene.removeChild(entity);
    if (entity instanceof Graphics) entity.destroy({ context: false });
    else entity.destroy();
  }
  entities.length = 0;
};

const createEntities = (
  variant: RenderingVariant,
  scene: Container,
  texture: ReturnType<Application['renderer']['generateTexture']>
): { entities: Array<Sprite | Graphics>; context: GraphicsContext | null } => {
  const entities: Array<Sprite | Graphics> = [];
  const context = variant === 'graphics-context'
    ? new GraphicsContext()
      .circle(0, 0, 7)
      .fill({ color: 0x75e6ff })
      .stroke({ color: 0xf4ffff, width: 2 })
    : null;

  for (let index = 0; index < ENTITY_COUNT; index += 1) {
    const entity = context ? new Graphics({ context }) : new Sprite(texture);
    if (entity instanceof Sprite) entity.anchor.set(0.5);
    placeEntity(entity, index, 0);
    entities.push(entity);
    scene.addChild(entity);
  }

  return { entities, context };
};

const summarize = (variant: RenderingVariant, frameTimes: number[]): PhaseResult => {
  const sorted = [...frameTimes].sort((left, right) => left - right);
  const total = frameTimes.reduce((sum, value) => sum + value, 0);
  const averageFrameMs = total / frameTimes.length;
  const p95FrameMs = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  return {
    variant,
    averageFrameMs,
    p95FrameMs,
    averageFps: 1000 / averageFrameMs,
    measuredFrames: frameTimes.length
  };
};

export const runRenderingSpike = (app: Application, host: HTMLElement): (() => void) => {
  const scene = new Container();
  const texture = createSpriteTexture(app);
  const panel = document.createElement('section');
  panel.className = 'spike-panel';
  panel.innerHTML = `
    <h1>Spike de representación</h1>
    <p>500 entidades, misma trayectoria determinista por variante. Se descarta el primer segundo de calentamiento.</p>
    <p id="rendering-spike-phase">Preparando…</p>
    <pre id="rendering-spike-results">Aún no hay mediciones.</pre>
    <button type="button" id="rendering-spike-restart">Repetir benchmark</button>
    <a href="./">Volver al juego</a>
  `;
  host.appendChild(panel);
  app.stage.addChild(scene);

  const phaseElement = panel.querySelector<HTMLElement>('#rendering-spike-phase');
  const resultsElement = panel.querySelector<HTMLElement>('#rendering-spike-results');
  const restartButton = panel.querySelector<HTMLButtonElement>('#rendering-spike-restart');
  if (!phaseElement || !resultsElement || !restartButton) throw new Error('Faltan controles del spike de rendering');

  let entities: Array<Sprite | Graphics> = [];
  let context: GraphicsContext | null = null;
  let variantIndex = 0;
  let phaseStartedAt = performance.now();
  let frameTimes: number[] = [];
  let results: PhaseResult[] = [];
  let nextBaselineRecycleAt = 0.75;
  let running = true;

  const startPhase = (): void => {
    clearEntities(scene, entities);
    context?.destroy();
    context = null;
    const variant = (['sprite', 'graphics-context', 'sprite-pool'] as RenderingVariant[])[variantIndex];
    const created = createEntities(variant, scene, texture);
    entities = created.entities;
    context = created.context;
    phaseStartedAt = performance.now();
    frameTimes = [];
    nextBaselineRecycleAt = 0.75;
    phaseElement.textContent = `Midiendo ${VARIANT_LABELS[variant]} (${variantIndex + 1}/3)…`;
  };

  const renderResults = (): void => {
    resultsElement.textContent = results.length === 0
      ? 'Aún no hay mediciones.'
      : results.map((result) => [
        VARIANT_LABELS[result.variant],
        `FPS medio: ${formatNumber(result.averageFps)}`,
        `frame medio: ${formatNumber(result.averageFrameMs)} ms`,
        `p95 frame: ${formatNumber(result.p95FrameMs)} ms`,
        `frames medidos: ${result.measuredFrames}`
      ].join(' | ')).join('\n');
  };

  const restart = (): void => {
    variantIndex = 0;
    results = [];
    renderResults();
    startPhase();
  };

  const tickerHandler = (ticker: { deltaMS: number }): void => {
    if (!running) return;
    const elapsed = (performance.now() - phaseStartedAt) / 1000;
    const variant = (['sprite', 'graphics-context', 'sprite-pool'] as RenderingVariant[])[variantIndex];
    if (variant === 'sprite' && elapsed >= nextBaselineRecycleAt && elapsed < PHASE_SECONDS) {
      // Baseline intentionally recreates the same 500 display objects. This
      // exposes the allocation/GC cost that the pool variant is meant to avoid.
      clearEntities(scene, entities);
      entities = createEntities(variant, scene, texture).entities;
      nextBaselineRecycleAt += 0.75;
    }
    for (let index = 0; index < entities.length; index += 1) {
      placeEntity(entities[index], index, elapsed);
    }
    if (elapsed >= WARMUP_SECONDS && frameTimes.length < 600) frameTimes.push(ticker.deltaMS);
    if (elapsed < PHASE_SECONDS) return;

    if (frameTimes.length > 0) results.push(summarize(variant, frameTimes));
    renderResults();
    variantIndex += 1;
    if (variantIndex < 3) startPhase();
    else phaseElement.textContent = 'Benchmark terminado. Repite en el mismo dispositivo y preset para comparar.';
  };

  restartButton.addEventListener('click', restart, { passive: true });
  app.ticker.add(tickerHandler);
  startPhase();

  return () => {
    running = false;
    app.ticker.remove(tickerHandler);
    restartButton.removeEventListener('click', restart);
    clearEntities(scene, entities);
    context?.destroy();
    scene.destroy();
    texture.destroy(true);
    panel.remove();
  };
};
