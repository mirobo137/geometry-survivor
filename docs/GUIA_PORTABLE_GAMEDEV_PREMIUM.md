# Guía portátil para construir juegos 2D premium y ligeros

Versión 1.0 · 11-09-2026

Esta guía recopila decisiones técnicas y visuales que demostraron ser útiles
durante el desarrollo de Geometry Survivor. Está escrita para reutilizarse en
otro juego con TypeScript, PixiJS, Canvas/WebGL o una arquitectura equivalente.

Los nombres `Solar Rail`, `Pulse Crest`, `Aster Loom`, `Prism Aegis`, `Arc Relay`,
`Hull Fracture`, `Breach Petals`, `Nacre` y las seis familias aprobadas del juego
original son referencias de acabado, no assets ni requisitos del nuevo proyecto.
La calidad debe repetirse; las siluetas, colores y efectos no deben copiarse.

## 1. Principios que sí conviene transportar

1. El juego necesita un gancho jugable visible desde los primeros segundos.
   El arte por sí solo no diferencia un survivor-like.
2. Primero se prueba un vertical slice corto y completo. Una partida de 4–6
   minutos con inicio, decisión, amenaza, boss y resultado enseña más que mucho
   contenido aislado.
3. La dificultad debe crecer primero mediante composición, densidad, patrones,
   frecuencia y espacio disponible; subir HP o daño es la última calibración.
4. Una amenaza debe crear una decisión. Si sólo añade ruido, cobertura o daño
   inevitable, empeora el juego aunque se vea espectacular.
5. El acabado premium no es “más glow”. Es origen físico, silueta, materiales,
   espacio negativo, animación temporal y lectura clara a tamaño real.
6. Low/Medium/High cambian fidelidad visual, nunca reglas, daño, colisiones,
   targeting, velocidad ni información esencial.
7. Los tests protegen estructura y comportamiento. La diversión, la legibilidad
   artística y la comodidad móvil necesitan revisión humana.
8. Una referencia aprobada fija el nivel de acabado, no autoriza copiarla ni
   aumentar presupuesto sin medir.

## 2. Flujo de trabajo para cualquier modelo o desarrollador

Antes de editar:

1. Leer la solicitud actual y el plan del proyecto.
2. Inspeccionar código, consumidores, contratos y tests existentes.
3. Identificar una única responsabilidad y una única subtarea.
4. Escribir el contrato antes de dibujar o programar.
5. Implementar la regla en el dominio correcto.
6. Construir la presentación usando snapshots/eventos ya existentes.
7. Probar el caso normal, el límite, el fallo, pausa, reset y resize.
8. Registrar qué fue automático, qué fue medido y qué sigue pendiente de ojos
   humanos.

No rehacer todo el juego para mejorar un asset. No crear infraestructura futura
sin un consumidor real. No declarar “premium”, “barato” o “optimizado” sólo
porque el código compile.

## 3. Arquitectura que evita regresiones

La dirección de dependencias recomendada es:

```text
CONTENT → SIMULATION → SNAPSHOTS / EVENTS → PRESENTATION
INPUT   → SIMULATION
AUDIO / FX / UI ← SNAPSHOTS / EVENTS
PLATFORM ADAPTERS → lifecycle / ads / save
```

### Simulation

Contiene estado y reglas: movimiento, enemigos, armas, daño, colisiones, arena,
spawn, progresión y dificultad. No importa PixiJS, DOM, audio ni SDKs.

### Content

Contiene definiciones tipadas: armas, enemigos, hazards, actos, upgrades,
paletas y presupuestos. Añadir una variante común no debe exigir modificar el
motor.

### Presentation

Representa snapshots y eventos. Puede interpolar, animar, tintar, ocultar o
mostrar, pero no decide daño, drops, XP, cooldown, dificultad o targeting.

### UI y plataforma

La UI emite comandos y conserva accesibilidad. La plataforma implementa
lifecycle, anuncios y guardado mediante adaptadores. Un timeout, adblock, error
de SDK o storage bloqueado debe convertirse en un resultado controlado, nunca
en una pantalla congelada.

Reglas estructurales:

