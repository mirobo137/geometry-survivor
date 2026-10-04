# Enemigos — cuerpo único y muerte compartida

Estado al 04-10-2026: **13 enemigos comunes y 3 bosses usan un PNG transparente
como cuerpo completo**; el SVG completo queda de fallback y fuente editable.
Las entradas modulares actuales de bosses siguen intactas hasta que se diseñen
entradas dedicadas. La presentación no altera ataques, dificultad, recompensas,
guardado, hitboxes ni radios.
Este contrato sustituye las recetas antiguas de desarme modular de enemigos
y el colapso exclusivo de bosses; los registros fechados conservan su historia.

## Alcance y comportamiento

- Trece enemigos: Chaser, Fast, Tank, Elite, Orbiter, Charger, Splitter,
  Prism Weaver, Warden Replica, Fracture Gunner, Thorn Bastion, Zigzag Reaver
  y Rift Miner.
- Tres bosses: Core Sentinel, Orbital Warden y Fracture Engine, incluidos
  bosses simultáneos de Overdrive. Warden conserva sus réplicas y todo su kit.
- Un sprite visible del cuerpo completo durante combate, en todos los
  presets. Movimiento secundario por transforms en Medium/High; Low y
  movimiento reducido omiten respiración/balanceo. Los telegraphs, orientación,
  escalas de réplicas/hijos, entrada y reacción de impacto siguen presentes.
- Los bosses conservan su ensamblaje de entrada con las capas SVG actuales.
  Después del ensamblaje se muestra su PNG completo. **No borrar esas capas ni
  migrar las entradas al PNG en esta entrega.**
- Todos mueren con la receta aprobada del Tank: contracción breve, separación
  amortiguada de cuatro regiones del mismo cuerpo, giro pequeño, oscurecimiento
  y fade; duración total **420 ms**. En bosses la distancia de fragmentación
  se escala por su tamaño lógico, no por cantidad de píxeles.
- Refinamiento aprobado para probar el 03-10-2026: descarga del reactor
  acompañando el corte. Destello blanco-dorado de ~110 ms, resplandor azul
  suave y seis rayos finos que se expanden y apagan junto al casco (420 ms).
  Chispas calientes: **8 High / 5 Medium / 3 Low**, con mayor recorrido.
  Movimiento reducido conserva un destello atenuado y un resplandor estático;
  omite rayos, chispas y fragmentos.
  Audio, hit-stop, feedback de pantalla y flujo de victoria se conservan.

## Recursos, identidad y ciclo de vida

La receta canónica está en
`src/presentation/pixi/enemies/SingleImageDefeat.ts`. Sus cuatro rectángulos
normalizados cubren exactamente la textura, sin solapes ni huecos en t=0.
Son vistas de un mismo `TextureSource`: no cuatro imágenes nuevas, readback,
recortes CPU/Canvas, filtros, máscaras ni shaders por entidad.

El pool común sigue limitado a High **18×4** sprites y Medium **12×4**.
Low y movimiento reducido no crean fragmentos. Si se satura, se omite esa
fragmentación, no el bloom acotado ni la baja real. Cada boss reutiliza sus
cuatro sprites de entrada para morir; no consume el pool común ni reserva
un pool nuevo. Las subtexturas se preparan por fuente, no por baja. No se
aumentan los pools de entidades/proyectiles/FX.

La descarga vive en `DefeatBloomContexts.ts` y usa los **mismos tres Graphics
por slot** de `DamageBloomView`; se alternan contextos cacheados de impacto
y muerte. Tres contextos compartidos adicionales, sin nuevos sprites por baja
ni shaders/filtros. La geometría del resplandor se construye a escala útil y
se normaliza al dibujar para conservar curvas suaves. Mezcla aditiva sólo en
la descarga; al volver a impactos se restaura la mezcla normal.

El pool de destellos sigue en **16 High / 12 Medium / 8 Low**. Una baja puede
sustituir el impacto ordinario más antiguo si no queda sitio, pero no desplaza
otra muerte. Las chispas siguen en el pool existente de **132 / 88 / 52**
sprites respectivamente; se omiten peticiones al saturarlo. El radio del
resplandor y tamaño/velocidad de chispas tienen techo para futuros bosses.

La descarga recibe posición y radio; **no lee ni recorta el asset del
enemigo**. Al sustituir `flat` por un PNG, los fragmentos usarán ese PNG y
el destello, rayos y chispas continuarán sin ninguna adaptación artística.
Los contextos compartidos tienen un único dueño y se destruyen al cerrar la
vista. Reset de tramo, pausa y limpieza usan el ciclo de vida ya compartido.

`enemyDefeated` lleva índice/generación capturados **antes de liberar** el
enemigo: los hijos de Splitter pueden reciclar ese mismo slot inmediatamente.
La vista copia orientación, offset, escala y alpha de la última pose válida,
incluidos entrada e impacto; no retiene una referencia a la entidad mutable.
Una identidad obsoleta/no dibujada usa pose neutra en la posición de la baja.
Los bosses copian su propia pose y mantienen animaciones independientes.

La liberación, XP, kills y vampirismo siguen siendo inmediatos. Los fragmentos
no tienen hitbox, daño, targeting ni recompensa. Pausa, level-up, menú e intro
congelan los efectos; victoria y transición de Overdrive permiten terminarlos.
El reset al empezar el siguiente tramo conserva las muertes activas; el reset
completo ocurre al finalizar la transición existente de 3 s, sin alargarla.
Reset restaura familia, tint y transforms; destroy libera sólo las vistas con
`destroy(false)`, nunca la fuente compartida.

