# Balas y estelas PNG — 03-10-2026

Extensión visual solicitada por el usuario para los diez cañones. No cambia
balance, targeting, cadencia, daño, muzzle slots, colisiones, precios ni saves.
Contrato de producción: [Arte híbrido](../../../../docs/design/ARTE_HIBRIDO.md).

## Identidad por paquete

| ID / modelo | Cabeza | Estela |
| --- | --- | --- |
| `basic` / Pulse Standard | Pulso dorado con rieles de titanio azul | Ion dorado con filamentos cian |
| `curve` / Arc Needle | Aguja de cristal violeta | Seda violeta curva |
| `smoke` / Cinder Bloom | Brasa de cobre con fisuras calientes | Humo estrecho con rescoldos |
| `rainbow` / Spectrum Drive | Tres cuñas prismáticas | Filamentos multicolores entrelazados |
| `lattice` / Lattice Halo | Perla rosa dentro de jaulas de diamante | Anillos de resonancia, no otra hélice |
| `helix` / Helix Lance | Lanza helada con conductores dorados | Doble hélice cian/oro |
| `bloom` / Bloomwake | Semilla menta y pétalos de nácar | Filamento con pétalos rosa |
| `spearhead` / Ivory Spear | Esquirla de marfil con alas cortas | Dos pistas blancas sobre ion cian |
| `gyre` / Gyre Coil | Cápsula concéntrica de latón/menta | Trenza de tres ondas azul/menta |
| `razor` / Rift Saw | Esquirla serrada plateada/escarlata | Cinta rosa con chevrones de corte |

Lote adicional: [Catálogo diez](../../../../docs/design/CATALOGO_DIEZ.md).
Gyre recorre tres oscilaciones amortiguadas (hasta 10 px, 0.65 s); Razor una
onda angular suavizada (hasta 9 px, 0.55 s). Derivada analítica alinea la punta
con su estela; ambos vuelven al eje y alternan lado por boca. No hay targeting,
simulación ni interpolación física nueva. Los veinte PNG suman 110,666 bytes.

Se compararon masas compactas, agujas y cuerpos con aletas/jaulas para asignar
una firma apropiada a cada paquete. No son cambios de color de la misma bala.
Frente `+X`; cámara cenital, sin perspectiva. Cabezas centradas, núcleo luminoso
localizado y contraste a tamaño pequeño; ninguna cabeza usa un gran halo circular.
Los halos de peligro, player y bosses conservan su prioridad visual.

## Producción y procedencia

Ocho generaciones originales con el generador de imágenes integrado de Codex,
`transparent_background=true`, sin referencia de otros artistas y sin llamar a
una API de pago. Cada generación contiene una cabeza arriba y su estela debajo,
separadas por alpha real. Los PNG de runtime están en este directorio, no dependen
de rutas personales del generador. Prompts literales y masters de procedencia:
[`projectile-image-sources.json`](../../../../scripts/projectile-image-sources.json).

[`prepare-projectile-art.py`](../../../../scripts/prepare-projectile-art.py) hace
sólo derivados mecánicos: localiza la separación transparente, recorta padding
casi invisible por límites alpha>=8, conserva el RGBA original dentro del recorte,
escala proporcionalmente y centra con padding. No dibuja efectos ni fabrica alpha.
Con los masters disponibles: `python scripts/prepare-projectile-art.py`.
Los masters no se borran ni se modifican. Los derivados se guardan optimizados.

## Runtime, encuadre y coste

- 16 PNG RGBA8: ocho cabezas de 96×48 y ocho cintas de 128×32.
- **86,229 bytes** para el catálogo completo. Un paquete equipado representa
  **34 KiB RGBA8 teóricos** (18 KiB cabeza + 16 KiB cinta); Low sólo pide la cabeza.
  Los ocho paquetes suman 272 KiB teóricos si se visitan todos en esa sesión.
  Estas cifras no incluyen DOM, overhead, mipmaps, fallback ni memoria total/GPU.
- Cabeza base de 36×18 unidades lógicas, anchor central, pulso de escala existente.
  La hitbox real sigue siendo la de simulación; no se agranda para seguir la imagen.
- Rail Lance y Pulse Volley mantienen sus PNG y tamaños de evolución aprobados;
  su estela usa el paquete elegido con acento dorado/menta. No se sustituyen por
  la imagen del arma base ni se cambia su mecánica.
