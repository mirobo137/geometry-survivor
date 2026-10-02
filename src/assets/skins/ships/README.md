# Flota de naves PNG

Migración de skins completada localmente el 01-10-2026 para revisión visual.
La aprobación del código/artes y el paso a `main` siguen pendientes del usuario.
La dirección visual y los prompts íntegros están en
[`scripts/fleet-skin-image-sources.json`](../../../../scripts/fleet-skin-image-sources.json);
el contrato general está en [`docs/design/NAVES_PNG.md`](../../../../docs/design/NAVES_PNG.md).

## Identidad de la flota

Cada nave es una imagen PNG RGBA completa, vista cenital con proa hacia `−Y` y
motor integrado. Las siete identidades nuevas cambian contorno, masa, material y
acento; ninguna es sólo un recolor de Ivory Spear o de las naves SVG anteriores.
Ivory Spear aporta la escala de cámara y el idioma de mundo. Los SVG antiguos no
se usaron como referencia de forma.

| ID guardado | Nave | Lectura de silueta y material | NOVA |
| --- | --- | --- | ---: |
| `spearhead` | Ivory Spear | Lanza simétrica, placas de marfil y cristal cian; nave base | gratis |
| `cyan` | Aurora Strider | Media luna abierta, corredor azul acero y plata | 0 |
| `violet` | Eclipse Prism | Coraza angular de amatista que forma un eclipse facetado | 250 |
| `amber` | Solar Bastion | Búnker hexagonal ancho, bronce y reactor ámbar | 600 |
| `emerald` | Verdant Vector | Quilla biocristalina con cuatro hojas curvas y vacíos amplios | 1,200 |
| `obsidian` | Obsidian Relay | Cometa furtiva oscura con tres puntas de señal rosa | 1,800 |
| `nova` | Nova Warden | Escudo radial de seis caras alrededor de una estrella | 3,000 |
| `manta` | Manta Veil | Ala continua de manta, nácar y reflejos marinos | 0 |

Se preservan los siete IDs, precios, nombres de catálogo, selección, propiedad y
progreso ya guardado. Los perfiles nuevos empiezan con Ivory Spear y sus cañones
gratuitos; la migración agrega esos dos cosméticos gratuitos a perfiles previos
sin cambiar su nave ni cañón actualmente seleccionados. `cyan` sigue disponible
gratis, como antes.

## Frame y compositor

| Propiedad | Contrato |
| --- | --- |
| Archivos nuevos | Siete PNG, cada uno 256×256 RGBA |
| Frame en mundo | 56×64, anchor `(0.5, 0.5)` |
| Player físico | Centro y radio 22 conservados |
| Orden | Cables → nave PNG → cañones → flash de daño |
| Presets | Silueta completa en Low/Medium/High; sin capas animadas nuevas |
| Movimiento | La nave gira/derrota con el transform existente; el motor va integrado |
| Fallback | PlayerView SVG anterior si el PNG seleccionado no carga o no decodifica |

`PlayerView` usa el `TetheredShipView` existente para las ocho naves. Sólo carga
la nave equipada y el cañón equipado; el flash comparte la textura de la nave y
las dos bocas comparten una textura de cañón. El locker enseña los PNG reales en
tarjetas estáticas y sólo anima la vista modal seleccionada. Las miniaturas son
HTML `img` con carga diferida. Cambiar la calidad, morir, revivir, pausar o
reiniciar no cambia daño, colisión, slots, apuntado ni cadencia.

El nombre histórico `TetheredAssets.ts` se conserva por compatibilidad con la
prueba y la URL de comparación `?ship-preview=tether`; la ruta normal ya usa
PNG. Manta Veil también es una sola imagen: el antiguo PNG de aletas queda como
material histórico, no como pieza de runtime para esta skin.

## Coste medido

Las siete naves nuevas pesan **566,547 bytes**. Con Ivory Spear, los ocho PNG de
nave suman **632,544 bytes**. Los siete cañones nuevos pesan **95,303 bytes**;
con el cañón base existente, los ocho PNG suman **108,481 bytes**. Total de los dieciséis assets:
**741,025 bytes (~723.7 KiB)**.

En Pixi se decodifica sólo una nave y un cañón: **320 KiB RGBA8 teóricos**
(256²×4 + 128²×4), sin mipmaps ni overhead. Los dos módulos y el flash reutilizan
esas texturas. Abrir el locker puede hacer que el navegador descargue miniaturas;
no crea ocho texturas Pixi ni demuestra un cambio de FPS. Las pruebas no miden un
móvil físico.

## QA

`TetheredAssets.test.ts` valida dimensiones, PNG RGBA de 8 bits, alpha real con
las cuatro esquinas transparentes, al menos un píxel opaco, tamaño acumulado y
el layout de los slots/cables. Para revisar las artes a escala de catálogo se
pueden abrir `test-results/skin-refresh/ships-contact.png` y la captura del
locker generada al completar el smoke. El reporte, navegador y rutas probadas
se registran en `CONTINUACION.md`.
