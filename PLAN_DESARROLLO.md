# GEOMETRY SURVIVOR — EVALUACIÓN Y PLAN DE DESARROLLO

> Estado: plan base aprobado para iniciar el proyecto.
>
> Fecha de revisión de documentación externa: 2026-08-25.
>
> Fuente de visión: [proyecto.md](proyecto.md). Si ambos documentos difieren, este archivo manda en decisiones de ejecución y `proyecto.md` manda en la visión del juego.

---

# 1. VEREDICTO

El planteamiento es bueno y viable para un equipo pequeño o desarrollo asistido por IA. La combinación de geometría, autoataque, control con un dedo y partidas cortas encaja especialmente bien con navegador y móvil. TypeScript + Vite + PixiJS 8 es una elección adecuada y no conviene cambiarla antes de construir el vertical slice.

Las mejores decisiones del planteamiento actual son:

- identidad visual alcanzable sin una gran producción de arte;
- control centrado en movimiento, adecuado para touch;
- contenido data-driven;
- separación entre simulación, presentación y plataformas;
- prioridad explícita a rendimiento móvil;
- vertical slice pequeño antes de producir muchas armas o enemigos;
- arena circular y hazards como posible elemento diferenciador.

El documento original no necesita más ideas: necesita menos ambigüedad. Mezcla visión, arquitectura, reglas de código, pipeline artístico, futuras herramientas y tareas para agentes en 134 secciones. Esto puede inducir a construir infraestructura antes de demostrar que el juego es divertido.

Por tanto, la decisión es:

1. conservar `proyecto.md` como visión y catálogo de principios;
2. usar este archivo como hoja de ruta ejecutable;
3. construir primero un vertical slice de una sola partida de 5–6 minutos;
4. crear desde la Fase 0 solo las skills base portátiles y aplazar las skills especializadas hasta que exista un workflow real que las necesite;
5. no producir contenido adicional hasta superar las puertas de diversión, responsive y rendimiento.

---

# 2. CORRECCIONES NECESARIAS AL PLANTEAMIENTO

## 2.1 Falta un gancho jugable reconocible

“Survivor de figuras geométricas” es una buena identidad visual, pero todavía no garantiza diferenciación en Poki o CrazyGames. El gancho recomendado para el MVP es:

> **La arena es un sistema vivo:** las subidas importantes la cargan, la hacen resonar y la expanden; su borde origina hazards, anticipa fases y modifica el espacio disponible.

Esto reutiliza sistemas ya planeados y no exige grandes recursos. Para el vertical slice:

- la arena crece en pasos discretos, no de forma imperceptible;
- cada expansión tiene una onda visual y sonora clara;
- el láser nace o se anuncia desde el borde;
- el boss utiliza la arena como parte de sus patrones;
- la frontera comunica el próximo cambio mediante color y pulsos.

Esta es una hipótesis que debe validarse jugando. Si el borde sigue sintiéndose decorativo, habrá que reforzar el gancho antes de añadir contenido.

## 2.2 El crecimiento de arena necesita reglas de cámara

No se intentará mostrar siempre la arena completa. Si la cámara se aleja continuamente, el jugador, el texto y los enemigos terminarán demasiado pequeños en móvil.

Regla para el MVP:

- la cámara mantiene una escala jugable constante;
- sigue al jugador con suavizado muy corto y sin retraso molesto;
- la arena inicial puede verse casi completa;
- al crecer, partes del borde pueden quedar fuera de pantalla;
- hazards importantes fuera de pantalla deben tener indicador direccional;
- ninguna expansión puede cambiar la escala de controles, colisiones o UI.

## 2.3 Pooling y estructuras compactas no son obligatorios para todo

Existe una tensión en `proyecto.md`: se pide evitar optimización prematura, pero también crear pools para casi todas las entidades desde el inicio.

Resolución:

- proyectiles, partículas y números de daño: diseñados para pool desde el vertical slice;
- la experiencia se acredita al derrotar al enemigo; el MVP no usa pickups físicos de XP porque la arena cerrada puede dejarlos fuera del alcance;
- enemigos: almacenamiento sencillo y pool solo si el perfil muestra pausas de GC;
- typed arrays / Structure of Arrays: se adoptan únicamente si el perfil de CPU o memoria lo justifica;
- todas las APIs de entidad deben permitir cambiar la representación interna sin afectar al contenido.

## 2.4 La integración de plataforma debe separarse del guardado

Poki sincroniza automáticamente ciertos datos de `localStorage` e IndexedDB; CrazyGames ofrece su propio Data Module. Por eso `GamePlatform.save(data)` es demasiado simple y mezcla responsabilidades.

Se usarán tres contratos pequeños:

```ts
interface PlatformLifecycle {
  init(): Promise<void>;
  loadingStart(): void;
  loadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
}

interface AdService {
  commercialBreak(): Promise<"shown" | "skipped" | "error">;
  rewardedBreak(): Promise<"reward" | "no-reward" | "error">;
}

interface SaveStore {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
}
```

`Local`, `Poki` y `CrazyGames` proporcionarán adaptadores. Gameplay nunca importará un SDK externo.

## 2.5 Faltaban requisitos comerciales importantes

Desde el primer día el juego debe:

- incluir inglés y usarlo como fallback;
- mantener textos en claves de localización, no hardcodeados;
- ser apto para PEGI 12;
- funcionar sin enlaces externos, publicidad propia ni Google Fonts;
- entrar a gameplay inmediatamente o con un solo clic;
- guardar ajustes y progreso con un esquema versionado;
- evitar un botón propio de fullscreen en el build de CrazyGames;
- funcionar si anuncios o guardado de plataforma fallan.

---

# 3. ALCANCE CERRADO DEL VERTICAL SLICE

El objetivo no es “hacer el juego”. Es probar que su núcleo merece crecer.

## Incluido

- una partida completa de 5–6 minutos;
- jugador con movimiento por teclado, mouse-drag y touch-drag;
- una arena circular con dos expansiones visibles;
- tres enemigos: Chaser, Fast y Tank;
- tres armas: Projectile, Orbit y Chain Lightning;
- un hazard: Laser;
- un elite como variante de un enemigo existente;
- un boss con dos patrones;
- XP, subida de nivel y tres cartas;
- alrededor de 10–12 mejoras;
- pausa, game over, reinicio y mejor tiempo/puntuación;
- audio y FX suficientes para evaluar game feel;
- calidad Low/Medium/High seleccionable;
- build `local` desplegado en GitHub Pages;
- adaptadores de plataforma simulados, aún sin monetización real.

## No incluido

- metaprogresión extensa;
- múltiples personajes;
- logros, cuentas o compras;
- multijugador;
- más de un boss;
- seis armas completas;
- composición procedural de cientos de assets;
- shaders complejos;
- backend;
- analítica externa;
- PWA o service worker;
- más layouts específicos por dispositivo; portrait jugable ya está fijado como orientación primaria;
- localización completa más allá de inglés y, si resulta barato, español.

## Criterio de éxito del vertical slice

Se continúa la producción solo si se cumplen las cuatro condiciones:

1. un jugador nuevo entiende cómo moverse en menos de 10 segundos;
2. la primera mejora aparece antes de que la experiencia se vuelva repetitiva;
3. al menos dos builds producen decisiones y sensaciones claramente diferentes;
4. el juego mantiene su legibilidad y rendimiento en las pruebas objetivo.

---

# 4. STACK APROBADO

## Decisión

- TypeScript con `strict: true`.
- Vite, con versiones exactas fijadas en el lockfile.
- PixiJS 8, renderer WebGL como preferencia inicial.
- HTML/CSS para pantallas, cartas y overlays donde aporte mejor responsive y accesibilidad.
- PixiJS para mundo, arena, proyectiles, enemigos y FX.
- Vitest para lógica pura.
- Playwright en CI para smoke tests reales de navegador y redimensionado.
- Web Audio detrás de `AudioService`; evaluar Howler solo si el spike de Safari/iOS demuestra que ahorra complejidad real.

## Razones

- Vite produce builds estáticos compatibles con GitHub Pages y bundles de plataforma.
- PixiJS permite sprites eficientes, geometría dinámica, caché de assets y control explícito de resolución.
- WebGL tiene una base móvil más predecible para este proyecto que adoptar WebGPU como renderer principal.
- La UI DOM reduce trabajo para safe areas, botones táctiles y escalado de texto.

## Reglas de dependencia

- no cargar librerías desde CDN;
- no usar Google Fonts ni assets remotos;
- cada build incluye todo excepto el SDK permitido por su plataforma;
- `package-lock.json` se versiona;
- no instalar una dependencia para resolver una utilidad pequeña;
- no usar un framework de UI durante el vertical slice.

---

# 5. ARQUITECTURA EJECUTABLE

```text
CONTENT ───────► SIMULATION ───────► SNAPSHOT / EVENTS
                       ▲                    │
INPUT ─────────────────┘                    ▼
                                      PRESENTATION
                                      Pixi + UI + Audio

PLATFORM ADAPTERS ─────► LIFECYCLE / ADS / SAVE
```

## 5.1 Capas

### Core

Código puro y estable: loop, reloj, RNG con semilla, eventos tipados y utilidades matemáticas. No conoce Pixi, DOM ni SDKs.

### Simulation

Estado y reglas: jugador, enemigos, armas, proyectiles, daño, XP, arena y director. Trabaja en unidades lógicas, no píxeles físicos.

### Content

Definiciones tipadas y validadas. Añadir una variante común no debe exigir modificar el motor.

### Presentation

Sincroniza la simulación con Pixi, reproduce animaciones y efectos. Puede interpolar, pero nunca decide daño, drops o dificultad.

### UI

Lee un view model y emite comandos (`chooseUpgrade`, `pause`, `restart`). No modifica sistemas internos directamente.

### Platform

Implementa lifecycle, anuncios, dispositivo y guardado para cada destino. Un error del SDK se convierte en un resultado controlado; nunca bloquea el juego indefinidamente.

## 5.2 Estructura inicial

Crear carpetas cuando tengan código real, no todas de una vez:

```text
src/
├── main.ts
├── app/
│   ├── createGame.ts
│   └── Game.ts
├── core/
│   ├── GameLoop.ts
│   ├── Clock.ts
│   ├── Random.ts
│   └── GameEvents.ts
├── simulation/
│   ├── World.ts
│   ├── GameState.ts
│   ├── arena/
│   ├── combat/
│   ├── enemies/
│   ├── progression/
│   └── spatial/
├── content/
│   ├── enemies/
│   ├── weapons/
│   ├── upgrades/
│   └── run/
├── presentation/
│   ├── pixi/
│   ├── fx/
│   └── viewport/
├── input/
├── audio/
├── ui/
├── platform/
│   ├── local/
│   ├── poki/
│   └── crazygames/
├── save/
└── config/
```

## 5.3 Game loop

- simulación fija a 60 Hz con acumulador;
- render con `requestAnimationFrame` e interpolación;
- delta máximo limitado después de volver de una pestaña oculta;
- máximo de pasos de recuperación por frame para evitar “spiral of death”;
- IA, targeting y spawns pueden usar frecuencias menores mediante scheduler;
- RNG con semilla para repetir bugs y pruebas;
- pausar simulación al abrir cartas, pausa manual, anuncio o pérdida de visibilidad;
- el resize nunca reinicia la simulación.

## 5.4 Estado explícito

```text
BOOT
  ↓
LOADING
  ↓
READY
  ↓ primer input
PLAYING ─────► LEVEL_UP ─────► PLAYING
   │               │
   ├──────────────► PAUSED
   │
   └──────────────► RUN_END ─────► RESTART / MENU
```

Los eventos de plataforma se derivan de transiciones de estado y deben ser idempotentes. Nunca se envían dos `gameplayStart` o dos `gameplayStop` consecutivos.

## 5.5 Colisiones y datos

