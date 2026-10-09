"""Encode requested responsive image variants. Requires Pillow with WebP/AVIF support."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import sys

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'docs/v2/phase-01/coastal-source.png'
original = Image.open(source).convert('RGB')
assert original.size == (1536, 1024), 'Re-review crop rectangles for a different master'
output = root / 'assets/v2/images'
output.mkdir(parents=True, exist_ok=True)
entries = []
for kind, bounds, widths in [('desktop', (0, 80, 1536, 944), [768, 1536]),
                             ('mobile', (500, 0, 1319, 1024), [400, 800])]:
    crop = original.crop(bounds)
    for width in widths:
        height = round(width * crop.height / crop.width)
        image = crop.resize((width, height), Image.Resampling.LANCZOS)
        for extension, codec, quality in [('avif', 'AVIF', 55), ('webp', 'WEBP', 75), ('jpg', 'JPEG', 80)]:
            file = output / f'coastal-{kind}-{width}.{extension}'
            image.save(file, format=codec, quality=quality)
            with Image.open(file) as check:
                assert check.format == codec and check.size == (width, height)
            if kind == 'mobile':
                assert file.stat().st_size <= 250_000, f'Mobile budget exceeded: {file}'
            entries.append({'file':str(file.relative_to(root)), 'format':codec, 'width':width, 'height':height,
                            'bytes':file.stat().st_size, 'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
provenance = {'source':'Generated with image_gen on 2026-10-09 for SimpleKit v2; fictional coastal scene, not a verified geographic location',
              'sourceFile':str(source.relative_to(root)), 'sourceDimensions':[1536,1024],
              'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),
              'content':'Text-free coast, misty mountains and evergreen shore. Live UI text/fade implemented separately in Phase 2.',
              'focalPoint':'70% x / 55% y', 'desktopCrop':[0,80,1536,944], 'mobileCrop':[500,0,1319,1024],
              'approval':'Implementation candidate; owner visual review pending in Phase 1 PR. No production release approval.',
              'variants':entries}
(root / 'docs/v2/phase-01/hero.json').write_text(json.dumps(provenance, indent=2)+'\n')
print('Encoded',len(entries),'verified variants; largest mobile:',max(e['bytes'] for e in entries if 'mobile' in e['file']))
