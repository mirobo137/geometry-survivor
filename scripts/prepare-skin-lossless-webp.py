"""Runtime derivatives only: keep PNG masters, verify exact RGBA equality."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "src/assets/skins"
sources = sorted((root / "ships").glob("*.png")) + sorted((root / "cannons").glob("*.png"))
sources += [root / "tethered/tether-ship.png", root / "tethered/tether-cannon.png"]
sources += [root.parent / "fx/magnetic-charge-field.png"] + sorted((root.parent / "fx/arsenal").glob("*.png"))
saved = 0
for source in sources:
    target = source.with_suffix(".webp")
    with Image.open(source) as original:
        rgba = original.convert("RGBA")
    rgba.save(target, lossless=True, exact=True, method=6)
    with Image.open(target) as derivative:
        assert derivative.convert("RGBA").tobytes() == rgba.tobytes(), source
    delta = source.stat().st_size - target.stat().st_size
    saved += delta
    print(source.name, "PNG", source.stat().st_size, "WebP", target.stat().st_size, "saved", delta)
print("Total identical-pixel asset savings:", saved)
