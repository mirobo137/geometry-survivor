# Órbita de Nacre

- ID: nacre-orbit. Rol: atmósfera cosmética detrás de arena/entidades.
- Fuente: nacre-orbit.svg, SVG original escrito en código en esta entrega;
  no generado por un modelo de imágenes ni derivado de una foto externa.
- Brief: planeta anillado en penumbra arriba a la izquierda, luna opuesta,
  polvo nacarado; cámara espacial, centro silencioso, sin texto en el dibujo,
  rayos, flashes, retícula ni estrellas con aspecto de pickups.
- Frame: 0 0 768 768; ancla central; cover uniforme con recorte deliberado.
- Material: gradientes suaves, estratos tenues, anillos detrás/delante del
  planeta. La composición conserva volumen en una única capa inmóvil.
- Fuente: 5,503 bytes. Textura: canvas RGBA8 768×768, base 2.25 MiB.
- Alpha: composición opaca; no necesita transparencia porque reemplaza toda
  la lámina de fondo. Sin filtros ni imágenes embebidas.
- Consumidores: CSS de locker y NacreBackgroundView, misma URL empaquetada.
- Carga/ownership/fallback: Promise compartida de vida de aplicación, carga
  diferida al equipar, base oscura si falla. No modificar textura tras destruir
  una vista. Low/Medium/High comparten material; no hay piezas de muerte.
- Precio: 0 NOVA; equipar añade el ID al save sin débito ni anuncio.
- Guía canónica y validación: docs/design/FONDOS_PREMIUM.md.

## Flor del Ocaso

- ID: vesper-bloom. Rol: atmósfera cosmética orgánica detrás de la arena.
- Fuente: vesper-bloom.svg, SVG code-first; no bitmap externo ni imagen de IA.
- Brief: flor astral facetada arriba a la derecha, núcleo rosado apagado,
  biseles violetas y trazos teal; centro despejado, sin texto, rayos, retícula
  ni formas que parezcan pickups.
- Frame: 0 0 768 768; ancla central; cover uniforme y recorte deliberado.
- Material: seis pétalos con gradientes justificados por volumen, costuras
  tenues y núcleo localizado. Una sola lámina inmóvil.
- Consumidores: CSS del locker y VesperBackgroundView mediante
  StaticSvgBackgroundView; mismo SVG en preview y runtime.
- Fuente/fallback: asset de 5–6 KB aproximados, rasterizado una vez a 768×768;
  medir bytes exactos en build. Base oscura si falla, sin partículas extra.
- Precio: 0 NOVA; equipar no cobra ni abre anuncio.
