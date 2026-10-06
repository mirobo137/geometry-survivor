# Catálogo de lanzamiento — identidad y composición

Contrato de identidad para diez cosméticos por familia, sin sustituir propiedad,
precios ni IDs existentes. Contratos:
[Naves PNG](NAVES_PNG.md), [Arte híbrido](ARTE_HIBRIDO.md) y
[Fondos premium](FONDOS_PREMIUM.md). No cambia simulación ni balance.

## Dirección visual del catálogo

Tres masas de nave comparadas: catamarán abierto, concha espiral y crucero
rectangular macizo. Se eligen las primeras dos: el crucero se acerca al bastión
ya existente. Corsair separa dos pontones escarlata con un canal delantero;
Nautilus usa una concha de cobalto/latón con turbina excéntrica. No repetir
alas de Manta, media luna Aurora, diamante Eclipse ni escudos Nova.
Verbos: atravesar / envolver. Una imagen completa, frente −Y, frame 56×64,
centro/pivote 0.5, motores traseros integrados; mismos cables, bocas y hitbox.

Tres masas de cañón: resonador circular, mandíbula serrada y barril convencional.
Se eligen resonador Gyre y mandíbula Rift Saw; el barril no aporta identidad.
Frente −Y, un PNG por módulo, frame 30×39, pivote 0.5/0.08 y culata 0.9.
Cabeza/cinta propias; movimiento lateral amortiguado sólo de presentación,
sin perseguir enemigos ni ampliar colisiones. Reusar pools/atlas de feedback.

## Comparación de fondos

| Tema | Motivo / composición | Material y paleta | Luz |
| --- | --- | --- | --- |
| Deep Space | nube periférica sin foco | pigmento índigo | difusa |
| Ion Storm | masas de vapor en esquinas | ion teal/cian | interna |
| Solar Drift | corrientes periféricas | cobre/ámbar | cálida interna |
| Crystal Field | paredes facetadas | geoda violeta/teal | aristas |
| Nacre Orbit | planeta anillado y luna opuesta | atmósfera azul/bronce | lateral |
| Vesper Bloom | pétalos arriba derecha | mineral violeta/rosa | núcleo |
| Tidal Veil | corrientes sin objeto | vapor petróleo/bronce | difusa |
| Silent Archive | bóvedas redondeadas opuestas | cerámica erosionada gris/latón | teal desde abajo |
| Lunar Fault | terrazas de cráter abajo izquierda | basalto/polvo gris/cobre | rasante inferior |
| Leviathan Wake | fósil curvo arriba derecha | hueso jade/nácar azul | dispersa superior |

Se compararon estos tres conceptos nuevos entre sí y contra las siete placas.
Cada uno cambia motivo/composición, material y luz, además de distribución de
masas/paleta. Se descarta otro eclipse o nebulosa recoloreada. Mantener centro
≥55% oscuro, masas enormes periféricas, sin objetos confundibles con combate.
Una placa + cuatro corrientes compartidas; paneo/respiración comunes,
Low/reduced-motion estáticos. Preview y runtime proceden del mismo máster.

## Producción y verificación

Generador integrado, no API de pago. Registrar prompts literales, originales,
derivados, alpha, bytes y validaciones en el manifiesto de este lote. La
aceptación humana y las pruebas físicas se siguen sólo en
[PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md); no inferir FPS de dimensiones o
pooling.

## Catálogo incorporado y costes

| Familia / ID | Nombre | NOVA | Derivados runtime / preview (bytes) |
| --- | --- | ---: | --- |
| Nave `corsair` | Scarlet Corsair | 3,600 | PNG 256²: 65,728 |
| Nave `nautilus` | Nautilus Ark | 4,200 | PNG 256²: 63,155 |
| Cañón `gyre` | Gyre Coil | 3,600 | PNG 128²: 27,572; cabeza 6,132; cinta 5,902 |
| Cañón `razor` | Rift Saw | 4,200 | PNG 128²: 28,589; cabeza 5,661; cinta 6,742 |
| Fondo `silent-archive` | Archivo Silente | 1,200 | WebP 1254²: 86,762; preview 512²: 17,982 |
| Fondo `lunar-fault` | Falla Lunar | 1,800 | WebP 1254²: 114,674; preview 512²: 23,660 |
| Fondo `leviathan-wake` | Estela del Leviatán | 2,400 | WebP 1254²: 65,080; preview 512²: 15,092 |

Son cosméticos comprables con NOVA, no premios forzados ni otra migración. Se
mantienen todos los cosméticos gratuitos y los precios anteriores. Selección y
propiedad usan los mismos guards y payload localStorage; la nave nueva elegida
también aparece en Inicio mediante el contrato ya existente.

