# Cañones PNG

Migración de modelos terminada localmente el 01-10-2026 para revisión humana;
no se ha publicado. Prompts y procedencia están en
[`scripts/fleet-skin-image-sources.json`](../../../../scripts/fleet-skin-image-sources.json).
La guía canónica es [`docs/design/NAVES_PNG.md`](../../../../docs/design/NAVES_PNG.md).

## Diez modelos intercambiables

Los siete modelos ya existentes reciben arte nuevo sin cambiar IDs, precios
ni dueño. La entrega original conservó proyectiles/estelas; desde el 03-10 son
[PNG propios por paquete](../../fx/projectiles/README.md), sin cambios de combate.
Ivory Spear reaprovecha el PNG aprobado y se añade
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
| `gyre` | Gyre Coil | Resonador circular de latón y anillos menta | 3,600 |
| `razor` | Rift Saw | Mandíbulas serradas de titanio y cerámica escarlata | 4,200 |

Los dos adicionales siguen frame/pivote/cable/feedback de la flota.
[Catálogo diez](../../../../docs/design/CATALOGO_DIEZ.md) registra generación,
derivados y validación. Suma de los diez PNG runtime: 164,642 bytes.
Cada pareja reutiliza una sola textura 128²; no crece el pool de fogonazo/vapor.

## Pivote y composición en combate

| Propiedad | Contrato |
| --- | --- |
| Archivos nuevos | Siete PNG RGBA de 128×128 |
| Frame en mundo | 30×39, +25% respecto a 24×31.2 por feedback del 03-10; anchor `(0.5, 0.08)` en la punta |
| Cable | Ancla trasera por modelo (`0.9` en los siete nuevos, `0.84` Ivory) |
| Boca | Slots de simulación `(−27, −11)` y `(27, −11)` |
| Dos módulos | Comparten un `Texture` y siguen el apuntado real e independiente |
| Cable al casco | Puertos fijos `(±11, 7)`, curva cúbica de ocho segmentos con holgura y respuesta suave |

La imagen completa del cañón se usa dos veces en `TetheredShipView`; el cable
queda debajo del casco y el PNG del módulo encima. El retroceso sólo transforma
el sprite existente. No se añaden bocas, colisión, daño, cadencia, filtros o
partículas acumulativas. El fogonazo y vapor breve usan un pool fijo y atlas
de 16 KiB compartido: contrato vigente en la sección de respuesta reactiva de
la guía canónica. Los cables tienen cuerpo oscuro y un reflejo metálico fino.

`CannonSelectPanel` enseña sólo un cañón real y su bala/estela en horizontal,
sin nave/cables. El modal muestra dos módulos y anima; las tarjetas son estáticas.
Cabezas/cintas usan sus PNG propios y el vector anterior como fallback durante
carga/error. Ivory Spear tiene su propia esquirla de marfil y wake cian, sin tocar
la mecánica ni el paquete elegido en el guardado. La carga de Pixi
usa la textura seleccionada; las dos instancias comparten esa textura cacheada.

## Coste medido y respaldo

Los siete PNG nuevos pesan **95,303 bytes**; el cañón Ivory Spear pesa **13,178
bytes**, **108,481 bytes** para la flota completa. En runtime Pixi carga sólo un
PNG de cañón: **64 KiB RGBA8 teóricos**. El PNG completo de nave más ese cañón
suman **320 KiB RGBA8** teóricos. El HTML del locker puede descargar miniaturas;
no se infiere FPS de su tamaño o del conteo de archivos.

Si el PNG de nave o cañón no carga, `PlayerView` deja visibles los emisores SVG
de respaldo existentes; cabeza SVG y cinta procedural son fallback si falla
su PNG. La textura no se destruye desde cada vista porque se comparte.
Maestros/proyectiles vectoriales y las estelas PNG híbridas permanecen para
fallback y propiedad explícita; no se eliminó el catálogo de efectos.

## Validación

`TetheredAssets.test.ts` inspecciona RGBA real, pivotes, slots y presupuesto.
`CannonPreviewSvg.test.ts` comprueba aislamiento sin nave y dos referencias al
PNG del cañón, cabeza y cinta (seis imágenes en modal; tres en tarjeta). La matriz de gameplay y locker Low/High,
persistencia, fallback y requests se documenta en `CONTINUACION.md` cuando se
termine la revisión browser.
