// CC0 WRAD ARMS: two-bone IK pins both palms to each weapon's grips.
import * as THREE from 'three';
import * as Assets from './assets.js';
const Y=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
function giroMundo(osso,rot){osso.parent.getWorldQuaternion(parentQ);osso.quaternion.copy(parentQ.invert()).multiply(rot);osso.updateWorldMatrix(false,true);}
export function criarMaosGLB(indice,comprimento=.3){
  const modelo=Assets.clonarCena('mobBracosFP');if(!modelo)return null;
  const grupo=new THREE.Group();grupo.name='MaosGLB';grupo.add(modelo);modelo.scale.setScalar(.12);
  modelo.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;}});
  const bracos=['r','l'].map(lado=>{
    const superior=modelo.getObjectByName('bicep.'+lado),antebraco=modelo.getObjectByName('forearm.'+lado),pulso=modelo.getObjectByName('wrist.'+lado),encaixe=modelo.getObjectByName('socket.'+lado);
    if(!superior||!antebraco||!pulso||!encaixe)return null;
    const direito=lado==='r',ombro=new THREE.Vector3(direito?.29:-.29,-.35,direito||indice===0?.40:.40-comprimento*.42),apoio=direito?new THREE.Vector3(0,0,.015):indice===0?new THREE.Vector3(-.045,-.03,.03):new THREE.Vector3(0,-.03,-comprimento*.42);
    const rotPulso=encaixe.quaternion.clone().invert(),offset=encaixe.position.clone().multiplyScalar(.12).applyQuaternion(rotPulso);
    return{superior,antebraco,pulso,encaixe,ombro,apoio,rotPulso,offset,l1:antebraco.position.length()*.12,l2:pulso.position.length()*.12,direito};
  });
  if(bracos.some(b=>!b))return null;
  // Curva dos dedos na empunhadura; o indicador fica estendido junto ao gatilho.
  modelo.traverse(o=>{if(o.isBone&&/finger_(middle|ring|pinky)[123]/.test(o.name))o.rotateX(.55);});
  const origem=new THREE.Vector3(),alvo=new THREE.Vector3(),dir=new THREE.Vector3(),pole=new THREE.Vector3(),cotovelo=new THREE.Vector3(),local=new THREE.Vector3();
  const atualizar=(recarga=0)=>{
    // A mão de apoio solta o guarda-mão durante a recarga e retorna ao seu encaixe.
    const f=recarga>0?Math.sin(Math.min(1,recarga/1.25)*Math.PI):0;
    for(const b of bracos){
      grupo.updateWorldMatrix(true,true);origem.copy(b.ombro);grupo.localToWorld(origem);
      local.copy(origem);b.superior.parent.worldToLocal(local);b.superior.position.copy(local);b.superior.updateWorldMatrix(false,true);
      alvo.copy(b.apoio);if(!b.direito){alvo.y-=f*.16;alvo.z+=f*.12;}
      alvo.sub(b.offset);grupo.localToWorld(alvo);dir.copy(alvo).sub(origem);
      const escala=grupo.getWorldScale(local).x,L1=b.l1*escala,L2=b.l2*escala,d=Math.min(L1+L2-.0001,Math.max(.0001,dir.length()));dir.normalize();
      pole.set(b.direito?1:-1,-.65,.25).transformDirection(grupo.matrixWorld);pole.addScaledVector(dir,-pole.dot(dir)).normalize();
      const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));cotovelo.copy(origem).addScaledVector(dir,a).addScaledVector(pole,h);
      q.setFromUnitVectors(Y,local.copy(cotovelo).sub(origem).normalize());giroMundo(b.superior,q);
      q.setFromUnitVectors(Y,local.copy(alvo).sub(cotovelo).normalize());giroMundo(b.antebraco,q);
      grupo.getWorldQuaternion(q);q.multiply(b.rotPulso);giroMundo(b.pulso,q);
    }
    grupo.updateWorldMatrix(true,true);
  };
  grupo.userData.atualizar=atualizar;grupo.userData.bracos=bracos;atualizar();return grupo;
}
