"""Optional asset maintenance only: fontTools[woff]; not part of Linux build.

Convert committed WOFF files to WOFF2 without resubsetting or changing metrics.
Keep WOFF fallbacks and the existing SIL OFL. Run from the repository root.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
import hashlib, json

entries = []
for source in sorted(Path('assets/v2/fonts').glob('*.woff')):
    font = TTFont(source, recalcTimestamp=False)
    target = source.with_suffix('.woff2')
    font.flavor = 'woff2'
    font.save(target)
    converted = TTFont(target, recalcTimestamp=False)
    # The compression container must not change character support or layout.
    assert font.getBestCmap() == converted.getBestCmap()
    assert font['hmtx'].metrics == converted['hmtx'].metrics
    entries.append({'source': str(source), 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                    'file': str(target), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                    'source_bytes': source.stat().st_size, 'bytes': target.stat().st_size,
                    'glyphs': len(converted.getGlyphOrder()), 'cmap_and_advance_metrics_unchanged': True})
Path('docs/v2/phase-08/fonts.json').write_text(json.dumps(entries, indent=2) + '\n')
print([(e['file'], e['bytes']) for e in entries])
