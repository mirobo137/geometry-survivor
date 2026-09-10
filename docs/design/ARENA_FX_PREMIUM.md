# Aster Loom — arena de contención articulada

Revisión: 09-09-2026. Sustituye la receta inicial de nueve capas con anillos y
rombos. El usuario pidió una segunda pasada artística más ambiciosa; esta
revisión aún espera su aprobación visual.

## Intención y contrato

La arena es una máquina que mantiene habitable una región del espacio.
Su firma es el contraste entre una frontera energética continua y un bastidor
de placas separadas, con anclajes mecánicos y luz conducida por ranuras.
El centro respira y deja ver el fondo cosmético; la presencia se concentra
en los últimos 48 puntos del campo y en el montaje exterior.

El Acto I conserva su calendario círculo ↔ hexágono. El deseo futuro de
inestabilidad y otras figuras está en ACTOS_Y_META.md: requiere su contrato
jugable antes de activar cambios. Esta entrega sólo modifica presentación.

La autoridad sigue siendo ArenaModel → ArenaBoundary → ArenaView.
El borde brillante usa radio por ángulo de simulación. Placas y anclajes
son decoración exterior sin colisión. PlayerModel y LaserHazard mantienen
sus reglas; el bastidor no permite caminar más lejos.

## Receta reproducible para Luna y otros agentes

Implementación: `ArenaFrameArt.ts` construye materiales y `ArenaView.ts`
coordina frontera, fases y animación. La galería usa estas clases reales.

1. **Silueta antes de glow.** 24 placas separadas y 12 anclajes radiales.
   Mantener juntas abiertas entre placas para que se vea un ensamblaje
   articulado. No rellenar las juntas con líneas brillantes.
2. **Sección mecánica.** Cada placa tiene base tinta, cuerpo azul grisáceo,
   cara elevada, bisel selectivo y una ranura oscura con luz mint. Los acentos
   latón son pequeñas marcas de servicio cada tres placas. Evitar blanco
   a todo lo largo de la cara metálica.
3. **Anclajes con volumen.** Carcasa octogonal asimétrica en coordenadas
   radial/tangencial, hombro iluminado, cara inferior más oscura y cavidad
   longitudinal. El núcleo luminoso se afina hacia el borde. Su tamaño
   permanece fijo cuando crece la arena.
4. **Frontera inequívoca.** Riel continuo en offset cero, con base tinta de
   8 puntos, conducción teal de 3 y filo de 0.9. Los cuerpos de placas ocupan
   offsets exteriores +4 a +19; los anclajes llegan a +30. La decoración
   puede quedar recortada por el viewport al radio máximo: no ampliar cámara
   o área jugable para mostrarla.
5. **Interior abierto.** Tinte base alpha 0.2 y 16 bandas contiguas de tres
   puntos cerca del borde, con alpha progresiva 0.008 a 0.128. La transición
   debe ser discreta también sobre fondo claro. 72 marcas pequeñas de
   calibración quedan junto al riel; no extender una cuadrícula por el combate.
6. **Centro propio y subordinado.** Roseta de seis piezas oscuras con segmentos
   orbitales débiles y un único punto energético. No convertirlo en otra
   nave, pickup o zona segura.
7. **Luz que viaja.** Seis pulsos afinados persistentes se desplazan a 0.12
   rad/s por el perímetro real +2.5 puntos. Su orientación consulta la
   tangente local, así que siguen los lados durante el morph. No rotar una
   réplica circular sobre un hexágono.
8. **Fases legibles.** Aviso discontinuo ámbar de la forma objetivo;
   morph guiado por simulación; resonancia por alpha/escala; una onda de
   expansión por cambio de expansionIndex. Ninguna animación decorativa
   revela el barrido del láser antes de la fase autorizada.

Paleta canónica en ARENA_ART: tinta #080f20, metal #26394f, cara #42576a,
bisel #819799, energía #67d9ca, punto caliente #d7fff0, marca #b9a778.
El ámbar del aviso sigue separado de la energía estable.

## Geometría y adaptación

El riel y las señales muestrean 144 puntos, frente a 36 de la primera
versión: suaviza el círculo y conserva los vértices del hexágono actual.
Las bandas y placas consultan directamente getArenaRadiusAtAngle.
El ensamblaje se vuelve a construir cuando cambia radio, forma o morph;
no tiene una rama artística separada para cada figura.

Una futura forma necesita:
- contrato de gameplay aprobado: orientación, espacio seguro y aviso;
- implementación convexa en ArenaBoundary y pruebas del clamp y láser;
- calendario del acto;
- revisión de muestreo: 144 no garantiza capturar los vértices de cualquier
  polígono futuro; incluirlos explícitamente si la silueta lo necesita;
- captura con el renderer real, también durante el cambio y con boss.

Nunca simular inestabilidad moviendo el riel a una frontera distinta de la
colisión. Nunca deducir daño del metal o de sus luces.

## Presupuesto y ciclo de vida

15 Graphics persistentes: nueve capas y seis pulsos; mismo presupuesto en
Low/Medium/High. Low conserva todo el material del bastidor. No hay filtros,
SVG parseado por frame, nuevas texturas, partículas ilimitadas o dependencias.

Estado estable: cero clear()/reconstrucciones de geometría en render/update.
Animación por transforms, alpha y visibilidad. Aviso cacheado por radio/forma
objetivo; resonancia cacheada por geometría; onda cacheada una vez por
expansión. Morph y crecimiento reconstruyen geometría durante sus ventanas
acotadas; medir ese coste, además del estado estable, si se incrementa detalle.

Todo subpath independiente inicia beginPath/moveTo; cada polígono cierra
explícitamente. Esta regla impide la diagonal fantasma de PixiJS 8.

Pausa: update recibe delta cero. Reduced motion: pulsos y onda ocultos,
núcleo inmóvil y luces estables. El aviso y la frontera siguen mostrando
el estado de simulación para conservar la información jugable.
Reset limpia señales y oculta pulsos; el siguiente render reconstruye el campo.

## Referencia y validación

Con Vite activo, abrir `/docs/visual/arena-reference.html`. Cuatro paneles
muestran círculo, hexágono, aviso→morph y contraste sobre fondo claro.
Animar/congelar permite inspeccionar los pulsos y la transformación.

`node docs/visual/capture-arena.mjs` genera capturas en
`test-results/arena-reference/`: desktop, portrait, transición y gameplay
Low con láser activo y boss. Las capturas se regeneran, no se incluyen como
assets de descarga.

ArenaView.test.ts comprueba señal, vida de onda, reutilización de geometría,
pausa, seguimiento de frontera y reduced motion. Son pruebas funcionales;
no acreditan belleza ni FPS en Android físico. La nueva entrega necesita
revisión humana en juego, especialmente al radio máximo, durante morph y
con fondos diferentes. Las mediciones móviles previas no validan el coste
de esta revisión automáticamente.

Evidencia de esta entrega: 248 tests en 73 archivos y build local correctos;
cinco smoke seleccionados pasan. Capturas desktop/portrait, fondo claro,
transformación y boss Low inspeccionadas. Medición orientativa de 180 llamadas
por estado en Chromium headless de esta PC: CPU update/render p95 de 0.10 ms
estable y 1.60 ms en morph (mediana del morph: 1.10 ms). Excluye envío GPU,
tessellation diferida y el resto del juego; no equivale a frame time ni FPS
móvil. El script imprime los valores al regenerar las capturas.
