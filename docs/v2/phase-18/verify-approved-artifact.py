"""Review proposal: verify and extract only the exact approved release files."""
from pathlib import Path
import hashlib, json, os, sys, tarfile
release, destination = map(Path, sys.argv[1:])
report=json.loads((release/'release-inventory.json').read_text())
assert report['inventorySHA256']==os.environ['INVENTORY_SHA']
# Node JSON.stringify order/spacing used by the canonical inventory script.
assert hashlib.sha256(json.dumps(report['files'],separators=(',',':'),ensure_ascii=False).encode()).hexdigest()==report['inventorySHA256']
assert not destination.exists(), 'Extract into a fresh directory'
destination.mkdir()
with tarfile.open(release/'release-candidate.tar.gz') as archive:
    seen=set()
    for member in archive.getmembers():
        name=member.name.removeprefix('./')
        assert not member.name.startswith('/') and '..' not in Path(name).parts
        assert member.isdir() or member.isfile(), 'Reject links/devices'
        if not member.isfile():continue
        assert name in report['files'] and name not in seen
        seen.add(name)
        data=archive.extractfile(member).read()
        assert len(data)==report['files'][name]['bytes']
        assert hashlib.sha256(data).hexdigest()==report['files'][name]['sha256']
        target=destination/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    assert seen==set(report['files'])
assert (destination/'CNAME').read_text().strip()=='simplekit.app'
assert 'Disallow: /\n' not in (destination/'robots.txt').read_text()
assert not (destination/'_headers').exists(), 'Preview headers must not publish'
print('Approved production inventory, paths, hashes, hostname and indexing verified')
