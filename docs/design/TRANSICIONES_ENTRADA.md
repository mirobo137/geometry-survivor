# Entradas de ruta — compuerta geométrica

Contrato visual vigente. Consumidores: `RunTransitionOverlay.ts`,
`src/ui/run-transition.css` e `index.html`. La guía de material es
`skills/geometry-survivor-svg/references/ui-art-direction.md`.

## Qué se presenta

- Inicio directo de cualquier acto o Infinito: compuerta premium de 2,6 s,
  omisible desde el primer instante.
- Continuar hacia otro acto o desde III hacia Infinito: placa básica de 1,3 s.
- Cambio de tramo dentro de Infinito: placa de 3 s, vuelta, tramo y nombre de
  la familia entrante. No repetir compuerta ni mostrar coeficientes internos.
- Movimiento reducido: entrada de ruta estática de 0,45 s. El cambio de tramo
  conserva sus 3 s de coordinación, sin movimiento decorativo.

`Game` y `GameState` conservan el reloj, bloqueo de combate/input, omisión y
pausa por lifecycle. La presentación no inicia gameplay ni ejecuta sus propios
timers. No cambiar las duraciones para acomodar arte sin revisar ese contrato.

## Diseño y coreografía

Una compuerta con cuatro placas metálicas, cavidad central y energía localizada.
El acabado se construye con caras y biseles reales; no con un glow grande.

1. 0–12%: aparece el campo, abre la línea horizontal y comienza el ensamblaje.
2. 12–36%: las placas encajan, el emblema hace una expansión pequeña y la firma
   de la ruta se alinea. El título entra desde abajo una única vez.
3. 36–76%: imagen estable para leer; sin rotación infinita ni destellos repetidos.
4. 76–100%: las dos mitades de la compuerta se separan y dejan ver la partida
   congelada. Arte y título desaparecen suavemente antes de recuperar control.

Firmas: Radial usa arcos concéntricos; Angular, rombos que alinean sus ejes;
Fracture, cuatro facetas separadas; Overdrive, una trayectoria cerrada infinita.
Comparten material, pero se distinguen por geometría además del color. Reutilizar
los emblemas existentes de selección de actos, sin redibujarlos en otro lugar.

La versión básica usa sólo una placa horizontal y el título, manteniendo algo
de la escena de fondo visible. El acto/tramo sigue siendo el foco de atención.

## Contrato del asset y coste

- Master: `src/assets/svg/ui/run-entry-gate.svg`; `viewBox="0 0 560 560"`,
  ancla (280,280), una instancia DOM, montaje una vez por overlay.
- 49 descendientes SVG, 39 primitivas totales; sólo una de cuatro firmas se
  muestra a la vez. Sin filtros, imágenes raster, máscaras, IDs ni URLs externas.
- Máximo 14 animaciones CSS finitas en High/Medium, 12 en Low; sólo transform
  y opacidad. Básica: 4. Sin `requestAnimationFrame` de producción, partículas
  ni asignaciones por frame; `hidden` cancela su presentación fuera de la entrada.
- Low mantiene placas, biseles, emblema, firma y texto. Quita graduación exterior,
  línea de horizonte y retícula. Medium quita retícula.
- Texto HTML, figura decorativa `aria-hidden`, botón de 44 px mínimo. Todas las
  animaciones, incluidos pseudoelementos, se congelan durante pausa.
- 320×568, 390×844, 640×360 y 1280×720 son referencias de composición. En
  landscape bajo, Omitir queda arriba a la derecha para liberar el título.

## Iteración y validación

Con Vite activo, abrir `/docs/visual/transitions-reference.html`. La página
extrae el markup real de `index.html` y usa la clase, SVG y CSS de producción.
Permite elegir ruta, variante, calidad y repetir. Es sólo una herramienta de
autoría; no simula una transición de estado ni altera guardados.

`node docs/visual/capture-transitions.mjs` captura nueve combinaciones,
comprueba límites de texto/control y ausencia de solapamientos, comprueba
movimiento reducido y mide intervalos rAF de la referencia DOM. Las capturas
van a `test-results/transitions/`. Esa medición aislada en Chromium headless
no equivale a FPS de gameplay ni valida GPU/consumo en teléfono físico.

Probar además los smokes existentes de inicio Angular, inicio público Overdrive,
continuación III→Overdrive y entrada móvil. Los tests de `Game`/`GameState`
comprueban coordinación y pausa. La aprobación artística corresponde al usuario.

Resultado 25-09-2026: typecheck, 32 unitarios focalizados, cuatro smokes y tres
builds pasaron. Nueve composiciones capturadas sin desbordamiento/solapamiento;
movimiento reducido: cero animaciones. Referencia DOM 1280×720 en Chromium
headless, 169 intervalos durante 2,8 s por preset: p95 High 16,7 ms, Low 16,8 ms;
máximo 16,8 ms en ambos. No mide gameplay ni hardware móvil. SVG: 4.660 bytes.
Sigue el warning de chunk de la aplicación >500 kB; pendiente aprobación humana.

Para extender: elegir primero una firma legible, mantener el ancla y un solo
master compartido, usar caras/espacios vacíos antes que más líneas, y respetar
la ventana estable de lectura. No alargar la entrada ni añadir blur, vídeos,
dependencias o partículas persistentes para buscar más impacto.
