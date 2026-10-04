"""Mechanical imagegen derivatives: scale only, preserve full frame and alpha."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "scripts/enemy-image-sources.json").read_text(encoding="utf-8"))
folder = root / "src/assets/images/enemies"
report = []
for item in manifest["entries"]:
    # The high-resolution generated original is optional; existing finals are
    # checked in. Pass a locally available original when regenerating the art.
    source = Path(item["source"])
    if not source.exists():
        source = folder / f'{item["id"]}.png'
    with Image.open(source) as original:
        master = original.convert("RGBA")
    if master.width != master.height:
        raise ValueError(f'{item["id"]}: square full-frame source required')
    if master.getchannel("A").getextrema()[0] != 0:
        raise ValueError(f'{item["id"]}: actual transparent alpha required')
    pixels = item["physicalSize"]
    image = master.resize((pixels, pixels), Image.Resampling.LANCZOS)
    target = folder / f'{item["id"]}.png'
    image.save(target, optimize=True, compress_level=9)
    # Versioned PNG remains the editing/inspection master. The runtime uses a
    # WebP derivative of exactly these pixels to fit the existing build budget.
    webp = target.with_suffix(".webp")
    # Maximum renderer DPR is 1.5. Retain the 2x PNG inspection master, while
    # shipping enough physical pixels for the actual battle frame at High.
    runtime_size = round(item["logicalSize"] * 1.5)
    runtime = image.resize((runtime_size, runtime_size), Image.Resampling.LANCZOS)
    runtime.save(webp, quality=55, method=6, exact=True)
    with Image.open(webp) as decoded:
        if decoded.size != runtime.size or decoded.convert("RGBA").getchannel("A").tobytes() != runtime.getchannel("A").tobytes():
            raise ValueError(f'{item["id"]}: runtime alpha or dimensions changed')
    alpha = image.getchannel("A")
    if any(alpha.getpixel(point) != 0 for point in [(0, 0), (pixels-1, 0), (0, pixels-1), (pixels-1, pixels-1)]):
        raise ValueError(f'{item["id"]}: transparent corner padding required')
    report.append({"id": item["id"], "pixels": pixels, "logicalSize": item["logicalSize"],
                   "sourceSize": master.size, "bytes": target.stat().st_size,
                   "runtimeBytes": webp.stat().st_size,
                   "runtimePixels": runtime_size,
                   "alpha": alpha.getextrema(), "bounds": alpha.getbbox()})
print(json.dumps({"entries": report, "totalBytes": sum(row["bytes"] for row in report),
                  "runtimeBytes": sum(row["runtimeBytes"] for row in report),
                  "rgbaBytes": sum(row["pixels"] ** 2 * 4 for row in report)}, indent=2))
