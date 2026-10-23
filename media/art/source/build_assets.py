"""Original LightWeave geometry. Local, deterministic, no network or Lens calls.

Author in cm; GLB vertices are meters (Lens's 100x import yields cm).
Preview is a software-rendered asset review, never Lens runtime evidence.
"""
from pathlib import Path
import json, math, struct, hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PALETTE = {
    'coral': '#FF6D88', 'coral_edge': '#FFD3C2',
    'teal': '#28E6C6', 'teal_edge': '#BDFFF0',
    'gold': '#FFCD59', 'gold_edge': '#FFF0BB',
    'beam': '#FFC547', 'beam_core': '#FFF1B3',
    'mirror': '#55DCD9', 'mirror_edge': '#C7FFF4',
    'stem': '#38BBA4', 'pearl': '#FFF8DC',
}

def rgb(name):
    s = PALETTE.get(name, name).lstrip('#')
    return tuple(int(s[i:i+2], 16) / 255 for i in (0, 2, 4))

def part(name, vertices, triangles, color, bloom=None, alpha=1.0):
    result = dict(name=name, vertices=np.array(vertices, float),
                  triangles=np.array(triangles, int), color=color, alpha=alpha)
    if bloom is not None:
        result['bloom'] = np.array(bloom, float)
    return result

def sphere(name, radius, color, center=(0, 0, 0), rings=8, segments=16):
    vertices, faces = [], []
    for j in range(rings + 1):
        t = math.pi*j/rings
        for i in range(segments):
            p = math.tau*i/segments
            vertices.append(np.array(center) + radius*np.array([math.sin(t)*math.cos(p), math.cos(t), math.sin(t)*math.sin(p)]))
    for j in range(rings):
        for i in range(segments):
            a, b = j*segments+i, j*segments+(i+1)%segments
            c, d = a+segments, b+segments
            if j: faces.append([a, b, c])
            if j < rings-1: faces.append([b, d, c])
    return part(name, vertices, faces, color)

def tube(name, points, radius, color, sides=8, alpha=1.0):
    points = np.array(points, float)
    vertices, faces = [], []
    for j, p in enumerate(points):
        tangent = points[min(j+1,len(points)-1)] - points[max(j-1,0)]
        tangent /= np.linalg.norm(tangent)
        basis = np.array([0.,1.,0.]) if abs(tangent[1]) < .9 else np.array([1.,0.,0.])
        a = np.cross(tangent, basis); a /= np.linalg.norm(a)
        b = np.cross(tangent,a)
        for i in range(sides):
            theta=math.tau*i/sides
            vertices.append(p+radius*(a*math.cos(theta)+b*math.sin(theta)))
    for j in range(len(points)-1):
        for i in range(sides):
            a=j*sides+i; b=j*sides+(i+1)%sides
            faces.extend([[a,b,a+sides],[b,b+sides,a+sides]])
    for i in range(1,sides-1):
        faces.extend([[0,i+1,i],[(len(points)-1)*sides,(len(points)-1)*sides+i,(len(points)-1)*sides+i+1]])
    return part(name,vertices,faces,color,alpha=alpha)

def ring(name,radius,z,color,tube_radius=.12):
    pts=[[radius*math.cos(t),radius*math.sin(t),z] for t in np.linspace(0,math.tau,33)]
    return tube(name,pts,tube_radius,color,6)

def box(name,size,center,color,alpha=1):
    vertices = [[center[0]+a*size[0]/2,center[1]+b*size[1]/2,center[2]+c*size[2]/2]
                for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]]
    return part(name,vertices,faces,color,alpha=alpha)

