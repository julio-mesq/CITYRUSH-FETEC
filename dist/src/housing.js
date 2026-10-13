// Casas: modo construção por pontos, móveis persistentes e garagem por imóvel.
import * as THREE from 'three';
import { PONTOS as LAYOUT_PONTOS } from './casa-layout.js';
import { criarMovel } from './furniture.js';
import { CASAS } from './casas-catalogo.js';

const $=id=>document.getElementById(id);
export const CATALOGO=[
  {id:'sofa',nome:'Sofá moderno',preco:1800,tipo:'sofa',w:1.7,d:.9,h:.85},
  {id:'mesa',nome:'Mesa',preco:950,tipo:'mesaJantar',w:1.4,d:.85,h:.76},
  {id:'cadeira',nome:'Cadeira',preco:420,tipo:'cadeira',w:.5,d:.5,h:.9},
  {id:'estante',nome:'Estante',preco:1200,tipo:'estante',w:1.0,d:.36,h:1.9},
  {id:'planta',nome:'Planta decorativa',preco:350,tipo:'planta',w:.6,d:.6,h:1.25},
  {id:'computador',nome:'Computador',preco:2200,tipo:'estacaoPC',w:1.2,d:.65,h:1.1},
  {id:'abajur',nome:'Abajur',preco:280,tipo:'abajur',w:.4,d:.4,h:1.6},
  {id:'geladeira',nome:'Geladeira',preco:1600,tipo:'geladeira',w:.85,d:.8,h:1.85}
];
// Pontos livres validados em tests/house-layout.mjs (não colidem com móveis fixos, paredes, portas nem vaga do carro).
const PONTOS=LAYOUT_PONTOS;
const estado={moveis:CASAS.map(()=>[]),garagens:CASAS.map(()=>[])};
let grupoCasa,J,cb,casaAtual=0,selecionado='sofa',aberta=false,objetos=[];

