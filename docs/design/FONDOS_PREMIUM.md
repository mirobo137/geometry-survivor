# Fondos premium — composición, legibilidad y presupuesto

Catálogo vigente desde el 03-10-2026: **diez placas**. Archivo Silente, Falla Lunar
y Estela del Leviatán siguen todos los contratos de esta guía; no agregan otro
sistema de animación. Motivos, procedencia y entrega:
[Catálogo diez](CATALOGO_DIEZ.md). Las cifras anteriores describen sus entregas
fechadas; los derivados actuales se recomprimieron desde los PNG originales.

Referencias originales: **Órbita de Nacre** y **Flor del Ocaso**, creadas como
SVG code-first el 09-09-2026. El 26-09-2026 los seis fondos pintados
(Deep Space, Ion Storm, Solar Drift, Crystal Field, Nacre Orbit y Vesper Bloom)
pasaron a placas pictóricas creadas con el generador integrado, con motivos y
paletas propios. Desde el 27-09-2026 los seis reciben movimiento atmosférico
periférico, reutilizando la técnica de Tidal Veil; las siete placas raster
comparten además el movimiento base descrito en esta guía. Todo fondo nuevo
generado con imágenes GPT debe tener una identidad claramente distinta del
catálogo existente, no ser sólo un cambio de color. Másteres, conversiones,
direcciones de generación y tamaños: `src/assets/images/backgrounds/README.md`.
Leer junto a [Arte híbrido](ARTE_HIBRIDO.md), la skill de rendering y la de
rendimiento móvil. Esta guía es independiente del modelo; Luna puede seguirla
con los mismos archivos, herramientas y criterios de revisión.

## Elegir medio por función

| Necesidad del fondo | Fuente preferida | Representación en partida |
| --- | --- | --- |
| Geometría editable o piezas limpias de pocas masas | SVG con gradientes simples | Rasterizar una vez y compartir textura |
| Profundidad pictórica, nubes minerales, planetas/materiales complejos o atmósfera orgánica | PNG/WebP producido con herramienta de imágenes | Sprite a resolución de uso, preview optimizada y bytes medidos |
| Constelación discreta o pocas facetas estáticas | Graphics existente | Dibujar sólo al cambiar tema o viewport |
| Fenómeno dinámico que comunica daño o frontera | Renderer de hazard/arena | No implementarlo como fondo cosmético |

## Contrato común y diferenciación de futuros fondos

Todo fondo raster, incluido el creado con el generador de imágenes GPT, debe
usar el movimiento compartido de `StaticRasterBackgroundView`: desplazamiento
suave de hasta ±12 unidades lógicas en X y ±10 en Y (periodos de 28 y 36 s) y
respiración de escala de 0 a +1.5% (38 s). El Sprite existente se transforma;
no se añaden texturas, filtros, shaders, partículas ni clases de movimiento por
fondo. El overscan base de 2.5% debe cubrir todo el recorrido en landscape,
portrait y tamaños cercanos a cuadrado. Medium/High animan; Low y
`prefers-reduced-motion` mantienen la composición completa, estática. Una
implementación alternativa requiere justificar por escrito el caso y validar
que no haya bordes expuestos ni distracción. Si el fondo futuro usa SVG o
Graphics en vez de una placa raster, aplicar el mismo recorrido al root
decorativo compartido, nunca a la cámara, arena ni espacio de juego.

Antes de generar una imagen nueva, revisar visualmente y por concepto el catálogo
completo de fondos en `BackgroundDefinitions` y `src/assets/images/backgrounds/`.
Registrar una matriz breve que compare cada fondo en: motivo/foco principal,
composición y distribución de masas, paleta dominante, material/textura y
dirección de luz. La propuesta debe diferir en al menos tres de esos ejes,
incluyendo siempre el motivo principal o la composición. Cambiar sólo el color,
brillo, niebla o halo no constituye una identidad nueva. Comparar al menos tres
conceptos realmente distintos antes de generar el arte final y documentar qué
lo separa de los fondos existentes.

