# Personajes SVG

Las naves PNG son el arte principal; aquí sólo permanecen los fallback SVG que
consume producción. La simulación permanece en `src/simulation/`.

```text
characters/
└─ player/
   ├─ README.md
   ├─ player-body.svg
   ├─ player-ring.svg
   ├─ player-core.svg
   ├─ player-shadow.svg
   ├─ player-accent.svg
   └─ skins/<id>/{body,ring,core}.svg
```

`PlayerHullSvg.ts` compone las piezas de fallback por skin. No se guardan
copias completas de la nave ni armas dentro de este catálogo.
