// Câmeras (V): 0 terceira pessoa, 1 primeira pessoa, 2 drone, 3 ação (ombro); no carro, V alterna 3ª pessoa / interno.
// No carro o mouse move a câmera livremente (jog.olho). Botão direito = mira com zoom (fovMira).
import * as THREE from 'three';
import { INT, colide } from './world.js';
const pos = new THREE.Vector3();
const anterior = new THREE.Vector3(), rotAnterior = new THREE.Quaternion();let ultPov=-1,ultCarro=null,transicao=0;
export function atualizarCamera(cam, agora, dt, jog, pov, fovMira = 0) {
  anterior.copy(cam.position);rotAnterior.copy(cam.quaternion);
  if(pov!==ultPov||jog.veiculo!==ultCarro){transicao=.55;ultPov=pov;ultCarro=jog.veiculo;}
  const c = jog.veiculo, a = c ? c.obj.position : jog.obj.position;
  // A pé, a câmera possui direção própria: o jogador pode olhar ao redor sem
  // obrigar o corpo a girar parado. Dentro do veículo, mantém a câmera livre já existente.
  const yaw = c ? c.yaw + jog.olho : (jog.cameraYaw ?? jog.yaw); let fov = 70;
  if (c && pov === 1) pov = 4; if (pov === 4 && !c) pov = 0;
  if (pov === 4) {
    const lx = c.olhoInterior?.x ?? -c.m.w * .22, lz = c.olhoInterior?.z ?? -.04, co = Math.cos(c.yaw), si = Math.sin(c.yaw);
    const altura = c.olhoInterior?.y ?? Math.max(.9, Math.min(1.35, c.m.h * .67));
    cam.position.set(a.x + lx * co + lz * si, a.y + altura, a.z - lx * si + lz * co);
    cam.rotation.set(jog.pitch, yaw, 0, 'YXZ'); fov = 76;
  }
  else if (pov === 1) { cam.position.set(a.x, a.y + (jog.agachado ? 1.1 : 1.65), a.z); cam.rotation.set(jog.pitch, yaw, 0, 'YXZ'); fov = fovMira || 70; }
  else {
    let d = c ? 9 : 4.5, h = c ? 3.5 - jog.pitch * 2 : 2.4 - jog.pitch * 2, lado = 0, s = 8;
    if (pov === 3) { d = c ? 8 : 3.2; h = 1.9 - jog.pitch * 1.5; lado = 1.1; s = 3; fov = 60; }
    if (fovMira && !c) { d = 2.8; h = 1.78 - jog.pitch * 1.5; lado = 1.2; s = 12; fov = fovMira; } // mira sobre o ombro: personagem deslocado para a esquerda do crosshair
    if (pov === 2) { const t = agora / 4000; pos.set(a.x + Math.sin(t) * 18, a.y + 8, a.z + Math.cos(t) * 18); }
    else pos.set(a.x + Math.sin(yaw) * d + Math.cos(yaw) * lado, a.y + h, a.z + Math.cos(yaw) * d - Math.sin(yaw) * lado);
    if(INT.on){pos.x=THREE.MathUtils.clamp(pos.x,INT.x-INT.w/2+.4,INT.x+INT.w/2-.4);pos.z=THREE.MathUtils.clamp(pos.z,INT.z-INT.d/2+.4,INT.z+INT.d/2-.4);pos.y=Math.min(pos.y,INT.tipo==='oficina'?6.7:3.7);}
    // A mesma proteção vale fora e dentro dos prédios. A câmera recua antes da
    // primeira parede ou móvel, evitando atravessar fachadas, tetos e estantes.
    for(let k=1;k<=20;k++){const t=k/20,x=a.x+(pos.x-a.x)*t,z=a.z+(pos.z-a.z)*t;if(colide(x,z,.2,1.7)){pos.set(a.x+(pos.x-a.x)*Math.max(0,t-.075),pos.y,a.z+(pos.z-a.z)*Math.max(0,t-.075));break;}}
    if(cam.position.distanceTo(a)>45)cam.position.copy(pos);else cam.position.lerp(pos, 1 - Math.exp(-s * dt));
    if (fovMira && !c) { // mira para a frente da câmera; o jogador continua visível à esquerda, fora do crosshair
      const alcance=45,cp=Math.cos(jog.pitch);
      cam.lookAt(a.x-Math.sin(yaw)*alcance*cp,a.y+1.55+Math.sin(jog.pitch)*alcance,a.z-Math.cos(yaw)*alcance*cp);
    } else cam.lookAt(a.x, a.y + 1.6, a.z);
  }
  if(transicao>0&&anterior.distanceTo(cam.position)<45){const f=1-Math.exp(-10*dt);cam.position.lerpVectors(anterior,cam.position,f);cam.quaternion.slerpQuaternions(rotAnterior,cam.quaternion,f);transicao-=dt;}
  cam.fov += (fov - cam.fov) * (1 - Math.exp(-8 * dt)); cam.updateProjectionMatrix();
}
