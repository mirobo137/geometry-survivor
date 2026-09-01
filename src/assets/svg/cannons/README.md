# Cannon cosmetic packages

Each package contains a paired emitter SVG and a projectile SVG. All cannon
assets use the player frame `-32 -32 64 64`; projectile assets use a centered
`-16 -16 32 32` frame and point along `+X`. They are rasterized once to Pixi
textures and reused by pooled sprites. Trail recipes stay in presentation code
so cosmetic skins cannot change simulation damage, cadence or trajectory.