function normalizar(item){return criarMovel(item.tipo,item.w,item.d,item.h);}
function limpar(){objetos.forEach(o=>grupoCasa.remove(o));objetos=[];}
export function mostrarCasa(indice){
  casaAtual=Math.max(0,Math.min(CASAS.length-1,indice|0));limpar();
  for(const m of estado.moveis[casaAtual]){
    const item=CATALOGO.find(c=>c.id===m.id);if(!item)continue;
    const p=PONTOS[m.slot];if(!p)continue;
    const o=normalizar(item);o.position.set(p[0],.14,p[1]);o.rotation.y=m.ry||0;o.userData.movelJogador=true;grupoCasa.add(o);objetos.push(o);
  }
  if(aberta)render();
}
const dinheiro=n=>'$'+Math.round(n).toLocaleString('pt-BR');
function render(){
  const moveis=estado.moveis[casaAtual],garagem=estado.garagens[casaAtual];
  $('casaPanel').innerHTML=`<div class="casaHead"><div><small>CASA ${casaAtual+1}</small><h2>Modo construção</h2></div><button data-casa="fechar">×</button></div>
  <div class="casaSaldo"><span>Saldo</span><b>${dinheiro(J.dinheiro)}</b></div>
  <section><h3>1. Escolha um móvel</h3><div class="casaGrid">${CATALOGO.map(c=>`<button class="${selecionado===c.id?'sel':''}" data-casa="item:${c.id}">${c.nome}<small>${dinheiro(c.preco)}</small></button>`).join('')}</div></section>
  <section><h3>2. Escolha uma posição</h3><div class="slots">${PONTOS.map((_,i)=>{const m=moveis.find(x=>x.slot===i);return `<button class="${m?'ocupado':''}" data-casa="slot:${i}">${i+1}${m?' · '+CATALOGO.find(c=>c.id===m.id)?.nome:''}</button>`}).join('')}</div></section>
  <div class="casaTools"><button data-casa="girar">Girar último móvel</button><button data-casa="remover">Vender último móvel</button></div>
  <section><h3>Garagem (${garagem.length}/4)</h3><p>${garagem.length?garagem.map(i=>cb.nomeVeiculo(i)).join(' · '):'Nenhum veículo guardado nesta casa.'}</p><div class="casaTools"><button data-casa="guardar">Guardar veículo da garagem</button>${garagem.map(i=>`<button data-casa="retirar:${i}">Retirar ${cb.nomeVeiculo(i)}</button>`).join('')}</div></section>
  <p class="casaAjuda">Os móveis ficam salvos nesta casa. Trocar um ponto ocupado vende o móvel anterior por 30% do preço.</p>`;
}
function colocar(slot){
  const item=CATALOGO.find(c=>c.id===selecionado),lista=estado.moveis[casaAtual];if(!item)return;
  const atual=lista.find(m=>m.slot===slot),credito=atual?Math.round((CATALOGO.find(c=>c.id===atual.id)?.preco||0)*.3):0,custo=item.preco-credito;
  if(J.dinheiro<custo)return cb.aviso('Dinheiro insuficiente para este móvel.');
  J.dinheiro-=custo;if(atual)lista.splice(lista.indexOf(atual),1);lista.push({id:item.id,slot,ry:0});mostrarCasa(casaAtual);cb.salvar();cb.aviso(item.nome+' colocado na casa.');
}
function agir(acao){
  const [tipo,v]=acao.split(':');
  if(tipo==='fechar')return alternar(false);
  if(tipo==='item'){selecionado=v;return render();}
  if(tipo==='slot')return colocar(+v);
  const lista=estado.moveis[casaAtual],ultimo=lista.at(-1);
  if(tipo==='girar'&&ultimo){ultimo.ry=((ultimo.ry||0)+Math.PI/2)%(Math.PI*2);mostrarCasa(casaAtual);cb.salvar();}
  else if(tipo==='remover'&&ultimo){const item=CATALOGO.find(c=>c.id===ultimo.id);J.dinheiro+=Math.round(item.preco*.3);lista.pop();mostrarCasa(casaAtual);cb.salvar();}
  else if(tipo==='guardar')cb.guardar(casaAtual);
  else if(tipo==='retirar')cb.retirar(casaAtual,+v);
}
export function iniciar(casa,jog,callbacks,salvo={}){
  grupoCasa=casa;J=jog;cb=callbacks;
  for(let i=0;i<CASAS.length;i++){estado.moveis[i]=Array.isArray(salvo.moveis?.[i])?salvo.moveis[i].slice(0,12):[];estado.garagens[i]=Array.isArray(salvo.garagens?.[i])?[...new Set(salvo.garagens[i])].slice(0,4):[];}
  $('casaPanel').onclick=e=>{const a=e.target.closest('[data-casa]')?.dataset.casa;if(a)agir(a);};
  return {mostrarCasa,alternar,dados,guardados,garagem:()=>estado.garagens[casaAtual]};
}
export function alternar(on=!aberta,indice=casaAtual){aberta=on;casaAtual=indice;$('casaPanel').classList.toggle('on',on);cb.aoAbrir(on);if(on){mostrarCasa(indice);render();}}
export const aberto=()=>aberta;
export const dados=()=>({moveis:estado.moveis.map(a=>a.map(x=>({...x}))),garagens:estado.garagens.map(a=>[...a])});
export const guardados=()=>estado.garagens.flat();
export function registrarGuardado(casa,modelo){const g=estado.garagens[casa];if(g.includes(modelo))return 'Este veículo já está guardado aqui.';if(g.length>=4)return 'A garagem desta casa está cheia.';g.push(modelo);render();cb.salvar();return '';}
export function removerGuardado(casa,modelo){const g=estado.garagens[casa],i=g.indexOf(modelo);if(i>=0)g.splice(i,1);render();cb.salvar();}