La diferenciación nunca desplaza las reglas comunes de uso: placa cuadrada con
cover uniforme; centro de combate oscuro, tranquilo y con al menos 55% de bajo
detalle; masas pintadas periféricas legibles en recortes portrait/landscape;
sin formas que puedan confundirse con jugador, enemigos, proyectiles,
telegraphs o geometría de arena. La imagen debe seguir leyendo como fondo, no
como key art que compite con la partida.

SVG no es universalmente más barato que PNG. En runtime importan el área
dibujada, texturas, resolución, solapamientos y filtros. Las placas pictóricas
dan profundidad consistente a los seis temas; el movimiento reutiliza dos
texturas de overlay compartidas por cuatro sprites. Los SVG de Nacre y
Vesper siguen preservados como antecedentes editables, pero no se usan en
runtime. Las texturas de juego son WebP cuadradas 1254×1254 (aprox. 6 MiB RGBA8
cada una, estimado), cargadas de forma diferida. Las miniaturas WebP de 512 px
separan su transferencia/decodificación de las texturas de Pixi. Esto eleva el
acabado y mantiene acotado el coste, pero no prueba una ganancia de FPS.

## Contrato de composición antes de dibujar

Comparar al menos tres masas diferentes, no tres recolores. Para esta entrega:

- Nebulosa central turbulenta: descartada porque ocupa el espacio de lectura
  y su textura fina necesitaría más resolución o material pintado.
- Ruina tecnológica angular: descartada porque sus bordes pueden competir con
  naves y el bastidor Aster Loom.
- Gigante anillado en penumbra con luna opuesta: elegida por profundidad,
  silueta propia y un centro naturalmente libre.

Declarar verbo, masas, material, vacío, acento y movimiento. Nacre propone
**contemplar una órbita distante**: planeta superior izquierdo, luna inferior
derecha, polvo nacarado y vacío central. El planeta usa luz lateral, franjas
atmosféricas débiles y terminador oscuro. Los anillos pasan por detrás y por
delante del globo; ese orden produce volumen sin blur.

La composición es cuadrada con recorte cover uniforme. El recorte del planeta
y la luna por los bordes es deliberado en portrait y landscape. No estirar la
imagen en X/Y por separado ni mover cámara, simulación o arena para encajarla.

## Receta que Luna debe conservar

1. Reservar primero el espacio de combate. El detalle más evidente queda
   periférico; el centro tiene poco contraste y ninguna estrella grande.
2. Diseñar una silueta reconocible a tamaño pequeño. La siguiente familia debe
   tener otra distribución de masas, no otro Saturno recoloreado.
3. Separar material en capas: espacio profundo → corriente tenue → anillos
   posteriores → globo con luz lateral → anillos anteriores → luna → polvo.
4. Mantener los valores del fondo por debajo de los del player/enemigos y
   hazards. Evitar blanco, flashes, rayos finos luminosos y motas con forma de
   pickup. El color por sí solo no evita confusiones de gameplay.
5. Si se usan gradientes, justificar cada uno: curvatura planetaria,
   terminador, profundidad atmosférica o caída de luz. No añadir filtros para
   tapar una silueta plana. Nacre no usa filter, mask, clipPath ni imagen embebida.
6. Mantener la misma composición entre catálogo y partida: derivar preview
   pequeña y runtime desde el mismo máster. Ocultar estrellas/anillo CSS
   genéricos al mostrar arte generado. La compresión/escala puede cambiar, no
   la identidad ni el encuadre de la ilustración.
7. Aplicar el movimiento común de placa en Medium/High y congelarlo en Low y
   `prefers-reduced-motion`. La identidad del fondo no debe depender de efectos
   exclusivos de High ni de añadir partículas, shader o filtro.
8. Inspeccionar el arte dentro de una partida con boss/láser, no sólo aislado.
   La arena ahora es más transparente: contrastar con Aster Loom actual en
   lugar de confiar en la antigua opacidad de 0.84.

## Presupuesto y ciclo de vida de placas pintadas

- Una textura activa de 1254×1254, ~6.0 MiB RGBA8 estimados. No es una medición de
  memoria total: navegador y GPU tienen overhead. El tamaño no aumenta con DPR
  ni resize.
