"""Pack selected, already-keyed frames; preserve all source art and metadata.

Run with Pillow. This performs export sizing/placement only, no keying,
repainting, or gameplay changes. Measurements and transforms are recorded.
"""
from pathlib import Path
import json
import math
import statistics
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'exports'
OUT.mkdir(exist_ok=True)
NAMES = ['run','idle','jump-rise','jump-apex','fall','land','flight-start',
         'flight-loop','flight-end','shoot-ground','shoot-air','hit','stomp',
         'crash','victory']
AIR = {'jump-rise','jump-apex','fall','flight-start','flight-loop','flight-end',
       'shoot-air','stomp','crash'}
SIZE = 768
HEAD = 128
GROUND = 660
overview = Image.new('RGB', (1500, 900), '#c9d3dd')
od = ImageDraw.Draw(overview)
manifest = []
for ni, name in enumerate(NAMES):
    label = 'mc-' + name
    meta = json.loads((ROOT / 'animations' / (label + '.json')).read_text())
    sheet = meta['sheet']
    source = Image.open(ROOT / 'animations' / meta['image']).convert('RGBA')
    ids = list(dict.fromkeys(i for tag in meta['tags'] for i in tag['frames']))
    frames, measures = [], []
    for i in ids:
        x, y = i % sheet['cols'] * sheet['frameW'], i // sheet['cols'] * sheet['frameH']
        f = source.crop((x, y, x + sheet['frameW'], y + sheet['frameH']))
        channels = [c.point(lambda v: 255 if v > 220 else 0) for c in f.split()]
        white = channels[0]
        for c in channels[1:]: white = ImageChops.darker(white,c)
        hb = white.getbbox()
        if not hb:
            raise ValueError(f'{label} frame {i}: no opaque white head')
        hb = list(hb)
        bb = f.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
        measures.append({'sourceFrame': i, 'whiteHeadBounds': hb, 'alpha128Bounds': list(bb)})
        frames.append(f)
    scale = HEAD / statistics.median(m['whiteHeadBounds'][2]-m['whiteHeadBounds'][0] for m in measures)
    center_x = statistics.median((m['whiteHeadBounds'][0]+m['whiteHeadBounds'][2])/2 for m in measures)
    floor = max(m['alpha128Bounds'][3] for m in measures)
    packed, records = [], []
    for f, m in zip(frames, measures):
        hb = m['whiteHeadBounds']
        # Airborne export pivot is the measured white-head bottom-center proxy.
        # Grounded exports keep the source bob and use a shared support baseline.
        if name in AIR:
            px, py = (hb[0]+hb[2])/2, hb[3]
            tx, ty = 430, 320
        else:
            px, py = center_x, floor
            tx, ty = 384, GROUND
        dx, dy = round(tx-px*scale), round(ty-py*scale)
        scaled = f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
        bbox = scaled.getchannel('A').point(lambda v: 255 if v >= 16 else 0).getbbox()
        mapped = [bbox[0]+dx,bbox[1]+dy,bbox[2]+dx,bbox[3]+dy]
        if min(mapped[:2]) < 8 or max(mapped[2:]) > SIZE-8:
            raise ValueError(f'{label} frame {m["sourceFrame"]}: insufficient padding {mapped}')
        canvas = Image.new('RGBA',(SIZE,SIZE))
        canvas.alpha_composite(scaled,(dx,dy))
        packed.append(canvas)
        records.append(dict(m,scale=scale,translation=[dx,dy],sourcePivot=[px,py],
                            exportPivot=[tx,ty],exportAlpha16Bounds=mapped))
    cols = min(4,len(packed)); rows = math.ceil(len(packed)/cols)
    result = Image.new('RGBA',(cols*SIZE,rows*SIZE))
    for i,f in enumerate(packed): result.paste(f,(i%cols*SIZE,i//cols*SIZE))
    result.save(OUT/(label+'.png'))
    tags = []
    for tag in meta['tags']:
        indices = [ids.index(i) for i in tag['frames']]
        tags.append(dict(name=tag['name'],frames=indices,fromFrame=min(indices),toFrame=max(indices),fps=tag['fps'],loop=tag['loop'],indexBase=0))
    export = dict(label=label,image=label+'.png',sourceImage='../animations/'+meta['image'],
        sourceAssetId=meta['assetId'],sheet=dict(frameW=SIZE,frameH=SIZE,cols=cols,rows=rows,frameCount=len(packed),fps=15),
        tags=tags,sourceFrameMap=ids,frames=records,
        anchors=dict(coordinates='pixels from top-left',ground=[384,GROUND],
            airborne=[430,320],alignment='white-head bottom-center proxy per airborne frame' if name in AIR else 'fixed measured support baseline; original bob retained'),
        scaleMethod='constant per clip; median opaque white head width normalized to 128px',
        reviewStatus='export checks passed; visual and playback review pending')
    (OUT/(label+'.json')).write_text(json.dumps(export,indent=2)+'\n')
    # Static inspection of every selected frame, with export pivot crosshairs.
    contact = Image.new('RGB',(cols*256,rows*280),'#c9d3dd'); cd=ImageDraw.Draw(contact)
    for i,f in enumerate(packed):
        thumb=f.resize((256,256));x=i%cols*256;y=i//cols*280
        contact.paste(thumb,(x,y+20),thumb);cd.text((x+4,y+3),f'{i} / source {ids[i]}',fill='black')
    contact.save(OUT/(label+'-contact.jpg'))
    thumb=packed[0].resize((280,280));x=ni%5*300;y=ni//5*300
    overview.paste(thumb,(x,y+20),thumb);od.text((x+5,y+4),label,fill='black')
    manifest.append(dict(label=label,manifest=label+'.json',frameCount=len(packed)))
overview.save(OUT/'overview.jpg')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported',len(manifest),'sheets; all selected frames have opaque white heads and >=8px padding.')