- preferir composición sobre jerarquías profundas de herencia;
- mantener una responsabilidad principal por módulo;
- no convertir `Game`, `World`, `Manager` o `EventBus` en un objeto universal;
- usar eventos tipados sólo cuando desacoplan consumidores reales;
- centralizar configuración, pero no esconder dependencias en `utils.ts`;
- crear una abstracción cuando exista un segundo consumidor real.

## 4. Loop, tiempo y determinismo

- Simulación con timestep fijo, normalmente 60 Hz, acumulador y delta máximo.
- Render independiente con interpolación cuando sea necesario.
- Máximo de pasos de recuperación para evitar el “spiral of death”.
- La velocidad y las colisiones no dependen del FPS ni del refresh rate.
- RNG con semilla para reproducir bugs, capturas y escenarios de balance.
- `pause`, level-up, anuncio, background y lifecycle deben congelar la
  simulación; el resize sólo cambia presentación.
- No usar `Date.now()` ni `performance.now()` para reglas, trayectorias o daño.
  El reloj de simulación debe ser la única fuente temporal del gameplay y FX.
- IA, targeting y spawn pueden actualizarse a menor frecuencia sólo después de
  medir que no se pierde respuesta perceptible.

## 5. Coordenadas, responsive y móvil

Separar tres espacios:

```text
WORLD SPACE       unidades estables de simulación
LOGICAL VIEWPORT  composición fija por orientación
CSS / DEVICE      tamaño físico y DPR del dispositivo
```

Aplicar una escala uniforme:

```ts
scale = Math.min(containerWidth / logicalWidth,
                 containerHeight / logicalHeight);
```

La misma matriz se usa para render e input. El área sobrante sólo contiene
fondo decorativo; nunca concede más mundo, enemigos o información por aspect
ratio. Portrait y landscape pueden tener viewports lógicos distintos, pero la
simulación conserva el mismo mundo y las mismas reglas.

Requisitos prácticos:

- `width/height: 100%`, `100dvh`, `overflow: hidden` y
  `overscroll-behavior: none`;
- `touch-action: none` en la superficie jugable;
- `ResizeObserver` agrupando cambios una vez por frame;
- HUD dentro de safe areas (`env(safe-area-inset-*)`);
- joystick o drag dinámico con un dedo, sin botones pequeños en combate;
- hit-area táctil mínima aproximada de 44×44 CSS px aunque el icono sea menor;
- no depender de hover y no tapar completamente al player con el dedo;
- manejar `pointercancel`, blur, `visibilitychange`, background y regreso.

Validar resize durante gameplay, pausa, level-up, game-over, anuncio simulado y
ambas orientaciones. Probar 30/60/144 Hz si el navegador lo permite y un
móvil modesto real; una PC potente no certifica rendimiento móvil.

## 6. Elegir SVG, PNG, Graphics o Sprite

| Necesidad | Representación preferida |
|---|---|
| UI responsive, iconos, cartas, botones, texto | HTML/CSS + SVG inline |
| Asset estático repetido | textura compartida + `Sprite` |
| Forma simple repetida y recoloreable | `GraphicsContext` compartido, medido |
| Línea, arco, warning o frontera dinámica simple | `Graphics`/mesh acotado |
| Cientos de entidades o FX | textura/atlas + pool |
| Material pintado, humo, porcelana u orgánico | PNG/WebP transparente, medido |
| Asset complejo estático | rasterizado una vez o atlas |

SVG no es automáticamente más barato que PNG. Un SVG pequeño puede producir
una textura GPU grande; un PNG puede ahorrar parseo, pero no garantiza más FPS.
El coste real depende de descarga, resolución, memoria, área cubierta,
solapamiento, filtros, draw calls y frecuencia de actualización.

### Reglas de ciclo de vida

- Parsear/rasterizar una vez, nunca dentro del loop caliente.
- Compartir textura, `GraphicsContext` y fuente entre instancias.
- Definir owner y destrucción explícita por escena o aplicación.
- Cargar de forma diferida al equipar o al entrar a la escena que lo necesita.
- Tener fallback si la carga falla o llega después de destruir la vista.
- En PixiJS 8, verificar la forma vigente de cargar imágenes: no asumir que
  `Texture.from(url)` hace la descarga que el proyecto necesita.
- No convertir cada detalle en un Sprite independiente sin un presupuesto.

## 7. Contrato universal de un asset visual

