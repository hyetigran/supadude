import numpy as np, json, math, cv2
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
SRC='/Users/tig/Desktop/tigran/SupaDude/assets/art/hero/animations/mc-run-v5b.pre-armfix.png'
OUT='/tmp/armfix/mc-run-v5c.png'
im=np.array(Image.open(SRC).convert('RGBA'))
info=json.load(open('/tmp/armfix/info.json'))
W,H=336,432
VF=[63,64,65,66,67,69,70,71,72,73,74,77,78]
A_FWD,A_BACK=65,-70
UP,FORE=60,58
SS=4
out=im.copy()
params=[]
for i in range(13):
    c=im[:,i*W:(i+1)*W].copy()
    inf=info[str(i)]
    r,g,b,a=[c[...,k].astype(int) for k in range(4)]
    dark=(a>60)&(r<110)&(g<110)&(b<110)
    arms=np.load('/tmp/armfix/arms%d.npy'%i)
    # pick up arm fragments split off by the cape zone: dark comps near arms, not legs
    hip=inf['hip']; tx=inf['torsoX']; hb=inf['headBottom']
    yy,xx=np.mgrid[0:H,0:W]
    torso=(np.abs(xx-tx)<=5)&(yy>=hb-4)&(yy<=max(hip,255)+2)
    red=(a>128)&(r>120)&(g<90)&(b<90)
    capezone=ndi.binary_dilation(red,iterations=6)
    headzone=(xx-inf['cx'])**2+(yy-inf['cy'])**2<=(inf['R']+9)**2
    rest=dark&~arms&~torso&~headzone&~capezone
    lab,n=ndi.label(rest,structure=np.ones((3,3)))
    near=ndi.binary_dilation(arms,iterations=8)
    for k in range(1,n+1):
        m=lab==k
        ys_,_=np.where(m)
        xs_=np.where(m)[1]
        dmin=np.min(np.hypot(xs_-tx,ys_-(hb+9)))
        if m.sum()<1400 and ys_.max()<hip+5 and ((m&near).any() or (m.sum()>100 and dmin<80)): arms|=m
    # arm strokes inside the cape zone that touch the arm mask (outside the cape fill itself)
    grow=arms.copy()
    for _ in range(14):
        grow=ndi.binary_dilation(grow)&dark&~torso&~headzone&~ndi.binary_dilation(red,iterations=2)
        grow|=arms
    arms=grow
    # precise torso centre from the clean lower torso
    xsr=[]
    for y in range(hb+62,hb+76):
        xs_=np.where(dark[y,int(tx)-8:int(tx)+9])[0]
        if 3<len(xs_)<10: xsr.append(xs_.mean()+int(tx)-8)
    tx=float(np.median(xsr))
    upper=(yy<hb+62)&(yy>hb-2)
    stub=dark&upper&(np.abs(xx-tx)<=14)&~headzone
    narrow=(np.abs(xx-tx)<=2.5)
    E=(ndi.binary_dilation(arms,iterations=2)|ndi.binary_dilation(stub,iterations=1))&~(torso&dark&~upper)&~(narrow&upper)&~headzone
    # inpaint premultiplied
    rgb=c[...,:3].astype(np.float32); al=c[...,3:].astype(np.float32)/255
    pm=(rgb*al).clip(0,255).astype(np.uint8)
    m8=E.astype(np.uint8)*255
    pm2=cv2.inpaint(pm,m8,4,cv2.INPAINT_TELEA)
    al2=cv2.inpaint((al[...,0]*255).astype(np.uint8),m8,4,cv2.INPAINT_TELEA).astype(np.float32)/255
    # where most neighbours are transparent, force clear
    al2=np.where(al2<0.35,0,al2)
    rgb2=np.where(al2[...,None]>0,pm2.astype(np.float32)/np.maximum(al2[...,None],1e-3),0).clip(0,255)
    nearcape=ndi.binary_dilation(red,iterations=5)
    clear=E&~nearcape
    al2[clear]=0
    new=c.copy()
    new[E,:3]=rgb2[E].astype(np.uint8); new[E,3]=(al2[E]*255).astype(np.uint8)
    # stroke colour from torso core
    core=torso&dark&(a>250)
    col=tuple(int(v) for v in np.median(c[core][:,:3],0))
    # draw arms
    ph=2*math.pi*(VF[i]-63.5)/16
    s=math.cos(ph)
    sh=(tx,hb+9)
    layer=Image.new('RGBA',(W*SS,H*SS),(0,0,0,0))
    d=ImageDraw.Draw(layer)
    arm_pts=[]
    tw=6.2*SS
    d.line([(tx*SS,(hb-3)*SS),(tx*SS,(hb+64)*SS)],fill=col+(255,),width=int(tw))
    for sign in (1,-1):
        v=s*sign
        th=A_FWD*v if v>0 else -A_BACK*v
        bend=40+10*v
        t1=math.radians(th); t2=math.radians(th+bend)
        el=(sh[0]+UP*math.sin(t1), sh[1]+UP*math.cos(t1))
        hd=(el[0]+FORE*math.sin(t2), el[1]+FORE*math.cos(t2))
        # smooth curve through shoulder-elbow-hand (quadratic through elbow)
        ctrl=(2*el[0]-0.5*(sh[0]+hd[0]), 2*el[1]-0.5*(sh[1]+hd[1]))
        pts=[]
        for k in range(41):
            t=k/40
            x=(1-t)**2*sh[0]+2*(1-t)*t*ctrl[0]+t*t*hd[0]
            y=(1-t)**2*sh[1]+2*(1-t)*t*ctrl[1]+t*t*hd[1]
            pts.append((x*SS,y*SS))
        wpx=6.2*SS
        d.line(pts,fill=col+(255,),width=int(wpx),joint='curve')
        for p in (pts[0],pts[-1]):
            d.ellipse([p[0]-wpx/2,p[1]-wpx/2,p[0]+wpx/2,p[1]+wpx/2],fill=col+(255,))
        arm_pts.append(dict(swing=round(th if v>0 else -th,1),shoulder=[round(sh[0],1),sh[1]],elbow=[round(el[0],1),round(el[1],1)],hand=[round(hd[0],1),round(hd[1],1)]))
    layer=layer.resize((W,H),Image.LANCZOS)
    base=Image.fromarray(new); base.alpha_composite(layer)
    out[:,i*W:(i+1)*W]=np.array(base)
    params.append(dict(cell=i,sourceVideoFrame=VF[i],armA=arm_pts[0],armB=arm_pts[1],erasedPx=int(E.sum()),strokeColor=col))
Image.fromarray(out).save(OUT)
json.dump(params,open('/tmp/armfix/params.json','w'),indent=1)
# contact sheets: erased-only debug and final
W2=W
o=Image.open(OUT); ct=Image.new('RGB',(W*7,H*2),'white')
for i in range(13):
    cc=o.crop((i*W,0,(i+1)*W,H)); ct.paste(cc,((i%7)*W,(i//7)*H),cc)
ct.save('/tmp/armfix/contact_v5c.png')
for p in params: print(p['cell'],p['armA']['swing'],p['armB']['swing'],p['erasedPx'],p['strokeColor'])
