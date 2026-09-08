# Start screen SVG assets

## `mark.svg`

- Rol: marca central del menú.
- ViewBox: `-72 -72 144 144`, ancla en el centro.
- Render: SVG inline en `StartScreen` para conservar escalado y recolor CSS.
- Carga inicial: el mismo master se usa como `img` desde HTML, antes de JS.
  Color cyan de fallback para ese consumidor; el menú inline puede heredarlo.
- Animación: marca quieta en el menú; el master no contiene scripts ni filtros.

## Controles del menú y carga — 08-09-2026

- Los cinco iconos pequeños viven junto a sus botones en `index.html`: play,
  ajustes, ruta, nave y laboratorio. Frame `0 0 24 24`, centro `(12,12)`,
  una instancia por acción, 2–3 primitivas, `currentColor`, sin IDs ni filtros.
- SVG DOM decorativo (`aria-hidden`); texto HTML, foco y targets ≥44 px.
  Estados normal, foco, pressed y disabled se resuelven en CSS; ninguna
  forma ni texto se recorta con clip-path.
- `src/ui/home.css` contiene el acabado y adaptación exclusivos del inicio.
  Dos columnas de acciones, una bajo 360 px; identidad/acciones lado a lado
  solo en desktop con altura suficiente. El contenido largo puede crecer.
- El HTML contiene cobertura opaca crítica de carga, independiente de JS.
  `boot-status.hidden` sólo entrega la pantalla tras terminar `game.start()`;
  errores conservan la cobertura. Barra indeterminada, sin porcentaje ficticio
  ni retraso artificial; reduced-motion la detiene.
- El fondo SVG/RGB existente conserva sus límites móviles. No hay nuevos
  loops Pixi, dependencias, filtros ni cambios de simulación.

## `hero-scene.svg`

- Rol: atmósfera decorativa de la pantalla de inicio.
- ViewBox: `0 0 1200 900`, centrado visualmente para recorte responsive.
- Render: SVG inline único en `#start-scene`; no es una entidad de gameplay.
- Animación: CSS transforma grupos preconstruidos y cambia opacidad o
  `stroke-dashoffset`; nunca se reescribe el XML por frame.
- Accesibilidad: decorativo, `aria-hidden="true"` y sin interacción.
- Restricciones: geometría simple, sin raster, recursos externos, scripts,
  filtros o máscaras complejas. IDs prefijados con `ui-start-hero-`.

Los textos, botones, foco y áreas táctiles continúan siendo HTML en
`index.html`. Si el coste visual futuro lo justificara, la escena podría
convertirse en una textura cacheada durante la entrada al menú, pero no se
recalculará por frame.