Antes del SVG, PNG o compositor, documentar:

```text
id estable / familia / rol
verbo visual y función de gameplay
referencia aprobada y diferencias deliberadas
viewBox y ancla lógica
frente y centro de masa
capas y materiales
consumidores y modo de render
tamaño mínimo y máximo de instancias
estados: normal, warning, active, recovery, disabled...
Low / Medium / High / reduced-motion
pausa, reset, muerte y ownership
presupuesto de paths, texturas, sprites y bytes
pruebas estructurales y revisión humana pendiente
```

La colisión, el punto de salida de una bala y el tamaño de daño pertenecen a la
simulación. La apariencia no puede modificarlos silenciosamente.

## 8. SVG code-first

Todo SVG reutilizable debe ser código legible, determinista y revisable en diff.

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="-32 -32 64 64"
     preserveAspectRatio="xMidYMid meet"
     role="img"
     aria-labelledby="asset-title asset-desc">
  <title id="asset-title">Nombre</title>
  <desc id="asset-desc">Función visual breve</desc>
  <g id="asset-body">...</g>
  <g id="asset-core">...</g>
</svg>
```

Reglas:

- `viewBox` y ancla predecibles; no padding invisible para corregir composición;
- grupos semánticos (`body`, `core`, `rear`, `wings`, `accent`, `warning`);
- `circle`, `ellipse`, `rect`, `polygon`, `line` y paths simples antes que miles
  de puntos;
- IDs prefijados por asset; ningún `gradient1`, `clip0` o ID genérico;
- `currentColor`/tokens cuando el consumidor DOM deba recolorear;
- colores explícitos cuando Pixi cargue el asset fuera del DOM;
- sin `script`, handlers, `foreignObject`, `<image>` embebido, fuentes remotas,
  URLs externas o filtros complejos sin medición;
- no convertir texto funcional a paths;
- no duplicar master y variante sin explicar la diferencia funcional.

Para personajes top-down: declarar frente, centrar el ancla, separar sólo las
piezas cuyo movimiento se perciba y conservar el mismo frame en todas. Una
respiración de 1–3% o una oscilación de 0.1–0.2 rad suele bastar. La animación
debe usar transforms sobre texturas cacheadas, no regenerar XML.

Al rasterizar piezas modulares en Pixi, pasar un `frame` explícito igual al
`viewBox` común. El recorte automático por límites visibles puede cambiar el
centro de cada textura y desalinear la nave.

## 9. La regla crítica de PixiJS: evitar la línea “a la nada”

`Graphics`/`GraphicsContext` conserva un punto activo después de `fill()` o
`stroke()`. Si se añade un arco, curva o línea independiente sin separar el
subpath, Pixi puede unir el inicio nuevo con el punto anterior, con frecuencia
desde `(0,0)`. El resultado es una diagonal fantasma hacia una figura o hacia
la nada.

Regla obligatoria para cada arco, curva o grupo independiente:

```ts
graphics
  .beginPath()
  .moveTo(startX, startY)
  .arc(centerX, centerY, radius, startAngle, endAngle)
  .stroke(style);
