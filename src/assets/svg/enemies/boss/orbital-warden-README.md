# Orbital Warden

Revisión vigente: astrolabio de tres brazos y núcleo longitudinal, 24 paths
(3 rear, 12 wings, 5 hull, 4 cockpit). Sustituye la ciudadela descrita abajo.
Ver docs/design/ACTO_II_BOSS_FAMILY_PREMIUM.md y la lámina warden-reference.html.

Boss premium del Acto II. Toma como referencia la arquitectura de mando del
Bastion/Core Sentinel, pero cambia la silueta por un astrolabio triskelion:
tres brazos tipo hoz, un huso longitudinal y un cristal reactor dentro de una
cavidad azul profunda.

- frame comun: `-56 -56 112 112`, ancla `(0, 0)`, frente `-Y`;
- orden: `rear -> wings -> hull -> cockpit`;
- 24 paths en el master, cuatro piezas cacheadas y un flat para Low;
- no usa filtros, masks, imagenes embebidas ni armas funcionales en el casco;
- el ataque se representa en `BossView`, no dentro del SVG;
- replicas pequenas usan la misma firma material en `enemies/warden-replica/`.

La diferencia mecanica se comunica por sus railes: embestida recta,
trayectoria curva, dos replicas destructibles y los hazards angulares. Las
piezas solo tienen movimiento ambiental; no cambian colision ni stats.
