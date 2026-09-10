# Fondos premium — composición, legibilidad y presupuesto

Referencia implementada: **Órbita de Nacre**, 09-09-2026.
Leer junto a [Arte híbrido](ARTE_HIBRIDO.md), la skill de rendering y la de
rendimiento móvil. Esta guía es independiente del modelo; Luna puede seguirla
con los mismos archivos, herramientas y criterios de revisión.

## Elegir medio por función

| Necesidad del fondo | Fuente preferida | Representación en partida |
| --- | --- | --- |
| Planetas, anillos, capas suaves y geometría editable | SVG con gradientes simples | Rasterizar una vez y compartir textura |
| Nebulosa pintada, textura mineral u orgánica difícil de expresar con pocas formas | PNG/WebP producido con herramienta de imágenes | Sprite a resolución de uso, con procedencia y bytes medidos |
| Constelación discreta o pocas facetas estáticas | Graphics existente | Dibujar sólo al cambiar tema o viewport |
| Fenómeno dinámico que comunica daño o frontera | Renderer de hazard/arena | No implementarlo como fondo cosmético |

SVG no es universalmente más barato que PNG. En runtime importa el área
dibujada, texturas, resolución, solapamientos y filtros. Nacre elige SVG porque
su silueta planetaria y capas de polvo se expresan con pocas formas editables:
5,503 bytes fuente, aproximadamente 1.70 kB gzip en este build. No necesita
una superficie pintada por IA ni una imagen de varios megapíxeles.

El navegador rasteriza el SVG a canvas 768×768 una vez y Pixi usa la textura
resultante. Así se conservan los gradientes sin depender de Graphics.svg().
No se hace parseo, rasterización ni dibujo de paths en cada frame.

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
6. Usar la misma fuente en catálogo, preview y partida. En Nacre el CSS usa el
   mismo SVG con cover; se suprimen las estrellas/anillo CSS genéricos. Nunca
   mostrar una miniatura espectacular que el runtime no reproduce.
7. Diseñar Low completo. Nacre es estático en todas las calidades: su identidad
   no depende de partículas, parallax ni de un preset alto.
8. Inspeccionar el arte dentro de una partida con boss/láser, no sólo aislado.
   La arena ahora es más transparente: contrastar con Aster Loom actual en
   lugar de confiar en la antigua opacidad de 0.84.

## Presupuesto de Nacre y ciclo de vida

- Una textura de 768×768, 2.25 MiB de imagen base RGBA8; no es una medición de
  memoria total. El canvas retenido, la imagen decodificada y el backend tienen
  costes adicionales. El tamaño de la textura no aumenta con DPR ni resize.
- Un Sprite inmóvil para la lámina. Se mantienen debajo el fondo base/fallback
  y los recursos ya existentes de BackgroundView; las nubes, estrellas y
  partículas de otros temas quedan ocultas y dejan de actualizarse con Nacre.
- Carga Pixi sólo al equipar. La URL también puede descargarse antes por la
  miniatura CSS; caché de navegador y textura GPU no son lo mismo.
- Promise/textura compartida durante la vida de la aplicación. Cambiar tema
  oculta el Sprite, no destruye la textura compartida. Root.destroy libera el
  objeto, no una textura que otra vista puede utilizar.
- Carga fallida: conservar la base oscura con constelación discreta. La carga
  puede reintentarse al volver a equipar. Una respuesta tardía no vuelve a
  mostrar un fondo deseleccionado ni adjunta nada a una vista destruida.
- Pausa y reduced-motion: la lámina permanece inmóvil siempre.
- No añadir animación porque haya presupuesto. Si una futura familia necesita
  dos capas, justificar la mejora y medir fill-rate antes de ampliarlo.

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

Fuente: `src/assets/svg/backgrounds/vesper-bloom.svg`; consumidor:
`VesperBackgroundView` a través de `StaticSvgBackgroundView`. Es un SVG de
5.143 bytes de fuente, 5.14 kB en build y 1.69 kB gzip, rasterizado una vez a
768×768 y compartido como una única textura RGBA8 de 2.25 MiB base. El archivo
es deliberadamente pequeño; Low/Medium/High comparten el mismo Sprite estático; el fondo
se carga sólo al equiparlo y falla a la base oscura.

ID `vesper-bloom`, precio `0`, etiqueta `PREMIUM · GRATIS`. Se añade al locker
sin cobrar NOVA ni mostrar anuncio. La preview CSS y Pixi usan el mismo SVG.
La prueba debe verificar equipar, persistencia, wallet en cero, carga tardía,
destrucción, portrait, boss y contraste del láser.

Para crear una tercera familia, repetir el contrato de Nacre/Vesper: comparar
masas, escoger un verbo y un material distintos, escribir el centro de lectura,
usar una textura compartida, ocultar movimiento decorativo en Low y medir el
área cubierta. No crear un cargador específico nuevo: reutilizar
`StaticSvgBackgroundView` y sus loaders por URL.