- colisiones del MVP: círculos y segmentos simples, independientes de la forma visual;
- uniform spatial grid para targeting, proyectiles, AoE y separación suave;
- consultas reutilizan buffers para no crear arrays cada frame;
- proyectiles y partículas usan pools de capacidad limitada;
- los límites de cada pool se exponen en el HUD de debug;
- si el pool se llena, se recicla o descarta un FX de baja prioridad; nunca se bloquea el juego.

---

# 6. RESPONSIVE SIN ALTERAR GAMEPLAY

“Que cambiar el tamaño no afecte en nada” se implementará como invariancia de simulación: el tamaño físico cambia, pero posiciones, velocidades, colisiones, dificultad y cámara lógica no.

## 6.1 Tres espacios de coordenadas

```text
WORLD SPACE
unidades de simulación; nunca depende del navegador
        ↓ cámara
LOGICAL VIEWPORT
720 × 1280 en portrait / 1280 × 720 en landscape
la simulación conserva el mundo 1280 × 720
        ↓ escala uniforme + offset
CSS / DEVICE PIXELS
tamaño real del iframe y DPR limitado
```

## 6.2 Estrategia

1. El canvas ocupa siempre el 100% del contenedor real.
2. La escena usa referencia lógica 720×1280 en portrait y 1280×720 en landscape.
3. Se calcula `scale = min(containerWidth / logicalWidth, containerHeight / logicalHeight)`.
4. La escena se centra mediante offsets; en portrait el mundo 1280×720 recibe un offset interno para que la arena siga siendo grande y jugable.
5. El área sobrante muestra fondo decorativo, nunca información o gameplay adicional.
6. El HUD vive dentro de la zona lógica y respeta `env(safe-area-inset-*)`.
7. El input convierte `clientX/clientY` a coordenadas lógicas usando exactamente la misma matriz.
8. Un `ResizeObserver` actualiza renderer, matriz, hit areas y UI una sola vez por frame.
9. DPR de render se limita por calidad; no se usa sin límite el DPR nativo.

Esta estrategia mantiene la misma porción útil del mundo en todos los tamaños. Una pantalla ultra-wide no obtiene ventaja y una ventana pequeña no pierde objetivos importantes.

## 6.3 Orientación

- portrait es la experiencia primaria para móvil;
- la presentación portrait usa un viewport lógico 720×1280 y centra el mundo de simulación 1280×720, sin deformarlo ni alterar sus velocidades o colisiones;
- landscape usa un viewport lógico 1280×720 y aprovecha pantallas de PC, tablet y portales de escritorio;
- no se implementa orientation lock ni se obliga a girar el dispositivo;
- el mismo `ViewportTransform` convierte render e input en ambas orientaciones;
- si una expansión futura deja hazards fuera de la franja visible en portrait, debe añadir indicadores direccionales en vez de conceder información extra.

## 6.4 CSS y navegador

La shell deberá usar:

- `width: 100%`, `height: 100%` y `100dvh` donde corresponda;
- `overflow: hidden` y `overscroll-behavior: none`;
- `touch-action: none` sobre la superficie jugable;
- `user-select: none` y prefijos necesarios;
- canvas `display: block`;
- `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">`;
- prevención de scroll por flechas, espacio y rueda mientras el juego posee el input;
- manejo de `pointercancel`, `visibilitychange`, blur, audio suspendido y retorno desde anuncio.

## 6.5 Controles

- touch y mouse usan un joystick dinámico: presionar/arrastrar crea un origen, mover genera vector, soltar detiene;
- no depende de un botón fijo pequeño;
- teclado acepta WASD, flechas y contempla layouts no QWERTY;
- `InputManager` entrega solo un `movementVector` normalizado;
- la selección de cartas usa targets táctiles amplios y no comparte gestos con movimiento;
- el primer input desbloquea audio e inicia el estado `PLAYING`.

## 6.6 Matriz mínima de resize

Probar automáticamente y de forma manual:

- 640×360, 836×470 y 1031×580;
- 821×462, 907×510, 1077×606 y 1216×684;
- 1280×720, 1366×768, 1536×864 y 1920×1080;
- 800×450 móvil landscape y 1080×607 tablet;
- portrait jugable en 360×640, 390×844 y 412×915;
- DPR reportado 1, 1.5, 2 y 3, comprobando el límite interno;
- resize durante gameplay, level-up, pausa, game over y retorno de un anuncio simulado.

### Puerta de aceptación

- no se reinicia ni altera la partida;
- no cambia la proporción ni la velocidad percibida;
- no se desalinean puntero y hitboxes;
- no se corta HUD, jugador ni una carta;
- no aparece scroll, selección de texto ni zoom accidental;
- no hay un frame negro persistente;
- el canvas no supera el presupuesto de memoria por un DPR excesivo.

---

# 7. DISEÑO DE LA PRIMERA PARTIDA

Los tiempos siguientes son hipótesis de balance, no reglas finales:

| Tiempo | Contenido | Objetivo |
|---|---|---|
| 0:00–0:20 | movimiento inmediato, Chaser y autoataque | entender sin tutorial textual |
| 0:20–1:00 | primer level-up, aparecen Fast | primera decisión y sensación de crecimiento |
| 1:00–1:40 | primera resonancia/expansión y telegraph del Laser | presentar el gancho de arena |
| 1:40–3:00 | Tank y mezclas de enemigos | obligar a priorizar targets y rutas |
| 3:00–4:20 | elite, segunda expansión y lasers combinados | caos controlado |
| 4:20–5:40 | boss de dos patrones | examen de movimiento y build |
| final | resumen, mejor resultado y reinicio rápido | provocar “otra partida” |

## 7.1 Armas del slice

### Projectile

Arma inicial, clara y fiable. Prueba targeting, colisión, piercing y velocidad.

### Orbit

Recompensa acercarse y moverse alrededor de grupos. No debe permitir quedarse quieto sin riesgo.

### Chain Lightning

Recompensa densidad y demuestra el spatial grid. El salto visual debe ser inmediato y legible.

Cada arma necesita al menos dos rutas perceptiblemente distintas, no solo `+10% damage`. Ejemplos:

- Projectile: piercing frente a split;
- Orbit: más satélites frente a mayor radio/velocidad;
- Chain: más saltos frente a descarga de alto daño y menos objetivos.

## 7.2 Mejoras

El pool inicial será de 10–12 mejoras:

- adquisición de Orbit;
- adquisición de Chain Lightning;
- dos transformaciones de Projectile;
- dos transformaciones de Orbit;
- dos transformaciones de Chain;
- velocidad de movimiento;
- vida/armadura;
- radio de recogida;
- una mejora de crítico o cadencia global.

La carta debe mostrar “antes → después” cuando cambie una cifra. No ofrecer una adquisición ya obtenida ni una mejora que no pueda aplicarse.

## 7.3 Director

El director usa una línea de tiempo y presupuesto de spawn, no adaptación secreta a la habilidad del jugador durante el MVP. Debe ser reproducible con semilla.

- cada enemigo tiene coste;
- cada fase tiene presupuesto, mezcla permitida y límite simultáneo;
- existen pequeños valles de intensidad antes de expansión y boss;
- el aumento proviene primero de composición y patrones, después de HP;
- los hazards tienen telegraph, ataque y recovery separados.

## 7.4 Boss

Un boss es suficiente. Debe reutilizar el lenguaje geométrico y probar dos habilidades:

1. barrido o línea láser anunciada desde la arena;
2. anillo/ondas con huecos seguros.

No añadir fases narrativas, cinemática larga ni proyectiles nuevos si los sistemas existentes pueden expresar el patrón.

---

# 8. RENDERING Y PIPELINE SVG

## Regla principal

SVG es el master editable, no la representación obligatoria en runtime.

| Caso | Representación inicial |
|---|---|
| cientos de enemigos/proyectiles repetidos | textura + Sprite |
| partículas masivas | sprite pool; evaluar ParticleContainer |
| borde de arena y warnings dinámicos | Pixi Graphics / mesh simple |
| shape simple repetida y escalable | GraphicsContext compartido, solo si mide bien |
| cartas, botones e iconos de pantallas | HTML/CSS + SVG |
| asset complejo | rasterizado en build y atlas |

PixiJS 8 puede cargar SVG como textura o convertirlo a `GraphicsContext`, pero no admite igualmente todas las características: texto, filtros y patrones tienen limitaciones. Por ello:

- no parsear SVG complejo durante gameplay;
- no usar blur SVG, drop shadows, patrones o texto dentro del SVG runtime;
- preferir formas básicas, fills, strokes y gradientes limitados;
- reutilizar contextos/texturas;
- no reconstruir `Graphics` cada frame;
- preparar atlas después de que el lenguaje visual se estabilice;
- validar visualmente cualquier optimización SVGO.

