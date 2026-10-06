# Ivory Spear — nave base y cañón original

Estado: **arte aprobado como referencia técnica** y reutilizado como nave base
seleccionada en instalaciones nuevas. La migración del catálogo y los 14 nuevos
PNG están completos localmente; el usuario aún debe revisar la captura antes de
que se publique. Catálogo y costes:
[`ships/README.md`](../ships/README.md) y [`cannons/README.md`](../cannons/README.md).

## PNG base

| Recurso | Archivo | Maestro | Frame del juego | Pivote |
| --- | --- | ---: | ---: | --- |
| Nave completa | [tether-ship.png](tether-ship.png) | 1254×1254 | 56×64 | centro `(0.5, 0.5)` |
| Módulo de cañón | [tether-cannon.png](tether-cannon.png) | 1217×1292 | 20×26 | boca `(0.5, 0.08)`; cable `0.84` |

Ambos son PNG RGBA generados con ImageGen integrado, no SVG rasterizado. La
nave conserva punta de lanza marfil, recesos azul noche, reactor cian y costuras
oro cálido; casco y propulsor son una sola imagen. El cañón tiene un conector
trasero y se instancia dos veces con una textura compartida. Prompt y fuente
original están en [`tether-image-sources.json`](../../../../scripts/tether-image-sources.json).

Frente: `−Y`. El player mantiene radio físico 22 y centro; las bocas siguen en
`(±27, −11)`. Los puertos del casco son `(±11, 7)`. Los cables decorativos van
debajo del casco y conservan ocho segmentos acotados. Alas, cables y cañones no
añaden hitboxes, daño ni física de cuerda.

## Uso del juego

- Instalación nueva: Inicio → Skins → Naves → Ivory Spear, ya equipada gratis.
- Modelos: Skins → Cañones → Ivory Spear, también gratis.
- Ruta de desarrollo: `/?skin=spearhead&cannon=spearhead&act=radial`.
- `?ship-preview=tether` sigue aceptado como alias de comparación de la nave base.

Los perfiles existentes mantienen la nave y el cañón que tenían seleccionados,
conservan propiedad/precios de su catálogo, y reciben Ivory Spear gratis en el
locker. No cambia el schema. El modelo de cañón se sigue guardando aparte de la
nave; elegir otro actualiza sólo el arte de las dos torretas, el proyectil y la
estela ya asociados a ese ID.

## Compositor y ciclo de vida

`TetheredShipView` es el compositor compartido de las ocho naves y los ocho
cañones; el nombre histórico del archivo/clase se conserva para compatibilidad.
Carga Image → `Texture.from` sólo para las dos selecciones actuales, cachea
texturas por URL y nunca las destruye desde una vista. Cables → nave → cañones →
flash de daño. Error de decode conserva el compositor vectorial anterior. Low
mantiene el arte esencial y reduce la flexión; reduced-motion deja cables
quietos. La pose pausa con el reloj de presentación y se reinicia/revive usando
los mismos nodos.

Las tarjetas DOM comparten los mismos archivos, son estáticas y usan carga lazy.
Sólo el modal inspeccionado anima la nave; `prefers-reduced-motion` y las vistas
ocultas detienen movimiento. No se ha medido FPS ni un teléfono físico. El PNG
no cambia gameplay ni presupone una mejora universal de rendimiento.

## QA local

`src/assets/skins/tethered/TetheredAssets.test.ts` verifica dimensiones, formato
RGBA y alpha real de los 16 PNG. `TetheredShipView.test.ts` verifica pivotes,
slots, texturas compartidas, cambio de skin, pausa, retroceso y fallback. El
resultado final de browser y las capturas de revisión se registran en
`PLAN_DESARROLLO.md` sólo si modifican una puerta de aceptación.
