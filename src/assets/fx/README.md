# Bitmap VFX assets

`projectile-smoke-puff.png` is a generated 128×128 RGBA particle used only by
the `smoke` cannon trail. It is a small pooled sprite, tinted at runtime, and
does not affect projectile physics, damage, collision or the other cannon
packages. The source generation prompt requested a white stylized puff with
genuine transparency; the published file has an sRGBA channel and is 7.1 KiB.

The SVG masters remain the source of truth for characters, UI and authored
cosmetic geometry. This bitmap is an intentional runtime exception for a soft
particle where a transparent texture is cheaper than rebuilding a cloud from
many vector paths. Low quality keeps the existing zero projectile-trail budget;
Medium/High reuse one cached texture through the existing bounded four-band
pool.
