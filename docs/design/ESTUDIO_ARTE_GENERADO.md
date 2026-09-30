# Imágenes generadas y SVG: evaluación para Geometry Survivor

Fecha: 29-09-2026. Estado: evaluación seguida de una implementación autorizada.
La opción A se amplió, por petición explícita, a las 29 ilustraciones de todas
las cartas; el inventario canónico, asociaciones y contrato de mantenimiento
están en [catálogo de cartas](../../src/assets/images/ui/cards/README.md).
El [registro del piloto](../../src/assets/images/ui/evolutions/README.md)
conserva la historia de la primera prueba Rail Lance/Pulse Volley.
Nuevo piloto autorizado de UI: una cabecera ilustrada en el selector de Actos,
con texto/controles HTML y una placa decorativa estática de 76,892 bytes.
Procedencia, prompt y validación: [menús ilustrados](../../src/assets/images/ui/menus/README.md).
Tras el feedback, el usuario pidió cuatro botones de ruta completamente
ilustrados (PNG, ~1.75 MB entre los cuatro) y alinear los anchos de cabecera y
cuadrícula. Prompts y comprobaciones en el mismo README. La aprobación de estos
botones sigue pendiente; no autoriza migrar todas las pantallas.
Leer junto a [Arte híbrido](ARTE_HIBRIDO.md) y [Fondos premium](FONDOS_PREMIUM.md).
La implementación del Laboratorio permanece y sus pruebas humanas se aplazan
según el [recordatorio](LABORATORIO_META_V2.md#recordatorio-pruebas-manuales-aplazadas).

## Lectura de las referencias

Las tres capturas aportadas muestran ilustración abundante, objetos con volumen,
materiales, luz consistente, formas legibles y marcos repetidos. Ese acabado es
alcanzable con arte raster también en nuestro stack. Las capturas no demuestran
por sí solas cómo se produjeron las piezas, sus animaciones o su rendimiento.

El puzzle repite pocos objetos grandes sobre un tablero ordenado; nuestro
survivor puede mostrar 250 enemigos, 300 proyectiles y numerosos FX. La dirección
artística puede trasladarse, pero debemos revisar la lectura en combate y en
32–64 px. Mantener identidad geométrica/espacial, no adoptar el estilo del puzzle
por asociación con su formato. Material pintado y geometría clara son compatibles.

## Qué existe realmente

Inspección de código y archivos locales, sin ejecutar una prueba nueva de FPS:

- `SvgTextureFactory.ts` rasteriza SVG con frame explícito y resolución 1.
  `PlayerVisualAssets.ts` utiliza piezas de 64×64; `CombatEntitiesView.ts`
  utiliza 64×64 para enemigos y 112×112 para bosses. Las instancias comparten
  texturas: no se interpreta un SVG complejo por enemigo y por frame.
- Las cartas reutilizan el sprite SVG `premium-icons.svg`: 26 símbolos en
  11,538 bytes de fuente, sin gzip. `UpgradeCardVisual.ts` asocia upgrades con
  iconos y tonos; diferentes rangos pueden compartir arte.
- Manta usa un PNG de 256×256 y 43,207 bytes compartido por dos aletas. Quilla,
  reactor y animaciones conservan composición híbrida.
- Las siete placas WebP de fondo suman 798,180 bytes (excluye miniaturas,
  corrientes y masters PNG). Tidal Veil mide 98,632 bytes y 1254×1254.
  Sus ~6 MiB RGBA8 se calculan desde los píxeles, no desde el peso WebP.

Por tanto, adoptar imágenes no exige cambiar motor ni combate. En sprites de
igual tamaño, capas y mezcla, el coste de dibujo puede ser similar aunque la
fuente sea PNG o SVG rasterizado. La diferencia visual procede del arte, no de
la extensión. Pixi documenta las dos rutas de SVG, textura y geometría:
[SVG en PixiJS](https://pixijs.com/8.x/guides/components/assets/svg).

## Costes que debemos separar

**Descarga:** el SVG sencillo suele ocupar poco; la pintura introduce más datos.
WebP admite transparencia y compresión con/sin pérdida. Elegir PNG o WebP por
inspección de bordes y bytes, sin garantizar un porcentaje universal de ahorro.
Generar un master grande y publicar derivados a tamaño útil. Para UI, cargar
arte al abrir su pantalla y reservar sus dimensiones; durante combate, preparar
lo necesario antes de mostrarlo. Referencia:
[rendimiento de imágenes](https://web.dev/learn/performance/image-performance).

**Memoria:** base teórica RGBA8 = ancho × alto × 4. No incluye mipmaps, padding
de atlas, copias del navegador, buffers ni overhead. No equivale a memoria total
medida; en UI DOM el navegador administra sus superficies.

| Ejemplo de recursos únicos decodificados | Base RGBA8 calculada |
| --- | ---: |
| Una pieza 64×64, como el frame actual del player | 16 KiB |
| Una pieza 128×128 | 64 KiB |
| Una pieza 256×256 | 256 KiB |
| Seis iconos 256×256 | 1.5 MiB |
| 26 iconos 256×256 | 6.5 MiB |
| Una lámina 2048×2048 | 16 MiB |
| 24 frames de 512×512, todos residentes | 24 MiB |

Duplicar ancho y alto cuadruplica memoria. Los 250 enemigos que comparten una
textura no requieren 250 copias de esa imagen, aunque sus objetos y su dibujo
sí cuestan. Un atlas ayuda al batching, pero sus huecos también ocupan memoria;
no usar uno enorme por defecto. Pixi separa fuente de píxeles y vistas de textura:
[Textures](https://pixijs.com/8.x/guides/components/textures).

**Trabajo por frame:** importar más detalle pintado no añade paths en cada
sprite; sí aumenta coste añadir muchas capas transparentes, máscaras, filtros,
mezclas y animación de pantalla completa. Mantener pools, compartir fuentes y
transformar piezas. La guía oficial recomienda spritesheets, texturas pequeñas
en dispositivos antiguos y limitar filtros:
[Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips).

**Producción:** una generación entrega pintura, no pivotes, piezas, acciones de
botón ni una animación completa. Hay que preparar alpha, encaje, orientación,
coherencia y derivados; puede requerir iteraciones. La imagen se genera durante
desarrollo y el juego publica archivos estáticos, sin llamadas a IA al jugar.
No se estima aquí un coste monetario ni un tiempo fijo de producción.

## Opciones y retrabajo

| Opción | Contenido | Retrabajo estimado por alcance | Resultado esperado |
| --- | --- | --- | --- |
| A. UI ilustrada | Arte de armas/evoluciones, cabeceras de actos, acentos de menú | Bajo–medio: generar arte y conectarlo a los registros/pantallas | Cambio muy visible en elecciones y primera impresión |
| B. UI + naves híbridas | A, más player y bosses con materiales pintados en piezas | Medio–alto: pivotes, ensamblaje, preview y FX de muerte | Más volumen y personalidad también durante la partida |
| C. Catálogo raster extensivo | A/B, enemigos comunes y gran parte de FX | Alto: muchos recursos, carga, caché, animaciones y regresión móvil | Dirección pictórica amplia; beneficio a tamaño pequeño aún por comprobar |

Son estimaciones relativas de alcance, no horas medidas. Recomendación: A como
primer experimento y B después si el usuario lo aprueba. C requiere evidencia
visual y de rendimiento; no resulta necesaria para conseguir un acabado premium.

Se pueden reutilizar IDs, reglas, guardado, ofertas, efectos y contratos de
input. El esfuerzo principal queda en presentación, assets y carga. En bosses,
un PNG plano no conserva por sí solo montaje/despiece o piezas que giran:
necesita separar elementos y mantener los frames/pivotes actuales. Para rayos,
ondas, trayectorias y avisos, conservar geometría dinámica y añadir sólo material
decorativo donde aporte; el arte pintado no debe definir el radio de daño.

Para UI mantener texto, precios, cifras y botones en HTML. Los marcos pintados
pueden usar nueve regiones para adaptar anchura/altura conservando esquinas:
[MDN border-image-slice](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice).
No convertir cada pantalla en una imagen con texto: dificultaría responsive,
estados y mantenimiento. No es necesario migrar a Unity para este resultado.

## Estado de implementación: catálogo completo de cartas

La implementación elegida conserva SVG/HTML para marcos, iconos, títulos,
descripciones, cifras y acciones; sólo agrega una ilustración WebP al contenido
visual de cada carta. Cada familia usa un arte base compartido por sus rangos,
cada una de las doce evoluciones tiene su propia ilustración, y cada mejora que
no es arma (incluyendo escudo, armadura y vampirismo) tiene una imagen distinta.
Las maestrías y la potencia repetible de Overdrive siguen mostrando la imagen de
la evolución seleccionada para esa arma.

El catálogo suma 29 WebP y 1,959,074 bytes de archivos. El navegador sólo crea
los elementos de imagen de las cartas de la oferta activa (máximo tres); el
cálculo teórico de RGBA8 no sustituye medir memoria real. No hay texturas Pixi,
precarga de todo el catálogo ni llamadas al generador durante el juego.

La comprobación automatizada cubre la existencia de arte en todas las ofertas,
unicidad entre familias/ramas/mejoras, conservación de las doce evoluciones en
maestrías, carga de archivos, tarjetas reales de armadura/escudo/vampirismo,
fallback y layout en varios viewports. La revisión artística final y el tacto en
móvil físico aún requieren al usuario. Esta entrega no prueba FPS de portales ni
modifica balance; consultar el README canónico del catálogo para rutas y pruebas.

El objetivo del proyecto sigue siendo ≤5 MB de descarga inicial y una partida
móvil estable. Los umbrales de plataforma deben verificarse al publicar;
este estudio no certifica Poki/CrazyGames ni rendimiento de un arte todavía
inexistente. No se generaron ni integraron nuevas imágenes en esta investigación.
