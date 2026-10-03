"""Deterministic format-only derivatives; keep PNG masters and image dimensions."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from math import log10, sqrt

folder = Path(__file__).resolve().parents[1] / 'src/assets/images/ui/menus'
for name in ('radial', 'angular', 'fracture', 'overdrive'):
    source = folder / f'act-{name}.png'
    target = source.with_suffix('.webp')
    with Image.open(source) as original:
        original = original.convert('RGB')
        original.save(target, 'WEBP', quality=88, method=6)
        with Image.open(target) as decoded:
            difference = ImageStat.Stat(ImageChops.difference(original, decoded.convert('RGB')))
            rmse = sqrt(sum(channel ** 2 for channel in difference.rms) / 3)
            psnr = 20 * log10(255 / rmse) if rmse else float('inf')
            print(f'{name}: {source.stat().st_size} -> {target.stat().st_size} bytes; PSNR={psnr:.2f} dB; {decoded.size}')
