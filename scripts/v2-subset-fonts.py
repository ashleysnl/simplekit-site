"""Optional maintenance recipe; run from repository root with fontTools and Liberation 2.1.5 TTFs installed. Not part of the build."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
import json,hashlib
out=Path('assets/v2/fonts');out.mkdir(parents=True,exist_ok=True);entries=[]
for family,source in [('Display','Serif'),('Sans','Sans')]:
 for style,weight in [('Regular',400),('Bold',700)]:
  origin=Path('/usr/share/fonts/truetype/liberation/Liberation'+source+'-'+style+'.ttf');font=TTFont(origin);familyName='SimpleKit '+family
  for n in font['name'].names:
   if n.nameID in [1,3,4,6,16,17]:
    text={1:familyName,3:'SimpleKitV2-'+family+'-'+style,4:familyName+' '+style,6:'SimpleKit'+family+'-'+style,16:familyName,17:style}[n.nameID]
    n.string=text.encode(n.getEncoding())
  options=subset.Options();options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];subsetter=subset.Subsetter(options=options);subsetter.populate(unicodes=list(range(0x20,0x250))+list(range(0x2000,0x2070))+list(range(0x20A0,0x20D0))+[0x2212,0x221E,0x2192,0x2190,0x2713]);subsetter.subset(font);font.flavor='woff'
  dest=out/('simplekit-'+family.lower()+'-'+str(weight)+'.woff');font.save(dest)
  entries.append({'file':str(dest),'family':familyName,'weight':weight,'upstream':'https://github.com/liberationfonts/liberation-fonts','version':'2.1.5','sourceFile':origin.name,'sourceSHA256':hashlib.sha256(origin.read_bytes()).hexdigest(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'modification':'Latin/punctuation subset, WOFF conversion, renamed families respecting Reserved Font Names','license':'SIL Open Font License 1.1'})
(out/'OFL.txt').write_text(Path('/usr/share/doc/fonts-liberation/copyright').read_text())
Path('docs/v2/phase-01/fonts.json').write_text(json.dumps(entries,indent=2)+'\n');print([(x['file'],x['bytes']) for x in entries])
