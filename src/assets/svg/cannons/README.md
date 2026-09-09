# Cannon cosmetic packages

Balas y estelas: contrato en
[dirección de proyectiles](../../../../skills/geometry-survivor-svg/references/projectile-direction.md).
Compositor real de inspección: `docs/visual/projectile-reference.html`.

Each package is a paired pair of barrel SVGs plus a projectile SVG. All cannon
pieces share the player frame `-32 -32 64 64` and the projectile frame
`-16 -16 32 32` pointing along `+X`.

| id | lectura |
| --- | --- |
| basic | Pulse: cureña, tubo, rail y boca circular |
| curve | Aguja fina con canal y punta ahorquillada |
| smoke | Mortero grueso con anillo de calor |
| rainbow | Prisma facetado con bandas y boca blanca |
| lattice | Emisor angular con collar de resonancia y halo de retícula |
| helix | Lanza premium con rail de espiral y estela en dos lóbulos |

The left and right barrels are separate files so Pixi can recoil only the
firing muzzle. They are rasterized once with an explicit 64×64 frame; SMIL
lives only in the locker preview. Trail recipes stay in presentation code so
cosmetic skins cannot change simulation damage, cadence or trajectory.

The authored muzzle rings sit on `PROJECTILE_MUZZLE_OFFSETS` (`±27, -11`).

`bloom` (Bloomwake) is the seventh hybrid package. Its SVG barrel/projectile
masters remain the source of truth; `src/assets/skins/cannons/bloom/` contains
the generated transparent trail texture and its typed asset contract. The PNG
is an optional presentation layer, lazy-loaded only when equipped on Medium or
High and replaced by the bounded procedural ribbon on Low or decode failure.
