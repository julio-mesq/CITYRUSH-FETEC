// Batch only static GLB decorations. Shared cached buffers stay intact; rigs/doors are excluded.
import * as THREE from 'three';
export function fundirEstaticos(raiz){
  raiz.updateMatrixWorld(true);const inversa=raiz.matrixWorld.clone().invert(),lotes=new Map(),originais=[];
  raiz.traverse(o=>{
    if(!o.isMesh||o.isSkinnedMesh||!o.geometry||Array.isArray(o.material)||!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;
    const g=o.geometry.clone().applyMatrix4(inversa.clone().multiply(o.matrixWorld));
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
    if(!lotes.has(o.material))lotes.set(o.material,[]);lotes.get(o.material).push(g);originais.push(o);
  });
  for(const [material,gs] of lotes){
    const nv=gs.reduce((n,g)=>n+g.attributes.position.count,0),ni=gs.reduce((n,g)=>n+g.index.count,0),idx=new Uint32Array(ni),geo=new THREE.BufferGeometry();
    for(const [nome,comp] of [['position',3],['normal',3],['uv',2]]){
      const a=new Float32Array(nv*comp);let off=0;
      for(const g of gs){const attr=g.attributes[nome];for(let i=0;i<attr.count;i++)for(let c=0;c<comp;c++)a[off++]=attr.getComponent(i,c);}
      geo.setAttribute(nome,new THREE.BufferAttribute(a,comp));
    }
    let ov=0,oi=0;for(const g of gs){for(let i=0;i<g.index.count;i++)idx[oi++]=g.index.getX(i)+ov;ov+=g.attributes.position.count;g.dispose();}
    geo.setIndex(new THREE.BufferAttribute(idx,1));geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;raiz.add(mesh);
  }
  for(const o of originais)o.removeFromParent();return lotes.size;
}
