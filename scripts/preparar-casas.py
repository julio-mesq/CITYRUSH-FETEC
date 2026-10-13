"""Agrupa as casas estáticas por material; conserva geometria e texturas."""
import io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

def preparar(src, dst):
    data=Path(src).read_bytes(); size=struct.unpack_from('<I',data,12)[0]
    g=json.loads(data[20:20+size]); base=28+size; raw=data[base:]
    tipos={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
    dimens={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
    def ler(i):
        a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt=np.dtype(tipos[a['componentType']]);k=dimens[a['type']]
        return np.ndarray((a['count'],k),dtype=dt,buffer=raw,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',k*dt.itemsize),dt.itemsize)).copy()
    grupos={}
    def visita(i,pai):
        o=g['nodes'][i]
        if 'matrix' in o: m=np.array(o['matrix']).reshape((4,4),order='F')
        else:
            m=np.eye(4);x,y,z,w=o.get('rotation',[0,0,0,1])
            m[:3,:3]=np.array([[1-2*y*y-2*z*z,2*x*y-2*z*w,2*x*z+2*y*w],[2*x*y+2*z*w,1-2*x*x-2*z*z,2*y*z-2*x*w],[2*x*z-2*y*w,2*y*z+2*x*w,1-2*x*x-2*y*y]])@np.diag(o.get('scale',[1,1,1]))
            m[:3,3]=o.get('translation',[0,0,0])
        m=pai@m
        if 'mesh' in o:
            for p in g['meshes'][o['mesh']]['primitives']:
                if p.get('mode',4)!=4: continue
                pos=ler(p['attributes']['POSITION']).astype(float);pos=pos@m[:3,:3].T+m[:3,3]
                ind=ler(p['indices']).reshape(-1).astype('uint32') if 'indices' in p else np.arange(len(pos),dtype='uint32')
                if np.linalg.det(m[:3,:3])<0: ind=ind.reshape(-1,3)[:,[0,2,1]].reshape(-1)
                if 'NORMAL' in p['attributes']:
                    normal=ler(p['attributes']['NORMAL']).astype(float)@np.linalg.pinv(m[:3,:3]);normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
                else:
                    normal=np.zeros_like(pos);tri=ind.reshape(-1,3);face=np.cross(pos[tri[:,1]]-pos[tri[:,0]],pos[tri[:,2]]-pos[tri[:,0]])
                    for k in range(3):np.add.at(normal,tri[:,k],face)
                    normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
                uv=ler(p['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in p['attributes'] else np.zeros((len(pos),2))
                key=p.get('material',0);entry=grupos.setdefault(key,{'pos':[],'normal':[],'uv':[],'indices':[],'n':0})
                entry['pos'].append(pos.astype('<f4'));entry['normal'].append(normal.astype('<f4'));entry['uv'].append(uv.astype('<f4'));entry['indices'].append(ind+entry['n']);entry['n']+=len(pos)
        for child in o.get('children',[]):visita(child,m)
    for root in g['scenes'][g.get('scene',0)]['nodes']:visita(root,np.eye(4))
    out={'asset':{'version':'2.0','generator':'City Rush static house batching'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':Path(dst).stem}],'meshes':[{'primitives':[]}],'materials':g.get('materials',[]),'textures':g.get('textures',[]),'samplers':g.get('samplers',[]),'images':[],'bufferViews':[],'accessors':[]};binary=bytearray()
    def view(b,target=None):
        while len(binary)%4:binary.append(0)
        v={'buffer':0,'byteOffset':len(binary),'byteLength':len(b)}
        if target:v['target']=target
        out['bufferViews'].append(v);binary.extend(b);return len(out['bufferViews'])-1
    def accessor(a,type_,ctype=5126):
        a=np.ascontiguousarray(a);v=view(a.tobytes(),34963 if type_=='SCALAR' else 34962);entry={'bufferView':v,'componentType':ctype,'count':len(a),'type':type_}
        if type_=='VEC3':entry.update(min=a.min(0).tolist(),max=a.max(0).tolist())
        out['accessors'].append(entry);return len(out['accessors'])-1
    if g.get('extensionsUsed'):out['extensionsUsed']=g['extensionsUsed']
    for material,entry in grupos.items():
        # Reutiliza vértices exatamente iguais; nenhum triângulo é removido.
        atributos=np.concatenate([np.concatenate(entry['pos']),np.concatenate(entry['normal']),np.concatenate(entry['uv'])],axis=1)
        unicos,inverso=np.unique(atributos,axis=0,return_inverse=True)
        indices=inverso[np.concatenate(entry['indices'])].astype('<u4')
        out['meshes'][0]['primitives'].append({'material':material,'attributes':{'POSITION':accessor(unicos[:,:3],'VEC3'),'NORMAL':accessor(unicos[:,3:6],'VEC3'),'TEXCOORD_0':accessor(unicos[:,6:8],'VEC2')},'indices':accessor(indices,'SCALAR',5125)})
    for img in g.get('images',[]):
        v=g['bufferViews'][img['bufferView']];b=raw[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
        im=Image.open(io.BytesIO(b));im.thumbnail((1024,1024));buf=io.BytesIO();mime=img['mimeType']
        im.save(buf,format='PNG' if mime=='image/png' else 'JPEG',optimize=True,**({'quality':88} if mime=='image/jpeg' else {}))
        out['images'].append({'bufferView':view(buf.getvalue()),'mimeType':mime})
    out['buffers']=[{'byteLength':len(binary)}];j=json.dumps(out,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\0'*((-len(binary))%4)
    result=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
    Path(dst).write_bytes(result);print(Path(dst).name,len(grupos),'materiais',len(result),'bytes')

if __name__=='__main__':preparar(sys.argv[1],sys.argv[2])
