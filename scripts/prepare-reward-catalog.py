"""Mechanical production derivatives, not an image generator. Run with Pillow."""
from pathlib import Path
import json
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'src/assets/images/reward-catalog'
SPEC = json.loads((BASE / 'prompts.json').read_text(encoding='utf-8'))
RUNTIME = BASE / 'runtime'
PREVIEW = BASE / 'preview'
RUNTIME.mkdir(exist_ok=True)
PREVIEW.mkdir(exist_ok=True)
report = []
tiles = []
fx_tiles = []

def cutout(image, size, path):
    image = image.convert('RGBA')
    extrema = image.getchannel('A').getextrema()
    if extrema[0] != 0 or extrema[1] < 16:
        raise ValueError(f'{path}: missing real transparent alpha: {extrema}')
    box = image.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        raise ValueError(f'{path}: empty sprite')
    content = ImageOps.contain(image.crop(box), (round(size[0]*.90), round(size[1]*.90)), Image.Resampling.LANCZOS)
    frame = Image.new('RGBA', size)
    frame.alpha_composite(content, ((size[0]-content.width)//2, (size[1]-content.height)//2))
    frame.save(path, 'WEBP', lossless=True, method=6)
    report.append({'file': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'width': size[0], 'height': size[1], 'alpha': list(extrema)})
    return frame

for entry in SPEC['identity']:
    id, family = entry['id'], entry['family']
    if id in ('asterion', 'solstice'):
        continue
    if family == 'ship':
        master = Image.open(BASE / 'masters' / f'{id}.png')
        art = cutout(master, (224, 256), RUNTIME / f'{id}.webp')
    elif family == 'cannon':
        master = Image.open(BASE / 'masters' / f'{id}-kit.png').convert('RGBA')
        w, h = master.size
        # The generated sheet may place the top sprites below its nominal half.
        # Find the transparent gutter instead of cutting off a cannon's rear.
        alpha = master.getchannel('A')
        gaps = []
        start = None
        for y in range(round(h*.45), round(h*.82)):
            count = sum(a > 16 for a in alpha.crop((0, y, w, y+1)).tobytes())
            if count <= w*.003:
                if start is None: start = y
            elif start is not None:
                gaps.append((start, y)); start = None
        if start is not None: gaps.append((start, round(h*.82)))
        if not gaps: raise ValueError(f'{id}: no transparent gutter between sprites')
        gap = max(gaps, key=lambda pair: pair[1]-pair[0])
        split = (gap[0]+gap[1])//2
        if id == 'astral-fang':
            body = Image.open(BASE / 'masters' / 'astral-fang.png')
            head = master.crop((0, 0, w, split))
        else:
            body = master.crop((0, 0, w//2, split))
            head = master.crop((w//2, 0, w, split))
        trail = master.crop((0, split, w, h))
        art = cutout(body, (120, 156), RUNTIME / f'{id}-cannon.webp')
        head_art = cutout(head, (128, 64), RUNTIME / f'{id}-head.webp')
        trail_art = cutout(trail, (256, 64), RUNTIME / f'{id}-trail.webp')
        fx_tile = Image.new('RGB', (360, 240), '#0b1727')
        for sprite, position in ((art, (8, 20)), (head_art, (160, 25)), (trail_art, (95, 130))):
            fx_tile.paste(sprite, position, sprite)
        ImageDraw.Draw(fx_tile).text((12, 220), id, fill='#bdefff')
        fx_tiles.append(fx_tile)
    else:
        master = Image.open(BASE / 'masters' / f'{id}.png').convert('RGB')
        art = ImageOps.fit(master, (1024, 1024), Image.Resampling.LANCZOS)
        art.save(RUNTIME / f'{id}.webp', quality=80, method=6)
        thumb = ImageOps.fit(master, (512, 512), Image.Resampling.LANCZOS)
        thumb.save(PREVIEW / f'{id}.webp', quality=78, method=6)
        for path in (RUNTIME / f'{id}.webp', PREVIEW / f'{id}.webp'):
            with Image.open(path) as im:
                report.append({'file': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'width': im.width, 'height': im.height, 'alpha': None})
    tile = Image.new('RGB', (240, 280), '#0b1727')
    thumb = ImageOps.contain(art.convert('RGBA'), (224, 246), Image.Resampling.LANCZOS)
    tile.paste(thumb, ((240-thumb.width)//2, (246-thumb.height)//2), thumb)
    ImageDraw.Draw(tile).text((8, 260), id, fill='#bdefff')
    tiles.append(tile)

# All originals kept as editable masters; only derivatives above are imported.
(BASE / 'asset-report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
sheet = Image.new('RGB', (7*240, 4*280), '#050b16')
for i, tile in enumerate(tiles):
    sheet.paste(tile, ((i%7)*240, (i//7)*280))
(ROOT / 'test-results/reward-catalog').mkdir(parents=True, exist_ok=True)
sheet.save(ROOT / 'test-results/reward-catalog/contact-sheet.jpg', quality=90)
fx_sheet = Image.new('RGB', (5*360, 2*240), '#050b16')
for i, tile in enumerate(fx_tiles):
    fx_sheet.paste(tile, ((i%5)*360, (i//5)*240))
fx_sheet.save(ROOT / 'test-results/reward-catalog/projectiles.jpg', quality=90)
print(f'{len(report)} derivatives: {sum(item["bytes"] for item in report):,} bytes')