- Un Sprite para la lámina, con movimiento base compartido en Medium/High y
  quieto en Low/reduced-motion. El fondo base permanece debajo como fallback;
  estrellas, patrones vectoriales y partículas decorativas quedan ocultos para
  cualquier placa pictórica.
- Carga Pixi sólo al equipar. La URL también puede descargarse antes por la
  miniatura CSS; caché de navegador y textura GPU no son lo mismo.
- Promise/textura compartida durante la vida de la aplicación. Cambiar tema
  oculta el Sprite, no destruye la textura compartida. Por ello, una sesión que
  equipe varios temas puede retener varias texturas aunque sólo dibuje una.
- Carga fallida: conservar la base oscura con constelación discreta. La carga
  puede reintentarse al volver a equipar. Una respuesta tardía no vuelve a
  mostrar un fondo deseleccionado ni adjunta nada a una vista destruida.
- Low y reduced-motion: congelar la transformación en la pose base; la placa
  sigue cubriendo el viewport.
- El movimiento base ya forma parte del contrato. Una capa atmosférica adicional
  sólo se agrega si distingue la identidad, reutiliza recursos cuando sea
  posible y pasa revisión de legibilidad/rendimiento.

## Integración de producto

ID estable: nacre-orbit. Aparece primero en Skins → Fondos.
Precio cero y etiqueta GRATIS · EQUIPAR. Usa el flujo de adquisición existente
con priceNova=0: no resta NOVA ni ofrece anuncio. Al equipar se añade a unlocked
y persiste selected. No se fuerza sobre el fondo que el usuario ya tenía.
No necesita nueva versión del save; isBackgroundId admite el nuevo ID.

## Comprobación reproducible

Con Vite activo: /docs/visual/background-reference.html. Usa BackgroundView y
ArenaView reales en landscape, portrait, Low y High.

node docs/visual/capture-background.mjs genera referencia, locker y boss
Low desktop/High portrait en test-results/background-reference/. En las
capturas de combate se oculta sólo el panel debug para inspeccionar el arte.
El script verifica selección gratis, saldo y ausencia de errores de página/HTTP.

Validar carga fallida/tardía, reutilización, resize, cambio de tema, cartera
vacía, persistencia, menú y partida. Ejecutar typecheck, tests, builds local,
Poki/CrazyGames y smoke. Inspeccionar amenazas sobre la zona más iluminada,
también al expandirse la arena y al cambiar de forma.

La cantidad fija de objetos y los bytes son límites medidos o calculados,
no garantía de FPS. Los perfiles previos del S25 no certifican este fondo:
confirmar en dispositivo real durante una run y stress. La aprobación
artística del usuario sigue pendiente hasta que lo pruebe.

## Segunda referencia — Vesper Bloom / Flor del Ocaso

Vesper Bloom demuestra cómo construir una familia nueva sin repetir el planeta
de Nacre ni la retícula de Crystal Field. Su verbo es **despertar**: una flor
astral facetada, asimétrica y periférica abre sus pétalos oscuros alrededor de
un núcleo tenue. La masa principal vive arriba a la derecha; el centro de la
arena queda libre y su contraste es bajo.

Se compararon tres direcciones: una catedral de obeliscos, demasiado cercana a
Crystal Field; un eclipse circular, demasiado cercano a Nacre; y la flor
facetada, elegida por silueta orgánica, profundidad y lectura distinta. Sus
materiales son placas violetas apagadas, biseles nacarados, núcleo rosado
concentrado y trazos teal mínimos. No usa partículas animadas ni líneas que
puedan confundirse con un láser.

Máster: `src/assets/images/backgrounds/vesper-bloom.png` (1254×1254,
1,767,441 bytes); runtime: `vesper-bloom.webp` (115,120 bytes), cargado
selectivamente por `VesperBackgroundView` mediante `StaticRasterBackgroundView`.
La placa opaca se comparte como una sola textura. El SVG
`src/assets/svg/backgrounds/vesper-bloom.svg` queda preservado como versión
code-first anterior y referencia de identidad, no se carga en runtime.

