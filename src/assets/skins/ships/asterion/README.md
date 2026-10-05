# Asterion Courier — skin de evento

## Identidad y procedencia

- ID de guardado: `asterion`; consumidor: skin semanal de nave RET-F01.
- Concepto visual recuperado del arte entregado: nave cenital de proa afilada,
  casco de porcelana marfil/titanio, reactor verde menta, placas grafito y alas
  curvas abiertas con acento dorado. La silueta es propia; no es un recolor de
  Ivory Spear ni sustituye las diez naves del catálogo base.
- Procedencia: imagen raster generada con la herramienta de imágenes de Codex
  en la sesión anterior y conservada como maestro dentro del repositorio.
- El prompt literal original no se archivó con el asset; esta descripción es
  una ficha de concepto recuperada, no una transcripción inventada. Si se
  regenera o deriva arte, guardar el prompt exacto y registrar la nueva fuente.
- La imagen sólo contiene la nave: sin texto, interfaz, fondo pintado ni piezas
  separadas. El motor está integrado. No cambia colisión, armas, estadísticas,
  apuntado ni propulsión.

## Archivos y encuadre

| Archivo | Uso | Dimensiones | Peso |
| --- | --- | ---: | ---: |
| `asterion.png` | Maestro transparente versionado | 224×256 RGBA | 45,347 bytes |
| `asterion.webp` | Runtime | 224×256 | 11,276 bytes |

Frame lógico de Pixi: 56×64, centro `(0.5, 0.5)`. La imagen conserva su proporción
4:~4.57 en menú/locker; el compositor la ajusta al frame de batalla sin cambiar
el pivote compartido. Se carga sólo para la nave equipada o su preview, mediante
`PLAYER_SHIP_RASTER_ART` y `?no-inline`; no se crea una textura de catálogo para
cada skin.

## Catálogo y propiedad

Asterion es la undécima entrada elegible, pero no amplía el catálogo base de diez.
Sólo el recibo confirmado del reto semanal añade su ID a `skins.unlocked`; el
precio cero es un marcador de evento, no una compra gratuita. Reclamarla no la
equipa automáticamente. Si ya está desbloqueada, una edición semanal posterior
ofrece la cantidad authored de NOVA descrita en
[`RETENCION_EVENTOS_Y_RECOMPENSAS.md`](../../../../../docs/design/RETENCION_EVENTOS_Y_RECOMPENSAS.md).

La regresión de `TetheredAssets.test.ts` comprueba dimensiones, alpha real y
frame lógico. Revisar también su legibilidad en 32/64/128 px y en las vistas de
Inicio, locker y batalla antes de aprobar visualmente la recompensa.
