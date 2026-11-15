import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
SRC='/Users/tig/Desktop/tigran/SupaDude/assets/art/hero/animations/mc-run-v5b.pre-armfix.png'
im=np.array(Image.open(SRC).convert('RGBA')).astype(int)
W,H=336,432
info={}
vis=[]
for i in range(13):
    c=im[:,i*W:(i+1)*W]
    r,g,b,a=[c[...,k] for k in range(4)]
    dark=(a>60)&(r<110)&(g<110)&(b<110)
    red=(a>128)&(r>120)&(g<90)&(b<90)
    white=(a>128)&(r>200)&(g>200)&(b>200)
    lab,n=ndi.label(white); s=ndi.sum(white,lab,range(1,n+1)); head=lab==(np.argmax(s)+1)
    ys,xs=np.where(head); cx,cy=xs.mean(),ys.mean(); R=np.sqrt(head.sum()/np.pi)
    yy,xx=np.mgrid[0:H,0:W]
    headzone=(xx-cx)**2+(yy-cy)**2 <= (R+9)**2
    # torso x: median of dark pixels in column band below head
    hb=ys.max()
    tx=[]
    for y in range(hb+20,hb+70):
        xs_=np.where(dark[y,150:200])[0]+150
        if len(xs_): tx.append(np.median(xs_[(xs_>160)&(xs_<190)]) if ((xs_>160)&(xs_<190)).any() else np.nan)
    tx=np.nanmedian(tx)
    # hip: lowest row where torso band has a single narrow run continuing
    hip=None
    for y in range(hb+60,H):
        row=dark[y,int(tx)-15:int(tx)+16]
        if row.sum()>11: hip=y; break
    torso=(np.abs(xx-tx)<=5)&(yy>=hb-4)&(yy<=hip+2)
    capezone=ndi.binary_dilation(red,iterations=6)
    cand=dark&~headzone&~torso&~capezone
    lab,n=ndi.label(cand,structure=np.ones((3,3)))
    arms=np.zeros_like(cand)
    shoulder=(tx,hb+6)
    comps=[]
    for k in range(1,n+1):
        m=lab==k
        if m.sum()<40: continue
        ys_,xs_=np.where(m)
        d=np.min(np.hypot(xs_-shoulder[0],ys_-shoulder[1]))
        top=ys_.min()
        comps.append((k,m.sum(),round(float(d),1),int(top),int(ys_.max())))
        if d<35 and m.sum()<1400: arms|=m
    info[i]=dict(cx=float(cx),cy=float(cy),R=float(R),headBottom=int(hb),torsoX=float(tx),hip=int(hip),comps=comps)
    v=np.zeros((H,W,3),np.uint8)+255
    v[dark]=(0,0,0); v[red]=(230,150,150); v[arms]=(0,160,255); v[torso&dark]=(0,200,0)
    vis.append(v[150:330])
    np.save('/tmp/armfix/arms%d.npy'%i,arms)
print(json.dumps(info,default=int))
row1=np.concatenate(vis[:7],1); row2=np.concatenate(vis[7:]+[np.full_like(vis[0],255)],1)
Image.fromarray(np.concatenate([row1,row2],0)).save('/tmp/armfix/seg.png')
json.dump(info,open("/tmp/armfix/info.json","w"),default=int)