```

También:

- usar `moveTo()` antes de cada línea independiente;
- cerrar explícitamente cada polígono;
- separar un arco que cruza `2π` en subpaths válidos;
- no encadenar `circle().stroke().arc().stroke()` esperando que `clear()`
  arregle el cursor;
- recordar que `clear()` limpia geometría, pero no separa subpaths creados
  posteriormente en el mismo frame;
- probar siempre arco normal y wrap-around.

Esta regla aplica a lasers, órbitas, arenas, cadenas, fondos, marcos y UI.

## 10. Receta de un efecto premium barato

Diseñar primero un frame estático a tamaño real. Si se ve plano, corregir
silueta, contraste y materiales; no apilar glow.

La gramática recomendada es:

```text
CALMA → PREPARACIÓN / TELEGRAPH → IMPACTO → RECOVERY
```

Cada efecto debe declarar:

- origen físico y dirección;
- quién posee el estado y el daño;
- duración de telegraph, attack y recovery;
- silueta y materiales por fase;
- respuesta posible del jugador;
- calidad, cantidad máxima y pooling;
- comportamiento en pausa, reset y reduced-motion.

Receta material:

1. base tinta que separa del fondo;
2. volumen o carcasa con planos medios;
3. cavidad que crea profundidad;
4. energía localizada, no blanco por toda la superficie;
5. filo, núcleo o acento con función;
6. disipación que deje claro que ya no hay daño.

Low conserva silueta, núcleo, telegraph, peligro y lectura direccional. Medium
y High agregan filamentos, restos, pulsos o alpha, pero no información nueva.
Un filtro blur por entidad, un glow permanente o una sacudida por cada golpe no
son sustitutos de una forma bien diseñada.

### Patrones probados y generalizables

- **Hazard lineal:** emisores en el origen, aviso discontinuo, cuerpo afinado
  hacia los extremos, núcleo estrecho, flash breve y recuperación fragmentada.
  El cuerpo visible debe coincidir con el ángulo de simulación.
- **Pulso radial:** aviso segmentado, banda anular activa con carcasa y filo,
  dirección comunicada por geometría, recuperación sin cuerpo dañino. No pintar
  una zona segura opaca: el jugador, enemigos y otros peligros deben seguirse
  viendo.
- **Anillo del boss:** si existe un hueco seguro real, mostrar el aro en dos
  tramos y marcar el corredor con alpha bajo, brackets y ticks. La decoración no
  es una hitbox y debe usar exactamente los ángulos de simulación.
- **Cadena:** underlay oscuro, cuerpo de color, núcleo fino, quiebres
  deterministas, nodos de transferencia y módulo en el objetivo. No dibujar una
  recta genérica ni generar ruido aleatorio por frame.
- **Impacto:** usar una silueta propia de material fracturado, pétalos o placas;
  no reciclar un anillo completo para todo. El player recibe FX sólo después de
  daño aceptado; un escudo que absorbió el golpe no debe fingir daño al casco.
- **Órbita persistente:** carcasa, apertura oscura, núcleo y halo segmentado;
  transforms por frame, no telegraph inventado desde la vista. No agrandar la
  apariencia para aparentar más daño.

## 11. Armas, balas y curvas

Una bala premium necesita cabeza reconocible, cuerpo longitudinal, cola afinada
y estela que explique desplazamiento. La estela debe:

- seguir muestras de la misma trayectoria que usa la cabeza;
- nacer en la boca, no delante de ella;
- usar alpha y scale longitudinal, con punta y desvanecimiento final;
- reutilizar pocos sprites o una textura horneada;
- quedar detrás de la cabeza;
- desaparecer en Low si es puramente decorativa, sin ocultar la bala.

Para una curva cosmética, la preview y el runtime deben muestrear la misma
función. Ejemplo genérico:

```ts
offset = amplitude * Math.sin(Math.PI * t / duration) ** 2;
```

La posición y la derivada deben ser continuas, regresar al eje y orientar la
cabeza con la tangente. Alternar el signo por boca puede evitar simetría rígida.
Una curva cosmética no es homing, no cambia colisión y no garantiza alcanzar un
objetivo. Si la curva debe afectar obstáculos o daño, la trayectoria debe ser
autoritativa y compartida por simulación y render.

Cada nuevo cañón, bala o estela debe cambiar una firma real —silueta,
distribución de planos, material, energía o trayectoria— y no ser un recolor,
una escala o un halo sobre el mismo diseño.

## 12. Enemigos, player y boss modulares

Diseñar por rol, no por color:

- perseguidor: proa y salidas traseras;
- rápido: aguja y alas retrasadas;
- tanque: proa truncada, hombros y reactor empotrado;
- élite: corona o separación propia, no una escala del perseguidor;
- boss: arquitectura de mando, reactor y planos de mayor escala, no enemigo
  común ampliado.

Procedimiento:

1. comparar tres siluetas diferentes en negro;
2. elegir una por función y proporción;
3. resolver masa, componentes y acentos antes del detalle;
4. construir chasis oscuro → planos → bisel → cavidad → energía;
5. preservar espacio negativo sin mentir sobre la colisión;
6. separar rear/wings/hull/cockpit sólo si el movimiento o la muerte lo exige;
7. usar un master compuesto en Low y piezas cacheadas en Medium/High;
8. probar giro, velocidad cero, impacto, muerte, pausa y reset.

La muerte puede separar piezas, pero debe usar un pool acotado y el reloj de
presentación existente. No crear una partícula por tornillo ni un sprite por
enemigo.

## 13. Arena y fondos

### Arena

La frontera jugable debe ser simultáneamente regla, feedback y firma visual.
El renderer debe consultar la misma frontera que usa el clamp del player y la
colisión de hazards. Placas, anclajes, luces y adornos exteriores no pueden
ampliar el área jugable.

Una arena adaptable a círculo, hexágono u otra forma necesita antes un contrato
de gameplay: orientación, espacio seguro, aviso, morph, muestreo y colisiones.
La decoración no debe inventar formas futuras desde el renderer.

### Fondo

El fondo debe añadir profundidad sin competir con player, enemigos, XP o hazards:

- reservar el centro para la lectura del combate;
- poner la masa más evidente en la periferia;
- usar valores inferiores a los del gameplay;
- evitar blanco, rayos finos, estrellas grandes o formas parecidas a pickups;
- escoger un verbo y tres masas distintas antes de dibujar;
- cambiar composición entre temas, no sólo color;
- rasterizar una vez y compartir una textura estática si corresponde;
- desactivar nubes/estrellas/partículas ambientales innecesarias en Low;
- ocultar recursos del tema anterior y tolerar cargas tardías/fallidas.

Una textura RGBA8 tiene como cálculo inicial `ancho × alto × 4` bytes, sin
mipmaps ni overhead. Es un límite de planificación, no una medición de memoria
GPU total ni una promesa de FPS.

## 14. UI premium y accesible

La UI debe sentirse parte del mismo universo, pero la acción debe reconocerse
antes que la decoración. Usar la gramática:

```text
placa → bisel → cavidad → acento energético → texto HTML
```

Reglas prácticas:

- una metáfora visual por icono;
- no usar hexágonos para todo;
- conservar espacio tranquilo para texto;
- reservar blanco para lectura y reflejos pequeños;
- construir biseles desde los vértices de la placa, no apilar contornos;
- texto fuera del SVG para localizarlo, adaptarlo y leerlo con accesibilidad;
- usar `aria-hidden` en iconos decorativos y texto accesible en botones;
- `focus` visible independiente de `hover`;
- `pressed`, `selected`, `disabled`, `pending`, error y éxito deben tener señal
  textual o geométrica, no sólo color o parpadeo;
- `prefers-reduced-motion` debe detener movimiento ornamental;
- usar SVG inline para controles responsive; el hit-area vive en el botón real;
- montar un sprite de símbolos una sola vez y evitar colisiones de IDs;
- no estirar un marco completo en barras o paneles de proporción arbitraria:
  usar CSS y esquinas fijas cuando corresponda.

Inspeccionar cartas y overlays reales a 24/32/48/64 px, 320/390 px de ancho,
landscape bajo, texto largo, focus, claro/oscuro y safe areas. Un catálogo de
iconos no demuestra que una carta completa sea legible.

## 15. Calidad, glow, trails y pools

Presupuesto visual inicial:

```text
prioridad: hazard crítico > player > boss > enemigos > armas > XP > FX > fondo
```

Si el presupuesto se supera, retirar en este orden:

1. partículas ambientales;
2. trails decorativos;
3. números de daño secundarios;
4. glow y filamentos;
5. nunca telegraphs, entidades o ataques reales.

Preferir glow barato: sprite principal + copia ligeramente mayor con alpha bajo
y blend medido. Preferir trails por posiciones históricas, alpha y scale. Usar
pools para proyectiles, partículas, pickups, números y FX de alto churn. No
crear arrays, texturas, paths ni sprites dentro del render caliente.

Los límites de objetos, bytes y primitivas no son benchmarks. Medir CPU, GPU,
GC, memoria, draw calls, fill-rate y frame time en el mismo escenario antes y
después de optimizar.

## 16. Audio y feedback temporal

- Desbloquear AudioContext después del primer input.
- Mantener `AudioService` separado de gameplay.
- Separar grupos de música, SFX y UI con mute/volumen persistentes.
- Limitar voces globales y repetir sonidos con cooldown o prioridad.
- Prioridad: telegraph/boss/daño del player > arma > level-up/XP > ambiente.
- Pausar o silenciar cuando la pausa o anuncio realmente comienzan.
- Restaurar al volver de background, anuncio, error o `touchend` según el caso.
- Variar ligeramente pitch de impactos repetidos sin crear caos sonoro.

Hit-stop, screen shake y squash & stretch deben ser pequeños, centralizados y
presupuestados. Un impacto normal puede durar milisegundos; uno crítico o de
boss puede ser mayor, pero nunca debe robar control táctil ni ocurrir en cada
partícula.

## 17. Telegrapher y espacio seguro

Todo peligro importante debe separar:

```text
telegraph → attack → recovery
```

Durante el telegraph el jugador debe saber qué zona está en riesgo, pero no
recibir daño. Durante el ataque la señal debe permanecer visible. En recovery
el cuerpo dañino desaparece o se diferencia claramente del residuo.

Antes de aprobar un hazard comprobar:

- existe al menos una respuesta espacial razonable;
- no nace debajo del player sin aviso;
- no se solapa con otro hazard de forma inevitable;
- el jugador puede entender dirección, alcance y timing;
- el safe pocket no está cubierto por una capa opaca;
- la dificultad no depende de mirar un color diminuto;
- pausa, reset y pérdida de foco no avanzan fases silenciosamente.

Para combinar hazards, usar arbitraje explícito. Un hazard ya iniciado no debe
cancelarse; otro puede esperar o descartarse al superar su deadline. La
frecuencia extra debe probarse como perfil opt-in antes de convertirse en
contenido authored y no debe mezclarse con una línea base.

## 18. Diseño de campaña y modo infinito

Una estructura reusable que funcionó bien:

- tres actos cortos, cada uno con regla espacial, aprendizaje y boss;
- `Quick Act` empieza limpio y repite un acto desbloqueado;
- `Expedition` enlaza actos y conserva la build;
- el final de campaña tiene victoria clara;
- `Overdrive` es un modo infinito opcional, no un cuarto acto narrativo.

Overdrive debe escalar mediante composición, densidad, frecuencia, patrones y
espacio dentro de caps. Debe conservar telegraphs, corredores seguros,
recuperación y legibilidad. No se debe multiplicar HP sin límite ni obligar al
jugador a jugar infinito para terminar la experiencia principal.

No crear selección de actos, save de Expedition ni campos de ciclos antes de
tener un consumidor real, una transición y pruebas idempotentes.

## 19. Meta, recompensas y guardado

- Una única moneda blanda evita complejidad y confusión inicial.
- Una recompensa terminal debe liquidarse una sola vez, incluso con callbacks,
  reload, revive, double reward o restart repetidos.
- Una muerte revivible permanece provisional hasta resolver la oferta; una
  victoria definitiva puede liquidarse inmediatamente.
- Revive conserva run, build y reloj; no genera una segunda recompensa.
- Una oferta rewarded no disponible, cancelada, con error o timeout no bloquea
  el juego.
- Reroll con moneda, anuncio o gratis es una decisión de producto: no inferir
  precio ni débito sin aprobación explícita.
- No guardar una run activa hasta tener snapshot determinista de simulación,
  build, acto, estado de intermisión y recompensa.
- Versionar save, mantener payload pequeño, usar defaults seguros y migraciones
  explícitas.
- Cosméticos (skins, cañones, balas, estelas y fondos) no deben conceder daño,
  targeting, colisión o ventaja oculta.

## 20. Validación por capas

### Unitarias

Probar sin renderer: fórmulas, colisiones, cooldowns, targeting, spatial grid,
upgrades, director, límites, migraciones y estados.

### Integración

Usar semilla fija, escenarios de blanco único/grupo/horda, player quieto/en
movimiento, 30/60/144 Hz, pools y eventos conectados.

### Browser smoke

Comprobar carga, primer input, movimiento, cartas, pausa, audio, anuncios
simulados, storage, resize, background/foreground, consola y requests 404.

### Visual

Capturar el renderer real, no una imitación HTML, en estados deterministas:
normal, telegraph, active, recovery, impacto, muerte, Low/High, oscuro/claro,
desktop/portrait. Las partículas aleatorias no deben bloquear snapshots.

### Manual

En cada hito jugable realizar una run real en PC y móvil: registrar dispositivo,
navegador, calidad, orientación, FPS aproximado, comprensión, daño percibido,
comodidad del input y si el resultado invita a repetir.

Tests verdes no equivalen a aprobación artística, diversión ni rendimiento en
Android físico. Separar siempre `AUTOMÁTICO OK`, `MEDIDO`, `APROBADO HUMANO` y
`PENDIENTE`.

## 21. Baseline y experimentos

Una línea base debe ser reproducible y no modificarse durante la medición:

- mismo commit, dispositivo, navegador, calidad y meta;
- registrar duración, causa, primeras decisiones, build, daño por fuente,
  conteos máximos, FPS/frame time y errores;
- no mezclar stress con runs normales;
- no mezclar un modo experimental de cadencia con el baseline;
- conservar reportes anteriores antes de borrar storage;
- repetir diez runs cuando la puerta necesite variación humana, aunque el FPS
  sea casi idéntico entre partidas.

Un experimento de ritmo debe cambiar una variable —por ejemplo intervalo de
hazard— y mantener daño, HP, spawn, geometría, recompensas y calidad iguales.
Primero usar query/config opt-in; después decidir si el valor merece entrar al
contenido authored y repetir la puerta humana.

## 22. Definition of Done reutilizable

Una feature no está cerrada hasta que:

- su intención jugable o visual está escrita;
- la autoridad de datos y estado está clara;
- simulation, presentation, UI y platform respetan sus fronteras;
- funciona en pausa, reset, resize y lifecycle;
- tiene tests de regla y límites;
- tiene captura o inspección visual en tamaño real;
- Low conserva gameplay y lectura esencial;
- el coste de paths, texturas, sprites, pools y bytes está acotado;
- no hay errores de consola ni requests inesperados;
- los builds de cada destino funcionan por separado;
- la prueba móvil y la aprobación humana están registradas por separado;
- la documentación indica exactamente qué sigue.

## 23. Plantilla para futuros encargos

```md
Feature:
Intención de gameplay / verbo visual:
Referencia aprobada y diferencias que NO se copiarán:
Autoridad de datos y estado:
Consumidores:
Silueta, materiales, espacio negativo y frente:
viewBox, ancla, pivotes y frame:
Fases: telegraph / active / recovery / idle:
Origen, dirección y zona dañina:
Low / Medium / High / reduced-motion:
Presupuesto: paths, texturas, sprites, instancias, bytes:
Pausa, reset, muerte, carga y ownership:
Representación elegida y motivo:
Tests puros e integración:
Capturas oscuro/claro, desktop/móvil y juego real:
Mediciones realizadas:
Pendiente de validación humana:
```

## 24. Fuentes de esta recopilación

En el proyecto de origen, el detalle ejecutable está distribuido en:

- `docs/design/EFECTOS_PREMIUM.md` — composición temporal y Solar Rail;
- `docs/design/ARENA_FX_PREMIUM.md` — Aster Loom y frontera adaptable;
- `docs/design/RADIAL_PULSE_FX_PREMIUM.md` — Pulse Crest;
- `docs/design/BOSS_FX_PREMIUM.md` — safe corridor y command rail;
- `docs/design/CHAIN_FX_PREMIUM.md` — Arc Relay;
- `docs/design/DAMAGE_FX_PREMIUM.md` — impactos materiales;
- `docs/design/ORBITA_PREMIUM.md` — arma persistente;
- `docs/design/FONDOS_PREMIUM.md` — composición y coste de fondos;
- `docs/design/ARTE_HIBRIDO.md` — decisión SVG/PNG y procedencia;
- `skills/geometry-survivor-svg/` — contrato, pipeline Pixi, UI, naves,
  proyectiles y validación;
- `docs/design/ACTOS_Y_META.md` — actos, Expedition y Overdrive;
- `PLAN_DESARROLLO.md` y `proyecto.md` — arquitectura, rendimiento, audio,
  plataformas, métricas y Definition of Done.

Las fuentes oficiales consultadas para las decisiones de plataforma y PixiJS
están enlazadas en `PLAN_DESARROLLO.md` y `docs/design/ARTE_HIBRIDO.md`. Para
otro proyecto hay que verificar la documentación vigente de la versión real de
PixiJS, Vite, navegador y portal antes de convertir una recomendación en código.
