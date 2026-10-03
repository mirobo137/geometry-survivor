"""Mechanically split generated RGBA masters into head/trail materials, not art editing.

Production derivatives preserve alpha and aspect ratio. The manifest records the
original imagegen prompts/sources; source masters are never changed or deleted.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

root = Path(__file__).resolve().parents[1]
sources = json.loads((root / 'scripts/projectile-image-sources.json').read_text(encoding='utf-8'))
out = root / 'src/assets/fx/projectiles'
out.mkdir(parents=True, exist_ok=True)
qa = root / 'test-results/projectiles'
qa.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB', (640, len(sources) * 100), '#091421')
draw = ImageDraw.Draw(sheet)
report = []
for row, item in enumerate(sources):
    master = Image.open(item['source']).convert('RGBA')
    minimum, maximum = master.getchannel('A').getextrema()
    if minimum != 0 or maximum < 240:
        raise ValueError(f"{item['id']}: master lacks true RGBA transparency")
    # Locate the actual transparent gap, not an assumed pivot in generated art.
    alpha = master.getchannel('A')
    empty = [y for y in range(master.height // 3, master.height * 2 // 3)
             if alpha.crop((0, y, master.width, y + 1)).getbbox() is None]
    if not empty:
        raise ValueError(f"{item['id']}: regions overlap; generate a separated master")
    split = empty[len(empty) // 2]
    for offset, color in [(0, '#091421'), (290, '#e4e9ec')]:
        sheet.paste(Image.new('RGB', (260, 96), color), (95 + offset, row * 100))
    for part, size, half in [('head', (96, 48), 0), ('trail', (128, 32), 1)]:
        crop = master.crop((0, 0 if half == 0 else split, master.width, split if half == 0 else master.height))
        # Some generators leave alpha=1 noise across otherwise empty padding.
        # Trim by visible-alpha bounds only; retain original RGBA inside the crop.
        bounds = crop.getchannel('A').point(lambda value: 255 if value >= 8 else 0).getbbox()
        if bounds is None:
            raise ValueError(f"{item['id']} {part}: empty material")
        crop = crop.crop((max(0, bounds[0] - 3), max(0, bounds[1] - 3),
                          min(crop.width, bounds[2] + 3), min(crop.height, bounds[3] + 3)))
        # Four transparent pixels at each end keep glow/filtering within the frame.
        material = ImageOps.contain(crop, (size[0] - 8, size[1] - 8), Image.Resampling.LANCZOS)
        image = Image.new('RGBA', size)
        image.paste(material, ((size[0] - material.width) // 2, (size[1] - material.height) // 2))
        target = out / f"{item['id']}-{part}.png"
        image.save(target, optimize=True)
        alpha = image.getchannel('A')
        report.append(dict(id=item['id'], part=part, size=size, bytes=target.stat().st_size,
                           alphaRange=alpha.getextrema(), bounds=alpha.getbbox()))
        # QA composites only: compare both backgrounds and actual small render size.
        x = 105 if part == 'head' else 230
        for offset, color in [(0, '#091421'), (290, '#e4e9ec')]:
            sheet.paste(image, (x + offset, row * 100 + 20), image)
            small = image.resize((36, 18) if part == 'head' else (64, 12), Image.Resampling.LANCZOS)
            sheet.paste(small, (x + offset, row * 100 + 74), small)
    draw.text((8, row * 100 + 20), item['id'], fill='white')
sheet.save(qa / 'contact.png')
print(json.dumps(report, indent=2))
