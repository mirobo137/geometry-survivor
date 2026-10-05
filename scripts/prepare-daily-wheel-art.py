"""Imagegen derivatives: resize/pad only; preserve generated transparency."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
generated = Path(r"C:\Users\shito\.codex\generated_images\01a0466b-525a-7d02-b45c-14308e79b550")
entries = [
    (generated / "exec-ac180d21-b54d-4719-849b-078f166803f5.png", "src/assets/skins/ships/solstice/solstice", (224, 256)),
    (generated / "exec-d1144de1-3296-4637-b045-b055bf8f59d9.png", "src/assets/images/ui/retention/wheel-rim", (512, 512)),
]
for source, relative, size in entries:
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if not source.exists():
        source = target.with_suffix(".png")
    with Image.open(source) as original:
        art = original.convert("RGBA")
    assert art.getchannel("A").getextrema() == (0, 255), "Real alpha required"
    resized = ImageOps.contain(art, size, Image.Resampling.LANCZOS)
    master = Image.new("RGBA", size)
    master.paste(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    master.save(target.with_suffix(".png"), optimize=True)
    master.save(target.with_suffix(".webp"), quality=75, method=6, exact=True)
    with Image.open(target.with_suffix(".webp")) as decoded:
        assert decoded.convert("RGBA").getchannel("A").tobytes() == master.getchannel("A").tobytes()
    print(relative, size, "source", art.size, "alpha", master.getchannel("A").getbbox(),
          "PNG", target.with_suffix(".png").stat().st_size, "WebP", target.with_suffix(".webp").stat().st_size)
