"""Mechanical resize of generated alpha masters; no drawing or alpha fabrication."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
sources = json.loads((root / 'scripts/arsenal-image-sources.json').read_text())
out = root / 'src/assets/fx/arsenal'
out.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB', (900, ((len(sources) + 5) // 6) * 200), '#091421')
draw = ImageDraw.Draw(sheet)
report = []
for i, item in enumerate(sources):
    image = Image.open(item['source']).convert('RGBA')
    size = 256 if item['id'] in ['pulse_ring', 'echo_shock', 'compression_wave', 'event_horizon', 'recharging_shield', 'thunderhead_burst'] else 128
    # Preserve the entire square frame: asymmetric waves must not acquire a new pivot.
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    target = out / (item['id'].replace('_', '-') + '.png')
    image.save(target, optimize=True)
    alpha = image.getchannel('A')
    report.append(dict(id=item['id'], width=size, height=size, bytes=target.stat().st_size,
                       alphaRange=alpha.getextrema(), bounds=alpha.getbbox(), source=item['source'], prompt=item['prompt']))
    thumb = image.resize((130, 130), Image.Resampling.LANCZOS)
    x, y = (i % 6) * 150 + 10, (i // 6) * 200 + 20
    sheet.paste(thumb, (x, y), thumb)
    draw.text((x, y + 140), item['id'], fill='white')
qa = root / 'test-results/arsenal'
qa.mkdir(parents=True, exist_ok=True)
sheet.save(qa / 'contact.png')
print(json.dumps([dict(id=i['id'], width=i['width'], height=i['height'], bytes=i['bytes'],
                       alphaRange=i['alphaRange'], bounds=i['bounds']) for i in report], indent=2))