def petals(color):
    """Eight solid teardrops and narrow pearl ridges share exact morph topology."""
    output=[]
    for ridge in (False,True):
        closed,opened,faces=[],[],[]
        for petal in range(8):
            angle=math.tau*petal/8
            R=np.array([[math.cos(angle),-math.sin(angle),0],[math.sin(angle),math.cos(angle),0],[0,0,1]])
            start=len(closed)
            for t,width in [(0,.25),(.22,1.45),(.55,1.95),(.8,1.30),(1,.05)]:
                for side in range(6):
                    a=math.tau*side/6
                    w=width*(.11 if ridge else 1)
                    x=w*math.cos(a)
                    thickness=.10 if ridge else .32
                    dz=thickness*math.sin(a) - (.38 if ridge else 0)
                    c=np.array([x*.64,2.6+.6*math.sin(math.pi*t),5.0+5.2*t+dz])
                    o=np.array([x,3.6+5.4*t,5.0+1.0*math.sin(math.pi*t)+dz])
                    closed.append(R@c); opened.append(R@o)
            for j in range(4):
                for k in range(6):
                    a=start+j*6+k; b=start+j*6+(k+1)%6
                    faces.extend([[a,b,a+6],[b,b+6,a+6]])
            for k in range(1,5):
                faces.extend([[start,start+k+1,start+k],[start+24,start+24+k,start+24+k+1]])
        # The x/z cross-section follows +Y when open; reverse the tube winding for outward faces.
        faces = [[a, c, b] for a, b, c in faces]
        output.append(part('PetalHighlights' if ridge else 'Petals',closed,faces,color+'_edge' if ridge else color,bloom=opened))
    return output

def flower(color):
    return [sphere('ReceiverSphere_R4cm',4,color,rings=8,segments=16),
            sphere('PearlCore',1.55,'pearl',(0,0,-3.45),rings=6,segments=12),
            ring('ReceiverRim',4.35,4.6,color+'_edge',.14),
            *petals(color),
            tube('Stem',[(0,-2,5.0),(0,-6,5.6),(.8,-10,6.0)],.25,'stem'),
            sphere('StemBud',.50,color+'_edge',(.8,-10,6),rings=4,segments=8)]

def mirror():
    p=[box('Reflector_Plane16x18',[16,18,.12],[0,0,0],'mirror',.23)]
    for label,size,center in [('Left',[.65,18,.8],[-7.675,0,0]),('Right',[.65,18,.8],[7.675,0,0]),('Top',[14.7,.65,.8],[0,8.675,0]),('Bottom',[14.7,.65,.8],[0,-8.675,0])]:
        p.append(box('Frame'+label,size,center,'mirror_edge'))
    for x,y in [(-7,8),(7,8),(-7,-8),(7,-8)]:
        p.append(sphere('GoldCorner',.38,'gold',(x,y,-.55),rings=4,segments=8))
    p.append(tube('ReflectorGlint',[(-5,5,-.12),(-1,8,-.12)],.11,'pearl'))
    p.append(tube('ReflectorGlintSmall',[(1,-7,-.12),(5,-4,-.12)],.08,'pearl'))
    return p

def source():
    return [sphere('SourceCore',1.4,'pearl'),sphere('SourceGold',2.1,'beam'),ring('SourceHalo',3.0,0,'beam_core',.16),ring('SourceOrbit',3.65,0,'gold',.07)]

def normals(vertices,faces):
    n=np.zeros_like(vertices)
    for face in faces:
        a,b,c=vertices[face]
        face_n=np.cross(b-a,c-a)
        for i in face:n[i]+=face_n
    length=np.linalg.norm(n,axis=1); length[length==0]=1
    return n/length[:,None]

