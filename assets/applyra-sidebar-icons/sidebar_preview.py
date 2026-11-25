from pathlib import Path
from PIL import Image, ImageDraw
import cairosvg,io,zipfile
R=Path('/mnt/data/applyra-sidebar-icons')
icons=['dashboard','resume','jobs','history','activity','analytics','cover-letter','ai-assistant','auto-apply','tasks','saved-jobs','downloads','match-score','settings','profile-import','job-search','application-tracker','sync','security','notifications','filters','profile']
W,H=260,1580
im=Image.new('RGB',(W,H),'#ffffff')
d=ImageDraw.Draw(im)
d.line((258,0,258,H),fill='#e5eaf3',width=2)
for i,key in enumerate(icons):
    cy=62+i*66
    if i==0: d.rounded_rectangle((65,cy-26,195,cy+26),radius=17,fill='#eef3ff')
    raw=(R/'svg'/f'{key}.svg').read_text().replace('currentColor','#245aef' if i==0 else '#43526b')
    glyph=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=raw.encode(),output_width=42,output_height=42))).convert('RGBA')
    im.paste(glyph,(109,cy-21),glyph)
im.save(R/'sidebar-size-preview.png',optimize=True)
with zipfile.ZipFile('/mnt/data/Applyra_Original_Sidebar_Icons.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
    for p in sorted(R.rglob('*')):
        if p.is_file(): z.write(p,p.relative_to(R.parent))
print('ICON COUNT:',len(list((R/'svg').glob('*.svg'))))
print('SMALL UI PREVIEW:',R/'sidebar-size-preview.png')
print('PACKAGE:', '/mnt/data/Applyra_Original_Sidebar_Icons.zip')
