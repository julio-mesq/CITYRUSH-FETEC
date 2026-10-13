// Trânsito: semáforos completos, carros dirigidos por NPCs e aviões no céu.
import * as THREE from 'three';
import { Carro, MODELOS } from './vehicles.js';
const CICLO=13;
export function estadoSemaforo(eixo,t){
  const p=((t%CICLO)+CICLO)%CICLO;
  if(eixo==='z')return p<5?'verde':p<6?'amarelo':'vermelho';
  return p<6?'vermelho':p<11?'verde':p<12?'amarelo':'vermelho';
}
export const verde=(eixo,t)=>estadoSemaforo(eixo,t)==='verde';
export function criarSemaforos(scene) {
  const N=49,grupo=new THREE.Group(),m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),metal=new THREE.MeshStandardMaterial({color:0x283038,roughness:.35,metalness:.72}),caixaMat=new THREE.MeshStandardMaterial({color:0x11161a,roughness:.5,metalness:.38});
  scene.add(grupo);
  const poste=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.15,6.4,8),metal,N),bracos=new THREE.InstancedMesh(new THREE.BoxGeometry(7,.13,.13),metal,N*2),caixas=new THREE.InstancedMesh(new THREE.BoxGeometry(.72,2,.56),caixaMat,N*2);
  const matLuz=(cor)=>new THREE.MeshBasicMaterial({color:cor,side:THREE.DoubleSide,toneMapped:false}),materiais={
    rz:matLuz(0xff2d1b),az:matLuz(0x322b12),vz:matLuz(0x0b3019),rx:matLuz(0x3b100c),ax:matLuz(0x322b12),vx:matLuz(0x19e36a)
  };
  // Duas faces: luzes visíveis também para quem se aproxima do outro sentido.
  const lente=new THREE.CircleGeometry(.225,14),rz=new THREE.InstancedMesh(lente,materiais.rz,N*2),az=new THREE.InstancedMesh(lente,materiais.az,N*2),vz=new THREE.InstancedMesh(lente,materiais.vz,N*2),rx=new THREE.InstancedMesh(lente,materiais.rx,N*2),ax=new THREE.InstancedMesh(lente,materiais.ax,N*2),vx=new THREE.InstancedMesh(lente,materiais.vx,N*2);
  const aro=new THREE.InstancedMesh(new THREE.TorusGeometry(.245,.033,6,16),metal,N*12);
  let n = 0;
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
    const x=a*100+8,z=b*100+8;m.compose(new THREE.Vector3(x,3.2,z),q,s);poste.setMatrixAt(n,m);
    // Dois braços por esquina: um sinal para cada direção da avenida.
    m.compose(new THREE.Vector3(x-3.5,6.35,z),q,s);bracos.setMatrixAt(n*2,m);
    const qx=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);m.compose(new THREE.Vector3(x,6.35,z-3.5),qx,s);bracos.setMatrixAt(n*2+1,m);
    m.compose(new THREE.Vector3(x-3.5,5.4,z),q,s);caixas.setMatrixAt(n*2,m);m.compose(new THREE.Vector3(x,5.4,z-3.5),qx,s);caixas.setMatrixAt(n*2+1,m);
    const qz=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),qxL=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    let an=n*12;
    for(const lado of [-1,1]){
      for(const [o,y] of [[rz,6],[az,5.4],[vz,4.8]]){m.compose(new THREE.Vector3(x-3.5,y,z+lado*.325),qz,s);o.setMatrixAt(n*2+(lado===1?1:0),m);aro.setMatrixAt(an++,m);}
      for(const [o,y] of [[rx,6],[ax,5.4],[vx,4.8]]){m.compose(new THREE.Vector3(x+lado*.325,y,z-3.5),qxL,s);o.setMatrixAt(n*2+(lado===1?1:0),m);aro.setMatrixAt(an++,m);}
    }
    n++;
  }
  for(const o of [poste,bracos,caixas,rz,az,vz,rx,ax,vx,aro]){o.frustumCulled=false;o.castShadow=o===poste||o===bracos||o===caixas;grupo.add(o);}
  let ultimo='';
  const cor=(mat,on,acesa,apagada)=>mat.color.setHex(on?acesa:apagada);
  return{atualizar(t,alvo={x:0,z:0}){grupo.position.set(Math.round(alvo.x/100)*100,0,Math.round(alvo.z/100)*100);const ez=estadoSemaforo('z',t),ex=estadoSemaforo('x',t),chave=ez+ex;if(chave===ultimo)return;ultimo=chave;
    cor(materiais.rz,ez==='vermelho',0xff2d1b,0x3b100c);cor(materiais.az,ez==='amarelo',0xffb81c,0x322b12);cor(materiais.vz,ez==='verde',0x19e36a,0x0b3019);
    cor(materiais.rx,ex==='vermelho',0xff2d1b,0x3b100c);cor(materiais.ax,ex==='amarelo',0xffb81c,0x322b12);cor(materiais.vx,ex==='verde',0x19e36a,0x0b3019);
  }};
}
// Carro de NPC: anda pela pista da direita, para no sinal vermelho e vira nas esquinas
// Índices em MODELOS (inclui os 6 novos do "City Pack": 13 lambo, 14 van, 15 pickup, 16 onibus, 17 moto2;
// bike (18) fica de fora do trânsito de propósito — bicicleta na pista em alta velocidade ficaria estranho).
// Lista em escopo de módulo (não recriada a cada carro) e exportada para main.js dimensionar a frota de trânsito
// de forma que TODOS os tipos apareçam pelo menos uma vez (antes, com só 10 carros de trânsito e 14 tipos aqui,
// os 4 últimos — van, pickup, onibus, moto2 — nunca eram sorteados).
export const TIPOS_TRANSITO = [0, 19, 1, 22, 2, 20, 6, 21, 5, 3, 13, 16, 17, 14, 15, 8, 9, 10, 11];
export class Transito {
  constructor(scene, i) { this.c = new Carro(scene, 0, 0, MODELOS[TIPOS_TRANSITO[i % TIPOS_TRANSITO.length]], 0); this.vel = 9 + Math.random() * 4; this.pausa = 0; this.reset(); }
  reset() { this.eixo = Math.random() < .5 ? 'z' : 'x'; this.dir = Math.random() < .5 ? 1 : -1; this.rua = Math.round((Math.random() * 2 - 1) * 8) * 100; this.pos = (Math.random() * 2 - 1) * 800; this.aplicar(); }
  aplicar() {
    const c = this.c, p = c.obj.position;
    if (this.eixo === 'z') { p.set(this.rua - 3.5 * this.dir, 0, this.pos); c.yaw = this.dir < 0 ? 0 : Math.PI; } else { p.set(this.pos, 0, this.rua + 3.5 * this.dir); c.yaw = this.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
    c.obj.rotation.y = c.yaw; c.v = this.pausa > 0 ? 0 : this.vel;
  }
  atualizar(dt, t, outros=[]) {
    if(this.c.hp<=0)return;
    if (this.pausa > 0) { this.pausa -= dt; return; }
    const p=this.c.obj.position;
    if(outros.some(o=>o!==this&&o.eixo===this.eixo&&o.dir===this.dir&&Math.abs(o.rua-this.rua)<1&&(o.pos-this.pos)*this.dir>0&&(o.pos-this.pos)*this.dir<Math.max(8,this.vel*.8))){this.c.v=0;return;}
    const ahead = this.dir > 0 ? Math.ceil(this.pos / 100) * 100 - this.pos : this.pos - Math.floor(this.pos / 100) * 100;
    if (ahead > 2 && ahead < 10 && !verde(this.eixo, t)) { this.c.v = 0; return; } // sinal vermelho
    const antes = Math.floor(this.pos / 100); this.pos += this.dir * this.vel * dt;
    if (Math.floor(this.pos / 100) !== antes && Math.random() < .35) {
      // Curva só na interseção; troca os eixos sem inverter a frente do veículo.
      const cruzamento = Math.round(this.pos / 100) * 100;
      const antigaRua = this.rua; this.rua = cruzamento; this.pos = antigaRua;
      this.eixo = this.eixo === 'z' ? 'x' : 'z'; this.dir = Math.random() < .5 ? 1 : -1;
    }
    if (Math.abs(this.pos) > 950) { this.pos = Math.sign(this.pos) * 949; this.dir *= -1; }
    this.aplicar();
  }
}
export function criarAvioes(scene) {
  const mt = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), lista = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), fus = new THREE.CylinderGeometry(1.6, 1.2, 22, 8); fus.rotateZ(Math.PI / 2);
    const P = (geo, x, y, z) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); g.add(o); };
    P(fus, 0, 0, 0); P(new THREE.BoxGeometry(5, .3, 28), 1, 0, 0); P(new THREE.BoxGeometry(3, .3, 9), -10, 0, 0); P(new THREE.BoxGeometry(3, 3.5, .3), -10, 2, 0);
    g.scale.setScalar(1.5); scene.add(g); lista.push({ g, a: Math.random() * 6.28, R: 350 + i * 120, h: 160 + i * 40, w: .09 - i * .015 });
  }
  return { atualizar(dt) { for (const o of lista) { o.a += o.w * dt; o.g.position.set(Math.cos(o.a) * o.R, o.h, Math.sin(o.a) * o.R); o.g.rotation.y = -(o.a + Math.PI / 2); } } };
}
