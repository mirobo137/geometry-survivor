"""Re-encode delivery plates from preserved PNG masters; never edit source art."""
import json
import sys
from pathlib import Path
from math import log10, sqrt
from PIL import Image, ImageChops, ImageStat, ImageOps

root = Path(__file__).resolve().parents[1]
folder = root / 'src/assets/images/backgrounds'
qa = root / 'test-results/catalog-compression'
qa.mkdir(parents=True, exist_ok=True)
quality = int(sys.argv[1]) if len(sys.argv) > 1 else 82
apply = '--apply' in sys.argv
report = []
for name in ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field', 'nacre-orbit', 'vesper-bloom', 'tidal-veil']:
    master = Image.open(folder / f'{name}.png').convert('RGB')
    for suffix in ['', '-preview']:
        previous = folder / f'{name}{suffix}.webp'
        if not previous.exists():
            continue
        original = Image.open(previous).convert('RGB')
        source = ImageOps.fit(master, original.size, method=Image.Resampling.LANCZOS)
        target = qa / previous.name
        source.save(target, quality=quality, method=6)
        decoded = Image.open(target).convert('RGB')
        error = ImageStat.Stat(ImageChops.difference(original, decoded))
        rmse = sqrt(sum(c ** 2 for c in error.rms) / 3)
        psnr = 20 * log10(255 / rmse) if rmse else 99
        report.append({'name': previous.name, 'old': previous.stat().st_size,
                       'new': target.stat().st_size, 'psnr': round(psnr, 2)})
        if apply:
            previous.write_bytes(target.read_bytes())
print(json.dumps(report, indent=2))
print('Saved bytes:', sum(r['old'] - r['new'] for r in report))
