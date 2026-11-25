from pathlib import Path
import json, io, zipfile, re, math
from xml.etree import ElementTree as ET
import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT=Path('/mnt/data/applyra-sidebar-icons')
for name in ('svg','png-24','png-48','png-96'): (ROOT/name).mkdir(exist_ok=True)
# Original custom paths, 24 x 24 coordinate system, for product sidebar nav; no borrowed icon library paths.
ICONS={
'dashboard':('Dashboard','''<rect x="3.1" y="3.1" width="7.6" height="7.6" rx="1.45"/><rect x="13.5" y="3.1" width="7.4" height="4.5" rx="1.25"/><rect x="3.1" y="13.5" width="7.6" height="7.4" rx="1.45"/><rect x="13.5" y="10.4" width="7.4" height="10.5" rx="1.45"/>'''),
'job-search':('Job search','''<circle cx="10.25" cy="10.1" r="6.35"/><path d="m14.9 14.75 5.75 5.75"/><path d="M7.5 10.25h5.5M9.1 8.4v3.7"/>'''),
'jobs':('Jobs','''<rect x="3" y="7.15" width="18" height="13.55" rx="2.15"/><path d="M8.6 7.15V5.4c0-1.2.85-2.1 2-2.1h2.8c1.2 0 2 .9 2 2.1v1.75M3 12.3c5.6 2.7 12.4 2.7 18 0M10.2 13.45v2.5h3.6v-2.5"/>'''),
'auto-apply':('Auto apply','''<path d="M12.9 3.2H6.35c-1.22 0-2.05.87-2.05 2.05v13.5c0 1.2.83 2.05 2.05 2.05h6.1"/><path d="M12.85 3.3v4.5h4.4M12.85 3.3l4.4 4.5v3.1"/><path d="m12.4 16.65 2.45 2.45 5.05-5.35"/><path d="M7.4 11.4h5.3M7.4 14.35h2.9"/>'''),
'application-tracker':('Application tracker','''<rect x="3.1" y="3.1" width="17.8" height="4.7" rx="1.25"/><rect x="3.1" y="9.65" width="17.8" height="4.7" rx="1.25"/><rect x="3.1" y="16.2" width="17.8" height="4.7" rx="1.25"/><circle cx="6.4" cy="5.45" r=".7" fill="currentColor" stroke="none"/><circle cx="6.4" cy="12" r=".7" fill="currentColor" stroke="none"/><path d="M9.2 5.45h8.35M9.2 12h8.35M9.2 18.55h8.35M5.6 18.55l.62.68 1.4-1.6"/>'''),
'history':('History','''<path d="M3.3 9.1A8.95 8.95 0 1 1 3.65 15.8"/><path d="M3.3 3.7v5.55h5.45"/><path d="M12.1 7.2v5.1l3.4 2.05"/>'''),
'activity':('Activity','''<path d="M2.6 12.2h3.85l2.1-6.4 4.05 12.4 2.55-7.35 1.2 1.35h5.05"/>'''),
'analytics':('Analytics','''<path d="M3.7 3.7v16.5H21"/><path d="M7.55 16.45v-3.9M11.75 16.45V9M15.95 16.45V6.15M20.15 16.45v-5.2"/><path d="m7.55 9.3 3.8-3.35 3.35 1.65 4.2-3.45"/>'''),
'resume':('Resume','''<path d="M6.6 2.8h7.2l4.5 4.5V19.1c0 1.2-.7 2.05-2 2.05H6.6c-1.25 0-2-.85-2-2.05V4.85c0-1.2.75-2.05 2-2.05Z"/><path d="M13.8 2.85v4.5h4.45"/><circle cx="9.3" cy="11.25" r="1.65"/><path d="M6.9 15.2c.5-1.45 1.35-2.2 2.4-2.2s1.9.75 2.35 2.2M13.55 11.65h2.15M13.55 14.7h2.15M7 18.2h8.7"/>'''),
'cover-letter':('Cover letter','''<path d="M5 3.1h9l4.25 4.25v5.05M14 3.1v4.25h4.25"/><path d="M5 3.1v15.6c0 1.3.75 2.1 2 2.1h5.45"/><path d="M8 10.5h6.4M8 13.5h4.9"/><path d="m13.1 19 5.65-5.65 1.95 1.95-5.65 5.65-2.55.6zM17.4 14.7l1.95 1.95"/>'''),
'profile':('Profile','''<circle cx="12" cy="8.1" r="4.15"/><path d="M4.25 20c.15-4.45 2.85-6.45 7.75-6.45S19.6 15.55 19.75 20c-2.2 1.15-4.75 1.75-7.75 1.75S6.45 21.15 4.25 20Z"/>'''),
'ai-assistant':('AI assistant','''<path d="m11.9 2.6 1.9 5.55 5.6 1.95-5.6 1.95-1.9 5.6-1.95-5.6-5.55-1.95 5.55-1.95z"/><path d="m19.8 16.2.78 2.1 2.05.8-2.05.78-.78 2.1-.8-2.1-2.05-.78 2.05-.8z"/><path d="m4.35 16.2.55 1.5 1.5.55-1.5.55-.55 1.5-.55-1.5-1.5-.55 1.5-.55z"/>'''),
'saved-jobs':('Saved jobs','''<path d="M6.35 3.35h11.3c1 0 1.6.75 1.6 1.85v15.35l-7.25-4.1-7.25 4.1V5.2c0-1.1.55-1.85 1.6-1.85Z"/><path d="M9.7 8.6h4.6M12 6.3v4.6"/>'''),
'downloads':('Downloads','''<path d="M12 3.3v12.25m0 0L7.75 11.3M12 15.55l4.25-4.25"/><path d="M3.45 17.5v2.15c0 .8.65 1.25 1.55 1.25h14c.9 0 1.55-.45 1.55-1.25V17.5"/>'''),
'match-score':('Match score','''<circle cx="11.75" cy="12" r="8.7"/><circle cx="11.75" cy="12" r="5.3"/><path d="M11.75 9.1a2.9 2.9 0 0 0-2.9 2.9c0 1.6 1.3 2.9 2.9 2.9.9 0 1.5-.25 2.05-.85"/><path d="m16.8 16.2 1.55 1.55 3.15-3.4"/>'''),
'tasks':('Tasks','''<path d="m3.65 6.2 1.5 1.5 2.35-2.6M10 6.75h10.4M3.65 12.2l1.5 1.5 2.35-2.6M10 12.75h10.4M3.65 18.2l1.5 1.5 2.35-2.6M10 18.75h10.4"/>'''),
'integrations':('Integrations','''<circle cx="5" cy="12" r="2.5"/><circle cx="17.9" cy="5.6" r="2.5"/><circle cx="17.9" cy="18.4" r="2.5"/><path d="m7.45 11.1 8.05-4.4M7.45 12.9l8.05 4.4M17.9 8.1v7.8"/>'''),
'sync':('Sync','''<path d="M18.9 8.65a7.45 7.45 0 0 0-12.15-2.2L4.55 8.65"/><path d="M4.55 4.45v4.2h4.2"/><path d="M5.1 15.35a7.45 7.45 0 0 0 12.15 2.2l2.2-2.2"/><path d="M19.45 19.55v-4.2h-4.2"/>'''),
'security':('Security','''<path d="M12 2.8 20 6v5.9c0 4.5-2.8 7.45-8 9.5-5.2-2.05-8-5-8-9.5V6z"/><rect x="9" y="10.85" width="6" height="5.4" rx="1.2"/><path d="M10.3 10.85V9.2a1.7 1.7 0 0 1 3.4 0v1.65"/>'''),
'notifications':('Notifications','''<path d="M5.5 16.65c1.65-1.8 1.75-3.7 1.75-6.9 0-2.8 1.8-4.65 4.75-4.65s4.75 1.85 4.75 4.65c0 3.2.1 5.1 1.75 6.9l.7 1H4.8z"/><path d="M10.15 20.05c.4 1.05 1.05 1.6 1.85 1.6s1.45-.55 1.85-1.6"/><path d="M12 2.45v1.6"/>'''),
'interviews':('Interviews','''<path d="M3.8 4.2h12.6a2 2 0 0 1 2 2v8.1a2 2 0 0 1-2 2H9l-4.85 3.3v-3.3H3.8a2 2 0 0 1-2-2V6.2a2 2 0 0 1 2-2Z"/><circle cx="8.5" cy="9.5" r="1.65"/><path d="M5.75 13.5c.5-1.3 1.4-1.95 2.75-1.95s2.25.65 2.75 1.95M13.7 8.4h2.1M13.7 11.15h1.55"/>'''),
'filters':('Filters','''<path d="M3.1 5.35h2.85M10.05 5.35h10.85M3.1 12h10.85M18.05 12h2.85M3.1 18.65h5.65M12.85 18.65h8.05"/><circle cx="8" cy="5.35" r="2.05"/><circle cx="16" cy="12" r="2.05"/><circle cx="10.8" cy="18.65" r="2.05"/>'''),
'profile-import':('Profile import','''<rect x="3.15" y="5.1" width="13.4" height="13.8" rx="2"/><circle cx="7.75" cy="10" r="1.75"/><path d="M5.25 14.6c.45-1.4 1.2-2.05 2.5-2.05s2.05.65 2.5 2.05M12 9.2h2.1M12 12h2.1"/><path d="M19.25 5.8v11.2m0 0-2.6-2.6m2.6 2.6 2.55-2.6"/>'''),
'settings':('Settings','''<path d="M10.1 2.9h3.8l.62 2.7a7.1 7.1 0 0 1 1.55.9l2.58-1.05 2.3 3.25-1.9 2.05c.1.85.1 1.65 0 2.45l1.9 2.05-2.3 3.25-2.58-1.05c-.48.35-.98.65-1.55.9l-.62 2.7h-3.8l-.62-2.7a7.1 7.1 0 0 1-1.55-.9l-2.58 1.05-2.3-3.25 1.9-2.05a8.2 8.2 0 0 1 0-2.45l-1.9-2.05 2.3-3.25 2.58 1.05c.48-.35.98-.65 1.55-.9z"/><circle cx="12" cy="12" r="3.05"/>'''),
'help':('Help','''<path d="M12 3.15a8.8 8.8 0 0 1 8.8 8.8 8.8 8.8 0 0 1-8.8 8.8 8.8 8.8 0 0 1-8.8-8.8A8.8 8.8 0 0 1 12 3.15Z"/><path d="M9.35 9.4A2.7 2.7 0 1 1 13 11.95c-.85.4-1 1.05-1 2.05"/><circle cx="12" cy="17.3" r=".62" fill="currentColor" stroke="none"/>'''),
'sidebar-toggle':('Sidebar toggle','''<rect x="3.1" y="3.5" width="17.8" height="17" rx="2"/><path d="M8.9 3.5v17M12.7 9.15l3.15 2.85-3.15 2.85"/>''')
}

