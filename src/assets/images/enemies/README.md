# Arte PNG de enemigos

Entrega del 04-10-2026: un cuerpo PNG con alpha por cada uno de los 13
enemigos comunes y tres bosses. Como no había prompts por enemigo versionados,
se generó cada imagen usando como referencia visual el master SVG actual. Los
briefs completos de regeneración de abajo son una ficha nueva, no transcripciones
literales de la herramienta.

## Ficha común de generación

Para regenerar una fila, combinar su descripción con este prompt:

> Ilustración 2D cenital para un sprite de enemigo de un videojuego sci-fi.
> Usa la imagen de referencia adjunta para mantener la silueta reconocible,
> las masas, el frente y la paleta distintiva; conviértela en arte pictórico
> facetado de alta calidad, con placas metálicas, cavidades oscuras, biseles
> locales limpios y energía luminosa integrada en el reactor. Una sola nave
> completa, orientada recta hacia arriba (frente -Y), centro de masa en el
> centro exacto del lienzo, flotando sin perspectiva. Conserva proporciones
> legibles a 32–64 px en las naves comunes y hasta 112 px en bosses. La nave
> debe caber entera dentro del cuadro con margen transparente pequeño y
> uniforme. Mantén una silueta negra clara, contraste suficiente en fondo
> oscuro o claro y una lectura material coherente; la luz sale del casco, sin
> halo exterior. Fondo realmente transparente, con alpha fuera de la nave.
> No dibujes suelo, sombra proyectada, fondo pintado, estrellas, humo, rayos,
> texto, letras, logotipos, interfaz, borde, perspectiva oblicua, segunda nave,
> piezas separadas ni elementos fuera del cuerpo.

Las instrucciones particulares registran la identidad que debe distinguirse
en el catálogo y su relación con la referencia SVG. No cambian hitbox, radio,
centro, orientación ni reglas del juego.

## Archivos finales y procedencia

