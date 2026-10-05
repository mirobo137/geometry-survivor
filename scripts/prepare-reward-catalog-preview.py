"""Create lightweight, preview-only derivatives from the reward-catalog pilot masters."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MASTERS = ROOT / 'src/assets/images/reward-catalog/masters'
PREVIEWS = ROOT / 'src/assets/images/reward-catalog/preview'
PREVIEWS.mkdir(parents=True, exist_ok=True)


def transparent_sprite(name: str, size: tuple[int, int], *, rotate: bool = False) -> dict:
    source = Image.open(MASTERS / f'{name}.png').convert('RGBA')
    alpha = source.getchannel('A')
    if alpha.getextrema()[0] != 0:
        raise ValueError(f'{name}: master must have genuine transparency')
    bounds = alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()
    if bounds is None:
        raise ValueError(f'{name}: master contains no visible pixels')
    art = source.crop(bounds)
    if rotate:
        art = art.transpose(Image.Transpose.ROTATE_90)
    gutter = round(min(size) * 0.07)
    fitted = ImageOps.contain(art, (size[0] - 2 * gutter, size[1] - 2 * gutter), Image.Resampling.LANCZOS)
    output = Image.new('RGBA', size)
    output.alpha_composite(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    target = PREVIEWS / f'{name}.webp'
    output.save(target, format='WEBP', lossless=True, method=6)
    return {
        'file': target.relative_to(ROOT).as_posix(),
        'dimensions': f'{size[0]}x{size[1]}',
        'bytes': target.stat().st_size,
        'alpha': list(output.getchannel('A').getextrema()),
    }


def background_preview(name: str, size: int = 512) -> dict:
    source = Image.open(MASTERS / f'{name}.png').convert('RGB')
    output = ImageOps.fit(source, (size, size), method=Image.Resampling.LANCZOS)
    target = PREVIEWS / f'{name}.webp'
    output.save(target, format='WEBP', quality=80, method=6)
    return {
        'file': target.relative_to(ROOT).as_posix(),
        'dimensions': f'{size}x{size}',
        'bytes': target.stat().st_size,
        'alpha': None,
    }


results = [
    transparent_sprite('riftwake-strider', (224, 256)),
    transparent_sprite('astral-fang', (320, 144), rotate=True),
    background_preview('ember-remnant'),
]
for result in results:
    print(f"{result['file']} {result['dimensions']} {result['bytes']} bytes alpha={result['alpha']}")
