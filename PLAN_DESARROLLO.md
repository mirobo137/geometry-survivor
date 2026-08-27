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
- `docs/performance/F0_SPIKES.md` documenta el protocolo y conserva las mediciones por dispositivo;
- ejecución limpia aportada desde Android Chrome: `Sprite` 59.95 FPS, `GraphicsContext` 59.94 FPS y pool 59.94 FPS, con p95 de 16.80 ms y latencia base de audio de 3.0 ms;
- `src/simulation/ArenaModel.ts` inicia Fase 1 con una expansión de arena configurable y pruebas de su radio/límite;
- `src/content/enemies/EnemyDefinitions.ts` define Chaser, Fast y Tank sin modificar el motor al añadir variantes;
- `src/simulation/combat/CombatSimulation.ts` compone `EnemySystem` y `CombatWeaponSystem`, y coordina Laser, daño, muerte, XP directa y eventos;
- `src/simulation/enemies/EnemySystem.ts` separa ciclo de vida, spawn, movimiento, contacto y consultas espaciales de enemigos del coordinador de combate;
- `src/simulation/combat/CombatWeaponSystem.ts` concentra Projectile, Orbit, Chain Lightning y stress detrás de una frontera de armas;
- `src/presentation/pixi/` divide arena, entidades, armas, hazards y jugador en vistas Pixi pequeñas, con `PixiGameView` como fachada;
- `src/app/Game.ts` extrae la coordinación de la run, loop fijo, resize, lifecycle, pausa, level-up, HUD y plataforma fuera de `main.ts`;
- `src/simulation/combat/EntityPools.ts` y `src/simulation/spatial/SpatialGrid.ts` cubren el churn y la broad-phase del slice; no se reserva pool para pickups de XP;
- `?stress=1` inicializa el escenario de 250 enemigos y 300 proyectiles para la puerta de rendimiento de Fase 2;
- medición manual aportada desde Android Chrome en `?stress=1`: estable en 60 FPS al estar quieto y con picos de 120 FPS al mover; modelo y preset Low aún no registrados;
- `src/simulation/progression/LevelProgression.ts` pausa la run al alcanzar el umbral de XP y `src/ui/LevelUpOverlay.ts` ofrece tres cartas funcionales;
- `UpgradeDefinition` declara `maxStacks` y `requires`; `UpgradeApplier` registra acumulaciones y `Game` entrega al overlay sólo cartas aplicables, evitando adquisiciones repetidas o mejoras sin prerrequisito;
- `UpgradeApplier` expone previews numéricos `antes → después` y `LevelUpOverlay` los presenta sin duplicar reglas de simulación;
- `src/platform/save/SaveStore.ts` define schema v1, migración/normalización y `LocalSaveStore` usa `localStorage` con fallback en memoria y límite de payload;
- `PlatformAdapter` compone `PlatformLifecycle` y `AdService`; `Game` consume solo el lifecycle y la implementación local mantiene anuncios simulados aislados;
- `src/content/weapons/WeaponDefinitions.ts` y `CombatSimulation` incorporan Orbit (contacto orbital) y Chain Lightning (hasta tres saltos con telegraph visual);
- `src/content/upgrades/UpgradeDefinitions.ts` contiene 10 mejoras data-driven, con cinco efectos adicionales para ritmo, alcance, daño y mitigación;
- `src/ui/PauseOverlay.ts` detiene la simulación al perder visibilidad/foco y permite reanudar con un target táctil amplio;
- `src/content/hazards/LaserDefinition.ts` y `src/simulation/hazards/LaserHazard.ts` incorporan Laser con telegraph, ataque, recuperación y escape perpendicular comprobable;
- `src/content/enemies/EnemyDefinitions.ts` añade la variante `elite`, reutilizando pool, grid, colisiones y XP con selección determinista desde 2:00;
- `ArenaModel` ejecuta dos expansiones (1:00 y 3:00) con mesetas intermedias y pulsos de resonancia expuestos al renderer;
- `src/content/run/DifficultyDefinitions.ts` centraliza seis fases de presión de spawn, con pruebas de monotonicidad y hitos deterministas;
- `src/app/GameState.ts`, `src/app/Game.ts`, `src/simulation/progression/UpgradeApplier.ts`, `src/simulation/combat/CombatRenderState.ts`, `src/simulation/enemies/EnemySystem.ts`, `src/simulation/combat/CombatWeaponSystem.ts` y `src/presentation/pixi/` avanzan la consolidación arquitectónica: fases tipadas, transiciones terminales/reinicio, runtime y upgrades fuera del bootstrap, contrato de render desacoplado y sistemas/vistas separados;
- `src/ui/GameHud.ts` muestra tiempo, vida, XP y bajas durante la partida;
- `npm run typecheck`, `npm test`, `npm run build:local`, `npm run build:poki` y `npm run build:crazygames` pasan (48 tests).

La shell responsive, la compatibilidad móvil y los spikes están publicados en `main`. La ejecución limpia confirma que las tres rutas sostienen aproximadamente 60 FPS en el teléfono disponible; se adopta `Sprite` reutilizable como representación de entidades repetidas por su menor complejidad de contenido. Fase 0 queda cerrada, Fase 1 tiene dos expansiones con resonancia y Fase 2 ya cuenta con el combate gris inicial, un preset de stress reproducible y una medición manual favorable. Fase 3 continúa con level-up pausado, diez mejoras data-driven, Orbit y Chain Lightning, pausa de lifecycle, límites/prerrequisitos de cartas y la extracción del aplicador de upgrades; Fase 4 avanza con Laser telegraphed, variante elite determinista, curva de spawn por fases y segunda expansión de arena. La consolidación arquitectónica ya tiene estado tipado, runtime separado del bootstrap, contrato de render, sistemas de enemigos/armas separados y vistas Pixi separadas; quedan pendientes smoke test manual en móvil, balance de valores, FX adicionales, guardado y el flujo de game over/reinicio.