| ID / archivo | Frame | Referencia SVG | Diferenciación visual para regenerar | Origen del generador | Bytes |
| --- | ---: | --- | --- | --- | ---: |
| `chaser.png` | 64×64 | `src/assets/svg/enemies/chaser/chaser.svg` | Scout blanco marfil y acero, proa fina, hombros estrechos, dos motores y reactor ámbar; compacto y ágil. | `exec-f4c5378c-9ae9-4a09-8604-4098bf0d3ff8.png` | 2,005 |
| `fast.png` | 64×64 | `src/assets/svg/enemies/fast/fast.svg` | Interceptor cian de proa larga y alas barridas; silueta de flecha más delgada que Chaser. | `exec-f2661fed-dbd5-42b9-95e2-9eb4a1c2fbeb.png` | 1,898 |
| `tank.png` | 64×64 | `src/assets/svg/enemies/tank/tank.svg` | Bastión ancho violeta, proa truncada, hombros blindados y reactor hundido; masa pesada sin halo. | `exec-82758de3-f35d-4975-86d4-c25010155c95.png` | 2,695 |
| `elite.png` | 64×64 | `src/assets/svg/enemies/elite/elite.svg` | Casco de amenaza prioritaria, placas magenta facetadas y núcleo rosado brillante; silueta afilada. | `exec-82f4c91a-3671-47b9-b8ee-7c70d2b1de67.png` | 2,424 |
| `orbiter.png` | 64×64 | `src/assets/svg/enemies/orbiter/orbiter.svg` | Nave de arco angular azul: cuerpo central compacto, dos placas laterales curvas y cristal azul claro. | `exec-dca6ae7a-d7ff-4f19-9c43-175095502c69.png` | 2,337 |
| `charger.png` | 64×64 | `src/assets/svg/enemies/charger/charger.svg` | Ariete triangular naranja, estrecho y axial, con cuña frontal dorada y motores integrados en la popa. | `exec-14b38609-3d6f-4006-9851-de6fe05b9875.png` | 2,510 |
| `splitter.png` | 64×64 | `src/assets/svg/enemies/splitter/splitter.svg` | Diamante índigo de fractura, placas laterales separables y doble señal de núcleo violeta; no es un Orbiter recoloreado. | `exec-1c6e147f-2c30-4dfd-975a-78528d352c2c.png` | 2,753 |
| `prism-weaver.png` | 64×64 | `src/assets/svg/enemies/prism-weaver/prism-weaver.svg` | Telar astral teal de tres brazos abiertos alrededor de un huso prismático central. | `exec-4fee3a07-b313-49b9-aebc-74c2e6cdd2d3.png` | 2,418 |
| `warden-replica.png` | 64×64 | `src/assets/svg/enemies/warden-replica/warden-replica.svg` | Réplica pequeña del astrolabio de Warden, con tres brazos cortos, blindaje turquesa y núcleo cian vertical. | `exec-8a891d99-d8f6-4492-ba59-542f5d52111b.png` | 2,049 |
| `fracture-gunner.png` | 64×64 | `src/assets/svg/enemies/FractureEnemySvgMarkup.ts` | Artillería asimétrica de acero azul: cargador a babor, cañón largo a estribor, recámara oscura y óptica cian. | `exec-a28262ca-a10f-4bf4-89a6-c9ba43ecb15d.png` | 2,197 |
| `thorn-bastion.png` | 64×64 | `src/assets/svg/enemies/FractureEnemySvgMarkup.ts` | Coraza compacta de seis escamas de cobre oscuro, dientes perimetrales cortos y cámara coral. | `exec-01c39d50-387a-433e-b1d1-c12ee37ee939.png` | 2,496 |
| `zigzag-reaver.png` | 64×64 | `src/assets/svg/enemies/FractureEnemySvgMarkup.ts` | Interceptor de alas escalonadas en Z, eje quebrado, cerámica oliva y propulsores ámbar descentrados. | `exec-18b0d227-5d1c-46d6-aa8b-54fbda96b539.png` | 1,865 |
| `rift-miner.png` | 64×64 | `src/assets/svg/enemies/FractureEnemySvgMarkup.ts` | Minador industrial con dos silos verticales, puente transversal, cargas hundidas y compuertas violetas. | `exec-707098aa-84f2-42b6-a010-69c368468d45.png` | 2,459 |
| `core-sentinel.png` | 112×112 | `src/assets/svg/enemies/boss/boss.svg` | Boss simétrico de blindaje concéntrico rosado, placas radiales pesadas y núcleo reactor cian luminoso. | `exec-b045adc0-5398-44bc-82e7-b283d4b06789.png` | 5,583 |
| `orbital-warden.png` | 112×112 | `src/assets/svg/enemies/boss/orbital-warden.svg` | Astrolabio de tres brazos tipo hoz alrededor de un huso longitudinal y cristal reactor cian. | `exec-4293d61b-5d70-44df-b2c7-37aacb26f97b.png` | 5,111 |
| `fracture-engine.png` | 112×112 | `src/assets/svg/enemies/FractureEnemySvgMarkup.ts` | Máquina de asedio de travesaño ancho, dientes cortos, dos hornos traseros y reactor rectangular coral segmentado. | `exec-28d7504d-ef4f-4bbe-8795-f041616f7eff.png` | 5,627 |

Los originales del generador fueron imágenes de 1254×1254 en el generador
integrado `image_gen`, con previsualizaciones renderizadas de los masters SVG
como referencia visual. Sus nombres originales son los `exec-*.png` de la
tabla y quedaron fuera del repositorio en `/workspace/generated_images`.

## Derivación, alpha y consumo

- Se redujeron los originales con ImageMagick/Lanczos al frame lógico entero:
  64×64 para enemigos y 112×112 para bosses. No hay trim, rotación ni escala
  adicional en Pixi; cada textura conserva centro `(0,0)` y frente `-Y`.
- PNG con paleta RGBA de hasta 128 entradas, compresión PNG nivel 9 y metadata
  eliminada.
  Los 16 archivos suman **46,427 bytes**. La comprobación de canal alpha sobre
  cada archivo da mínimo 0 y máximo entre 65,021 y 65,535; incluye alpha
  transparente y parcial en los bordes, no un damero pintado.
- `EnemyRasterTextures.ts` carga los URL mediante `Image`, espera `decode()` y
  crea una `Texture` compartida. El master SVG permanece visible si falla la
  carga. Las texturas raster se mantienen durante la vida de la sesión; las
  vistas destruyen sus subtexturas de fragmentos con `destroy(false)`, no la
  fuente compartida.
- Common: una textura para sprite vivo y ruptura pooled. Boss: PNG para el
  cuerpo al acabar la entrada; sus cuatro partes SVG siguen siendo las capas
  de la entrada actual. Las futuras entradas particulares se diseñan después.
- No hay cambios de colisión, movimiento, daño, ataques, pools o balance.
