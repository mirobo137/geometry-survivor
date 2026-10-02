# Cañones PNG

Migración de modelos terminada localmente el 01-10-2026 para revisión humana;
no se ha publicado. Prompts y procedencia están en
[`scripts/fleet-skin-image-sources.json`](../../../../scripts/fleet-skin-image-sources.json).
La guía canónica es [`docs/design/NAVES_PNG.md`](../../../../docs/design/NAVES_PNG.md).

## Ocho modelos intercambiables

Los siete modelos ya existentes reciben arte nuevo sin cambiar IDs, precios,
dueño, proyectiles ni estelas. Ivory Spear reaprovecha el PNG aprobado y se añade
como octavo modelo gratuito. Cualquier cañón funciona con cualquier nave.

| ID | Modelo | Firma de silueta/material | NOVA |
| --- | --- | --- | ---: |
| `basic` | Pulse Standard | Emisor axial recto, acero azul y línea cian | 0 |
| `curve` | Arc Needle | Aguja violeta con un conductor lateral curvo | 250 |
| `smoke` | Cinder Bloom | Cámara ancha de combustión, bronce oscuro y ámbar | 600 |
| `rainbow` | Spectrum Drive | Bifurcación de cristal prismático | 1,200 |
| `lattice` | Lattice Halo | Jaula angular de cuatro rieles alrededor del núcleo rosa | 1,800 |
| `helix` | Helix Lance | Lanza central envuelta por dos rieles helicoidales | 3,000 |
| `bloom` | Bloomwake | Cáliz de cuatro pétalos de nácar y canales menta | 0 |
| `spearhead` | Ivory Spear | Módulos de marfil originales con gema cian | 0 |

## Pivote y composición en combate

| Propiedad | Contrato |
| --- | --- |
| Archivos nuevos | Siete PNG RGBA de 128×128 |
| Frame en mundo | 20×26; anchor `(0.5, 0.08)` en la punta |
| Cable | Ancla trasera por modelo (`0.9` en los siete nuevos, `0.84` Ivory) |
| Boca | Slots de simulación `(−27, −11)` y `(27, −11)` |
| Dos módulos | Comparten un `Texture` y siguen el apuntado real e independiente |
| Cable al casco | Puertos `(±11, 7)`, ocho segmentos decorativos, sin física |

La imagen completa del cañón se usa dos veces en `TetheredShipView`; el cable
queda debajo del casco y el PNG del módulo encima. El retroceso sólo transforma
el sprite existente. No se añaden bocas, colisión, daño, cadencia, filtros o
partículas. La línea de cable conserva el tratamiento aprobado.

`CannonSelectPanel` enseña el PNG real, montado en la nave base real. El modal
animado sólo añade la estela/proyectil vectorial que ya corresponde al ID; las
tarjetas son estáticas. El octavo modelo Ivory Spear conserva el proyectil básico
y la estela recta, sin tocar el paquete elegido en el guardado. La carga de Pixi
usa la textura seleccionada; las dos instancias comparten esa textura cacheada.

## Coste medido y respaldo

Los siete PNG nuevos pesan **95,303 bytes**; el cañón Ivory Spear pesa **13,178
bytes**, **108,481 bytes** para la flota completa. En runtime Pixi carga sólo un
PNG de cañón: **64 KiB RGBA8 teóricos**. El PNG completo de nave más ese cañón
suman **320 KiB RGBA8** teóricos. El HTML del locker puede descargar miniaturas;
no se infiere FPS de su tamaño o del conteo de archivos.

Si el PNG de nave o cañón no carga, `PlayerView` deja visibles los emisores SVG
de respaldo existentes; los proyectiles y estelas siguen usando sus maestros
SVG actuales. La textura no se destruye desde cada vista porque se comparte.
Maestros/proyectiles vectoriales y las estelas PNG híbridas permanecen para
fallback y propiedad explícita; no se eliminó el catálogo de efectos.

## Validación

`TetheredAssets.test.ts` inspecciona RGBA real, pivotes, slots y presupuesto.
`CannonPreviewSvg.test.ts` comprueba que el preview usa la nave Ivory Spear y dos
referencias al PNG del modelo elegido. La matriz de gameplay y locker Low/High,
persistencia, fallback y requests se documenta en `CONTINUACION.md` cuando se
termine la revisión browser.