- El loader/caché de `ArsenalTextures` se comparte; sólo se prepara el cosmético
  equipado. Decodifica antes de `Texture.from`, cachea error y conserva deadline
  finito. `CastArt` congela cabeza/cinta por disparo: una descarga tardía se usa
  en el siguiente disparo, no cambia el material de una bala que ya está volando.
- Las cuatro bandas de cinta son vistas de **una misma TextureSource**, cacheadas
  por textura. Se reutilizan 256 sprites en Medium y 480 en High (64/120 balas).
  Low tiene cero sprites/peticiones/cálculos de estela. Las 300 cabezas y el pool
  de glow permanecen acotados; no hay blur, shaders, nodos ni uploads por frame.
- Duración, límite de longitud y arco cosmético existentes permanecen iguales.
  Una bala recién nacida no deja estela detrás de la boca. El arco no altera
  trayectoria, colisión o apuntado de la simulación.
- SVG de cabeza y cinta procedural siguen siendo fallback. Los antiguos PNG de
  puffs/pétalos no se borran, pero combate ya no los solicita como una segunda cola.
- Skins usa estos mismos PNG: una muestra horizontal por tarjeta y dos verticales
  en el modal, sin nave/cables. Carga sólo imágenes visibles; SVG fallback durante
  cola, timeout/error. Sólo el modal anima y respeta movimiento reducido.

## Pruebas y rutas

`ProjectileRasterAssets.test.ts`, `ArsenalTextures.test.ts`, `CastArt.test.ts`,
`ProjectileTrailView.test.ts`, `ProjectileTrailTexture.test.ts` y
`CannonPreviewSvg.test.ts` cubren catálogo, tamaño, carga selectiva, pooling,
material tardío, Low, boquilla y composición. Regresiones de encuadre/compra y
carga lenta/fallida permanecen en `tests/browser/`.

`node scripts/qa-projectiles.mjs` inspecciona las ocho recetas Low/High usando
el hook de devtools de Pixi, sin modificar simulación; guarda capturas/JSON en
`test-results/projectiles/` y cierra su propio preview/navegador. Ejecutar después
de Playwright (éste limpia `test-results/`). No mide FPS en teléfono físico.

Ruta ya existente, cambiar sólo `cannon` por un ID de la tabla:
`/?weapon-path=projectile&debug=1&cannon=helix&quality=high`.
La ruta normal `/?act=radial&cannon=helix&quality=medium` también prueba el paquete;
no se crea un nuevo atajo de simulación. `quality=low` prueba cabeza sin estela.
Evoluciones: `/?evolution=rail-lance&scenario=mass&debug=1&cannon=helix&quality=high`
y la misma ruta con `evolution=pulse-volley`.

La revisión humana de arte/tamaño y el rendimiento en móvil físico quedan
pendientes; aprobar tests no equivale a certificar game feel ni una run prolongada.

Verificación local de esta entrega: typecheck, **601 unitarias / 124 archivos**,
tres builds bajo 15 MB y **14 smoke enfocados** desktop/móvil (1.9 min), con
encuadre, compra, persistencia, pause/resize, carga lenta/fallida y las doce
evoluciones. QA confirmó las ocho cabezas/cintas en Low/High y los mismos
300 heads / 0 o 480 sprites de cola. No se ejecutó toda la suite browser.

El stress de 250 enemigos + 300 balas pasó sus controles de material/pooling
sin errores. En Chromium headless, ANGLE/SwiftShader por software, la primera
muestra final acotada de 5 s registró ~22.5 FPS Low y ~7.7 FPS High (p95 del
profiler HUD 50/100 ms); el reporte identifica el renderer de software.
**No cumple el objetivo físico
de 60 FPS en ese entorno** ni es una comparación anterior/después. No declarar
una mejora de FPS ni aprobar la puerta de rendimiento con estos datos: requiere
GPU/móvil real y comparación del mismo escenario. Heap retenido tras GC varió
~0.006 MiB Low / ~0.35 MiB High en esa muestra corta; no demuestra ausencia de
fugas durante horas ni corresponde a memoria de Node/Vite.

Artefactos completos con este lote: local 12,244,958 bytes (incluye mapas),
Poki 7,329,924 y CrazyGames 7,329,930. Persiste warning de chunk JS >500 KB;
los presupuestos duros pasan, sin certificar SDKs de portal ni publicación.
