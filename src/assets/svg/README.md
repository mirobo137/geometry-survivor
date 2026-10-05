# Biblioteca SVG

Los SVG se conservan como piezas code-first de UI y como fallback cuando el
juego los consume en producción. El catálogo PNG/WebP es el arte principal de
naves, cañones, enemigos y fondos.

```text
svg/
├─ characters/player/  # body/ring/core y detalles SVG de fallback
├─ enemies/            # masters completos de fallback y entrada de bosses
├─ cannons/            # barriles izquierdo/derecho y proyectiles fallback
└─ ui/                 # iconos, paneles y marcos
```

Los dos SVG de `backgrounds/` se conservan intencionalmente como referencias
editables históricas; no forman parte del runtime. Los dibujos obsoletos sin
consumidor de producción se retiraron. La escena raster del menú se documenta
en `src/assets/images/ui/home/README.md`.
