// Visuais das armas: isolados dos dados de combate para que cálculos e testes
// possam usar weapons.js sem inicializar Three.js ou carregar modelos 3D.
import * as THREE from 'three';
import * as Assets from './assets.js';
import { FORMAS, ARMAS_GLB, ARMAS_ROT_Y } from './weapons.js';

const material=(cor,metal=.15)=>new THREE.MeshStandardMaterial({color:cor,roughness:.42,metalness:metal});
const caixa=(g,w,h,d,cor,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(cor));o.position.set(x,y,z);g.add(o);return o;};
const cilindro=(g,r,l,cor,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,12),material(cor,.35));o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;};

function armaProcedural(i,d){
  const g=new THREE.Group();
  if(i===5){ // lança-foguetes completo: tubo, ogiva, empunhaduras e mira
    cilindro(g,.105,.78,0x405641,0,0,0);
    for(const z of [-.34,.31])cilindro(g,.125,.065,0x202a22,0,0,z);
    const ogiva=new THREE.Mesh(new THREE.ConeGeometry(.105,.22,14),material(0x728151,.05));ogiva.rotation.x=-Math.PI/2;ogiva.position.z=-.49;g.add(ogiva);
    caixa(g,.085,.23,.075,0x252a27,0,-.16,.11);caixa(g,.07,.17,.06,0x252a27,0,-.13,-.16);
    caixa(g,.045,.07,.18,0xc8d0bf,0,.12,-.08);cilindro(g,.018,.15,0x151a17,0,.15,-.08);
    caixa(g,.16,.035,.09,0x242a25,0,.02,.36);
  }else{
    const comprimento=d[2],cor=i===0?0x25282b:i===4?0x20252a:0x30363a;
    caixa(g,Math.max(.07,d[0]*1.6),Math.max(.1,d[1]*.72),comprimento*.62,cor,0,0,-comprimento*.08);
    cilindro(g,Math.max(.014,d[0]*.2),comprimento*.48,0x15191c,0,.02,-comprimento*.48);
    caixa(g,Math.max(.045,d[0]),Math.max(.13,d[1]*.9),Math.max(.055,comprimento*.1),0x1b1d20,0,-d[1]*.58,comprimento*.12).rotation.x=-.18;
    if(i>=2){caixa(g,.05,.05,comprimento*.35,0x171b1e,0,.09,-comprimento*.06);cilindro(g,.035,.16,0x20262a,0,.105,-comprimento*.1);}
    if(i===3)cilindro(g,.018,comprimento*.56,0x5b4634,.035,.015,-comprimento*.43);
  }
  return g;
}

// Devolve uma arma sempre orientada para -Z. A mesma função é usada na mão e
// em primeira pessoa, evitando que um modelo apareça correto numa câmera e ao contrário na outra.
export function criarVisualArma(i){
  const d=FORMAS[i];if(!d)return null;
  const arma=new THREE.Group(),corpo=new THREE.Group(),chave=ARMAS_GLB[i],modelo=chave&&Assets.clonarCena(chave);
  if(modelo){
    const box=new THREE.Box3().setFromObject(modelo),centro=new THREE.Vector3();box.getCenter(centro);
    const tam=Math.max(box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z)||1;
    modelo.position.set(-centro.x,-centro.y,-centro.z);
    const normalizado=new THREE.Group();normalizado.add(modelo);normalizado.scale.setScalar(Math.max(...d)/tam);normalizado.rotation.y=ARMAS_ROT_Y[i]??0;corpo.add(normalizado);
  }else corpo.add(armaProcedural(i,d));
  arma.add(corpo);arma.updateMatrixWorld(true);
  // O pivô do arquivo GLB costuma ficar no centro da arma. Reposicionamos todo
  // o modelo para que a origem seja o centro do cabo: agora posição (0,0,0)
  // significa literalmente "a mão está segurando a arma", em qualquer câmera.
  const box=new THREE.Box3().setFromObject(corpo),tamFinal=box.getSize(new THREE.Vector3()),centro=box.getCenter(new THREE.Vector3());
  const recuoCabo=[.18,.26,.3,.24,.31,.3][i]??.25;
  const cabo=new THREE.Vector3(centro.x,box.min.y+tamFinal.y*(i===5?.34:.31),box.max.z-tamFinal.z*recuoCabo);
  corpo.position.sub(cabo);
  const boca=new THREE.Object3D();boca.name='BocaDaArma';boca.position.set(centro.x-cabo.x,box.max.y-tamFinal.y*.38-cabo.y,box.min.z-cabo.z);arma.add(boca);
  arma.userData.muzzle=boca;arma.userData.grip=new THREE.Vector3();arma.userData.comprimento=tamFinal.z;
  arma.traverse(n=>{if(n.isMesh){n.castShadow=true;n.frustumCulled=false;}});return arma;
}
