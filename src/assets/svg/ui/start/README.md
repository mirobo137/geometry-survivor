# Start screen SVG assets

## `mark.svg`

- Rol: marca central del menú.
- ViewBox: `-72 -72 144 144`, ancla en el centro.
- Render: SVG como `img` en `StartScreen`; master vectorial, decodificado por
  el navegador. No hay paths animados dentro del DOM del menú.
- Carga inicial: el mismo master se usa como `img` desde HTML, antes de JS.
  Color cyan propio para ambos consumidores.
- Animación: el consumidor gira la imagen una vuelta lenta (36 s) y el master
  no contiene scripts ni filtros. `prefers-reduced-motion` la congela.

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
- Después de reaparecer el parpadeo en el móvil del usuario, fondo, gradientes
  grandes y marco RGB quedan estáticos. La hipótesis es invalidación/pintado de
  capas grandes al animar paths SVG; no se ha capturado una traza de esa GPU.
- Presupuesto: una imagen de marca de 64–144 px y cuatro luces CSS de 10 px.
  Sólo transform/opacity; luces con desplazamiento de 8 px, ciclo 7 s y
  opacidad 0.6–0.9. `will-change` sólo en estas cinco superficies pequeñas.
  Al ocultar inicio, abrir skins/meta o solicitar reduced-motion, se retiran
  animación y promoción. No congelar las previsualizaciones propias del locker.
- No reactivar dash/opacity por grupos en el fondo SVG de pantalla completa:
  ralentizar una animación no evita repintados. Cualquier ampliación necesita
  nueva prueba en el móvil afectado. Sin nuevos loops Pixi ni dependencias.

## `hero-scene.svg`

- Rol: atmósfera decorativa de la pantalla de inicio.
- ViewBox: `0 0 1200 900`, centrado visualmente para recorte responsive.
- Render: SVG estático como `img` en `#start-scene`, con URL gestionada por Vite.
  Las clases del master se conservan para edición/catálogo; no reciben las
  animaciones CSS del documento al usarse como imagen.
- Animación: cuatro luces HTML independientes del SVG. El fondo no se anima.
- Accesibilidad: decorativo, `aria-hidden="true"` y sin interacción.
- Restricciones: geometría simple, sin raster, recursos externos, scripts,
  filtros o máscaras complejas. IDs prefijados con `ui-start-hero-`.

Los textos, botones, foco y áreas táctiles continúan siendo HTML en
`index.html`. No se convierte el master a PNG ni se añaden texturas Pixi.
Referencia: [guía de animaciones de web.dev](https://web.dev/articles/animations-guide).
Usar transform/opacity favorece composición, pero no garantiza ausencia de
fallos en todos los drivers. La puerta final es la prueba del Android afectado.