def glb(name,parts,default_bloom=0):
    forward_axis='+Z' if name=='Beam_1cm' else '-Z'
    chunks=[]; views=[]; accessors=[]; materials=[]; meshes=[]; nodes=[]
    def buffer(data,kind,component=5126,include_bounds=False):
        array=np.array(data,dtype='<f4' if component==5126 else '<u4')
        raw=array.tobytes(); offset=sum(len(x) for x in chunks)
        chunks.append(raw+b'\0'*((-len(raw))%4))
        views.append(dict(buffer=0,byteOffset=offset,byteLength=len(raw)))
        a=dict(bufferView=len(views)-1,componentType=component,count=len(array),type=kind)
        if include_bounds:a.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
        accessors.append(a);return len(accessors)-1
    channels=[];samplers=[]
    for p in parts:
        c=rgb(p['color']); alpha=p['alpha']
        materials.append(dict(name=p['color'],pbrMetallicRoughness=dict(baseColorFactor=[*c,alpha],metallicFactor=0,roughnessFactor=.6),emissiveFactor=list(c),doubleSided=True,alphaMode='BLEND' if alpha<1 else 'OPAQUE',extensions={'KHR_materials_unlit':{}}))
        v=p['vertices']*.01; f=p['triangles']
        prim=dict(attributes={'POSITION':buffer(v,'VEC3',include_bounds=True),'NORMAL':buffer(normals(v,f),'VEC3')},indices=buffer(f.flatten(),'SCALAR',5125),material=len(materials)-1)
        mesh=dict(name=p['name'],primitives=[prim])
        if 'bloom' in p:
            prim['targets']=[{'POSITION':buffer((p['bloom']-p['vertices'])*.01,'VEC3',include_bounds=True),'NORMAL':buffer(normals(p['bloom'],f)-normals(p['vertices'],f),'VEC3')}]
            mesh['weights']=[default_bloom];mesh['extras']={'targetNames':['Bloom']}
            sampler=len(samplers)
            samplers.append(dict(input=buffer([[0],[.85]],'SCALAR',include_bounds=True),output=buffer([[0],[1]],'SCALAR'),interpolation='LINEAR'))
            channels.append(dict(sampler=sampler,target=dict(node=len(nodes),path='weights')))
        meshes.append(mesh);nodes.append(dict(name=p['name'],mesh=len(meshes)-1))
    binary=b''.join(chunks)
    doc=dict(asset=dict(version='2.0',generator='LightWeave original procedural artwork 1.0',extras=dict(authorUnits='centimeters',glbUnits='meters',forward_axis=forward_axis,upright=True,importStatus='not_imported',previewEvidence='offline_software_render')),extensionsUsed=['KHR_materials_unlit'],scene=0,scenes=[dict(name=name,nodes=list(range(len(nodes))))],nodes=nodes,meshes=meshes,materials=materials,buffers=[dict(byteLength=len(binary))],bufferViews=views,accessors=accessors)
    if channels:doc['animations']=[dict(name='Bloom',samplers=samplers,channels=channels)]
    raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
    total=12+8+len(raw)+8+len(binary)
    out=struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    path=ROOT/'glb'/f'{name}.glb';path.write_bytes(out)
    allv=np.concatenate([p.get('bloom',p['vertices']) if default_bloom else p['vertices'] for p in parts])
    lo,hi=allv.min(axis=0),allv.max(axis=0)
    report=dict(name=name,path=str(path.relative_to(ROOT)),bytes=len(out),sha256=hashlib.sha256(out).hexdigest(),status='local_asset_ready_not_imported',backend='original_procedural_geometry',backend_reason='animated_articulated petals; local source art only while official session setup is in progress',aabb_cm=(hi-lo).round(5).tolist(),aabb_min_cm=lo.round(5).tolist(),aabb_max_cm=hi.round(5).tolist(),aabb_center_offset_cm=((hi+lo)/2).round(5).tolist(),forward_axis=forward_axis,upright=True,animation_available=bool(channels),triangles=sum(len(p['triangles']) for p in parts),vertices=sum(len(p['vertices']) for p in parts))
    print(f'{name}: {report["triangles"]} triangles; AABB cm {report["aabb_cm"]}; {len(out)} bytes')
    return report

def data_file(name,parts):
    output=dict(schema='lightweave.proceduralmesh.v1',units='centimeters',forward_axis='+Z' if name=='Beam_1cm' else '-Z',parts=[])
    for p in parts:
        q={k:(v.round(6).tolist() if isinstance(v,np.ndarray) else v) for k,v in p.items()}
        q['normals']=normals(p['vertices'],p['triangles']).round(6).tolist()
        output['parts'].append(q)
    (ROOT/'data'/f'{name}.json').write_text(json.dumps(output,separators=(',',':')))

def transform(parts,R=None,t=(0,0,0),bloom=1):
    R=np.eye(3) if R is None else R
    result=[]
    for p in parts:
        q=p.copy();v=p['vertices']
        if 'bloom' in p:v=v+(p['bloom']-v)*bloom
        q['vertices']=v@R.T+np.array(t);q.pop('bloom',None);result.append(q)
    return result

def look_direction(front):
    z=-np.array(front,float);z/=np.linalg.norm(z)
    x=np.cross([0,1,0],z);x/=np.linalg.norm(x);y=np.cross(z,x)
    return np.array([x,y,z]).T

