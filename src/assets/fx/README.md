# Bitmap VFX assets

`projectile-smoke-puff.png` is a generated 128×128 RGBA particle used only by
the `smoke` cannon trail. It is a small pooled sprite, tinted at runtime, and
does not affect projectile physics, damage, collision or the other cannon
packages. The source generation prompt requested a white stylized puff with
genuine transparency; the published file has an sRGBA channel and is 7.1 KiB.

The asset is requested lazily through a native `Image` only when the smoke
package is selected in Medium/High; PixiJS receives that decoded image through
`Texture.from(image)`. A normal menu boot does not download it. The SVG masters remain
the source of truth for characters, UI and authored
cosmetic geometry. This bitmap is an intentional runtime exception for a soft
particle where a transparent texture is cheaper than rebuilding a cloud from
many vector paths. Low quality keeps the existing zero projectile-trail budget;
Medium/High reuse one cached texture through the existing bounded four-band
pool.

## Magnetic Charge: complete image effect prototype

Magnetic Charge now uses one coordinated transparent-PNG set for the complete
base-weapon cycle: projectile core and trail, remote beacon and attraction
field, detonation annulus, and recovery. The renderer requests all four
textures on the first active cast. PixiJS receives decoded images through
`Texture.from(image)` after native `Image` loading. If any image fails, the
renderer switches the whole base effect to its existing Graphics version; it
does not combine an incomplete PNG set with vector layers. Low keeps every
functional part of the image cycle with lower opacity. The separate Event
Horizon and Polar Collapse evolutions remain on their existing vector path
pending a separate visual review.

The core and detonation sprites use anchors registered to the bright core and
the center of the detonation aperture, respectively, so their focal points
coincide despite small offsets inside the generated canvases: `(0.4907, 0.4938)`
for the core and `(0.5075, 0.5023)` for the detonation. Magnetic Charge is
rendered below combat entities, keeping enemy silhouettes in front of the
field and detonation.

| Runtime image | Size / bytes | Master | Use |
|---|---:|---:|---|
| `magnetic-singularity-core.png` | 128×128 · 33,445 B | `magnetic-singularity-core-master.png` · 677,831 B | moving charge and detonation core |
| `magnetic-charge-travel.png` | 202×64 · 8,222 B | `magnetic-charge-travel-master.png` · 356,500 B | directional streak, stretched along its travel segment |
| `magnetic-charge-field.png` | 256×256 · 104,292 B | `magnetic-charge-field-master.png` · 1,647,001 B | target beacon and expanding pull field |
| `magnetic-charge-detonation.png` | 256×256 · 89,797 B | `magnetic-charge-detonation-master.png` · 1,860,246 B | base annular detonation and recovery |

All four derivatives have real RGBA transparency (alpha range 0–255). The
base pack transfers 235,756 bytes (about 230.2 KiB) and has 626.5 KiB of
decoded RGBA pixels. If CPU image data and GPU texture uploads are both
resident, that is roughly 1.22 MiB before browser and driver overhead. The
masters are source material only and are not imported into the game bundle.

This raises the old core-only prototype's transfer cost from 33.4 kB to about
230.2 KiB for the complete base effect, an increase of about 202.3 kB
(197.6 KiB). Four reused Sprite nodes support the images; there is one active
Magnetic Charge cast. No frame-rate gain is claimed: this is a visual
replacement whose download, decoded-pixel and GPU costs are explicit. The
detonation art scales to the live outer radius snapshot; the illustration does
not decide collision or damage, and its inner painted edge is not a simulation
boundary.

Generated with the integrated image-generation tool in this Codex session.
The core's original prompt was retained verbatim. The other three literal
invocation prompts were not exported with the generated files; their briefs
below are reconstructed regeneration prompts, not verbatim transcripts.

Core prompt:

> Create a single isolated videogame VFX sprite on a fully transparent background with genuine alpha, square 1:1 composition. Subject: a compact floating magnetic singularity charge core viewed directly from above, with a dark midnight-navy octagonal armored shell, bright icy-cyan and white diamond aperture in the center, four tiny separated gunmetal shards close around it, and a few short broken cyan/violet magnetic filaments hugging the shell. Add only tiny amber-gold fasteners as accents. Refined hand-painted sci-fi arcade game art with crisp faceted materials and controlled light, matching a clean geometric arena-survivor game. Keep the complete sprite inside the middle 76 percent of the canvas, with empty transparent margins. The silhouette and cyan core must stay legible when displayed at about 64 by 64 game pixels. The object must read as a compact core, not an explosion. No wide aura, no full outer ring or halo, no smoke, no ground shadow, no floor, no text, no border, no background color or background glow. Clean alpha edges.

Field regeneration brief:

> Create one isolated top-down magnetic pull-field game VFX sprite on a square transparent RGBA canvas. Compose a clear compact central beacon with eight distinct radial cyan and violet magnetic ribbons bending inward, ending in small bright arrow-like facets to communicate attraction. Match the dark midnight-navy, icy-cyan, violet and restrained amber language of the Magnetic Singularity Core. Keep the whole circular field inside the central 88 percent with a clean transparent perimeter. Strong silhouette at 128 game pixels and no painted background, floor, shadow, text, border or opaque glow.

Travel regeneration brief:

> Create one isolated horizontal projectile travel streak for a top-down arcade game, on a wide transparent RGBA canvas. A narrow icy-cyan energy filament with a violet edge and a bright sharp leading point tapers to transparent speed wisps behind it. The silhouette must remain readable when shortened and rotated at runtime. Keep generous transparent ends, no core, no ring, no background, floor, shadow, text or border.

Base detonation regeneration brief:

> Create one isolated top-down annular Magnetic Charge detonation sprite on a square transparent RGBA canvas. Build a thick circular band from twelve separated armored sci-fi sectors, with a dark navy segmented outer rail, vivid cyan and violet plasma channels, fine white edges and restrained amber fasteners. Leave a clean central aperture about 42 percent of the outer diameter, so the safe center and broad damaging annulus read clearly. Keep transparent space outside the ring; no background, ground shadow, text or border. Crisp hand-painted game VFX with readable segments at 128 pixels.
