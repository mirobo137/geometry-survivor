# Solstice Regent

Arte generado el 04-10-2026 con la función integrada de imágenes, alpha real.
Prompt literal e identidad: [PROMPT.md](PROMPT.md). Fuente original:
`exec-ac180d21-b54d-4719-849b-078f166803f5.png`, 1173×1341 RGBA.
El original pertenece a la salida de generación; el juego sólo usa archivos
versionados de esta carpeta y no depende de rutas privadas del generador.

| Asset | Tamaño | Bytes | Uso |
| --- | --- | ---: | --- |
| solstice.png | 224×256 RGBA | 82,496 | Maestro transparente |
| solstice.webp | 224×256 | 16,836 | Runtime, calidad 75, alpha exacto |

Resize Lanczos full-frame centrado, sin trim/recolor/despiece; regeneración
mecánica: `scripts/prepare-daily-wheel-art.py`, fallback al maestro versionado.
Frame lógico 56×64, anchor `(0.5,0.5)`, proa arriba; tres toberas en
`(-7.8,24)`, `(0,28)`, `(7.8,24)`. Un casco entero y los propulsores compartidos
de `PlayerPropulsionDefinitions`, no capas PNG adicionales. Hitbox/radio22,
estadísticas, cables y cañones no cambian. Low/Medium/High conservan silueta.

ID persistente `solstice`, acquisition `daily-wheel`, nunca compra gratuita
por `priceNova: 0` ni desbloqueo genérico por anuncio. Premio de ambos giros
(gratis/video), 1% inicial y +1 punto por giro hasta 20%, de
[Ruleta diaria](../../../../../docs/design/RULETA_DIARIA.md). Equipo opcional,
PNG único también en Inicio. No es recolor de Asterion: tres proas de corona,
obsidiana/oro y reactor carmesí frente al arco de marfil/mint del premio semanal.