Prompts literales de las nueve generaciones originales y rutas fuente:
[`catalog-ten-image-sources.json`](../../scripts/catalog-ten-image-sources.json).
Derivación reproducible: `scripts/prepare-catalog-ten.py`. Los PNG originales
de los tres fondos están en `src/assets/images/backgrounds/`; los originales
transparentes quedan preservados en la ruta privada indicada por el manifiesto.
Esas rutas no se importan en el juego: todos los derivados están en el repositorio.
Para regenerar en otra máquina se necesitan esos originales o repetir la
generación con los prompts; no fabricar un máster desde el derivado pequeño.
Alpha real 0–255 y esquinas transparentes comprobados en ships/cannons;
balas RGBA con canal de ocho bits. Frente nave/cañón −Y, balas +X.
Los cañones se normalizan al material cuadrado y al frame lógico común; las
naves/cabezas/cintas conservan aspecto dentro de su gutter.

Puertos medidos de propulsión: Corsair `[−10,28],[10,28]`; Nautilus
`[−3,28],[3,28]`. Nuevos perfiles Gyre/Razor usan el atlas de feedback ya
existente. No aumentan sprites de jets (3/6/9) ni feedback (4/8/12),
ni buffers de cable. Fallback PNG fallido reutiliza el SVG seguro existente,
no añade masters SVG nuevos.

### Movimiento de bala

Gyre: tres ondas sinusoidales durante 0.65 s, amplitud máxima 10 unidades
lógicas. Rift Saw: cuatro oscilaciones de onda angular suavizada durante
0.55 s, máximo 9. Envolvente seno² elimina salto de salida y vuelve al eje;
la derivada analítica alinea cabeza y cinta. Alternar emisor refleja el gesto.
Es una transformación de presentación: daño, velocidad, hitbox, blanco y
posición de simulación siguen intactos. No comunica proyectiles teledirigidos.
Previews del modal muestran un gesto reducido por CSS; tarjetas estáticas y
reduced-motion sin ese movimiento. Low conserva cabeza móvil sin estela,
como Arc Needle/Helix; no se añaden texturas invisibles ni pools.

### Recursos

Cada placa activa sigue 1 Sprite + 4 corrientes / 2 texturas compartidas.
Placa RGBA8 1254² ≈6 MiB; preview 512² ≈1 MiB si el navegador la decodifica.
Dos naves añaden 512 KiB y dos cañones 128 KiB de textura si se visitan ambos;
dos cabezas y dos cintas añaden 68 KiB. Estimaciones sin overhead/mipmaps,
no mediciones de memoria total. El caché es acotado por catálogo, no una
promesa de descargar o retener únicamente la opción actualmente equipada:
visitar otros cosméticos puede conservar sus texturas durante la sesión.

La primera compilación rebasó 15 MB. Se regeneraron trece WebP de los fondos
anteriores desde sus PNG intactos con Q82/method=6, misma resolución, ahorrando
483,096 bytes; no se recomprimieron los WebP existentes ni se cambiaron overlays.
Script `scripts/optimize-background-delivery.py 82 --apply`.
PSNR comparado con el derivado previo: placas 40.87–45.90 dB; previews
39.62–44.06 dB. Nacre fue comparado visualmente a tamaño completo. Nuevos
fondos Q78 y previews Q76.

Artefactos completos verificados, incluidos mapas de diagnóstico:
local 14,964,288; Poki 10,012,364; CrazyGames 10,012,370 bytes. Límite 15,000,000
sin aumento ni eliminación de mapas. Margen local sólo 35,712 bytes: antes de
otra ampliación revisar descarga/chunks/derivados; no asumir margen infinito.

## QA y runtime

`scripts/qa-catalog-ten.mjs` comprueba las tres placas nuevas en Low/High,
carga selectiva, corrientes y errores JS/HTTP. Los tests de catálogo cubren IDs,
transparencia, dimensiones, guardado, fallback lazy, movimiento de balas y
límite de desplazamiento. Las capturas QA de `test-results/` no forman parte
del runtime. El estado de aceptación física y de publicación está únicamente en
[PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md); SwiftShader no certifica FPS ni
coste GPU en teléfono.

## Prueba directa sin comprar

- `/?weapon-path=projectile&debug=1&quality=high&skin=corsair&cannon=gyre&background=silent-archive`
- `/?weapon-path=projectile&debug=1&quality=high&skin=nautilus&cannon=razor&background=lunar-fault`
- Usar `background=leviathan-wake` para el fósil; `quality=low` para comparar
  cabeza sin cinta y fondos estáticos. Las URLs de drill no desbloquean el locker.
