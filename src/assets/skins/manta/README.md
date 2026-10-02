# Manta Veil

La skin conserva el ID `manta`, su nombre, su precio y la propiedad de los
guardados existentes. Su arte actual es el PNG completo de
[`ships/manta.png`](../ships/manta.png), 256×256 RGBA, y su ficha aparece en
[`ships/README.md`](../ships/README.md).

## Prototipo anterior

La implementación anterior construía una manta con quilla SVG y dos aletas
animadas a partir de `manta-wing.png`. Esa pieza, `MantaAssets.ts`,
`MantaWingView.ts`, `MantaPreview.ts` y los SVG editables se conservan como
material histórico, pero ya no se cargan en el juego ni en el locker. La skin
usa el mismo compositor PNG de una sola imagen que las otras siete naves.

La nueva ilustración de Manta fue generada junto con la flota, con forma y
material originales; los SVG anteriores no se usaron como referencia de forma.
Su prompt y procedencia están en
[`fleet-skin-image-sources.json`](../../../../scripts/fleet-skin-image-sources.json).

La prueba de migración verifica que Manta siga seleccionada y desbloqueada en
guardados anteriores, y que la nave base gratuita se agregue sin cambiar esa
selección.
