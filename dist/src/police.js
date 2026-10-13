import * as THREE from 'three';
import { Carro, MODELOS } from './vehicles.js';
import { colide, distanciaLivre } from './world.js';
import { explodir } from './effects.js';
const rua = n => Math.round(n/100)*100;
export function criarPolicia(scene) {
  const modelo=MODELOS.find(m=>m.glb==='policial')||MODELOS[0];
  const carros=Array.from({length:3},()=>{const c=new Carro(scene,0,0,modelo,0);c.obj.visible=false;c.policial=true;return c;});
  let ultimoVisto=null,memoria=0,visaoCd=0,avistadoCache=false;
  return {carros, atualizar(dt,jog,estrelas,interior,npcs) {
    const alvo=jog.veiculo?.obj.position||jog.obj.position;
    let dano=0;visaoCd-=dt;
    if(interior||!estrelas)avistadoCache=false;
    else if(visaoCd<=0){
      visaoCd=.2;avistadoCache=false;
      const observadores=[...npcs.filter(n=>n.policia&&!n.caido).map(n=>n.obj),...carros.filter(c=>c.obj.visible).map(c=>c.obj)];
      for(const o of observadores){
        const a=o.position.clone().setY(1.5),b=alvo.clone().add(new THREE.Vector3(0,1.1,0)),v=b.sub(a),d=v.length();
        if(d<(jog.agachado&&!jog.veiculo?22:85)&&distanciaLivre(a,v.normalize(),d)>=d-.6){avistadoCache=true;break;}
      }
    }
    const avistado=avistadoCache;
    if(avistado){ultimoVisto=alvo.clone();memoria=18;}else memoria=Math.max(0,memoria-dt);
    const ativos=interior||!estrelas?0:Math.min(3,Math.ceil(estrelas/2));
    carros.forEach((c,i)=>{
      if(c.recuperando>0){c.recuperando-=dt;c.obj.visible=false;return;}
      if(c.hp<=0){explodir(c.obj.position,6);c.recuperando=18;c.obj.visible=false;c.hp=100;return;}
      if(i>=ativos){c.obj.visible=false;c.v=0;return;}
      const p=c.obj.position;
      if(!c.obj.visible){p.set(rua(alvo.x)+(i?100:-100),0,rua(alvo.z));c.hp=100;c.obj.visible=true;c.rota=[];}
      const q=ultimoVisto||alvo;
      const distanciaJogador=p.distanceTo(alvo),distanciaParada=jog.veiculo?14:10;
      c.definirFarol(Math.floor(performance.now()/200)%2===0);
      if(distanciaJogador<=distanciaParada){c.v=0;c.rota=[];return;}
      c.rotaTempo=(c.rotaTempo||0)-dt;if(c.rotaTempo<=0){c.rota=[];c.rotaTempo=1.2;}
      if(!c.rota?.length){
        const ix=rua(p.x),iz=rua(p.z),tx=rua(q.x),tz=rua(q.z);
        c.rota=[{x:ix,z:iz},{x:tx,z:iz},{x:tx,z:tz}];
        if(Math.abs(q.x-tx)<7)c.rota.push({x:tx,z:q.z});else if(Math.abs(q.z-tz)<7)c.rota.push({x:q.x,z:tz});
      }
      let prox=c.rota[0],dx=prox.x-p.x,dz=prox.z-p.z,d=Math.hypot(dx,dz);
      if(d<1.4){c.rota.shift();c.v=0;return;}
      const velocidade=Math.min(memoria||!ultimoVisto?13+estrelas*2:7,Math.sqrt(Math.max(0,distanciaJogador-distanciaParada)*10));
      const yaw=Math.atan2(-dx,-dz),erro=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));c.yaw+=erro*Math.min(1,dt*7);c.obj.rotation.y=c.yaw;
      // A viatura primeiro se alinha à rua; não desliza com a frente para trás.
      const passo=Math.min(d,velocidade*dt*Math.max(0,Math.cos(erro))),nx=p.x+dx/d*passo,nz=p.z+dz/d*passo;
      if(!colide(nx,nz,1)){p.x=nx;p.z=nz;c.v=velocidade;}else {c.rota=[];c.v=0;}
      if(p.distanceTo(alvo)<4){if(jog.veiculo){jog.veiculo.v*=Math.exp(-2*dt);jog.veiculo.hp=Math.max(0,jog.veiculo.hp-4*dt);}else dano+=9*dt;c.v=0;}
    });
    return {avistado,dano};
  }};
}
