"""Read-only source audit; outputs evidence under docs/manual-visualizer-audit.
Run: python scripts/audit-visualizer-assets.py (Pillow required).
Compositions reproduce the demo's flat tiled material/multiply model using actual PNGs;
they do not claim to be browser screenshots or physically based fabric renders.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, ImageDraw
import json, hashlib, collections

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/dcorhome-manual-visualizer'
OUT = ROOT / 'docs/manual-visualizer-audit'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((SRC / 'asset-manifest.json').read_text(encoding='utf-8'))
report = {'files': {}, 'manifest_mismatches': [], 'rooms': {}, 'fabrics': {}}
hashes = collections.defaultdict(list)
for path in sorted(SRC.rglob('*')):
    if not path.is_file(): continue
    rel = path.relative_to(SRC).as_posix()
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    entry = {'bytes': path.stat().st_size, 'sha256': digest}
    hashes[digest].append(rel)
    if path.suffix.lower() in ('.png', '.webp', '.jpg'):
        try:
            with Image.open(path) as im:
                im.load()
                entry.update(size=list(im.size), mode=im.mode, format=im.format,
                             rgb_stddev=ImageStat.Stat(im.convert('RGB')).stddev)
                a = im.getchannel('A') if 'A' in im.getbands() else None
                lum = im.convert('L')
                entry.update(luminance_range=list(lum.getextrema()), luminance_bbox=lum.getbbox())
                if a is not None:
                    hist = a.histogram()
                    entry.update(alpha_range=list(a.getextrema()), alpha_bbox=a.getbbox(),
                                 transparent_pixels=hist[0], opaque_pixels=hist[255],
                                 partial_alpha_pixels=sum(hist[1:255]))
        except Exception as exc: entry['decode_error'] = str(exc)
    report['files'][rel] = entry
for entry in manifest['files']:
    rel = entry['path']; actual = report['files'].get(rel)
    if actual is None:
        report['manifest_mismatches'].append({'path': rel, 'problem': 'missing'})
        continue
    for key in ('bytes', 'sha256', 'mode'):
        if key in entry and entry[key] != actual.get(key):
            report['manifest_mismatches'].append({'path': rel, 'field': key, 'expected': entry[key], 'actual': actual.get(key)})
    if 'width' in entry and actual.get('size') != [entry['width'], entry['height']]:
        report['manifest_mismatches'].append({'path': rel, 'problem': 'dimensions'})
    if 'has_alpha' in entry and entry['has_alpha'] != ('alpha_range' in actual):
        report['manifest_mismatches'].append({'path': rel, 'problem': 'alpha declaration'})
listed = {e['path'] for e in manifest['files']} | {'asset-manifest.json'}
report['unlisted_files'] = sorted(set(report['files']) - listed)
report['exact_duplicates'] = [v for v in hashes.values() if len(v) > 1]
report['total_bytes'] = sum(e['bytes'] for e in report['files'].values())
report['largest_files'] = sorted(report['files'], key=lambda k: report['files'][k]['bytes'], reverse=True)[:15]

required = ['base.webp','sheer-layer.webp','main-left-layer.webp','main-right-layer.webp',
            'sheer-mask.webp','main-left-mask.webp','main-right-mask.webp','window-mask.webp',
            'curtain-track-layer.webp','foreground-occlusion.webp','foreground-occlusion-mask.webp','geometry.json']
def roomfile(folder, name):
    expected = folder/name
    return expected if expected.exists() else folder/name.replace('.webp','.png')
sheet = Image.new('RGB', (1000, 10*240), '#eee8df')
draw = ImageDraw.Draw(sheet)
for index in range(1, 11):
    rid = f'room-{index:02d}'; folder = SRC/'rooms'/rid
    g = json.loads((folder/'geometry.json').read_text())
    w,h = Image.open(roomfile(folder,'base.webp')).size
    bounds = g['window']['normalized_bounds']; start=g['track']['from_normalized']; end=g['track']['to_normalized']
    coords = bounds+start+end+[g['hem_y_normalized']]
    mask = Image.open(roomfile(folder,'main-left-mask.webp')).convert('L')
    mask = ImageChops.lighter(mask, Image.open(roomfile(folder,'main-right-mask.webp')).convert('L'))
    mask = ImageChops.lighter(mask, Image.open(roomfile(folder,'sheer-mask.webp')).convert('L'))
    fg = Image.open(roomfile(folder,'foreground-occlusion.webp')).convert('RGBA').getchannel('A')
    overlap = ImageChops.multiply(mask, fg)
    report['rooms'][rid] = {
        'missing': [f for f in required if not (folder/f).exists()],
        'actual_alternatives': {f:roomfile(folder,f).name for f in required if not (folder/f).exists()},
        'matching_dimensions': all(report['files'][roomfile(folder,f).relative_to(SRC).as_posix()]['size']==[w,h] for f in required if f.endswith('.webp')),
        'geometry_in_range': all(isinstance(c,(float,int)) and 0<=c<=1 for c in coords),
        'geometry_ordered': bounds[0]<bounds[2] and bounds[1]<bounds[3] and start[0]<end[0] and start[1]<g['hem_y_normalized'],
        'canvas_matches': g['canvas']=={'width':w,'height':h},
        'foreground_curtain_overlap_pixels': sum(overlap.histogram()[1:]),
        'curtain_bbox': mask.getbbox(), 'foreground_bbox': fg.getbbox(),
        'geometry': g,
    }
    base = Image.open(roomfile(folder,'base.webp')).convert('RGB')
    overlay=base.copy(); d=ImageDraw.Draw(overlay)
    d.rectangle(tuple(round(c*s) for c,s in zip(bounds,[w,h,w,h])), outline='red', width=6)
    d.line((start[0]*w,start[1]*h,end[0]*w,end[1]*h), fill='cyan',width=6)
    tint=Image.new('RGB',(w,h),'#28cc68')
    overlay=Image.composite(tint,overlay,mask.point(lambda v: round(v*.28)))
    sheet.paste(base.resize((480,210)),(0,(index-1)*240+25))
    sheet.paste(overlay.resize((480,210)),(500,(index-1)*240+25))
    draw.text((5,(index-1)*240+5), rid+' base | right: red window / cyan track / green curtain masks',fill='black')
sheet.save(OUT/'room-alignment-contact-sheet.jpg',quality=92)

fabric_sheet=Image.new('RGB',(1100,20*115),'#eee8df'); fd=ImageDraw.Draw(fabric_sheet)
for row, folder in enumerate(sorted((SRC/'fabrics').glob('*/*'))):
    if not folder.is_dir(): continue
    paths=sorted(folder.glob('*.png')); shades=[p for p in paths if p.stem not in ('master','opacity-mask')]
    key=folder.relative_to(SRC).as_posix()
    report['fabrics'][key]={'master_exists':(folder/'master.png').exists(), 'shades':[p.stem for p in shades],
        'shade_count':len(shades),'sizes':sorted({tuple(report['files'][p.relative_to(SRC).as_posix()]['size']) for p in paths}),
        'unique_shade_hashes':len({hashlib.sha256(p.read_bytes()).hexdigest() for p in shades}),
        'mean_shade_colors':[ImageStat.Stat(Image.open(p).convert('RGB')).mean for p in shades]}
    fd.text((2,row*115+2),key,fill='black')
    for col,p in enumerate([folder/'master.png']+shades):
        tile=Image.open(p).convert('RGB').resize((94,82));fabric_sheet.paste(tile,(col*100,row*115+18))
        fd.text((col*100,row*115+100),p.stem[:15],fill='black')
fabric_sheet.save(OUT/'fabric-contact-sheet.jpg',quality=93)

room=SRC/'rooms/room-01'; base=Image.open(roomfile(room,'base.webp')).convert('RGBA'); size=base.size
def texture_layer(group,variety,shade,maskfile,opacity):
    tex=Image.open(SRC/'fabrics'/group/variety/(shade+'.png')).convert('RGB').resize((260,500))
    tile=Image.new('RGB',size)
    for y in range(0,size[1],500):
        for x in range(0,size[0],260): tile.paste(tex,(x,y))
    layer=tile.convert('RGBA')
    layer.putalpha(Image.open(roomfile(room,maskfile)).convert('L').point(lambda a: round(a*opacity)))
    return layer
def compose(sv,sc,mv,mc):
    result=base.copy()
    for group,v,c,mask,opacity,shadefile in [
        ('sheers',sv,sc,'sheer-mask.webp',.37,'sheer-layer.webp'),
        ('main-curtains',mv,mc,'main-left-mask.webp',.96,'main-left-layer.webp'),
        ('main-curtains',mv,mc,'main-right-mask.webp',.96,'main-right-layer.webp')]:
        result=Image.alpha_composite(result,texture_layer(group,v,c,mask,opacity))
        # Match the demo's multiply shading (normal CSS isolated scene assumed).
        shading=Image.open(roomfile(room,shadefile)).convert('RGBA')
        multiplied=ImageChops.multiply(result.convert('RGB'),shading.convert('RGB')).convert('RGBA')
        multiplied.putalpha(shading.getchannel('A').point(lambda a:round(a*.22)))
        result=Image.alpha_composite(result,multiplied)
    for f in ['curtain-track-layer.webp','foreground-occlusion.webp']:
        result=Image.alpha_composite(result,Image.open(roomfile(room,f)).convert('RGBA'))
    return result.convert('RGB')
a=compose('plain-voile','soft-ivory','pure-linen','olive-green')
b=compose('fine-voile','pure-white','velvet','burgundy')
a.save(OUT/'test-A-ivory-voile-olive-linen.png');b.save(OUT/'test-B-white-sheer-burgundy-velvet.png')
union=Image.new('L',size)
for f in ['sheer-mask.webp','main-left-mask.webp','main-right-mask.webp']:
    union=ImageChops.lighter(union,Image.open(roomfile(room,f)).convert('L'))
def difference(first,second):
    diff=ImageChops.difference(first,second).convert('RGB')
    channels=diff.split(); changed=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2]).point(lambda v:255 if v else 0)
    outside=ImageChops.multiply(changed,union.point(lambda v:0 if v else 255))
    return {'changed_pixels':changed.histogram()[255],'outside_masks':outside.histogram()[255], 'bbox':changed.getbbox()}
report['compositions']={'A_vs_B':difference(a,b),
    'sheer_color_only':difference(a,compose('plain-voile','pure-white','pure-linen','olive-green')),
    'main_color_only':difference(a,compose('plain-voile','soft-ivory','pure-linen','burgundy')),
    'main_variety_only':difference(a,compose('plain-voile','soft-ivory','velvet','olive-green')),
    'base_sha256':hashlib.sha256(roomfile(room,'base.webp').read_bytes()).hexdigest(),
    'method':'Offline Pillow approximation of supplied CSS compositor with actual PNG paths, 260x500 scene-pixel texture tiles. Not a browser screenshot; CSS scales tiles with viewport.'}
report['summary']={'file_count':len(report['files']),'decoded_images':sum('size' in x for x in report['files'].values()),
    'decode_errors':[k for k,v in report['files'].items() if 'decode_error' in v]}
(OUT/'evidence.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'summary':report['summary'],'manifest_mismatch_count':len(report['manifest_mismatches']),
                  'compositions':report['compositions'],'total_bytes':report['total_bytes']},indent=2))
