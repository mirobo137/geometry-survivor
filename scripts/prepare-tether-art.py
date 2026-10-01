"""Mechanical production derivatives only; preserve the image generator's alpha."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
sources = json.loads((root / 'scripts/tether-image-sources.json').read_text())
output = root / 'src/assets/skins/tethered'
output.mkdir(parents=True, exist_ok=True)
report = []
sheet = Image.new('RGB', (768, 300), '#081623')
draw = ImageDraw.Draw(sheet)
for index, item in enumerate(sources):
    original = Image.open(item['source']).convert('RGBA')
    # Canonical square texture frames. Logical display aspect is in TetheredAssets.
    image = original.resize((item['size'], item['size']), Image.Resampling.LANCZOS)
    target = output / ('tether-' + item['id'] + '.png')
    image.save(target, optimize=True)
    alpha = image.getchannel('A')
    corners = [alpha.getpixel(p) for p in [(0, 0), (0, item['size']-1), (item['size']-1, 0), (item['size']-1, item['size']-1)]]
    assert alpha.getextrema() == (0, 255) and corners == [0, 0, 0, 0]
    report.append(dict(id=item['id'], original=list(original.size), final=list(image.size),
                       bytes=target.stat().st_size, alpha=alpha.getextrema(), bounds=alpha.getbbox(), corners=corners))
    thumb = image.resize((224, 224), Image.Resampling.LANCZOS)
    sheet.paste(thumb, (index*256+16, 12), thumb)
    draw.text((index*256+20, 254), item['id'], fill='white')
qa = root / 'test-results/tethered'
qa.mkdir(parents=True, exist_ok=True)
sheet.save(qa / 'assets.png')
print(json.dumps(report, indent=2))