FONT='/System/Library/Fonts/Avenir Next.ttc'
def text(draw,pos,s,size=25,fill=(230,239,244),bold=False):
    draw.text(pos,s,font=ImageFont.truetype(FONT,size,index=1 if bold else 0),fill=fill)

def render(parts,width=800,height=800,eye=(28,23,-58),target=(0,0,3),scale=22):
    eye=np.array(eye,float);target=np.array(target,float)
    forward=target-eye;forward/=np.linalg.norm(forward)
    right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward)
    # Look-at right points to image right in a right-handed world.
    right=-right; up=np.cross(forward,right)
    canvas=Image.new('RGBA',(width,height),(0,0,0,0));draw=ImageDraw.Draw(canvas,'RGBA')
    faces=[]
    for p in parts:
        v=p['vertices'];rel=v-target
        projected=np.stack([width/2+(rel@right)*scale,height/2-(rel@up)*scale],axis=1)
        depth=(v-eye)@forward
        col=np.array(rgb(p['color']))*255
        for f in p['triangles']:
            pts=projected[f]
            norm=np.cross(v[f[1]]-v[f[0]],v[f[2]]-v[f[0]])
            nl=np.linalg.norm(norm)
            light=.75+.25*abs(np.dot(norm/max(nl,1e-9),np.array([-.5,.65,-.55])))
            color=tuple(np.clip(col*light,0,255).astype(int))+(int(p['alpha']*255),)
            faces.append((depth[f].mean(),pts,color))
    for _,pts,col in sorted(faces,key=lambda f:-f[0]):draw.polygon([tuple(x) for x in pts],fill=col)
    return canvas

def make_previews(flowers):
    sheet=Image.new('RGB',(1800,1280),(12,22,33));d=ImageDraw.Draw(sheet)
    text(d,(66,42),'LIGHTWEAVE',27,(117,241,220),True)
    text(d,(66,84),'A garden made of light.',51,(251,243,222),True)
    text(d,(68,150),'ORIGINAL ART ASSET REVIEW  /  CLOSED TO BLOOM',21,(160,178,194))
    for i,color in enumerate(('coral','teal','gold')):
        for state,bloom in [('closed',0),('bloom',1)]:
            j=0 if state=='closed' else 1
            art=render(transform(flowers[color],bloom=bloom),width=560,height=450,eye=(15,8,-75),target=(0,0,3.7),scale=19)
            art.save(ROOT/'preview'/f'{color}-{state}-transparent.png')
            x=52+i*580;y=215+j*475
            sheet.paste(art,(x,y),art)
            text(d,(x+150,y+442),f'{color.upper()} / {state.upper()}',21,tuple(int(c*255) for c in rgb(color+'_edge')),True)
    text(d,(68,1208),'Software-rendered geometry • centimeters • pending official Lens import and Preview verification',20,(142,160,177))
    sheet.save(ROOT/'preview'/'flower-states-contact-sheet.png')
    positions={'coral':(-26,7,-10),'teal':(25,21,-12),'gold':(-7,34,-18)}
    mirror_center=np.array([0,14,0.]);assembled=[]
    for color,pos in positions.items():
        assembled+=transform(flowers[color],look_direction(mirror_center-np.array(pos)),pos,1)
    source_pos=[0,14,-30]
    aim=np.array(positions['gold'])-mirror_center;aim/=np.linalg.norm(aim)
    incident=np.array([0.,0.,1.]);normal=incident-aim;normal/=np.linalg.norm(normal)
    if normal[2]>0:normal=-normal
    assembled+=transform(mirror(),look_direction(normal),mirror_center)
    assembled+=transform(source(),t=source_pos)
    end=np.array(positions['gold'])-aim*4
    assembled+=[tube('GoldenIncident',[source_pos,mirror_center],.20,'beam'),tube('GoldenReflected',[mirror_center,end],.20,'beam'),tube('IncidentCore',[source_pos,mirror_center],.08,'beam_core'),tube('ReflectedCore',[mirror_center,end],.08,'beam_core')]
    base=Image.new('RGB',(1800,1250),(15,25,36));d=ImageDraw.Draw(base)
    text(d,(64,46),'LIGHTWEAVE / PHOTON GARDEN',26,(131,240,220),True)
    text(d,(64,94),'One mirror. Three discoveries.',49,(255,242,209),True)
    art=render(assembled,width=1670,height=910,eye=(72,85,-145),target=(0,20,-10),scale=17)
    base.paste(art,(65,245),art)
    text(d,(65,1150),'ORIGINAL ASSET COMPOSITION',22,(255,209,100),True)
    text(d,(65,1190),'Offline geometry render — Lens import, live input and headset appearance are verified separately.',20,(161,179,195))
    base.save(ROOT/'preview'/'photon-garden-offline-composition.png')
    light=Image.new('RGB',(1400,800),(199,209,214));art=render(assembled,width=1400,height=740,eye=(72,85,-145),target=(0,20,-10),scale=13)
    light.paste(art,(0,20),art);d=ImageDraw.Draw(light)
    text(d,(35,746),'LIGHT BACKGROUND SILHOUETTE REVIEW / OFFLINE ASSET RENDER',20,(40,68,72))
    light.save(ROOT/'preview'/'light-background-silhouettes.png')
    frames=[]
    for i in range(30):
        t=min(i/20,1);t=t*t*(3-2*t)
        frame=Image.new('RGB',(640,640),(12,22,33))
        art=render(transform(flowers['coral'],bloom=t),width=600,height=520,eye=(15,8,-75),target=(0,0,3.7),scale=22)
        frame.paste(art,(20,60),art);d=ImageDraw.Draw(frame)
        text(d,(32,20),'LIGHTWEAVE / BLOOM',25,(255,219,196),True)
        text(d,(32,598),'OFFLINE MORPH PREVIEW',19,(160,180,192))
        frames.append(frame)
    frames[0].save(ROOT/'preview'/'coral-bloom-offline.gif',save_all=True,append_images=frames[1:],duration=43,loop=0,disposal=2)

