"""Mechanical imagegen derivatives; preserve masters, pixels and true alpha."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
entries = json.loads((root / 'scripts/catalog-ten-image-sources.json').read_text(encoding='utf-8'))
report = []
for item in entries:
    master = Image.open(item['source']).convert('RGBA')
    kind, name = item['kind'], item['id']
    if kind == 'background':
        folder = root / 'src/assets/images/backgrounds'
        # Archive the PNG source, not a reconstructed WebP.
        target = folder / f'{name}.png'
        if not target.exists():
            target.write_bytes(Path(item['source']).read_bytes())
        for suffix, size, quality in [('', 1254, 78), ('-preview', 512, 76)]:
            image = ImageOps.fit(master.convert('RGB'), (size, size), method=Image.Resampling.LANCZOS)
            target = folder / f'{name}{suffix}.webp'
            image.save(target, quality=quality, method=6)
            report.append({'file': str(target.relative_to(root)), 'bytes': target.stat().st_size})
        continue
    if master.getchannel('A').getextrema()[0] != 0:
        raise ValueError(f'{name}: genuine transparency required')
    if kind == 'projectile':
        alpha = master.getchannel('A')
        empty = [y for y in range(master.height // 3, master.height * 2 // 3)
                 if alpha.crop((0, y, master.width, y + 1)).getbbox() is None]
        if not empty:
            raise ValueError(f'{name}: head/trail gap missing')
        split = empty[len(empty) // 2]
        pieces = [('head', (96, 48), master.crop((0, 0, master.width, split))),
                  ('trail', (128, 32), master.crop((0, split, master.width, master.height)))]
        folder = root / 'src/assets/fx/projectiles'
    else:
        pieces = [('', (256, 256) if kind == 'ship' else (128, 128), master)]
        folder = root / 'src/assets/skins' / ('ships' if kind == 'ship' else 'cannons')
    for suffix, size, crop in pieces:
        bounds = crop.getchannel('A').point(lambda value: 255 if value >= 8 else 0).getbbox()
        if bounds is None:
            raise ValueError(f'{name}: empty art')
        crop = crop.crop(bounds)
        # Keep a transparent safety gutter and the original aspect ratio.
        gutter = 4 if kind == 'projectile' else round(size[0] * .06)
        # Cannons use a canonical square material; display aspect is 30x39,
        # as in prepare-tether-art.py. Do not leave a portrait-sized sliver.
        art = (crop.resize((size[0] - gutter * 2, size[1] - gutter * 2), Image.Resampling.LANCZOS)
               if kind == 'cannon' else
               ImageOps.contain(crop, (size[0] - gutter * 2, size[1] - gutter * 2), Image.Resampling.LANCZOS))
        image = Image.new('RGBA', size)
        image.paste(art, ((size[0] - art.width) // 2, (size[1] - art.height) // 2))
        target = folder / (name + (f'-{suffix}' if suffix else '') + '.png')
        image.save(target, optimize=True)
        report.append({'file': str(target.relative_to(root)), 'bytes': target.stat().st_size,
                       'alpha': image.getchannel('A').getextrema(), 'bounds': image.getchannel('A').getbbox()})
print(json.dumps(report, indent=2))