En PixiJS 8, cada arco, curva o grupo de líneas visualmente independiente debe iniciar un subpath explícito con `beginPath()` o `moveTo()`. No se permite depender del punto activo que `fill()`/`stroke()` conserva, porque puede producir una diagonal desde `(0,0)` o desde la figura anterior. El procedimiento y la regresión obligatoria viven en [geometry-survivor-rendering](skills/geometry-survivor-rendering/SKILL.md#subpaths-independientes-en-pixijs-8).

## Presupuesto visual

La prioridad de render es:

```text
HAZARD CRÍTICO > PLAYER > BOSS > ENEMIGOS > ARMAS > XP > FX > FONDO
```

Si se supera un límite:

1. descartar partículas ambientales;
2. reducir trails;
3. agrupar u ocultar números de daño;
4. reducir glow;
5. nunca ocultar telegraphs, enemigos o ataques reales.

---

# 9. RENDIMIENTO Y PRESUPUESTOS

Los números son puertas de ingeniería iniciales y se ajustarán con medición.

## Descarga

- objetivo de descarga inicial comprimida: **≤ 5 MB**;
- puerta Poki: **< 8 MB** inicial;
- puerta CrazyGames móvil: **≤ 20 MB** inicial;
- build completo del MVP: objetivo **≤ 15 MB**;
- todos los paths relativos;
- música y contenido no necesario se cargan después del primer estado jugable;
- Vite genera nombres con hash; no añadir service worker al MVP.

## Runtime

- objetivo: 60 FPS;
- mínimo jugable: 30 FPS sin variar reglas o velocidad;
- sin pausas de GC visibles durante combate normal;
- Low debe priorizar estabilidad sobre nitidez;
- DPR inicial propuesto: Low 1.0, Medium 1.25, High 1.5;
- antialias y filtros caros apagados en Low;
- audio simultáneo limitado y sonidos repetidos con cooldown.

## Carga de stress

Puerta mínima del slice en calidad Low:

- 250 enemigos;
- 300 proyectiles;
- experiencia acreditada directamente en cada baja, sin entidades de pickup;
- 150 partículas/FX activos;
- spatial queries y daño funcionando, no solo objetos decorativos.

La meta 500 enemigos / 600 proyectiles de `proyecto.md` es un escenario de stress, no la densidad obligatoria de la partida.

## Adaptive quality

Fase inicial:

- selector manual y preset basado en dispositivo;
- HUD de métricas con media y percentiles de frame time;
- no cambiar calidad por un frame lento.

Fase posterior:

- degradar tras varios segundos bajo el umbral;
- aplicar histéresis para no oscilar;
- subir calidad solo fuera de combate o en una nueva sesión;
- nunca cambiar reglas de gameplay.

---

# 10. AUDIO

- desbloquear AudioContext en el primer input;
- `AudioService` independiente del gameplay;
- grupos `music`, `sfx`, `ui` con mute y volumen persistentes;
- límite de voces global y límite por sonido;
- variación ligera de pitch para impactos repetidos;
- prioridad: telegraph/boss/player damage > arma > feedback de experiencia > ambiente;
- pausar o mutear solo cuando el anuncio realmente comienza;
- restaurar audio ante `touchend`, retorno de background y fin/error de anuncio;
- no iniciar música automática antes de interacción.

---

# 11. GUARDADO

El vertical slice guarda:

- versión del schema;
- ajustes de audio, controles y calidad;
- mejor tiempo/puntuación;
- tutorial visto;
- metaprogresión solo cuando exista realmente.

No se guardará una run activa inicialmente. El payload objetivo será menor de 20 KB y nunca se guardará cada frame.

Adaptadores:

- Local: `localStorage` con `try/catch` y fallback en memoria;
- Poki: almacenamiento local compatible con su sincronización automática;
- CrazyGames: Data Module para guest y usuario conectado;
- migraciones explícitas entre versiones;
- un fallo al cargar produce defaults seguros, no pantalla infinita.

---

# 12. BUILDS Y GITHUB PAGES

Se generan tres builds, porque mezclar SDKs incumpliría restricciones y complicaría QA:

```text
npm run build:local
npm run build:poki
npm run build:crazygames
```

La selección será de build (`VITE_PLATFORM` o equivalente), no una detección frágil repartida por el juego.

## Local / GitHub Pages

- no carga SDK externo;
- usa anuncios simulados con éxito, cancelación, demora y error;
- permite presets mediante query string, por ejemplo `?stress=1` (el panel técnico se muestra automáticamente);
- permite `?boss=1` como escenario de desarrollo: inicia el reloj en el umbral oficial del boss y sincroniza la arena late game, sin modificar la URL normal ni el balance;
- muestra versión/commit en el HUD de debug;
- usa `base: "./"` para paths relativos y compatibilidad con subruta/zip;
- GitHub Actions ejecuta verificación y publica únicamente `dist/local`.

## Limitación importante

GitHub Pages sirve para probar gameplay, responsive, audio, carga y persistencia local. No reproduce de forma fiable:

- anuncios reales;
- callbacks reales de plataforma;
- restricciones de red de Poki;
- layout final y SDK habilitado de CrazyGames;
- cloud save real;
- comportamiento exacto dentro de sus iframes/apps.

Antes de publicar, es obligatorio probar el mismo build en:

- Poki Inspector;
- CrazyGames Preview Tool.

Esto también puede hacerse desde navegador subiendo el bundle; no obliga a jugar habitualmente desde un servidor local.

## Workflow de GitHub Actions

Cada push a la rama principal:

1. instala con `npm ci`;
2. ejecuta typecheck;
3. ejecuta unit tests;
4. valida contenido y SVG;
5. construye los tres destinos;
6. falla si excede presupuestos de tamaño;
7. ejecuta smoke tests de navegador y resize sobre `dist/local`;
8. publica `dist/local` en GitHub Pages si todo pasa.

El deploy no debe ocurrir si falla una puerta. GitHub Pages es el entorno de revisión del juego, no el host comercial final.

---

# 13. INTEGRACIÓN POKI Y CRAZYGAMES

## Compatibilidad comercial

El proyecto se prepara técnicamente para ambas plataformas, pero esto no garantiza que cualquier acuerdo de distribución permita publicarlo en las dos. Poki describe acuerdos **Web Exclusive** y **Non-Exclusive**. Si el objetivo sigue siendo Poki + CrazyGames, no aceptar exclusividad web sin confirmar por escrito que la distribución prevista es compatible. Esta decisión contractual debe resolverse antes de la submission, no antes del vertical slice.

## Poki

- `gameplayStart` ocurre con el primer input real y al reanudar;
- `gameplayStop` en pausa, level-up, fin de run, menú o interrupción jugable;
- no duplicar eventos consecutivos;
- `commercialBreak` solo en cortes naturales antes de volver a jugar;
- `rewardedBreak` concede premio únicamente con éxito;
- no bloquear el juego por adblock;
- empaquetar fonts, assets y librerías; sin requests externos innecesarios;
- comprobar modo incógnito;
- no mostrar splash, links salientes ni anuncios de terceros.

## CrazyGames

- usar SDK HTML5 v3 e inicialización asíncrona;
- fuera de localhost/CrazyGames, el SDK está deshabilitado: GitHub Pages usa LocalAdapter;
- `gameplayStart`/`gameplayStop` siguen estados jugables, pero el SDK gestiona por sí mismo cambios de foco;
- no mostrar fullscreen propio;
- inglés obligatorio y contenido PEGI 12;
- en Basic Launch los anuncios están desactivados y el juego debe continuar correctamente;
- en Full Launch, pausar input/simulación durante solicitud y anuncio;
- mutear al recibir `adStarted`, restaurar en fin o error;
- no mostrar banners durante gameplay.

## Monetización recomendada

No integrar anuncios hasta que la run sea divertida.

Primeros puntos naturales:

- anuncio comercial tras game over y antes de reiniciar, si la plataforma lo decide;
- opcional rewarded revive una vez por run, con alternativa clara de terminar/reiniciar;
- opcional reroll fuera de gameplay, solo después de validar que no degrada las elecciones.

No mostrar anuncio:

- en el primer minuto;
- al abrir una carta normal de level-up;
- durante un telegraph o boss;
- por abrir pausa, opciones o menú;
- al mismo tiempo que una oferta rewarded.

---

# 14. ESTRATEGIA DE PRUEBAS SIN DEPENDER DEL PC

## Automatizadas en GitHub

### Unitarias

- daño y críticos;
- cooldowns;
- spatial grid;
- targeting y chain jumps;
- selección de upgrades válida;
- director con semilla;
- límites de arena;
- migraciones de guardado;
- transiciones de estado y eventos de SDK sin duplicados.

### Browser smoke

- carga hasta READY;
- primer pointer inicia gameplay;
- movimiento por teclado y pointer;
- abrir/elegir level-up;
- pausar y reanudar;
- simular anuncio success/error;
- perder contexto/foco y regresar;
- redimensionar por toda la matriz mínima;
- comprobar que no hay excepciones de consola ni requests 404.

### Visual regression limitada

Capturas de:

- gameplay inicial;
- arena expandida;
- level-up;
- laser telegraph;
- game over;
- gameplay portrait;
- presets Low y High.

No bloquear por diferencias de partículas aleatorias: usar semilla y desactivar animación no determinista en snapshots.

## Manuales desde móvil

En cada hito jugable:

1. abrir GitHub Pages en al menos un Android real;
2. probar desde carga fría y con cache;
3. rotar dos veces durante partida;
4. enviar a background y volver;
5. recibir una interrupción de audio si es posible;
6. jugar con batería/ahorro activado;
7. jugar al menos una run completa;
8. anotar dispositivo, navegador, calidad, FPS aproximado y fallo.

Cuando haya acceso breve a PC, priorizar DevTools Performance/Memory y CrazyGames/Poki Inspector, no una sesión larga de balance.

---

# 15. FASES Y PUERTAS

## Fase 0 — Product lock y spikes

Entregables:

- `AGENTS.md` y skills base portátiles descubiertas por GPT/Codex y Grok;
- decisiones de input, cámara y viewport confirmadas;
- página Pixi vacía responsive desplegada;
- spike de 500 shapes repetidas comparando Sprite, GraphicsContext y pool;
- spike de audio en móvil;
- CI y GitHub Pages funcionando.

Puerta:

- resize estable en toda la matriz;
- una forma sigue al pointer correctamente tras redimensionar/rotar;
- elección documentada de representación masiva.

## Fase 1 — Movimiento y arena

Entregables:

- loop fijo;
- player, input y cámara;
- frontera circular y colisión;
- background ligero;
- primera expansión de arena;
- HUD debug.

Puerta:

- mover al jugador durante 3 minutos se siente preciso en mouse y touch;
- no hay drift, salto por resize ni scroll accidental.

## Fase 2 — Combate gris

Entregables:

- Chaser, Fast y Tank;
- Projectile;
- daño, muerte, spatial grid y pooling crítico;
- spawn budget básico;
- XP acreditada inmediatamente al derrotar al enemigo (sin pickup físico).

Puerta:

- 250 enemigos y 300 proyectiles pasan stress Low;
- ninguna colisión depende del renderer;
- la muerte de enemigo ya resulta clara sin arte final.

## Fase 3 — Progresión y builds

Entregables:

- level-up pausado;
- tres cartas válidas;
- Orbit y Chain Lightning;
- 10–12 upgrades;
- guardado de ajustes/mejor marca.

Puerta:

- dos builds cambian realmente cómo se mueve el jugador;
- cartas legibles y pulsables en el tamaño móvil mínimo;
- tests de reglas sin Pixi.

## Fase 4 — Firma de arena y dificultad

Entregables:

- resonancia y dos expansiones;
- Laser completo;
- elite;
- curva de 4 minutos antes del boss;
- telegraphs priorizados.

Puerta:

- un jugador entiende el Laser después de verlo una vez;
- el camping deja de ser la estrategia dominante;
- el borde de arena se percibe como parte del juego.

## Fase 5 — Boss y run completa

Entregables:

- boss de dos patrones;
- game over, victoria/resumen y restart;
- run reproducible de 5–6 minutos;
- primer balance completo.

Puerta:

- 10 runs internas sin softlock, pérdida de progreso ni daño inevitable;
- reinicio hasta gameplay en pocos segundos;
- primera run no necesita una pantalla de instrucciones larga.

## Fase 6 — Game feel y arte

Entregables:

- lenguaje visual mínimo;
- assets SVG master y texturas runtime;
- FX recipes, audio, shake, hit stop y trails;
- Low/Medium/High;
- galería SVG solo si ya acelera trabajo repetido.

Puerta:

- amenazas siguen legibles con FX High;
- Low conserva identidad y feedback;
- no se exceden presupuestos de descarga ni memoria.

## Fase 7 — Hardening móvil

Entregables:

- profiling CPU/GPU/GC;
- lifecycle completo;
- context-loss y fallos de storage manejados;
- adaptive quality si los datos la justifican;
- suite de resize completa.

Puerta:

- run completa estable en el teléfono modesto disponible;
- mínimo 30 FPS jugable en stress razonable;
- ningún resize, background/foreground o audio interrupt rompe la run.

## Fase 8 — Plataformas

Entregables:

- builds separados;
- Poki lifecycle/ads/save;
- CrazyGames v3 lifecycle/ads/data;
- simulador local de todos los resultados;
- metadata, thumbnails y clips iniciales.

Puerta:

- Poki Inspector sin errores relevantes;
- CrazyGames Preview sin errores relevantes;
- el build sigue jugable con adblock, anuncios no disponibles y storage fallido;
- no existen requests externos no permitidos.

## Fase 9 — Validación y producción

Solo después de pasar las fases anteriores:

- añadir contenido en paquetes pequeños;
- medir retención cualitativa y duración de runs;
- elegir metaprogresión mínima;
- producir nuevas armas/enemigos a partir de necesidades reales;
- refinar las skills base y añadir skills especializadas de arte/contenido únicamente para workflows repetidos y ya validados.

---

## 15.1 Estado de puertas tras validación manual — 27-08-2026

Evidencia aportada por el usuario, separada de las mediciones automatizadas:

- [x] La rotación funciona durante la experiencia jugable.
- [x] Se completaron varias runs normales hasta el final.
- [x] El boss puede ser alcanzado y derrotado.
- [x] Las decisiones de build tienen impacto real para llegar al boss y derrotarlo.
- [x] El balance inicial se percibe adecuado para el primer nivel.
- [x] Las mecánicas principales y los diseños provisionales cumplen su función actual.
- [ ] Registrar diez runs internas con causa de final, softlocks y daño inevitable.
- [ ] Registrar dispositivo, navegador, preset de calidad y FPS aproximado.
- [x] Validar context loss automáticamente y cubrir el fallback de storage bloqueado con tests unitarios.
- [x] Validar el spike de Web Audio; reproduce sonido tras interacción del usuario y se documenta su volumen bajo de prueba.
- [ ] Validar context loss, storage bloqueado, audio y background/foreground en un móvil real.
- [ ] Validar los builds dentro de Poki Inspector y CrazyGames Preview.
- [ ] Aplicar el polish visual y el juice de la Fase 6 después de cerrar las puertas funcionales.

Esta evidencia permite avanzar en la validación de Fase 5, pero no sustituye el registro cuantitativo ni las pruebas específicas de plataforma y lifecycle.

---

## 15.2 Auditoría de modularidad y reproducibilidad — 28-08-2026

Antes de continuar con el siguiente hito se cerraron los hallazgos estructurales de la sesión anterior:

- `WebAudioService` captura fallos del constructor, conexiones y lifecycle; si el navegador bloquea Web Audio, el juego continúa en silencio sin un rechazo no controlado.
- `EnemySpawnDefinitions` posee la mezcla temporal (`chaser`, `fast`, `tank`, `elite`); `EnemySystem` conserva ciclo de vida, movimiento, contacto y spatial grid sin umbrales de dificultad embebidos.
- `CombatRenderState` expone interfaces reducidas y readonly para enemigos, proyectiles, órbitas y cadenas; las vistas no reciben campos mutables de gameplay a través de ese contrato.
- `StressCombatScenario` separa el benchmark de pools de la frontera normal de armas sin duplicar el pool ni alterar el balance.
- Playwright ejecuta cinco escenarios desktop y un escenario touch en un proyecto Pixel 5 emulado. La instalación queda documentada (`npx playwright install chromium`) y CI la realiza de forma explícita.

La extracción se detuvo en estas fronteras porque `Game` sigue siendo un orquestador cohesivo y `CombatWeaponSystem` sigue teniendo un único consumidor. Se volverán a evaluar sólo al aparecer una cuarta arma, un segundo consumidor o una regla transversal real; no se crean managers especulativos.

La validación de esta auditoría registró 75 tests unitarios/integración en 21 archivos, 6 smoke tests browser, typecheck y builds `local`, `poki` y `crazygames` correctos. El smoke emulado no sustituye las comprobaciones manuales de audio, storage, background/foreground y contexto WebGL en un teléfono físico.

---

## 15.3 Audio y pausa manual — 28-08-2026

La primera iteración de audio queda deliberadamente sin dependencia ni descarga externa:

- `WebAudioService` conserva el contrato independiente del gameplay y ahora reproduce una frase procedural de ocho pasos con bajo, melodía y armonía, además de los cues existentes;
- `PauseOverlay` ofrece un botón directo de pausa, continuar, reinicio explícito desde pausa y controles persistentes de música, efectos y silencio;
- los ajustes se normalizan mediante `SaveStore` y se aplican al bus de audio sin tocar la simulación;
- `GameState.restartFromPause()` mantiene separado el reinicio manual de las transiciones terminales y de level-up;
- los smoke tests desktop y Pixel 5 cubren pausa manual, ajustes y reanudación; el usuario validó auditivamente música, efectos, pausa, volumen y silencio en el teléfono.

Se evaluaron alternativas code-first pequeñas: [ZzFX](https://github.com/KilledByAPixel/ZzFX/blob/master/README.md) (MIT, sin dependencias y menos de 1 KB comprimido) y [ZzFXM](https://keithclark.github.io/ZzFXM/) (renderer musical MIT de aproximadamente 442 bytes gzip). También se verificó [Kenney Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) y su licencia [CC0](https://kenney.nl/support). No se añaden todavía porque el plan exige builds autocontenidos, sin CDN, y la música externa encontrada para prototipos puede añadir varios MB. La decisión se reabrirá en Fase 6 cuando exista dirección sonora y presupuesto de descarga medido.

---

## 15.4 SVG UI inicial — 28-08-2026

Se incorporó el primer consumidor real de la skill SVG code-first:

- `src/assets/svg/ui/pause.svg` y `settings.svg` usan `viewBox` cuadrado, `currentColor`, IDs prefijados y ninguna referencia externa;
- se insertan inline desde `main.ts`, mientras el hit-area, foco y texto accesible permanecen en botones HTML;
- `SvgAssets.test.ts` valida estructura, IDs únicos, accesibilidad decorativa y ausencia de scripts, raster o URLs externas;
- la UI queda preparada para ampliar el mismo contrato a player, enemigos y hazards sin parsear SVG durante el gameplay.

---

## 15.5 Audio híbrido estable — 28-08-2026

Se reemplaza la frase programada mediante `setTimeout` por una arquitectura con una pista continua y efectos independientes:

- `AudioManager` mantiene el contrato que consume `Game`; simulación y contenido no importan Howler, ZzFX ni Web Audio;
- `HowlerMusicBackend` crea su `Howl` sólo dentro de `unlock()`, es decir, durante la primera interacción válida. La pista actual es una fuente WAV generada localmente en memoria: permite verificar loop, pausa, reinicio, volumen y recuperación sin CDN ni asset binario provisional;
- al licenciar la música final, se sustituirá esa fuente por archivos locales `WebM/Opus` y `MP3` ordenados en `src/assets/audio/music/`. Howler elegirá el primer formato compatible; no usar WAV como formato de publicación salvo clips muy cortos;
- `ZzfxSfxBackend` usa recetas ZzFX tipadas en `content/audio/AudioCueDefinitions.ts`, un bus propio conectado al contexto que ya abrió Howler y un máximo de ocho voces. No crea un segundo `AudioContext`, condición necesaria para Safari/iOS y reinicios fiables;
- cada cue tiene cooldown propio. Los eventos masivos como `enemy-defeated` pasan por 80 ms de rate limit; daño, level-up y boss tienen prioridades perceptuales superiores mediante sus recetas y cooldowns;
- para añadir un efecto futuro: (1) definir la receta y cooldown en `AudioCueDefinitions`, (2) emitir la clave desde la frontera existente de eventos en `Game`, (3) añadir test de comportamiento si abre una ruta nueva, (4) probar pausa, mute, restart y móvil. No se llama a ninguna librería desde sistemas de simulación.

Se añade Howler 2.2.4, `@types/howler` 2.2.13 y la referencia MIT de ZzFX 1.3.2 al lockfile. Tone.js queda fuera del runtime: no aporta valor al vertical slice frente a una pista looping y recetas de efectos, y añadiría un scheduler musical adicional.

---

## 15.6 Plan de juice visual mobile-first — 31-08-2026

Esta sección convierte la Fase 6 en un plan ejecutable y medible. El objetivo
no es llenar la pantalla de efectos, sino hacer que cada decisión importante
tenga una respuesta breve, legible y coherente con el lenguaje geométrico
neón ya establecido en la pantalla de inicio, las cartas y la arena.

### Investigación aplicada al proyecto

- `Vampire Survivors` demuestra el valor de una muerte corta y reconocible,
  pequeños estallidos de polvo y un efecto propio por arma; la misma referencia
  también advierte que demasiados números y efectos pueden ocultar al jugador.
  Véase la [reseña de Nintendo Everything](https://nintendoeverything.com/rapid-review-vampire-survivors/).
- `Halls of Torment` ofrece controles para reducir la opacidad de efectos y
  ocultar los números de daño, una respuesta práctica al caos visual. El plan
  adopta esa idea como configuración opcional, no como requisito para entender
  el combate. Véase la [discusión de visibilidad de efectos](https://steamcommunity.com/app/2218750/discussions/0/4033600999078471547/).
- `Deep Rock Galactic: Survivor` diferencia elites, peligros del escenario y
  bosses para que cada amenaza exija una lectura distinta; su reseña destaca
  que los encuentros de boss deben tener drama propio, no ser sólo más vida.
  Véase la [reseña de PC Gamer](https://www.pcgamer.com/games/roguelike/deep-rock-galactic-survivor-review/).
- Un estudio de feedback de impacto en juegos de acción encontró que hit-stop,
  coherencia sonora y control de cámara tienen una influencia especialmente
  fuerte en la sensación de impacto. Se aplicará como principio de diseño,
  manteniendo amplitudes pequeñas por tratarse de un survivor móvil. Véase el
  [estudio sobre impact feel](https://arxiv.org/abs/2208.06155).

### Principios que no se negocian

1. La simulación emite eventos; la presentación decide cómo dibujarlos. Ningún
   FX modifica daño, vida, velocidad, XP, colisiones o dificultad.
2. Cada evento tiene cuatro momentos: anticipación, impacto, persistencia y
   recuperación. La recuperación evita que todos los efectos compitan al mismo
   tiempo.
3. La prioridad visual permanece: hazard crítico > player > boss > elite >
   enemigo > arma > texto de daño > partículas > fondo.
4. El color acompaña, pero nunca es la única señal de peligro. Se combinan
   forma, ritmo, escala, contorno o sonido.
5. Low reduce fidelidad, no información: conserva player, enemigos, barras de
   boss, telegraphs, dirección y resultado de los impactos.
6. No se usarán blur, filtros o sombras por entidad. SVG será el master; Pixi
   reutilizará texturas y pools para las instancias repetidas.

### Contratos y módulos previstos

- `src/content/visual/VisualTokens.ts`: colores, grosores, duraciones,
  amplitudes y límites compartidos por UI, personajes y FX.
- `src/content/visual/SkinDefinitions.ts`: `SkinId`, piezas SVG, paleta,
  acento y variantes de animación. Las skins sólo cambian presentación; no
  otorgan daño, vida, velocidad ni otra ventaja.
- `src/presentation/pixi/fx/ImpactFxView.ts`: compositor de FX con recetas
  tipadas, prioridad, cooldown, `prefers-reduced-motion` y quality preset.
- `src/presentation/pixi/fx/FxPool.ts`: pool único para chispas, fragmentos,
  anillos, trails y números. Las recetas no crean objetos en cada impacto.
- `src/presentation/pixi/fx/DamageNumberView.ts`: texto Pixi cacheado,
  agrupación de impactos cercanos y límite de instancias visibles. Nunca se
  añadirá un nodo DOM por enemigo.
- `src/presentation/pixi/entities/HealthBarView.ts`: barra pequeña reutilizable
  para boss, elite y enemigos que hayan recibido daño recientemente.
- `src/presentation/pixi/characters/`: compositores de player y familias de
  enemigos. Cada uno conserva piezas SVG con el mismo `viewBox`, frame y ancla.

El evento visual mínimo debe transportar `kind`, posición lógica, intensidad,
variante y tiempo de vida. Si un evento no necesita una representación visual,
no se crea. La cola debe poder descartar o agrupar FX de baja prioridad bajo
stress sin perder telegraphs ni feedback del player.

### Recetas de feedback

#### Player

- Idle: respiración del core de 0.8–1.5 % y rotación/energía ambiental muy
  sutil; no debe parecer que se está moviendo sin input.
- Movimiento: inclinación de 2–4° y una estela corta sólo en Medium/High.
- Disparo: recoil de 60–110 ms en la pieza del arma, destello breve y cue ZzFX
  con cooldown; no escalar el cuerpo completo en cada disparo.
- Daño: flash blanco de 70–100 ms, compresión de 2–4 %, anillo cian/rojo de
  recuperación y vibración de cámara de 0.5–1.5 unidades. La invulnerabilidad
  se comunica también con ritmo/contorno para no depender del parpadeo.
- Level-up: expansión radial, giro corto del core, halo dorado y cue musical;
  el overlay de cartas sigue siendo el foco y la simulación continúa pausada.

#### Enemigos

- Impacto normal: flash/tint de 60–90 ms, escala punch de 1.03–1.06 y un
  desplazamiento visual corto. Es sólo presentación; no es knockback de gameplay.
- Impacto fuerte o crítico: anillo pequeño, dos o cuatro chispas y una pausa de
  impacto de 8–16 ms únicamente si la densidad lo permite. Los impactos masivos
  se agrupan para no producir un terremoto constante.
- Daño flotante: por defecto aparece sólo en impactos legibles o enemigos
  importantes; se agrupan golpes del mismo objetivo durante aproximadamente
  80 ms. Se colorean por tipo de evento y pueden apagarse desde ajustes.
- Mini barra de vida: no se dibuja sobre los 250 enemigos todo el tiempo. Se
  muestra durante 0.8–1.2 s sobre enemigos dañados recientemente y siempre en
  elite/tank/boss; el boss conserva una barra HUD completa. El límite inicial
  será de 8/16/24 barras visibles en Low/Medium/High y se medirá en móvil.

#### Muerte de enemigos

- Chaser/Fast: shrink suave más fade y un burst de 3–5 fragmentos geométricos,
  220–320 ms, con dirección determinista basada en la posición del impacto.
- Tank/Elite: desarme visual de 4–8 piezas cacheadas, anillo de energía y
  recuperación de 320–480 ms. La silueta debe dejar de bloquear al jugador
  desde el primer instante; los fragmentos son decorativos y no colisionan.
- Boss: secuencia exclusiva en tres pasos: telegraph de colapso, separación de
  anillos/core y burst final con sonido. El tiempo total debe permitir reiniciar
  rápido y no convertirse en una cinemática obligatoria.
- XP sigue acreditándose al morir, como ya exige el diseño; no se añade pickup
  físico para justificar el efecto.

#### Arena, armas y hazards

- Proyectiles: trail corto por historial de posiciones, no blur; el trail se
  apaga antes de competir con el telegraph.
- Chain Lightning: flash de impacto, arco breve y dos o tres partículas en el
  rebote; el número de saltos continúa siendo decisión de simulación.
- Laser: warning y línea de ataque permanecen por encima de FX decorativos; un
  hit sólo añade un flash y una onda de recuperación.
- Expansión de arena: ring, shockwave, pocas partículas, cambio de tono del
  borde y cue ascendente. La cámara sólo recibe un zoom punch pequeño.
- Borde: reacción sutil al contacto o daño, sin sacudir la cámara en cada tick.

#### Muerte del player

Secuencia de 450–750 ms: último flash controlado, separación del core y piezas,
fade del aura, pausa de impacto corta y transición al resumen. El input se
limpia inmediatamente, el resumen no depende del FX y el botón de reinicio
queda disponible sin recargar. Con `prefers-reduced-motion` se conserva sólo
un cambio de estado, alpha y sonido breve.

### Skins y player modular

El player se construirá como `shadow`, `outer-ring`, `body`, `core`,
`weapon-left`, `weapon-right`, `accent` y una `signature` por skin, todos con
el contrato SVG común. La primera entrega visual contiene cuatro skins de
prueba: cyan/mint, violeta/dorada, ámbar solar y esmeralda biocristalina.
Cada skin se puede cambiar desde el selector de desarrollo y el locker, sin
tocar `PlayerModel`, `CombatSimulation` o las cartas.

La animación runtime usará transformaciones sobre texturas cacheadas: tilt,
recoil, squash, pulse y separación de piezas al morir. No se generarán variantes
por dirección ni XML nuevo por entidad. Antes de integrar cada personaje se
aplicará la ficha SVG: silueta plana, frente, piezas, ancla, lectura a 32 px y
score mínimo de 8/10.

### Presets iniciales y límites de coste

Son presupuestos de arranque, no cifras definitivas; se deben comparar en el
mismo teléfono y viewport:

| Preset | Partículas/fragments | Daño flotante | Barras enemigas | Trails/glow |
| --- | ---: | --- | ---: | --- |
| Low | 30 % del pool | apagado salvo boss/elite | dañados recientes, máximo 8 | sin trail, sin filtro |
| Medium | 60 % del pool | agrupado, máximo 16 | máximo 16 | trail corto, glow por sprites |
| High | 100 % del pool | agrupado, máximo 24 | máximo 24 | trail completo, sin blur por entidad |

Punto de partida para el pool: 96 FX simultáneos en Low, 160 en Medium y
240 en High, con reutilización y descarte por prioridad. El stress deberá
añadir al menos 150 FX reales además de 250 enemigos y 300 proyectiles. Si el
frame p95 supera la puerta, se reduce primero fondo/trail/partículas, después
texto y por último glow; nunca se reduce el telegraph ni se cambia gameplay.

### Orden de implementación y validación en GitHub Pages

1. Crear tokens, `FxPool` y contrato de eventos; probar un único impacto con
   `?juice=1` sin cambiar reglas.
2. Integrar feedback del player y daño recibido; validar pausa, resize y
   `prefers-reduced-motion`.
3. ✅ Integrar impacto y derrota visual del chaser, tank y elite con piezas SVG
   cacheadas, pool acotado y anillo compartido; comparar textura compartida
   frente a `Graphics` sólo si una medición real lo justifica.
4. Añadir `DamageNumberView` y `HealthBarView` con límites y agrupación; probar
   caos con `?stress=1` y no con una escena artificial aislada únicamente.
5. Crear muerte del player y muerte especial del boss; confirmar que resumen y
   restart in-place no esperan a terminar la animación.
6. ✅ Añadir las cuatro skins de prueba y el locker cosmético; la adquisición es
   gratuita sólo como prototipo y la economía comercial queda pendiente.
7. Comparar Low/Medium/High en el móvil de referencia, registrar FPS medio,
   p95, memoria aproximada, legibilidad y captura antes/después. Sólo entonces
   decidir si hace falta `ParticleContainer` o un filtro pequeño.

### Definition of Done de la Fase 6 visual

- Se reconoce player, enemigo, daño, amenaza y muerte sin depender del color.
- El desarme de piezas no cambia colisiones, pool de gameplay ni XP.
- Daño flotante y barras informan sin ocultar al player, telegraphs o CTA.
- El feedback normal no produce shake o hit-stop constante en hordas.
- Low conserva lectura y controles; High mejora impacto sin tapar la escena.
- `prefers-reduced-motion`, pausa, resize, background/foreground y reinicio
  funcionan sin efectos huérfanos.
- SVGs tienen contrato, IDs prefijados, frame/ancla comunes y prueba
  estructural; no hay raster, filtros caros ni recursos externos nuevos.
- Typecheck, tests, builds local/Poki/CrazyGames y smoke browser pasan; el
  móvil de referencia aporta mediciones comparables y no sólo una impresión.

### Primera implementación — tokens, player y primer impacto — 31-08-2026

El primer bloque ejecutable del plan quedó integrado sin alterar reglas de
simulación:

- `src/content/visual/VisualTokens.ts` centraliza las paletas `cyan`/`violet`,
  los presupuestos Low/Medium/High y las amplitudes del player;
- `src/assets/svg/characters/player/` contiene el master y seis piezas con
  `viewBox="-32 -32 64 64"`; `PlayerVisualAssets` las rasteriza una vez con el
  frame común y `PlayerView` sólo anima transforms, orientación, idle, recoil y
  flash de daño;
- `src/presentation/pixi/fx/FxPool.ts` reserva sprites una vez, reutiliza sus
  slots y descarta solicitudes cuando el pool está lleno; no hay allocations
  por impacto en la ruta de actualización;
- `ImpactFxView` implementa el primer recipe de daño del player: anillo
  expandible, partículas geométricas limitadas y soporte de reduced-motion;
- `Game` reenvía el evento `playerDamaged` a la presentación después de que la
  simulación acepta el daño. El FX no aplica daño ni cambia invulnerabilidad;
- `?skin=violet` permite comparar la segunda paleta en GitHub Pages y
  `?quality=low|high` compara presupuestos; sin parámetro se usa `cyan` y
  `medium` para conservar el comportamiento actual;
- se añadieron pruebas estructurales SVG y pruebas unitarias de tokens, pool,
  impacto y player. Typecheck, 95 tests, los tres builds y los 8 smoke browser
  pasan.

Esta entrega no incluye todavía números de daño, barras, muerte/desarme de
enemigos ni escena de muerte del player. Esas piezas siguen el orden del plan y
se construirán sobre este pool y contrato, no como efectos aislados.

### Primera pantalla de skins — locker cosmético — 31-08-2026

La futura pantalla de skins ya tiene una primera implementación ejecutable,
sin convertir las skins en un sistema de estadísticas ni introducir una
economía prematura:

- `src/content/visual/SkinDefinitions.ts` contiene el catálogo tipado, el
  texto, la paleta y el modo de adquisición de cada skin. El catálogo es el
  único lugar que debe ampliarse al añadir otra variante.
- `src/ui/skins/SkinSelectPanel.ts` separa la escena de administración del
  menú principal. Cada tarjeta es un botón HTML accesible con estado `locked`,
  `selected` y acción de adquirir/equipar; el preview se genera con SVG
  code-first y no usa PNG ni canvas adicional.
- `SaveStore` migra el schema v1 al v2 y persiste `skins.selected` y
  `skins.unlocked`. Cyan se entrega por defecto; Violeta se puede adquirir
  gratis en este prototipo para validar el flujo en Pages. El contrato queda
  preparado para reemplazarlo por coste/requisito cuando exista una
  progresión meta real.
- `Game` carga la skin guardada al crear la vista y la actualiza en vivo cuando
  se equipa desde el locker. El query `?skin=cyan|violet|amber|emerald` sigue siendo un
  override de desarrollo; ninguna skin toca PlayerModel, combate, colisiones,
  daño, XP o balance.
- La pantalla conserva safe-area, portrait, landscape, foco visible,
  `prefers-reduced-motion` y un límite de cuatro tarjetas iniciales. El panel se
  puede cerrar y volver al menú sin destruir la escena ni dejar huecos de
  layout.

La puerta de esta entrega exige: adquisición y equipamiento persistentes tras
recargar, preview SVG sin recursos externos, migración segura de guardados,
typecheck, suite, tres builds y smoke browser sin errores de consola/red. La
economía, inventario masivo, rarezas comerciales y skins con efectos de juego
permanecen fuera de alcance hasta definir la progresión meta.

### Extensión visual — cuatro firmas de skin y locker desplazable — 31-08-2026

La prueba del primer locker mostró que el color por sí solo no da suficiente
identidad. Se amplía el contrato sin tocar gameplay:

- `PlayerSkinId` ahora contiene `cyan`, `violet`, `amber` y `emerald`. Cada
  definición declara una firma geométrica (`aurora`, `prism`, `solar` o
  `verdant`) además de la paleta.
- `SkinSignatureSvg.ts` genera la pieza vectorial periférica de cada firma con
  el mismo `viewBox` y frame del jugador. Pixi la rasteriza una vez por skin y
  `PlayerView` la rota/pulsa con tokens de movimiento; no se reconstruye SVG
  durante la partida.
- El preview del locker ya no es un círculo coloreado: combina casco,
  emisores, núcleo, fragmentos/aspas y marcas direccionales. CSS anima órbitas,
  fragmentos, corona, aspas y núcleo; `prefers-reduced-motion` los congela.
- El locker conserva cuatro tarjetas y `overflow: auto` en el panel. En
  portrait el panel usa `touch-action: pan-y` para permitir el desplazamiento;
  el canvas de gameplay mantiene `touch-action: none` y no comparte el gesto.
- La matriz browser comprueba que el contenido excede la altura disponible y
  que el `scrollTop` cambia en Pixel 5 emulado, además de adquirir/equipar una
  skin y conservar el guardado.

El orden de adquisición sigue siendo gratuito de demostración. Costes,
monedas, rarezas y una economía meta requieren una decisión de progresión
independiente y no se inventan en esta mejora visual.

### Correccion de parpadeo en el locker movil - 01-09-2026

La revision del locker detecto dos fuentes de repintado innecesario que no
afectaban a la simulacion, pero si podian hacer destellar el panel en algunos
GPU moviles:

- al elegir una skin se reemplazaban las cuatro tarjetas y sus SVG animados en
  la misma tarea; ahora las tarjetas se montan una sola vez y solo se actualizan
  clases, estado accesible y texto de accion;
- el locker era un scroll anidado mientras el fondo, el borde del contenedor y
  grupos SVG de las previews seguian animandose; en viewport de hasta 60rem la
  vista `is-skins-mode` congela esas capas, las cuatro miniaturas y las
  transformaciones de grupos SVG. El preview grande de la skin equipada
  conserva una animacion suave de levitacion, opacidad y trazos. El menu
  principal mantiene su animacion en escritorio.
- En portrait el panel reserva cabecera y preview como una zona fija (modelo de
  fila congelada tipo hoja de calculo); solo `#start-skin-cards` tiene
  `overflow-y: auto` y vuelve a `scrollTop = 0` al abrirse. La skin equipada
  permanece visible mientras se recorren las demas.

La prueba browser movil verifica que el modo locker activa el preset estable,
que panel/atmosfera/miniaturas no tienen animacion activa y que el preview
equipado conserva solo sus animaciones de baja intensidad.
Esto fija la politica: en movil la legibilidad y la composicion estable tienen
prioridad; el movimiento decorativo puede reactivarse en un spike medido de
GPU real, sin tocar contratos de gameplay ni crear otro canvas.

### Primer feedback de impactos y derrotas enemigas - 01-09-2026

Se completa el siguiente bloque de la Fase 6 sin ampliar la frontera de
simulacion:

- `EnemyImpactFxView` usa un anillo compartido y un `FxPool` de fragmentos o
  polvo con capacidad fija, colores por `EnemyKind`, limites por `FxQuality` y
  descarte silencioso de decoracion cuando el pool esta lleno. El polvo de un
  impacto reutiliza el mismo sprite pool, cambia solo a una textura circular
  cacheada, nace alrededor del objetivo y se limita a 3/4/5 sprites
  Low/Medium/High;
- `CombatEntitiesView` compara snapshots de vida solo para detectar impactos y
  aplica un scale-punch visual de 4.5%/120 ms. La derrota usa el evento de
  `CombatSimulation` en `Game`, evitando perderla si el slot se libera y se
  reutiliza antes del siguiente render;
- `PixiGameView` avanza y limpia el compositor, y el reinicio borra snapshots y
  pools. No se crean sprites por impacto, no se dibujan numeros ni barras aun y
  ningun FX modifica dano, vida, XP, colisiones, dificultad o timestep;
- con `prefers-reduced-motion` queda el anillo informativo y se omiten los
  fragmentos. El feedback normal permanece debajo de player, hazards y boss en
  la jerarquia de capas.

Los enemigos compuestos conservan una regla adicional de transform: la ranura
pooled posee la posicion mundial, y sus piezas SVG se renderizan en espacio
local. Asi cualquier punch, escala o shake futuro se ancla al enemigo y nunca
al origen de la escena; no se vuelve a crear ni rasterizar SVG al recibir dano.

La siguiente entrega visual implementa `DamageNumberView` y `HealthBarView`
desde la frontera de presentacion: `CombatEntitiesView` agrupa el delta de vida
que ya observa por ranura pooled, sin emitir un evento nuevo de simulacion. Los
numeros tienen pool 0/16/24 Low/Medium/High y se agrupan durante 80 ms; las
barras usan un `Graphics` compartido con limite 8/16/24, prioridad para
tank/elite y una ventana de un segundo para enemigos danados recientemente.

La puerta de esta entrega exige que el impacto sea perceptible sin inundar la
escena, que el stress conserve el presupuesto y que un restart no deje FX
huérfanos. El siguiente bloque sera `DamageNumberView` + `HealthBarView` con
agrupacion y limites; despues se abordaran muerte especial de boss y player.

# 16. RIESGOS PRINCIPALES

| Riesgo | Señal temprana | Mitigación |
|---|---|---|
| se siente como otro clon survivor | tester describe solo “Vampire Survivors con figuras” | reforzar arena viva antes de más contenido |
| arena crece y todo se ve pequeño | cámara necesita alejarse para mostrar borde | escala constante, borde parcial e indicadores |
| caos ilegible | muertes por hazards que el jugador no vio | jerarquía visual y cap de FX |
| exceso de arquitectura | pasan muchas tareas sin una run jugable | puertas por diversión; abstraer tras segundo caso real |
| SVG perjudica rendimiento | parsing largo o draw calls altos | raster/atlas para masas; Graphics solo selectivo |
| touch incómodo | dedo tapa player/hazard | joystick dinámico, cámara y telegraph con margen |
| GitHub Pages da falsa seguridad | funciona allí pero falla en portal | Inspector/Preview obligatorios en Fase 8 |
| acuerdo de distribución incompatible | una oferta exige exclusividad web | revisar términos antes de firmar; mantener builds separados |
| anuncios rompen estado/audio | juego sigue detrás del anuncio | state machine y simulador de callbacks/error |
| descarga crece por audio | primer gameplay tarda demasiado | audio diferido y presupuesto CI |
| balance depende del framerate | diferencias a 30/60/144 Hz | timestep fijo y tests |

---

# 17. MÉTRICAS DE DECISIÓN

Antes de ampliar el juego, registrar al menos:

- segundos hasta primer movimiento;
- segundos hasta primera decisión;
- duración y causa de cada run;
- arma/mejora escogida y descartada;
- tiempo inmóvil del jugador;
- daño recibido por tipo y si tenía telegraph visible;
- FPS/frame time por preset;
- conteos máximos de entidades y pools;
- tamaño inicial y completo del build;
- errores de consola y fallos de guardado.

En el MVP estos datos pueden mostrarse/exportarse localmente; no se añadirá analítica externa sin aprobación de plataforma y política de privacidad.

---

# 18. DEFINITION OF DONE

Una feature se considera terminada cuando:

- cumple su criterio jugable;
- tiene input mouse/teclado/touch cuando aplica;
- sobrevive al resize y pause/resume;
- no mezcla simulación con Pixi o SDKs;
- tiene tests para reglas críticas;
- no introduce errores de consola;
- respeta presupuestos de entidades y FX;
- funciona en LocalPlatform con success y error simulados;
- tiene texto en claves i18n si muestra texto;
- actualiza documentación si cambia una decisión arquitectónica;
- está desplegada y verificable en GitHub Pages.

---

# 19. DOCUMENTACIÓN DEL REPOSITORIO

Estructura documental recomendada a medida que el proyecto crezca:

```text
proyecto.md                 visión y principios
PLAN_DESARROLLO.md          ejecución, fases y puertas
AGENTS.md                   instrucciones cortas y enlaces canónicos
skills/                     skills canónicas neutrales al modelo
.grok/skills/               adaptadores finos de descubrimiento para Grok
docs/
├── decisions/              ADRs solo para decisiones costosas de revertir
├── platforms/              checklists Poki/CrazyGames
├── balance/                curvas y resultados de runs
├── performance/            dispositivos, perfiles y presupuestos
└── visual/                 lenguaje visual y pipeline SVG
```

No copiar las mismas reglas en muchos archivos. Las skills base del proyecto existen desde la Fase 0 porque protegen fronteras críticas. Las skills especializadas deben enlazar la fuente canónica y existir solo cuando una tarea repetida lo justifique.

Un identificador de modelo no basta para controlar el repositorio. Codex/GPT o Grok Build deben iniciarse con este directorio como raíz y con herramientas de lectura, edición y pruebas. Si se usa GPT-5.6 o Grok 4.6 mediante API directa, el orquestador debe cargar `AGENTS.md`, entregar la skill pertinente y proporcionar esas herramientas; no existe descubrimiento automático garantizado en una llamada de modelo aislada.

---

# 20. PRÓXIMA ACCIÓN RECOMENDADA

La primera implementación debe ser únicamente la **Fase 0**. No se deben crear todavía todas las carpetas, armas o skills descritas en `proyecto.md`.

Orden inmediato:

1. comprobar que GPT/Codex y Grok descubren `AGENTS.md` y las skills base del proyecto;
2. inicializar Vite + TypeScript + PixiJS;
3. crear la shell responsive y LocalPlatform;
4. configurar GitHub Actions + Pages;
5. publicar un canvas con una figura controlable;
6. verificar resize, rotación, pointer mapping y DPR;
7. ejecutar el spike Sprite vs GraphicsContext;
8. documentar el resultado y comenzar Fase 1.

---

# 21. FUENTES OFICIALES CONSULTADAS

## Poki

- [Requirements](https://sdk.poki.com/new-requirements)
- [Poki SDK HTML5](https://sdk.poki.com/html5)
- [Poki Inspector](https://sdk.poki.com/poki-inspector)
- [Deal types y requisitos de rendimiento](https://sdk.poki.com/deals)

## CrazyGames

- [Technical requirements](https://docs.crazygames.com/requirements/technical/)
- [Gameplay requirements](https://docs.crazygames.com/requirements/gameplay/)
- [Quality guidelines](https://docs.crazygames.com/requirements/quality/)
- [Advertisement requirements](https://docs.crazygames.com/requirements/ads/)
- [HTML5 SDK v3](https://docs.crazygames.com/sdk/intro/)
- [Game lifecycle](https://docs.crazygames.com/sdk/game/)
- [Data module](https://docs.crazygames.com/sdk/data/)
- [CrazyGames App y safe areas](https://docs.crazygames.com/resources/crazygames-app/)
- [Game covers](https://docs.crazygames.com/requirements/game-covers/)

## PixiJS, Vite y GitHub

- [PixiJS Application](https://pixijs.com/8.x/guides/components/application)
- [PixiJS Resize Plugin](https://pixijs.com/8.x/guides/components/application/resize-plugin)
- [PixiJS SVG](https://pixijs.com/8.x/guides/components/assets/svg)
- [PixiJS Graphics y GraphicsContext](https://pixijs.com/8.x/guides/components/scene-objects/graphics)
- [PixiJS ParticleContainer](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)
- [Vite: deploy de sitio estático](https://vite.dev/guide/static-deploy)
- [Vite: configuración `base`](https://vite.dev/config/shared-options.html#base)
- [GitHub Pages: custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages: límites](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## Agentes y skills

- [OpenAI: guía de GPT-5.6 y uso de skills](https://developers.openai.com/api/docs/guides/latest-model)
- [xAI: Skills, Plugins & Marketplaces](https://docs.x.ai/build/features/skills-plugins-marketplaces)
- [xAI: reglas de proyecto con AGENTS.md](https://docs.x.ai/build/features/project-rules)

## Skill SVG code-first — 25-08-2026

Se incorpora una skill especializada para que la IA genere y mantenga SVG mediante codigo, sin depender de PNG ni de un editor grafico:

- canonica: `skills/geometry-survivor-svg/SKILL.md`;
- referencias: contrato de asset, pipeline PixiJS y validacion;
- adaptador Grok: `.grok/skills/geometry-survivor-svg/SKILL.md`;
- `AGENTS.md` y la skill de rendering la enrutan cuando una tarea sea especifica de SVG.

La skill exige `viewBox`, ancla, IDs deterministas, accesibilidad, rutas relativas, ausencia de recursos externos y una eleccion explicita entre SVG inline, textura Pixi o `GraphicsContext`. Tambien protege el `viewBox` y la accesibilidad durante optimizacion.

## Direccion artistica de personajes SVG — 28-08-2026

La skill ahora exige una ficha de diseno antes del XML: funcion y lectura de gameplay, silueta, proporciones, pose top-down, ancla, paleta, presupuesto de primitivas y pruebas a 32/48/64/96 px. Incluye una rubrica de reconocimiento, personalidad, funcion, legibilidad y coherencia de familia; una puntuacion menor de 8/10 obliga a corregir silueta o proporciones antes de anadir detalle.

El primer asset que aplica el contrato es `src/assets/svg/enemies/turtle/turtle.svg`: caparazon poligonal dominante, cabeza adelantada, cuatro patas, cola, viewBox centrado, 12 primitivas geometricas, cuatro colores principales y cero filtros o recursos externos. `CombatEntitiesView` lo convierte una sola vez en textura Pixi y lo comparte con el pool de `chaser`; la simulacion permanece sin cambios.

La direccion visual queda fijada: cada personaje declara frente base y offset, el contenedor se orienta con su velocidad y las piezas animables comparten viewBox/ancla. La tortuga separa caparazon, patas delanteras, patas traseras y cabeza; Pixi aplica giro, balanceo y bob de baja amplitud mientras la simulacion conserva exactamente las mismas colisiones. Al rasterizar piezas, `SvgTextureFactory` exige un frame igual al viewBox comun para impedir que el recorte automatico cambie el centro de cada textura. `TurtleVisual` crea las piezas de cada ranura solo al primer uso como `chaser` y luego las reutiliza, evitando trabajo de arranque innecesario en movil.

## UI SVG y menu de cartas - 28-08-2026

La organizacion visual sigue el mismo contrato por dominio: cada familia de
personaje tiene sus masters en `src/assets/svg/{enemies|characters}/<id>/` y su
compositor Pixi en `src/presentation/pixi/{enemies|characters}/<id>/`. Player y
tortuga ya usan esta estructura; un nuevo enemigo debe poder cambiar de forma
independiente sin editar una carpeta compartida de sprites.

El level-up usa `src/assets/svg/ui/level-up/` para geometria y
`src/ui/level-up/` para orquestacion. `LevelUpOverlay` mantiene tres botones
HTML accesibles y data-attributes estables; `UpgradeCardVisual` es el registro
visual por `UpgradeId`; `card-frame.svg` se instancia por carta e `icons.svg` se
monta una sola vez y se referencia con `<use>`. La simulacion solo entrega
definiciones y previews: no conoce SVG, DOM ni Pixi.

La estrategia responsive es intencional: el texto, foco y hit-area son HTML; el
marco vectorial se adapta a la carta con CSS variables por tono y el sprite de
iconos conserva su proporcion. El layout cambia de tres columnas a una columna
compacta en portrait, respeta safe-area y reduced-motion, y el cambio de viewport
solo afecta presentacion. Al anadir una carta se amplia el mapa visual y el
asset iconografico, sin duplicar reglas de gameplay. La validacion estructural
rechaza raster, filtros, scripts, recursos externos e IDs no prefijados.

## Interaccion premium de cartas y FX Pixi - 28-08-2026

La primera capa de "juice" del level-up queda separada del gameplay. Los
botones HTML/SVG conservan texto, foco, accesibilidad y hit-area; emiten el
contrato semantico `focus`, `blur`, `press` y `select` definido en
`src/ui/level-up/LevelUpCardInteraction.ts`. `Game` convierte los rectangulos
CSS a anclas del espacio logico solo al abrir o redimensionar.

`LevelUpFxView` (`src/presentation/pixi/ui/level-up/`) dibuja aura, aura interna,
anillo, rayos y una rafaga de 24 sprites reutilizados. El efecto usa un reloj de
UI independiente, de modo que la confirmacion sigue animandose durante la pausa
de gameplay; `eventMode = none` impide que Pixi intercepte el toque. La consulta
de `prefers-reduced-motion` elimina movimiento y particulas cuando el usuario lo
solicita.

No se incorpora `pixi-filters` todavia. Primero se valida el coste con `Graphics`
y el pool pequeno; un glow filtrado solo se aceptara mediante un spike medido y
una politica Low/High. Si el numero de particulas creciera de forma real, se
reevaluara `ParticleContainer`, manteniendo su uso limitado a FX sin filtros.

### Spike futuro de FX para cartas

La version actual debe tratarse como baseline, no como resultado visual final:
una `Graphics` de aura/anillo, rayos simples y un pool fijo de 24 sprites. Antes
de aumentar brillo, particulas o shaders, comparar en el mismo dispositivo y
viewport estas variantes:

1. baseline actual;
2. glow barato por dos o tres sprites aditivos escalados;
3. `GlowFilter` de `pixi-filters` aplicado solo al contenedor seleccionado;
4. particulas de mayor contraste y, solo si el conteo lo exige, un
   `ParticleContainer` dedicado.

Registrar para cada variante: captura antes/despues, legibilidad del texto,
tiempo de frame medio y p95, FPS estable, draw calls aproximados, memoria y
comportamiento con `prefers-reduced-motion`. La puerta es conservar 60 FPS en
el telefono de referencia y no ocultar el CTA ni el copy; Low debe reducir
particulas/glow sin cambiar la seleccion ni el telegraph. Si ninguna variante
mejora claramente la lectura, conservar el baseline y redirigir el presupuesto
a squash, sonido, timing y contraste de la carta.

## Pantalla de inicio y presentacion - 28-08-2026

La aplicacion ahora abre en un menu de presentacion antes de iniciar la
simulacion. `GameState` usa la fase `menu`, por lo que no avanzan tiempo,
enemigos, armas ni input hasta pulsar `JUGAR`; los atajos `?boss=1` siguen
saltando el menu para depuracion.

`src/ui/StartScreen.ts` es la vista DOM responsable de abrir/cerrar el menu,
mostrar la mejor marca y persistir los ajustes de audio. El layout incluye un
CTA principal, un panel funcional de musica/SFX/silencio y dos ranuras
deshabilitadas con `data-feature` (`level-select`, `skins`) para futuras pantallas
sin acoplarlas al motor. `src/assets/svg/ui/start/mark.svg` es el master
vectorial del nucleo/orbitas; el resto del acabado usa gradientes, rejilla y
animaciones CSS de bajo coste.

La presentacion conserva el viewport logico y safe-area: desktop usa panel
centrado y portrait colapsa las acciones en una columna. `JUGAR` es tambien el
gesto que desbloquea Howler/ZzFX en movil. La pantalla no crea una segunda
simulacion ni modifica progresion; al empezar, `Game` activa input, HUD, audio y
lifecycle en una unica transicion.

### Extensión visual — escena SVG dinámica - 31-08-2026

La presentación incorpora una escena ambiental vectorial por capas sin cambiar
la frontera entre UI y simulación:

- `src/assets/svg/ui/start/hero-scene.svg` es el master code-first de una
  composición con órbitas, rayos radiales, nodos, barridos, fragmentos y núcleo;
  conserva `viewBox="0 0 1200 900"`, ancla visual centrada, IDs prefijados y no
  incluye raster, scripts, URLs externas, filtros ni máscaras complejas;
- `StartScreen` lo monta una vez en `#start-scene` como SVG inline decorativo;
  `aria-hidden` y `pointer-events: none` garantizan que no intercepte input ni
  sustituya el texto HTML accesible;
- `src/styles.css` anima solo `transform`, `opacity` y
  `stroke-dashoffset`: órbitas con velocidades distintas, nodos pulsantes,
  barridos de luz, respiración del núcleo, atmósfera y sheen del panel. No se
  reescribe el XML ni se crean nodos nuevos por frame;
- la escena usa CSS/DOM porque es una sola composición responsive de menú, no
  una masa de entidades. Pixi queda reservado para un spike futuro si una
  medición real justifica textura cacheada o un pool pequeño de partículas;
- `prefers-reduced-motion` detiene la animación y baja la opacidad ambiental.
  El fondo se recorta con el viewport, mientras panel, copy, CTA y hit-area
  conservan prioridad visual en portrait, landscape y safe-area.
- Para compatibilidad con GPU móviles, no se animan rotaciones de grupos SVG
  grandes ni desplazamientos de gradientes de pantalla completa: las órbitas
  se mueven con `stroke-dashoffset`, las luces con opacidad y sólo los nodos
  pequeños usan escala. Las capas no llegan a opacidad cero al reiniciar su
  ciclo, evitando un destello de apagado/encendido.
- El panel de inicio no usa `backdrop-filter` ni `mix-blend-mode`; conserva una
  superficie semitransparente estable. El bloque de configuración usa
  `contain: layout paint` y `overflow-anchor: none` para que abrir/cerrar no
  deje una superficie compuesta vacía ni altere el reflow del resto del menú.
- El marco exterior y la línea interna del panel recorren un ciclo RGB lento de
  cuatro tonos (`border-color` y opacidad baja); la línea interna va desfasada
  2.5 s. `prefers-reduced-motion` congela ambos bordes en el token cyan base.

Definition of Done adicional: contrato SVG e IDs validados por prueba
estructural, escena visible en smoke browser, inspección en 1280×720 y
390×844 sin solapamiento/scroll, typecheck/tests/builds local-Poki-CrazyGames
correctos y ningún cambio en estado, reglas, input o timestep de simulación.

## Estado de implementación — 26-08-2026

La primera base ejecutable de la Fase 0 ya está creada en el directorio de trabajo:

- `package.json`, `vite.config.ts` y `tsconfig.json` fijan Vite + TypeScript + PixiJS 8.20.0;
- `src/presentation/viewport/ViewportTransform.ts` mantiene un mundo lógico 1280×720 sin estirar;
- `ViewportTransform` presenta 720×1280 en portrait y 1280×720 en landscape, sin overlay que obligue a rotar;
- `src/input/InputManager.ts` acepta pointer/touch y WASD, ZQSD o flechas;
- `src/simulation/PlayerModel.ts` contiene movimiento fijo y límite circular sin depender de Pixi;
- `src/platform/local/LocalPlatform.ts` deja aislada la futura integración de SDK;
- `src/presentation/PixiGameView.ts` dibuja una arena geométrica mínima y la figura controlable;
- `.github/workflows/deploy.yml` prepara la publicación de `dist/local` en GitHub Pages;
- `src/spikes/RenderingSpike.ts` permite comparar 500 `Sprite`, `GraphicsContext` compartido y pool desde GitHub Pages con `?spike=rendering`;
- `src/spikes/AudioSpike.ts` comprueba desbloqueo, latencia y retorno de visibilidad de Web Audio desde `?spike=audio`;
- `src/audio/AudioService.ts` implementa el adaptador Web Audio integrado: música procedural diferida, cues básicos y pausa/reanudación sin importar la simulación;
- `docs/performance/F0_SPIKES.md` documenta el protocolo y conserva las mediciones por dispositivo;
- ejecución limpia aportada desde Android Chrome: `Sprite` 59.95 FPS, `GraphicsContext` 59.94 FPS y pool 59.94 FPS, con p95 de 16.80 ms y latencia base de audio de 3.0 ms;
- `src/simulation/ArenaModel.ts` inicia Fase 1 con una expansión de arena configurable y pruebas de su radio/límite;
- `src/content/enemies/EnemyDefinitions.ts` define Chaser, Fast y Tank sin modificar el motor al añadir variantes;
- `src/simulation/combat/CombatSimulation.ts` compone `EnemySystem` y `CombatWeaponSystem`, y coordina Laser, daño, muerte, XP directa y eventos;
- `src/simulation/enemies/EnemySystem.ts` separa ciclo de vida, spawn, movimiento, contacto y consultas espaciales de enemigos del coordinador de combate;
- `src/simulation/combat/CombatWeaponSystem.ts` concentra Projectile, Orbit y Chain Lightning detrás de una frontera de armas; `StressCombatScenario.ts` mantiene el benchmark de pools como escenario separado y reutiliza el pool real;
- `src/presentation/pixi/` divide arena, entidades, armas, hazards y jugador en vistas Pixi pequeñas, con `PixiGameView` como fachada;
- `src/app/Game.ts` extrae la coordinación de la run, loop fijo, resize, lifecycle, pausa, level-up, HUD y plataforma fuera de `main.ts`;
- `src/simulation/combat/EntityPools.ts` y `src/simulation/spatial/SpatialGrid.ts` cubren el churn y la broad-phase del slice; no se reserva pool para pickups de XP;
- `?stress=1` inicializa el escenario de 250 enemigos y 300 proyectiles para la puerta de rendimiento de Fase 2;
- `?boss=1` permite probar el boss desde el umbral de 4:20 sin jugar los minutos previos; la prueba browser comprueba su aparición y no altera la run normal;
- medición manual aportada desde Android Chrome en `?stress=1`: estable en 60 FPS al estar quieto y con picos de 120 FPS al mover; modelo y preset Low aún no registrados;
- `src/simulation/progression/LevelProgression.ts` pausa la run al alcanzar el umbral de XP y `src/ui/level-up/LevelUpOverlay.ts` ofrece tres cartas funcionales;
- `UpgradeDefinition` declara `maxStacks` y `requires`; `UpgradeApplier` registra acumulaciones y `Game` entrega al overlay sólo cartas aplicables, evitando adquisiciones repetidas o mejoras sin prerrequisito;
- `UpgradeApplier` expone previews numéricos `antes → después` y `LevelUpOverlay` los presenta sin duplicar reglas de simulación;
- `src/platform/save/SaveStore.ts` define schema v1, migración/normalización y `LocalSaveStore` usa `localStorage` con fallback en memoria y límite de payload;
- `PlatformAdapter` compone `PlatformLifecycle`, `AdService` y `SaveStore`; `Game` consume lifecycle/guardado y la implementación local mantiene anuncios simulados aislados;
- `Game` detecta muerte del jugador, crea un `RunSummary`, actualiza la mejor marca mediante `SaveStore` y muestra un overlay responsive con reinicio;
- Los modelos y pools de simulación exponen `reset()`; el botón de reinicio reutiliza sistemas y vuelve a `playing` sin recargar la página;
- `src/content/weapons/WeaponDefinitions.ts` y `CombatSimulation` incorporan Orbit (contacto orbital) y Chain Lightning (hasta tres saltos con telegraph visual);
- `src/content/upgrades/UpgradeDefinitions.ts` contiene 11 mejoras data-driven, con cinco efectos adicionales para ritmo, alcance, daño, mitigación y doble emisor;
- `src/ui/PauseOverlay.ts` detiene la simulación al perder visibilidad/foco y permite reanudar con un target táctil amplio;
- `src/content/hazards/LaserDefinition.ts` y `src/simulation/hazards/LaserHazard.ts` incorporan Laser con telegraph, ataque, recuperación y escape perpendicular comprobable;
- `src/content/enemies/EnemyDefinitions.ts` añade la variante `elite`, reutilizando pool, grid, colisiones y XP; `EnemySpawnDefinitions.ts` la selecciona de forma determinista desde 2:00;
- `ArenaModel` ejecuta dos expansiones (1:00 y 3:00) con mesetas intermedias y pulsos de resonancia expuestos al renderer;
- `src/content/run/DifficultyDefinitions.ts` centraliza seis fases de presión de spawn, con pruebas de monotonicidad y hitos deterministas; `EnemySpawnDefinitions.ts` centraliza la mezcla temporal de enemigos con perfiles tipados y selección determinista;
- `CombatRenderState` expone contratos de render reducidos y de solo lectura para enemigos, proyectiles, órbitas y cadenas, sin entregar campos mutables de gameplay a las vistas;
- `WebAudioService` trata el constructor y las operaciones de lifecycle de Web Audio como una mejora opcional: fallos de permisos, WebView o recursos degradan a silencio sin rechazos no controlados;
- `playwright.config.ts` mantiene un smoke desktop y añade un proyecto Pixel 5 emulado con una prueba de drag touch; la instalación reproducible es `npx playwright install chromium` y CI la ejecuta antes del smoke;
- `src/app/GameState.ts`, `src/app/Game.ts`, `src/simulation/progression/UpgradeApplier.ts`, `src/simulation/combat/CombatRenderState.ts`, `src/simulation/enemies/EnemySystem.ts`, `src/simulation/combat/CombatWeaponSystem.ts`, `src/simulation/bosses/BossSystem.ts` y `src/presentation/pixi/` avanzan la consolidación arquitectónica: fases tipadas, transiciones terminales/reinicio/victoria, runtime y upgrades fuera del bootstrap, contrato de render desacoplado y sistemas/vistas separados;
- `src/content/bosses/BossDefinition.ts` centraliza el umbral, movimiento orbital, telegraphs, daño, radio y hueco seguro; `BossSystem` mueve al boss de forma determinista, alterna barrido/anillo y reserva un slot del pool normal para garantizar su aparición;
- `src/presentation/pixi/BossView.ts` representa boss, barra de vida y telegraphs sin decidir colisiones ni daño; su paleta RGB está separada y validada para impedir valores incompatibles con Pixi;
- `src/ui/GameHud.ts` muestra tiempo, vida, XP y bajas durante la partida;
- `npm run typecheck`, `npm test`, `npm run test:browser`, `npm run build:poki` y `npm run build:crazygames` pasan (88 tests unitarios/integración y 8 smoke tests de navegador: 7 desktop + 1 Pixel 5 emulado); el workflow instala Chromium, ejecuta esas puertas y sólo entonces publica `dist/local`.

La shell responsive, la compatibilidad móvil y los spikes están publicados en `main`. La ejecución limpia confirma que las tres rutas sostienen aproximadamente 60 FPS en el teléfono disponible; se adopta `Sprite` reutilizable como representación de entidades repetidas por su menor complejidad de contenido. Fase 0 queda cerrada, Fase 1 tiene dos expansiones con resonancia y Fase 2 ya cuenta con el combate gris inicial, un preset de stress reproducible y una medición manual favorable. Fase 3 continúa con level-up pausado, once mejoras data-driven, Orbit y Chain Lightning, pausa de lifecycle, límites/prerrequisitos de cartas, previews numéricos, guardado versionado y servicios de plataforma separados; Fase 4 avanza con Laser telegraphed, variante elite determinista, curva de spawn por fases y segunda expansión de arena. Fase 5 ya tiene un boss móvil con dos patrones y flujo de victoria. La consolidación arquitectónica mantiene estado tipado, runtime separado del bootstrap, contrato de render, sistemas de enemigos/armas/boss separados, vistas Pixi separadas, pantalla de inicio en fase `menu` y flujos de game-over/victoria con resumen y reinicio in-place; quedan pendientes repetir el encuentro corregido en móvil, balance de valores, spike comparativo de FX y la puerta humana de la run completa.

## Cierre terminal: derrota legible y resumen diferido - 01-09-2026

La muerte del jugador se trata como una escena de presentacion acotada, no como
un cambio de reglas. `PlayerView` mantiene sus piezas SVG cacheadas y las separa
durante 2.2 s; `TerminalFxView` anade un estallido de 10 fragmentos reutilizados,
un anillo de mayor radio y un lavado gris overscan que cubre landscape y portrait.
El lavado se sostiene hasta el resumen para evitar un corte brusco al terminar
la separacion de piezas.
La receta `player-defeated` de ZzFX aporta un tono grave descendente; si el
audio no esta desbloqueado, el flujo continua en silencio.

El resumen de game-over/victoria se agenda 3 s despues de la transicion terminal
para que la animacion pueda verse sin que el DOM intercepte la escena. El timer
se cancela al reiniciar o apagar el runtime y no modifica el timestep, la
simulacion, la puntuacion ni el contrato de victoria. La capacidad sigue fija y
`prefers-reduced-motion` evita el burst conservando el tono informativo.

La decision sigue las practicas de game feel de combinar timing, composicion,
particulas y sonido, pero con el presupuesto movil del proyecto: [GDC Vault -
Game Feel: Why Your Death Animation Sucks](https://www.gdcvault.com/play/1022759/Game-Feel-Why-Your-Death)
y el estudio de [features que influyen en impact feel](https://arxiv.org/abs/2208.06155).
Antes de aumentar filtros o particulas se debe repetir la puerta de 60 FPS en el
telefono de referencia y comparar Low/Medium/High.

## Feedback de disparo y estelas de proyectil - 01-09-2026

El primer bloque de accion del player queda integrado sin introducir eventos de
simulacion por disparo: `Game` observa el estado pooled del ultimo burst y
condensa cualquier rafaga del mismo frame en un pulso visual y un cue ZzFX.
`PlayerView` anima recoil local durante 90 ms y dibuja el destello en la boca
seleccionada; el cuerpo de gameplay no escala ni se mueve.

`ProjectileTrailView` usa una sola `Graphics` y un historial de ranuras activas
para dibujar una linea corta alineada con la velocidad. El trail no aparece en
Low, se limita a 64 segmentos en Medium y 120 en High, y se limpia al reciclar
o reiniciar. Los proyectiles siguen siendo sprites pooled y su movimiento,
cadencia, dano y colisiones permanecen en `CombatWeaponSystem`.

La puerta de esta entrega exige verificar en movil el destello/recoil, que el
trail no tape enemigos ni telegraphs, y que `?stress=1` conserve el presupuesto.

## Origen exacto de disparo y carta Doble ca\u00f1\u00f3n - 01-09-2026

`WeaponDefinitions` centraliza las dos anclas de boca en el mismo marco SVG que
usa el player. `CombatWeaponSystem` rota esa geometria con la direccion del
objetivo: la configuracion base alterna una boca por ataque y coloca el
proyectil en ese origen, mientras que `twin_emitters` dispara desde ambas.

`ShotRenderState` es un descriptor estable y reutilizado con direccion, mascara
de bocas y origen de cada emisor. `PlayerView` recibe ese descriptor, orienta
temporalmente el arma hacia el objetivo y dibuja uno o dos destellos sobre el
origen exacto; la presentacion no vuelve a deducir la posicion desde un
proyectil que ya avanzo.

La carta `Doble ca\u00f1\u00f3n` se integra mediante `UpgradeApplier`, tiene una sola
acumulacion y permanece separada de la geometria SVG. El stress usa el mismo
calculo de origen, pero la fachada visual sigue condensando rafagas para no
saturar audio ni GPU. La puerta humana exige comprobar alternancia, doble
emisor, recoil y alineacion bala/destello en movil real.

## Muerte especial del boss - 01-09-2026

La derrota del boss ya no comparte exactamente la receta del player. Durante
1.2 s `TerminalFxView` dibuja un colapso en tres pasos: anillo inicial, dos
anillos que se separan con el nucleo comprimiendose y un burst radial final.
Los elementos son `Graphics` reutilizados y ocho fragmentos del pool; no se
crean sprites ni entidades de simulacion al morir. El resumen sigue diferido
3 s, por lo que la victoria conserva lectura sin convertirse en una
cinematica bloqueante.

La implementacion aplica `beginPath()` para cada circulo independiente y
mantiene `prefers-reduced-motion`, portrait/landscape y los presupuestos
Low/Medium/High. La puerta humana restante es repetir `?boss=1` en el telefono
real y confirmar desplazamiento, telegraphs, derrota y reinicio sin errores.

## Investigacion y hoja de ruta - canones y skins de proyectil - 01-09-2026

La investigacion confirma que el enfoque es viable para GitHub Pages, Poki y
CrazyGames si el SVG se usa como fuente de arte y se rasteriza una sola vez a
texturas Pixi compartidas. Pixi recomienda reutilizar `GraphicsContext`, no
limpiar y reconstruir geometria en cada frame, y preferir sprites/spritesheets
para elementos repetidos. Los filtros son utiles para un brillo premium, pero
son operaciones por pixel y deben quedar limitados a pocos elementos.
`ParticleContainer` es una opcion de alto rendimiento para particulas ligeras,
aunque su API v8 es experimental y no debe ser el primer camino del proyecto.

La decision de contenido para la siguiente fase es:

- cada skin puede declarar una variante de emisor/canon y un paquete visual de
  proyectil sin tocar `damage`, `lifetime`, cadencia, colisiones ni velocidad;
- la simulacion conserva una direccion recta determinista. Una bala curva se
  representara como una desviacion visual del trail o una animacion de sprite,
  nunca como una curva de gameplay, para que el cosmetic no cambie la fisica;
- los cuerpos SVG de bala se convierten a texturas cacheadas y los proyectiles
  siguen siendo sprites pooled. Las estelas se dibujan con una receta pooled:
  recta, arco visual, luminosa o humo;
- Low desactiva trail y filtros; Medium usa pocos segmentos y humo corto; High
  permite mas segmentos y un glow acotado. Nunca se crea una textura, Graphics,
  filtro o particula por disparo;
- el menu de skins seleccionara el paquete de bala equipado junto a la skin del
  jugador. El guardado y el contrato de render solo se amplian cuando exista
  ese consumidor, evitando infraestructura especulativa.

Orden recomendado: (1) ampliar los emisores SVG manteniendo las anclas del
marco `64x64`; (2) introducir un `ProjectileSkinDefinition` data-driven y un
pool de presentacion; (3) probar las cuatro recetas visuales con el mismo
proyectil logico; (4) conectar desbloqueo/equipamiento al locker; (5) medir
`?stress=1` en el telefono de referencia antes de aceptar mas glow o particulas.

Referencias tecnicas primarias: [PixiJS Textures](https://pixijs.com/8.x/guides/components/textures),
[PixiJS Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics),
[PixiJS Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips),
[PixiJS ParticleContainer](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)
y [PixiJS Filters](https://pixijs.com/8.x/guides/components/filters).
