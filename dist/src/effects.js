// Efeitos visuais com pool: tiros e mortes reutilizam os mesmos objetos 3D.
// Isso evita pausas do coletor de memória quando uma escopeta ou explosão gera
// vários impactos no mesmo quadro.
import * as THREE from 'three';
const lista = [], livres = [], rastros=[], rastrosLivres=[], esf = new THREE.SphereGeometry(1, 6, 4), flashGeo=new THREE.SphereGeometry(1,6,4), LIMITE = 64, LIMITE_RASTROS=24; let cena;
export const iniciar = s => { cena = s; };
function obter() {
  let m=livres.pop();
  if(!m){
    if(lista.length+livres.length>=LIMITE)return null;
    m=new THREE.Mesh(esf,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));cena.add(m);
  }
  m.visible=true;return m;
}
function novo(p, cor, op, e, d, sobe, y) {
  const m=obter();if(!m)return null;
  m.material.color.setHex(cor);m.material.opacity=op;m.position.copy(p);m.position.y+=y;m.scale.setScalar(1);
  const o={m,t:0,d,e,sobe,op,v:null};lista.push(o);return o;
}
export const explodir = (p, r = 6) => novo(p, 0xff8c00, .9, r, .6, 0, 1);
export const fumaca = p => novo(p, 0x444444, .6, 1.5, 1.2, 2, 1.5);
export function tracante(a,b,foguete=false){
  let o=rastrosLivres.pop();
  if(!o){
    if(rastros.length+rastrosLivres.length>=LIMITE_RASTROS)return;
    const geo=new THREE.BufferGeometry(),pos=new THREE.Float32BufferAttribute(6,3);geo.setAttribute('position',pos);
    const linha=new THREE.Line(geo,new THREE.LineBasicMaterial({transparent:true,depthWrite:false}));
    const flash=new THREE.Mesh(flashGeo,new THREE.MeshBasicMaterial({depthWrite:false}));cena.add(linha,flash);o={linha,flash,t:0,d:.06};
  }
  const pos=o.linha.geometry.attributes.position;pos.setXYZ(0,a.x,a.y,a.z);pos.setXYZ(1,b.x,b.y,b.z);pos.needsUpdate=true;
  const cor=foguete?0xff7b1b:0xffdd95;o.linha.material.color.setHex(cor);o.flash.material.color.setHex(foguete?0xff7a18:0xfff1aa);
  o.linha.material.opacity=.95;o.linha.visible=o.flash.visible=true;o.flash.position.copy(a);o.flash.scale.setScalar(foguete?.09:.045);o.t=0;o.d=foguete?.11:.06;rastros.push(o);
}
export function impacto(p, sangue=false) {
  const quantidade=sangue?4:3;
  for(let i=0;i<quantidade;i++) {
    const o=novo(p,sangue?0x9d2032:0xffd58e,.9,.12,.28+Math.random()*.16,0,0);if(!o)break;
    o.v=new THREE.Vector3((Math.random()-.5)*2.6,Math.random()*2.6,(Math.random()-.5)*2.6);o.m.scale.setScalar(.045);
  }
}
export function atualizar(dt) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const o = lista[i]; o.t += dt; const k = o.t / o.d;
    o.m.scale.setScalar(o.v ? .035+o.e*k : .4 + o.e * k); o.m.position.y += o.sobe * dt; o.m.material.opacity = o.op * (1 - k);
    if(o.v){o.v.y-=7*dt;o.m.position.addScaledVector(o.v,dt);}
    if (k >= 1) { o.m.visible=false;lista.splice(i,1);livres.push(o.m); }
  }
  for(let i=rastros.length-1;i>=0;i--){const o=rastros[i];o.t+=dt;o.linha.material.opacity=Math.max(0,1-o.t/o.d);if(o.t>=o.d){o.linha.visible=o.flash.visible=false;rastros.splice(i,1);rastrosLivres.push(o);}}
}

// Cria os objetos do pool antes da partida (visíveis só durante a pré-compilação dos
// shaders) para que o primeiro tiro/explosão não gere pausa de compilação.
const aquecendo = [];
export function preaquecer() {
  for (let i = 0; i < 24; i++) { const m = obter(); if (!m) break; m.position.set(0, -500, 0); aquecendo.push(m); }
  for (let i = 0; i < 6; i++) { tracante({ x: 0, y: -500, z: 0 }, { x: 0, y: -500, z: 1 }); }
}
export function finalizarPreaquecimento() {
  for (const m of aquecendo) { m.visible = false; livres.push(m); }
  aquecendo.length = 0;
  for (let i = rastros.length - 1; i >= 0; i--) { const o = rastros[i]; o.linha.visible = o.flash.visible = false; rastros.splice(i, 1); rastrosLivres.push(o); }
}