def validate(parts):
    for p in parts:
        assert np.isfinite(p['vertices']).all()
        assert p['triangles'].min()>=0 and p['triangles'].max()<len(p['vertices'])
        assert p['triangles'].shape[1]==3
        if 'bloom' in p:
            assert p['vertices'].shape==p['bloom'].shape
            assert min(p['vertices'][:,2].min(),p['bloom'][:,2].min())>4.0

def main():
    for folder in ('glb','data','preview'):(ROOT/folder).mkdir(exist_ok=True)
    flowers={color:flower(color) for color in ('coral','teal','gold')};reports=[]
    for color,parts in flowers.items():
        validate(parts);data_file('Flower_'+color,parts)
        for state,bloom in [('Closed',0),('Bloom',1)]:reports.append(glb(f'Flower_{color.title()}_{state}',parts,bloom))
    for name,parts in [('Mirror_16x18cm',mirror()),('PhotonSource',source()),('Beam_1cm',[tube('BeamCore',[(0,0,0),(0,0,1)],.10,'beam_core'),tube('BeamGold',[(0,0,0),(0,0,1)],.22,'beam')])]:
        validate(parts);data_file(name,parts);reports.append(glb(name,parts))
    (ROOT/'data'/'palette.json').write_text(json.dumps({'palette':PALETTE,'lens_material_recommendation':{'surface':'unlit emissive','beam':'additive, depth tested','mirror_pane':'transparent additive tinted cyan','black':'no opaque backdrop; optical additive display shows black as transparent'},'status':'design_recipe_not_lens_materials'},indent=2))
    petal_min_z=min(min(p['vertices'][:,2].min(),p['bloom'][:,2].min()) for p in flowers['coral'] if 'bloom' in p)
    (ROOT/'manifest.json').write_text(json.dumps(dict(schema='lightweave.art-handoff.v1',status='offline_original_assets_not_imported',assets=reports,receiver_radius_cm=4,mirror_width_cm=16,mirror_height_cm=18,flower_front_axis='-Z',flower_petals_min_z_cm=round(float(petal_min_z),6),morph_duration_seconds=.85,preview_type='offline_software_render',petal_winding_revision=2),indent=2))
    make_previews(flowers)
    print('Validation passed: finite geometry, valid indices, compatible morph topology, petals behind receiver. No Lens calls.')

if __name__=='__main__':main()
