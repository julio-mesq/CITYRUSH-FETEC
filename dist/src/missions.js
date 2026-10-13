// Campanha curta da Demo Pública + trabalhos opcionais do celular.
// A campanha começa somente quando o jogador a aceita no celular, deixando o
// início dentro da casa livre para exploração e escolha consciente da missão.
import * as THREE from 'three';
import { LUGARES } from './world.js';
import { ganhar } from './choices.js';

const BASE=[
  {t:'Entrega Expressa: leve seu carro da garagem até o mercado',lugar:'mercado',tipo:'carro',r:28,d:600,k:2},
  {t:'Corrida Urbana: atravesse todos os checkpoints',tipo:'rota',pontos:[[100,0],[100,-200],[-100,-200],[-100,0]],limite:90,d:1200,k:3,carro:10},
  {t:'Táxi: busque o passageiro e leve-o ao destino',tipo:'rota',pontos:[[0,100],[200,100]],limite:120,d:900,k:3,arma:1},
  {t:'Recuperação: encontre o veículo e leve-o à oficina',tipo:'rota',pontos:[[200,-100],[-500,0]],limite:140,d:1400,k:4,carro:13},
  {t:'Última fuga: escape da polícia e alcance o esconderijo',tipo:'fuga',x:0,z:-300,r:20,d:2500,k:8,arma:2}
];
const FALAS={
  trabalhador:['Marcos: A primeira entrega está pronta. Pegue o carro na garagem.','Rafa: Mostre que conhece as ruas e complete o circuito.','Zé: Um passageiro espera no primeiro ponto.','Marcos: Recupere o veículo e leve-o inteiro à oficina.','Central: Você foi identificado. Chegue ao esconderijo.'],
  criminoso:['Tony: Leve o pacote sem chamar atenção.','Tony: Vença o circuito e ganhe respeito.','Zé: O passageiro não pode se atrasar.','Tony: O carro marcado precisa voltar para a oficina.','Tony: A polícia chegou. Suma do mapa.'],
  policial:['Central: Entregue os documentos usando o veículo da garagem.','Central: Complete o treinamento de direção.','Central: Transporte a testemunha entre os pontos seguros.','Central: Recupere o veículo marcado.','Central: Treino de perseguição iniciado. Alcance a zona segura.'],
  executivo:['Assistente: A encomenda precisa chegar ao mercado.','Assistente: O evento de direção começou.','Assistente: Busque o cliente e leve-o à reunião.','Segurança: Recupere o veículo da empresa.','Segurança: Saia da perseguição e alcance o ponto seguro.']
};
const MULT={trabalhador:1,criminoso:1.2,policial:1.1,executivo:1.4};
let MISSOES=BASE.map(m=>({...m})),mult=1,i=0,mortes=0,extra=null,farol,hooks={},ativa=false,preparada='',tipoAtual='trabalhador',rotaEtapa=0,tempoRota=0;
const rnd=()=>Math.round((Math.random()*2-1)*3)*100;
const dest=()=>extra||MISSOES[i];
function coordenadas(m){
  if(!m)return null;
  if(m.tipo==='rota')return m.pontos?.[Math.min(rotaEtapa,m.pontos.length-1)]||null;
  return m.x===undefined?null:[m.x,m.z];
}
function chave(m){return(m===extra?'extra:':'demo:')+(m?.t||'fim');}
function posicionar(){const m=dest(),p=coordenadas(m);farol.visible=!!p;if(p)farol.position.set(p[0],40,p[1]);}
function preparar(){
  const m=dest();if(!ativa||!m||preparada===chave(m))return;
  preparada=chave(m);m.mortes=0;rotaEtapa=0;tempoRota=m.limite||0;
  if(m.tipo==='matar')hooks.spawnAlvos?.(m.n,false);
  if(m.tipo==='fuga')hooks.procurado?.(2);
  const fala=m===extra?'Contato: '+m.t:(FALAS[tipoAtual]?.[i]||m.t);hooks.dialogo?.(fala);
  posicionar();
}
export function iniciar(scene,tipo='trabalhador',callbacks={}){
  tipoAtual=tipo;hooks=callbacks;mult=MULT[tipo]||1;MISSOES=BASE.map(m=>({...m,pontos:m.pontos?.map(p=>[...p])}));
  for(const m of MISSOES)if(m.lugar){const l=LUGARES.find(k=>k.tipo===m.lugar);if(l){m.x=l.x;m.z=l.z;}}
  const oficina=LUGARES.find(k=>k.tipo==='oficina');if(oficina)MISSOES[3].pontos[1]=[oficina.x,oficina.z];
  farol=new THREE.Mesh(new THREE.CylinderGeometry(3,3,80,16,1,true),new THREE.MeshBasicMaterial({color:0xffcc00,transparent:true,opacity:.35,side:THREE.DoubleSide}));scene.add(farol);farol.visible=false;
}
export function ativar(){if(i>0&&i<MISSOES.length){ativa=true;preparar();}}
export function dar(tipo){
  if(tipo==='demo'){
    if(ativa&&i<MISSOES.length)return false;
    if(i>=MISSOES.length)i=0;
    ativa=true;extra=null;preparada='';preparar();return true;
  }
  if(extra)return false;
  const p=LUGARES.find(l=>l.tipo==='posto'),mk=LUGARES.find(l=>l.tipo==='mercado');
  const T={entrega:{t:'Entrega: leve um carro até o ponto',tipo:'carro',x:rnd(),z:rnd(),r:10,d:400},matar:{t:'Cobrança: elimine 4 alvos',tipo:'matar',n:4,d:700},posto:{t:'Encontre o informante no posto',tipo:'ir',x:p?.x||0,z:p?.z||100,r:28,d:300},fuga:{t:'Fuga: chegue ao ponto com 2 estrelas',tipo:'fuga',x:rnd(),z:rnd(),r:12,d:1200},taxi:{t:'Táxi: leve o passageiro de carro',tipo:'carro',x:rnd(),z:rnd(),r:12,d:350},mercado:{t:'Encomenda: vá ao mercado',tipo:'ir',x:mk?.x||100,z:mk?.z||0,r:28,d:250}};
  if(!T[tipo])return false;extra={...T[tipo],d:Math.round(T[tipo].d*mult),mortes:0};ativa=true;preparada='';preparar();return true;
}
export const matou=(alvoMissao=false)=>{if(!alvoMissao)return;if(extra?.tipo==='matar')extra.mortes++;else if(!extra&&MISSOES[i]?.tipo==='matar')mortes++;};
export const atual=()=>{const m=dest(),p=coordenadas(m);return m&&p?{...m,x:p[0],z:p[1]}:m;};
export function texto(jog){
  if(!ativa)return 'DEMO PÚBLICA: abra o celular (T) e aceite a campanha em Contatos';
  const m=dest();if(!m)return 'Demo Pública concluída — explore, compre e personalize a cidade';
  const p=jog.veiculo?jog.veiculo.obj.position:jog.obj.position,q=coordenadas(m),dist=q?Math.round(Math.hypot(p.x-q[0],p.z-q[1])):0;
  const rota=m.tipo==='rota'?` · checkpoint ${Math.min(rotaEtapa+1,m.pontos.length)}/${m.pontos.length} · ${Math.max(0,Math.ceil(tempoRota))} s`:'';
  const abates=m.tipo==='matar'?` (${m===extra?extra.mortes:mortes}/${m.n})`:'';
  return(m===extra?'TRABALHO: ':'DEMO '+(i+1)+'/5: ')+m.t+abates+rota+(q?` · GPS ${dist} m`:'');
}
export function atualizar(jog,est,dt=.016){
  if(!ativa)return null;const m=dest();if(!m)return null;
  const p=jog.veiculo?jog.veiculo.obj.position:jog.obj.position,q=coordenadas(m),perto=q&&Math.hypot(p.x-q[0],p.z-q[1])<(m.r||12);let ok=false;
  if(m.tipo==='rota'){
    tempoRota-=dt;
    if(tempoRota<=0){rotaEtapa=0;tempoRota=m.limite;posicionar();hooks.aviso?.('Tempo encerrado. A rota foi reiniciada.');return null;}
    if(perto&&jog.veiculo){rotaEtapa++;if(rotaEtapa>=m.pontos.length)ok=true;else{posicionar();hooks.aviso?.('Checkpoint '+(rotaEtapa+1)+' de '+m.pontos.length);}}
  }else if(m.tipo==='ir')ok=perto;
  else if(m.tipo==='carro')ok=perto&&!!jog.veiculo;
  else if(m.tipo==='fuga')ok=perto&&!!jog.veiculo&&est>=1;
  else if(m.tipo==='matar')ok=(m===extra?extra.mortes:mortes)>=m.n;
  if(!ok)return null;
  jog.dinheiro+=m.d;if(m.k)ganhar(m.k);const eraExtra=m===extra;
  if(eraExtra)extra=null;else{i++;mortes=0;}
  preparada='';const fim=!eraExtra&&!MISSOES[i];if(!fim)preparar();else farol.visible=false;
  return{recompensa:m.d,arma:m.arma,carro:m.carro,fim,historia:!eraExtra};
}
export const indice=()=>i;
export const definir=v=>{i=Math.max(0,Math.min(Number(v)||0,MISSOES.length));preparada='';};