ID `vesper-bloom`, precio `0`, etiqueta `PREMIUM · GRATIS`. Se añade al locker
sin cobrar NOVA ni mostrar anuncio. La preview CSS usa una derivación WebP de
menor resolución del mismo arte que carga Pixi en partida.
La prueba debe verificar equipar, persistencia, wallet en cero, carga tardía,
destrucción, portrait, boss y contraste del láser.
Procedencia y prompts completos de generación:
`src/assets/images/backgrounds/README.md`.

Para una nueva familia, repetir el contrato de Nacre/Vesper: comparar masas,
escoger un verbo y un material distintos, escribir el centro de lectura,
seleccionar SVG/Graphics para geometría editable o raster para superficies
pintadas, ocultar movimiento decorativo en Low y medir el área cubierta. No
crear una clase de loader por cada fondo: reutilizar `StaticSvgBackgroundView`
para SVG y `StaticRasterBackgroundView` para imágenes rasterizadas.

## Tercera referencia — Velo de Marea / Tidal Veil

Velo de Marea prueba una superficie pictórica generada, distinta de los
planetas y siluetas facetadas anteriores. Su verbo es **derivar**: corrientes
minerales de vapor azul petróleo, índigo y bronce apagado rodean un centro casi
negro. No hay un motivo central ni elementos finos que puedan confundirse con
proyectiles, rayos o pickups. La textura única conserva la misma composición en
Low y en portrait/landscape mediante cover uniforme; la silueta secundaria
puede recortarse de forma distinta según la orientación.

Fuente de trabajo y prompt: `src/assets/images/backgrounds/README.md`.
Se generó una lámina cuadrada y se convirtió a WebP para runtime. Máster PNG:
1,707,898 bytes. WebP base: 98,632 bytes, 1254×1254; RGBA8 ocupa ~6.0 MiB
decodificado, aparte de overhead/caché. La compresión reduce descarga, no la
memoria de textura.

### Corrientes en movimiento — iteración 26-09-2026

La capa de corrientes se mueve independientemente de la transformación suave
compartida por la placa base; no mueve la cámara ni la arena. Se añadió una
lámina transparente generada en la paleta del fondo y recortada en dos
corrientes periféricas. Para cubrir las cuatro esquinas se crean cuatro
sprites, reutilizando esas dos texturas: A en arriba-izquierda; B en
abajo-derecha; A reflejada horizontalmente en arriba-derecha; B reflejada en
abajo-izquierda. Las fases y ritmos de las copias son independientes para que
no se lean como una repetición sincronizada. La primera iteración quedó
demasiado sutil al probarla; el ritmo actual usa A ±38×22 unidades lógicas
(18/24 s), B ±30×34 (23/17 s), A reflejada ±33×25 (20/19 s) y B reflejada
±34×30 (21/25 s). La respiración es de ±7% relativo y el alpha base por esquina
es 0.24/0.22/0.20/0.18. Esto hace perceptible el desplazamiento en pocos
segundos sin mover el centro de la arena ni la placa base. No hay partículas,
reconstrucción de geometría, filtros ni shaders.

En portrait, posicionar esas corrientes usando el cuadrado `cover` de la placa
recorta la mayor parte del humo fuera del viewport. El runtime escala las cuatro
capas al ancho visible y ancla la pareja inferior al borde inferior visible;
en landscape conserva la composición cuadrada previa. El ajuste es solo de
presentación: misma textura, cuatro sprites, alpha y deriva, sin cambiar arena
ni simulación. La comprobación mínima es 720×1280 con intersección visible en
las cuatro esquinas, además del paisaje 1280×720.

Los WebP runtime de las dos corrientes suman 136,796 bytes y ~1.83 MiB RGBA8
decodificados. La escena usa cinco sprites en total (lámina + cuatro esquinas),
pero conserva dos texturas transparentes; las copias reflejadas no duplican la
memoria de bitmap. Los recursos se cargan sólo al equipar Tidal Veil y se
comparten durante la vida de la aplicación. La composición estática WebP de
55,128 bytes fue la primera preview del locker. El modal actual monta solamente
al abrirse la placa y cuatro capas CSS basadas en los mismos dos WebP de
corrientes que usa la partida (A/B/A reflejada/B reflejada). Cada esquina
deriva de forma independiente; el tinte CSS aproxima la paleta de Pixi, no
promete una coincidencia píxel a píxel. Las tarjetas del catálogo permanecen
estáticas. Fallos de las capas conservan la lámina/fallback y no afectan
gameplay. Low y `prefers-reduced-motion` dejan las corrientes visibles, pero
inmóviles también en el modal.