Los masters SVG completos siguen cacheados como fallback; las cuatro piezas de
entrada de bosses siguen siendo texturas activas. Los SVG separados de piezas
comunes quedan como referencias editables y dejan de cargarse al runtime.
`FractureEnemySvgMarkup` conserva su ensamblaje para producir los masters SVG
usados como fallback.
No atribuir ahorro de memoria GPU medido a esta entrega. Sí se elimina la
superposición de la muerte antigua del boss en `TerminalFxView`; esa vista
conserva exclusivamente la derrota/tono del player.

## Sustitución por PNG — 04-10-2026

- Artefactos: [PNG y ficha de procedencia](../../src/assets/images/enemies/README.md).
  Los 16 finales mantienen el frame entero, frente `-Y` y centro `(0,0)`:
  64×64 comunes, 112×112 bosses, con transparencia alpha; suman **46,427 bytes**.
- El catálogo decodifica PNG con `Image` antes de crear `Texture.from(image)`.
  Mientras carga o si falla, cada cuerpo conserva su SVG completo de fallback.
  Los assets PNG viven como texturas compartidas de la sesión.
- `EnemyShipVisual` cambia la textura del sprite existente al completarse la
  carga. `EnemyDefeatFxView` registra los fragmentos para cada fuente PNG;
  las muertes ya activas conservan las subtexturas que estaban usando.
- Los bosses registran fragmentos desde el PNG y cambian el cuerpo final al
  terminar el ensamblaje. Si la entrada está en curso, sus capas SVG siguen
  animándose sin interrupción. Las cuatro piezas SVG de entrada se conservan.
- Los SVG de componentes de enemigos comunes permanecen como masters en el
  repositorio. Ya no se importan en runtime: el cuerpo SVG único basta como
  fallback y los sprites comunes ya se muestran como una imagen completa.
- No cambian tamaño de combate, orientación, telegraphs, movimiento, animación,
  ataques o ventana no atacante de bosses. No se capturó un preview de juego en
  esta entrega; el usuario revisará el resultado en su entorno.
- Los PNG se derivaron a sus frames con Lanczos y paleta RGBA de hasta 128
  entradas.
  La inspección de archivo confirma canal alpha y píxeles transparentes. El
  bundle no se midió de nuevo en esta entrega; la última medida local previa
  fue 14,980,401 bytes y el build vigente debe confirmar el presupuesto.

## Evidencia histórica de la muerte común — 03-10-2026

Con Vite: `/docs/visual/tank-defeat.html?quality=high`. El nombre de ruta se
conserva por compatibilidad; ahora su selector contiene las **16 familias**.
Botones Destruir/Restaurar, pausa, cámara lenta, tamaño real y tres calidades.
Instancia `CombatEntitiesView` real, no un renderer alternativo. Puede abrirse
una familia con `&enemy=orbital-warden` (o cualquier ID del selector).

Diagnóstico: `node scripts/qa-tank-defeat.mjs`. Servidor aislado en 5184 y
Chromium se cierran en `finally`, sin reiniciar el Vite del usuario. Evidencia
en `test-results/tank-defeat/`; las pruebas browser generales borran esa
carpeta, ejecutar este diagnóstico después. No forma parte del build.

Verificado el 03-10-2026 (cuerpo único; refinamiento de descarga abajo):

- Typecheck y **687 unitarias / 127 archivos** correctos; incluye las 13
  familias, tres bosses, propiedad de fuentes, pausa/terminales, 60 ciclos de
  bosses simultáneos y reciclado inmediato de Splitter.
- **96 casos browser**: 16 familias × PC High/Medium/Low, móvil emulado
  portrait High/Low y reduced-motion High. Fuente/cobertura, pose inicial,
  compresión/separación/fade, pausa/resize, 60 ciclos por caso,
  saturación/limpieza y reset de transición sin descartar la muerte.
  Cero errores JS/HTTP y capturas revisadas.
- Cinco smoke: carga/input/pausa/resize, control touch portrait, atajo de
  Core Sentinel, patrones authored de Fracture Engine y escenario Overdrive.
  Correctos (41.7 s).
- Builds Local/Poki/CrazyGames correctos. Tamaños completos:
  **14,971,967 / 10,014,716 / 10,014,722 bytes** respectivamente.
- Warning previo JS >500 KB permanece; no se ejecutó la suite browser completa
  ni se certificaron FPS/GPU en teléfono físico. La aprobación humana de la
  extensión completa sigue pendiente; el prototipo original Tank ya fue aprobado.

Sin commit, push o deploy. Overdrive por puntos, retención y pruebas humanas
del Laboratorio mantienen sus pendientes originales.

### Validación del refinamiento de descarga

Typecheck y suite completa: **689 unitarias / 127 archivos**. Tras afinar
la geometría se repitieron las 19 pruebas de los módulos afectados y typecheck.
Pruebas nuevas: prioridad de muerte frente a impacto, saturación sin desplazar
otra muerte, reutilización de las tres capas/contextos, vuelta al impacto con
mezcla normal, pausa, movimiento reducido y destrucción de contextos.

Los **96 casos browser** se repitieron con la descarga final: 16 familias,
seis configuraciones, ciclos/pausa/resize/reset de tramo y cero errores JS/HTTP.
Capturas de destello inicial y fragmentación revisadas. La suite de cinco
smoke anterior pertenece a la entrega de cuerpo único; no se volvió a correr
por este refinamiento visual. No se midieron FPS/GPU de un teléfono físico.

Builds finales Local/Poki/CrazyGames correctos:
**14,980,401 / 10,016,486 / 10,016,492 bytes**, incluidos source maps donde
corresponde. Los tres contextos y la receta añaden 1,770 bytes al artefacto
de portal frente al cuerpo único. Warning previo JS >500 KB sin cambios.