SVG_HEAD='''<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'''

for key,(label,paths) in ICONS.items():
    svg=SVG_HEAD+f'<title>{label} — Applyra</title>'+paths+'</svg>'
    ET.fromstring(svg)
    (ROOT/'svg'/f'{key}.svg').write_text(svg,encoding='utf-8')
    for s in (24,48,96):
        render=svg.replace('currentColor','#40516b').replace('var(--icon-bg, #ffffff)','#ffffff')
        cairosvg.svg2png(bytestring=render.encode(),write_to=str(ROOT/f'png-{s}'/f'{key}.png'),output_width=s,output_height=s)

# 4K presentation sheet, with cards for presentation ONLY — exported SVGs have zero background.
W=H=4096
img=Image.new('RGB',(W,H),'#f7f9fd')
d=ImageDraw.Draw(img)
try:
    font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    fTitle=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',128)
    fSub=ImageFont.truetype(font_path,51)
    fCell=ImageFont.truetype(font_path,46)
    fNum=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',27)
except Exception:
    fTitle=fSub=fCell=fNum=ImageFont.load_default()

d.text((240,130),'APPLYRA',font=fTitle,fill='#14233d')
d.text((245,290),'Independent sidebar icons  /  24 × 24 coordinate system  /  SVG master',font=fSub,fill='#65738d')
d.rounded_rectangle((245,390,700,400),radius=5,fill='#2f60ee')
cols=5; left=220; top=540; cell_w=735; cell_h=555
for idx,(key,(label,paths)) in enumerate(ICONS.items()):
    r,c=divmod(idx,cols); x=left+c*cell_w; y=top+r*cell_h
    d.rounded_rectangle((x,y,x+682,y+500),radius=45,fill='white',outline='#e5eaf4',width=3)
    active=(idx==0)
    if active:
        d.rounded_rectangle((x+214,y+55,x+464,y+305),radius=54,fill='#eff3ff')
    raw=(ROOT/'svg'/f'{key}.svg').read_text().replace('currentColor','#2860ed' if active else '#43536e').replace('var(--icon-bg, #ffffff)', '#eff3ff' if active else '#ffffff')
    out=cairosvg.svg2png(bytestring=raw.encode(),output_width=210,output_height=210)
    item=Image.open(io.BytesIO(out)).convert('RGBA')
    img.paste(item,(x+235,y+75),item)
    bb=d.textbbox((0,0),label,font=fCell); tx=x+(682-(bb[2]-bb[0]))/2
    d.text((tx,y+342),label,font=fCell,fill='#1d2e4b')
    d.text((x+32,y+454),f'{idx+1:02}',font=fNum,fill='#8fa0bb')