Es una capa cosmética independiente de DPR y estado de gameplay: no modifica
arena, colisiones ni lectura de telegraphs. Los bytes y la memoria se midieron
desde archivos/dimensiones; no equivalen a una medición de FPS o memoria GPU.
La validación automatizada cubre carga diferida, uso compartido de las dos
texturas, espejo de las esquinas opuestas, deriva independiente en las cuatro
esquinas, desplazamiento de placa medible a los cuatro segundos y movimiento
desactivado. Medium/High muestran el movimiento; Low y
`prefers-reduced-motion` permanecen estáticos por diseño. Sigue pendiente la
inspección humana dentro de una run y en móvil físico; no declarar aprobado el
coste visual/rendimiento hasta realizarla.

### Receta reutilizable para elevar fondos existentes con ImageGen

Aplicar cuando un fondo procedural o SVG no alcance el acabado de las placas
pictóricas actuales. Se conserva su ID y contrato de producto; se reemplaza sólo
la representación visual. No producir únicamente una capa de adorno encima de
un fondo que ya quedó por debajo en riqueza de materiales.

1. Leer la identidad vigente (motivo, paleta, nombre, precio y requisitos) y
   conservarla. Enumerar qué rasgos visuales no se deben perder; no convertir
   seis fondos en variaciones cromáticas de la misma nebulosa.
2. Antes de generar, especificar la silueta/material único, masas periféricas,
   orientación de luz, encuadre cuadrado y área segura central. Reservar al
   menos 55% de bajo detalle en el centro, evitar puntos brillantes pequeños y
   líneas finas que puedan confundirse con enemigos, pickups o telegraphs.
3. Generar una placa original opaca con ImageGen. Inspeccionar el resultado y
   retocar por iteración si se pierde la identidad, el centro se llena o una
   forma parece gameplay. No usar capturas de usuarios como referencia sin
   autorización explícita.
4. Guardar el PNG master y documentar identidad, prompt/dirección, fecha y
   procedencia. Derivar WebP de runtime cuadrado de hasta 1254 px y una preview
   de 512 px desde el mismo master. Medir bytes y estimar memoria RGBA; WebP no
   reduce el tamaño ya decodificado en GPU.
5. Usar la misma estrategia de cover uniforme en retrato y paisaje, sin estirar
   ejes. Actualizar miniatura de CSS y sprite Pixi con las derivaciones del
   mismo master; retirar estrellas/anillo genéricos que contradigan la pintura.
6. Cargar textura Pixi sólo al equipar ese fondo. Reutilizar el loader raster
   compartido, dejar la base oscura existente debajo como fallback y no instanciar
   texturas de todos los temas en cada partida.
7. Aplicar a la placa el movimiento compartido descrito en el contrato común,
   en Medium/High, y congelarlo en Low y `prefers-reduced-motion`. La identidad
   no debe depender de efectos exclusivos de High ni de partículas, shader o
   filtro; Low mantiene una composición completa y legible.
8. Añadir cada tema a la referencia real con `BackgroundView` y `ArenaView`.
   Revisar una run con player/enemigos, láser, boss, todas las formas de arena,
   portrait/landscape y Low/High. Medir rendimiento en hardware real antes de
   afirmar que no hay coste perceptible.
9. No cerrar la puerta visual por tests unitarios: pedir confirmación humana del
   encuadre y legibilidad. Los tests cubren carga diferida, selección, fallback,
   resize y persistencia, no calidad artística.

## Politica vigente: movimiento para todas las pinturas — 27-09-2026

