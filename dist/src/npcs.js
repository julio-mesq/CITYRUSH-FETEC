// NPCs a pé: andam pelas calçadas, fogem ou brigam quando agredidos; policiais perseguem; organizador de mini-jogos.
import * as THREE from 'three';
import { criarHumano, trocarArma, atualizarArmaTerceiraPessoa } from './player.js';
import { colide, distanciaLivre } from './world.js';
const R = (a, b) => a + Math.random() * (b - a);
const peles = [0xf5d0ad,0xe7b98f,0xc98f65,0xa66a45,0x7b4932,0x5a3528];
const camisas=[0x7e2f38,0x244f73,0x37664b,0xc47a32,0x5b477c,0xd4c2a3,0x33424f,0x9a4f63,0x3e6f83,0x75613e,0x202328,0xb38b5d,0x526b2f,0x6b3948,0x405d8c,0xc5c8c9,0x8d442f,0x2d716b];
const calcas=[0x1e293b,0x303236,0x51483f,0x2f4058,0x5b4f3d,0x22252a,0x6d665d,0x26354a,0x4b382f,0x414850];
const cabelos=[0x111214,0x2d1c16,0x5b3825,0x936b3f,0xc3a269,0x6f2d21,0x3b3029];
const acessorios=['bone','mochila','oculos','fones','bolsa','gorro','chapeu',null];
const personalidades=['Esportista','Executivo','Artista','Estudante','Turista','Músico','Trabalhador','Aventureiro','Fotógrafo','Universitário','Ciclista','Morador'];
function perfil(i){return{modelo:['homem','miniCivilA','mulher','miniCivilB','mulher2','miniCivilC'][i%6],acessorio:acessorios[(i*3)%acessorios.length],detalhe:camisas[(i*7+5)%camisas.length],nome:personalidades[i%personalidades.length]};}
function procurarCobertura(p,alvo){
  const origem=alvo.clone().setY(1.35);
  for(const raio of [6,10])for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+(raio*.17),c=new THREE.Vector3(p.x+Math.cos(a)*raio,0,p.z+Math.sin(a)*raio);
    if(colide(c.x,c.z,.48))continue;
    const linha=c.clone().setY(1.2).sub(origem),d=linha.length();
    if(distanciaLivre(origem,linha.normalize(),d)<d-1.15)return c;
  }
  return null;
}
export class NPC {
  constructor(scene, policia, fixo, cor, indice=0) {
    this.policia = policia; this.fixo = fixo; this.indice=indice;this.cacando = false; this.tt = 0; this.briga = 0; this.brigou = false;
    const visual=perfil(indice),policialEstilo=policia?{modelo:'miniPolicial',acessorio:'policia',detalhe:0x142b4a,nome:'Policial'}:visual;
    this.obj = criarHumano(cor ?? (policia ? 0x1e3a8a : camisas[(indice*5+3)%camisas.length]), peles[(indice*5+1)%peles.length], cabelos[(indice*3+2)%cabelos.length], policia?0x17243b:calcas[(indice*7+2)%calcas.length], fixo ? 'soldado' : 'npc',fixo?null:policialEstilo);
    if(policia)trocarArma(this.obj,indice%3===0?2:0);
    this.obj.scale.setScalar(R(.91, 1.09));this.obj.scale.x*=.94+((indice*7)%9)/100;this.escalaBase=this.obj.scale.x; scene.add(this.obj); this.reset();
  }
  reset(perto) {
    this.hp = 100;this.caido=0;this.missao=false;this.chefe=false;this.obj.visible=true;this.obj.rotation.z=0;this.obj.scale.setScalar(this.escalaBase); this.fuga = 0; this.cacando = false; this.briga = 0; this.dir = Math.random() < .5 ? 1 : -1; this.eixo = Math.random() < .5 ? 'x' : 'z';
    const rua = Math.round(R(-9, 9)) * 100 + 10, p = R(-900, 900);
    this.obj.position.set(this.eixo === 'z' ? rua : p, 0, this.eixo === 'z' ? p : rua);
    if (this.fixo) this.obj.position.set(9, 0, 50);
    if(perto&&!this.fixo){const via=Math.round(perto.x/100)*100+10;this.obj.position.set(via,0,perto.z+(Math.random()<.5?-1:1)*R(45,130));this.eixo='z';}
    this.parado=0;this.rotina=R(5,14);this.velAtual=0;this.memoria=0;this.ultimoAlvo=null;
    this.proximoTiro=R(.3,1);this.disparoPose=0;this.cobertura=null;this.coberturaTempo=0;this.buscarCobertura=R(1,4);this.ladoTatico=Math.random()<.5?-1:1;this.visaoCd=R(0,.18);this.visivelCache=false;
  }
  hostil(x, z,missao=false,chefe=false) { this.obj.position.set(x, 0, z);this.obj.visible=true;this.obj.rotation.z=0;this.caido=0;this.missao=missao;this.chefe=chefe;this.hp=chefe?450:100;if(chefe)this.obj.scale.setScalar(this.escalaBase*1.35); this.briga = chefe?180:60; this.fuga = 0; }
  morrer(){
    if(this.caido)return false;
    this.hp=0;this.caido=2.2;this.briga=this.fuga=0;this.cacando=false;this.velAtual=0;this.obj.userData.socoAte=0;return true;
  }
  // Retorna o dano causado ao jogador neste frame
  atualizar(dt, alvo, estrelas, furtivo=false) {
    this.tt += dt; const p = this.obj.position, dx = alvo.x - p.x, dz = alvo.z - p.z, d = Math.hypot(dx, dz) || 1;
    if(this.caido){this.caido-=dt;this.velAtual=0;this.obj.rotation.z+=(1.48-this.obj.rotation.z)*Math.min(1,dt*10);if(this.caido<=0)this.reset(alvo);return 0;}
    if(!this.fixo&&!this.missao&&d>240){this.reset(alvo);return 0;}
    const andar=(vx,vz,olharMovimento=true)=>{
      if(!colide(p.x+vx*dt,p.z,.3))p.x+=vx*dt;if(!colide(p.x,p.z+vz*dt,.3))p.z+=vz*dt;
      this.velAtual=Math.hypot(vx,vz);
      // A rotação vem da velocidade realmente aplicada. Isso elimina pedestres
      // andando de costas depois de virar uma esquina ou desviar de uma parede.
      if(olharMovimento&&this.velAtual>.08)this.obj.rotation.y=Math.atan2(-vx,-vz);
    };
    if (this.briga > 0) { // briga: persegue e bate
      this.briga -= dt; this.brigou = true; this.obj.rotation.y = Math.atan2(-dx, -dz);
      if (d > 1.6) { andar(dx/d*4.5,dz/d*4.5); return 0; }
      this.obj.userData.socoAte = this.tt + .25; return 6 * dt;
    }
    if (this.brigou) { this.brigou = false; if (!this.fixo) this.reset(); }
    if (this.fixo) { if (d < 8) this.obj.rotation.y = Math.atan2(-dx, -dz); return 0; }
    if (this.policia && estrelas > 0) {
      const origem=p.clone().setY(1.4),dir=new THREE.Vector3(dx,0,dz).normalize();
      this.visaoCd-=dt;
      if(d>80)this.visivelCache=false;
      else if(this.visaoCd<=0){this.visaoCd=.16+(this.indice%3)*.025;this.visivelCache=d<(furtivo?22:80)&&distanciaLivre(origem,dir,d)>=d-.6;}
      const ve=this.visivelCache;
      if(ve){this.ultimoAlvo=alvo.clone();this.memoria=12;}else this.memoria=Math.max(0,this.memoria-dt);
      if(!this.memoria){this.cacando=false;this.velAtual=0;this.disparoPose=0;return 0;}
      this.cacando=true;this.obj.rotation.y=Math.atan2(-dx,-dz);this.proximoTiro-=dt;this.buscarCobertura-=dt;this.disparoPose=Math.max(0,this.disparoPose-dt);
      if(this.buscarCobertura<=0&&d<45){this.cobertura=procurarCobertura(p,alvo);this.coberturaTempo=R(1.1,2.2);this.buscarCobertura=R(5,9);}
      if(this.cobertura){
        const vx=this.cobertura.x-p.x,vz=this.cobertura.z-p.z,l=Math.hypot(vx,vz)||1;
        if(l>.8)andar(vx/l*(5.2+estrelas*.25),vz/l*(5.2+estrelas*.25),false);
        else{this.velAtual=0;this.coberturaTempo-=dt;if(this.coberturaTempo<=0){this.cobertura=null;this.ladoTatico*=-1;}}
      }else if(d<10)andar(-dx/d*(5.2+estrelas*.2),-dz/d*(5.2+estrelas*.2),false);
      else if(d>30){const q=this.ultimoAlvo,vx=q.x-p.x,vz=q.z-p.z,l=Math.hypot(vx,vz)||1;andar(vx/l*(4.7+estrelas*.2),vz/l*(4.7+estrelas*.2),false);}
      else andar(-dz/d*this.ladoTatico*3.2,dx/d*this.ladoTatico*3.2,false);
      if(ve&&d>7&&d<45&&this.proximoTiro<=0){
        const a=p.clone().setY(1.35),b=alvo.clone().setY(1.12),chance=THREE.MathUtils.clamp(.72-d*.012+estrelas*.05-(furtivo?.08:0),.2,.84),acertou=Math.random()<chance;
        if(!acertou){b.x+=R(-2.2,2.2);b.z+=R(-2.2,2.2);}
        dispatchEvent(new CustomEvent('city-police-shot',{detail:{a,b,acertou}}));
        this.proximoTiro=Math.max(.45,1.15-estrelas*.09)+Math.random()*.35;this.disparoPose=.28;
        if(acertou)return 5+estrelas*1.3;
      }
      return 0;
    }
    if (this.cacando) this.reset();
    this.fuga = Math.max(0, this.fuga - dt);
    this.rotina-=dt;if(this.rotina<=0){this.parado=R(1,4);this.rotina=R(6,18);}
    if(this.parado>0 && this.fuga<=0){this.parado-=dt;this.velAtual=0;return 0;}
    const e = this.eixo, antes = Math.floor(p[e] / 100);
    const v=this.dir*(this.fuga>0?8:1.6);andar(e==='x'?v:0,e==='z'?v:0);
    if (p[e] > 950) this.dir = -1; else if (p[e] < -950) this.dir = 1;
    if (Math.floor(p[e] / 100) !== antes && Math.random() < .5) { p[e] = Math.round(p[e] / 100) * 100 + this.dir * 10; this.eixo = e === 'x' ? 'z' : 'x'; this.dir = Math.random() < .5 ? 1 : -1; }
    return 0;
  }
  atualizarVisualArma(){if(this.policia&&!this.caido&&this.obj.visible)atualizarArmaTerceiraPessoa(this.obj,this.disparoPose>0,false);}
}
export const criarNPCs = (scene, n = 30) => Array.from({ length: n }, (_, i) => new NPC(scene, i < 4,false,undefined,i));
export const criarOrganizador = scene => new NPC(scene, false, true, 0xff7a00);