footer='Custom line illustrations  •  No filled app tiles  •  SVGs scale without resolution loss'
d.text((244,3910),footer,font=fSub,fill='#65738d')
img.save(ROOT/'applyra-icons-preview-4k.png',optimize=True)

manifest={
 'name':'Applyra original navigation icon set',
 'version':'1.0.0',
 'icon_count':len(ICONS),
 'authorship':'New original source-drawn vector geometry. Generic UI metaphors; no third-party icon package or copied brand assets.',
 'format':'24x24 SVG, stroke=currentColor, stroke-width=1.8, transparent background; convenience PNGs at 24px/48px/96px',
 'suggested_css':'.applyra-icon { width:20px; height:20px; color:#40516b } .applyra-icon.is-active { color:#2860ed }',
 'note':'A graphical design alone does not imply a feature is implemented. Icons can be connected only to features actually present. Brand novelty/trademark clearance has not been legally certified.',
 'icons':[{'name':key,'label':label,'path':'svg/'+key+'.svg'} for key,(label,_) in ICONS.items()]
}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
readme='''# Applyra — independent sidebar icon set

- **COUNT_PLACEHOLDER separately authored, transparent SVG icons** in `svg/`.
- Crisp at 16, 18, 20, 24, 32 px and beyond. No raster upscaling required.
- Each uses a `24 × 24` viewBox, 1.8 stroke, rounded caps/joins, and `currentColor`.
- PNG fallbacks in `png-24/`, `png-48/`, `png-96/`.
- `applyra-icons-preview-4k.png` is a contact sheet only; sidebar files are separate.
- SVGs do not have the large glossy squares from the previous image concepts.

## Use
Inline the SVG markup in your sidebar component to inherit CSS color:

```html
<span class="sidebar-icon" aria-hidden="true">
  <!-- paste body of svg/dashboard.svg here -->
</span>
```

```css
.sidebar-icon svg { width: 20px; height: 20px; color: #40516b; }
.sidebar-link[aria-current="page"] .sidebar-icon svg { color: #2860ed; }
```

For `<img src="...">`, `currentColor` does not inherit from the surrounding page CSS; use the PNG fallback or replace `currentColor` with a fixed hex color in a generated SVG. Do not claim a feature works just because an icon exists. These are graphic assets, not implemented features.

## Originality / rights
Created specifically as source-authored SVG paths for Applyra, not copied from an icon library. Symbols such as a clock, magnifying glass, and briefcase are conventional UI metaphors; originality alone cannot guarantee trademark clearance or exclusive rights.
'''
(ROOT/'README.md').write_text(readme.replace('COUNT_PLACEHOLDER',str(len(ICONS))),encoding='utf-8')
zipdest=Path('/mnt/data/Applyra_Original_Sidebar_Icons.zip')
with zipfile.ZipFile(zipdest,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
    for p in sorted(ROOT.rglob('*')):
        if p.is_file():
            z.write(p,p.relative_to(ROOT.parent))

# Confirm all files and dimensions; make summary for output/citation.
for key in ICONS:
    tree=ET.parse(ROOT/'svg'/f'{key}.svg'); assert tree.getroot().get('viewBox')=='0 0 24 24'
    for sz in (24,48,96):
        assert Image.open(ROOT/f'png-{sz}'/f'{key}.png').size==(sz,sz)
assert Image.open(ROOT/'applyra-icons-preview-4k.png').size == (4096,4096)
print('VALIDATED:',len(ICONS),'separate original vector SVGs, 3 sizes of transparent PNGs each, plus 4096x4096 preview')
print('PACK:',zipdest, round(zipdest.stat().st_size/1024/1024,2),'MiB')
print('PREVIEW:', ROOT/'applyra-icons-preview-4k.png')
print('EXAMPLE:',ROOT/'svg/dashboard.svg')
print('NAMES:',', '.join(ICONS))