La petición de producto establece movimiento para todos los fondos. Los seis
fondos pictóricos (Deep Space, Ion Storm, Solar Drift, Crystal Field, Órbita de
Nacre y Flor del Ocaso) comparten las corrientes periféricas de cuatro esquinas,
cada uno con tinte y ritmo propios. Además, las siete placas raster se desplazan
y respiran con el movimiento común de `StaticRasterBackgroundView`; no se mueve
la cámara ni se cubre el centro de juego.

Implementacion: `PainterlyBackgroundMotionView` reutiliza las dos texturas WebP
transparentes de corrientes ya incluidas para Tidal Veil; no genera ni descarga
seis juegos de overlays. Las cuatro instancias espejadas conservan deriva y
fases independientes. Cada fondo define su propio tinte, opacidad, velocidad y
fase en `PAINTERLY_MOTION_STYLES`, para respetar su paleta y evitar que el
movimiento se perciba sincronizado o repetido. Las texturas solo se piden al
seleccionar uno de esos seis temas y se comparten mediante el loader cacheado.

Iteracion de prueba solicitada el 27-09: se elevo 0.10 la opacidad configurada
por tema, se aumento el recorrido hasta ±35-44 px en X y ±25-39 px en Y, y se
acelero el ciclo aproximadamente un 5%. La silueta y el centro transparente de
las texturas no cambian; queda pendiente que el usuario confirme si esta
intensidad se siente mejor en juego.

Medium y High animan con transformaciones y alpha de sprites existentes, sin
recrear Graphics, emitir particulas, aplicar filtros ni ejecutar shaders. Low y
`prefers-reduced-motion` dejan la capa visible pero inmovil; las tarjetas del
locker permanecen estaticas y el modal solo monta sus cuatro corrientes al
abrirse. Tests cubren carga bajo demanda, reutilizacion de
texturas, tintes por tema, deriva independiente perceptible en cuatro segundos y
congelacion estatica.

Regla reutilizable añadida el 27-09: todas las placas raster (los seis fondos
pictóricos y Velo de Marea) reciben además movimiento compartido desde
`StaticRasterBackgroundView`: paneo de hasta ±12 px en X y ±10 px en Y, más una
respiración de escala de 0 a +1.5% (28–38 s). La primera receta de ±2.5 px,
±2 px y +0.4% resultó imperceptible al probarla, por lo que se elevó el recorrido
más de cuatro veces y se acortaron los ciclos. Solo transforma el Sprite ya
existente; no duplica imágenes, crea texturas ni añade filtros. El overscan de
2.5% conserva cobertura en portrait/landscape incluso en los extremos del paneo.
Low y
`prefers-reduced-motion` mantienen la placa quieta. Las nubes periféricas siguen
siendo una capa separada y más visible; el centro de combate conserva su lectura.
Esta receta común es el default para nuevos fondos raster, salvo que una prueba
de recorte, legibilidad o accesibilidad justifique desactivarla.

Esta política sustituye la regla histórica de que Tidal Veil era el único fondo
animado. La equivalencia técnica no garantiza paridad artística: comprobar
manualmente los seis temas en gameplay, paisaje/retrato, Low/High y con hazards
activos. Validar legibilidad central y que cada tinte combine con su pintura;
medir FPS/memoria solo en hardware real antes de declarar el rendimiento
aprobado.

#### Movimiento especial de Velo de Marea

Los dos overlays periféricos compartidos de Tidal Veil cubren cuatro esquinas
mediante espejo y deriva independiente. Este registro describe su capa de
corrientes original; la regla global de micro movimiento de placa se añadió
después y está especificada en la sección superior.

El movimiento de Velo de Marea ya fue aprobado visualmente por el usuario. La
inspección humana de las seis placas con la nueva capa requiere revisar el
locker y una run en paisaje y retrato; los tests automatizados no sustituyen
esa puerta.

ID `tidal-veil`, nombre `Velo de Marea`, precio `0 NOVA`, etiqueta
`PREMIUM · GRATIS`. La elección añade el ID al guardado y no abre rewarded ad.
Validación de referencia: `/docs/visual/background-reference.html`; el script
`docs/visual/capture-background.mjs` incluye locker sin coste, Low desktop,
High portrait y combate con boss. Falta la aprobación visual del usuario y la
comprobación de rendimiento en su móvil físico.
