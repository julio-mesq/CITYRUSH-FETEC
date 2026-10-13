import * as THREE from 'three';

const ponto=new THREE.Vector3(),centro=new THREE.Vector3(),tamanho=new THREE.Vector3();
const suavizar=(a,b,dt,k=9)=>a+(b-a)*(1-Math.exp(-k*dt));
// Divide apenas os triângulos escolhidos, preservando UVs/normais/materiais.
export function separarGeometria(mesh,matriz,predicado){
  const g=mesh.geometry,indices=g.index,position=g.attributes.position,sim=[],nao=[];
  for(let i=0;i<(indices?indices.count:position.count);i+=3){
    const ids=[0,1,2].map(k=>indices?indices.getX(i+k):i+k);
    const teste=ids.every(id=>{ponto.fromBufferAttribute(position,id).applyMatrix4(matriz);return predicado(ponto);});
    (teste?sim:nao).push(...ids);
  }
  if(!sim.length)return null;
  const parte=g.clone();parte.setIndex(sim);parte.computeBoundingBox();parte.computeBoundingSphere();
  const resto=g.clone();resto.setIndex(nao);resto.computeBoundingBox();resto.computeBoundingSphere();mesh.geometry=resto;
  const o=new THREE.Mesh(parte,mesh.material);o.position.copy(mesh.position);o.quaternion.copy(mesh.quaternion);o.scale.copy(mesh.scale);o.castShadow=mesh.castShadow;o.receiveShadow=mesh.receiveShadow;mesh.parent.add(o);return o;
}
function pivotar(c,o,frente){
  c.obj.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(o);box.getCenter(centro);c.obj.worldToLocal(centro);box.getSize(tamanho);
  const direcao=new THREE.Group(),giro=new THREE.Group();direcao.position.copy(centro);c.obj.add(direcao);direcao.add(giro);c.obj.updateMatrixWorld(true);giro.attach(o);
  c.rodasAnimadas.push({direcao,giro,frente:frente??centro.z<0,raio:Math.max(.15,tamanho.y/2)});
}
export function prepararDinamica(c){
  c.rodasAnimadas=[];c.portaAbertura=0;c.tempoVisual=0;c.molaY=0;c.molaV=0;c.velAnterior=0;c.pitchMola=0;c.rollMola=0;
  c.obj.updateMatrixWorld(true);
  const rodas=[];c.exterior.traverse(o=>{if(!/wheel|pneu|tyre|tire|^Circle\.00[1-4]$/i.test(o.name)||/spare|wheel-back$|_Anchor$/i.test(o.name))return;let pai=o.parent;while(pai&&pai!==c.exterior){if(/wheel|pneu|tyre|tire|^Circle\.00[1-4]$/i.test(pai.name))return;pai=pai.parent;}rodas.push(o);});
  rodas.forEach(o=>pivotar(c,o));
  if(!rodas.length){
    // Os GLBs antigos de moto/ônibus vieram fundidos em uma única malha.
    // Extrai as rodas baixas, sem girar a carroceria inteira.
    const malhas=[];c.exterior.traverse(o=>{if(o.isMesh)malhas.push(o);});
    const raio=c.m.roda||(c.duasRodas?.34:.43),xs=c.duasRodas?[0]:[-c.m.w*.43,c.m.w*.43];
    for(const x of xs)for(const z of [-c.m.l*.32,c.m.l*.32]){
      const conjunto=new THREE.Group();c.obj.add(conjunto);
      for(const mesh of malhas){
        c.obj.updateMatrixWorld(true);const matriz=c.obj.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
        const roda=separarGeometria(mesh,matriz,p=>Math.abs(p.x-x)<(c.duasRodas?.23:.27)&&Math.hypot(p.y-raio,p.z-z)<raio*1.12);
        if(roda){c.obj.updateMatrixWorld(true);conjunto.attach(roda);}
      }
      if(conjunto.children.length)pivotar(c,conjunto,z<0);else conjunto.removeFromParent();
    }
  }
  c.porta=null;
  if(c.m.interiorReal){
    c.porta=c.exterior.getObjectByName('DOOR_L_CTRL');
    if(c.porta)c.alturaPorta=c.porta.position.y;
  }
  if(!c.duasRodas&&!c.m.interiorReal){
    const inicioPorta=c.m.portaFrente??-c.m.l*.23,fimPorta=c.m.portaTras??c.m.l*.11;
    const hinge=new THREE.Group();hinge.position.set(-c.m.w*.43,c.m.h*.4,inicioPorta);c.obj.add(hinge);c.obj.updateMatrixWorld(true);
    const malhas=[];c.exterior.traverse(o=>{if(o.isMesh)malhas.push(o);});
    for(const mesh of malhas){
      const matriz=c.obj.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
      const porta=separarGeometria(mesh,matriz,p=>p.x< -c.m.w*.33&&p.z>inicioPorta&&p.z<fimPorta&&p.y>c.m.h*.26&&p.y<c.m.h*.89);
      if(porta){c.obj.updateMatrixWorld(true);hinge.attach(porta);}
    }
    if(hinge.children.length){c.porta=hinge;c.alturaPorta=hinge.position.y;}else hinge.removeFromParent();
  }
  c.luzesTraseiras=[];c.luzesRe=[];c.setas=[];
  const luz=(cor,x,z,w=.16)=>{const mat=new THREE.MeshBasicMaterial({color:cor});const o=new THREE.Mesh(new THREE.BoxGeometry(w,.10,.065),mat);o.position.set(x,Math.max(.43,c.m.h*.42),z);c.obj.add(o);return mat;};
  const lados=c.duasRodas?[0]:[-1,1];
  for(const lado of lados){c.luzesTraseiras.push(luz(0x551015,lado*c.m.w*.32,c.m.l*.5+.025,c.duasRodas?.12:.19));c.luzesRe.push(luz(0x373b3d,lado*c.m.w*.19,c.m.l*.5+.03,.09));}
  if(!c.duasRodas)for(const lado of [-1,1])for(const frente of [-1,1])c.setas.push({lado,mat:luz(0x47330a,lado*c.m.w*.43,frente*(c.m.l*.5+.04),.09)});
  if(c.m.glb==='policial'){
    c.giroflex=[];for(const [x,cor] of [[-.25,0x126aff],[.25,0xff2020]]){const mat=new THREE.MeshBasicMaterial({color:cor});const o=new THREE.Mesh(new THREE.BoxGeometry(.38,.10,.20),mat);o.position.set(x,c.m.h+.08,0);c.obj.add(o);c.giroflex.push(mat);}
  }
}
export function atualizarDinamica(c,dt,dirigindo){
  if(!c.rodasAnimadas||!c.obj.visible||c.destruido||c.guardado)return;
  dt=Math.min(dt,.05);c.tempoVisual+=dt;
  const aceleracao=THREE.MathUtils.clamp((c.v-c.velAnterior)/Math.max(dt,.001),-24,24);c.velAnterior=c.v;
  const freio=dirigindo&&(c.v>0.2&&(c.volanteFreio||false));
  const impacto=c.impactoCd>0?.025:0;
  const alvoY=impacto+Math.sin(c.tempoVisual*10)*Math.min(.009,Math.abs(c.v)*.0004);
  // Mola amortecida: assentamento, impacto e transferência de peso.
  c.molaV+=(80*(alvoY-c.molaY)-16*c.molaV)*dt;c.molaY+=c.molaV*dt;
  c.pitchMola=suavizar(c.pitchMola,THREE.MathUtils.clamp(aceleracao*.0018,-.045,.045),dt);
  c.rollMola=suavizar(c.rollMola,-c.volante*Math.min(.045,Math.abs(c.v)*.0015),dt);
  c.exterior.position.y=([-.12,0,.14][c.tuning.suspensao]||0)+c.molaY;
  c.exterior.rotation.x=c.pitchMola;c.exterior.rotation.z=c.duasRodas?0:c.rollMola;
  for(const r of c.rodasAnimadas){r.giro.rotation.x=(r.giro.rotation.x+c.v*dt/r.raio)%(Math.PI*2);r.direcao.rotation.y=r.frente?c.volante*.45:0;}
  if(c.porta){c.porta.rotation.y=(c.m.interiorReal?1:-1)*c.portaAbertura*1.08;if(!c.m.interiorReal)c.porta.position.y=c.alturaPorta+c.exterior.position.y;}
  for(const m of c.luzesTraseiras)m.color.setHex((freio||aceleracao< -2)?0xff2525:c.farolLigado?0xb91a22:0x551015);
  for(const m of c.luzesRe)m.color.setHex(c.v<-.2?0xeef5ff:0x373b3d);
  const pisca=Math.floor(c.tempoVisual*2.5)%2===0;
  for(const s of c.setas)s.mat.color.setHex(pisca&&Math.abs(c.volante)>.25&&s.lado===-Math.sign(c.volante)?0xffb72b:0x47330a);
  if(c.giroflex)c.giroflex.forEach((m,i)=>m.color.setHex((Math.floor(c.tempoVisual*6)+i)%2?0x101218:i?0xff2020:0x126aff));
}
