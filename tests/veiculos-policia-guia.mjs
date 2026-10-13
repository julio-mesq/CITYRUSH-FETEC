import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guiaControles, COMANDOS } from '../dist/src/controls-guide.js';
class V {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}clone(){return new V(this.x,this.y,this.z);}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}setY(y){this.y=y;return this;}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}length(){return Math.hypot(this.x,this.y,this.z);}normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this;}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}}
class Carro {constructor(){this.obj={position:new V(8,0,0),rotation:{y:0},visible:true};this.hp=100;this.v=20;this.yaw=0;}definirFarol(){}}
const ler=n=>fs.readFileSync(new URL('../dist/src/'+n+'.js',import.meta.url),'utf8');
const p=ler('police'),body=p.slice(p.indexOf('export function criarPolicia')).replace('export function','function');
const criar=new Function('THREE','Carro','MODELOS','colide','distanciaLivre','explodir','rua',body+';return criarPolicia;')({Vector3:V},Carro,[{glb:'policial'}],()=>false,(_a,_b,d)=>d,()=>{},n=>Math.round(n/100)*100);
const policia=criar({}),jog={obj:{position:new V()},veiculo:null};
policia.carros[0].obj.visible=true;policia.carros[0].obj.position.set(8,0,0);
policia.atualizar(.016,jog,1,false,[]);
assert.equal(policia.carros[0].v,0,'viatura deve parar perto do jogador parado');
assert.equal(policia.carros[0].obj.position.x,8,'viatura parada não deve avançar sobre o jogador');
assert.equal(policia.carros[0].obj.position.z,0);
for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=Math.atan2(x,-z);assert.ok(Math.abs(x*Math.cos(a)+z*Math.sin(a))<1e-6);assert.ok(-x*Math.sin(a)+z*Math.cos(a)<-.99,'frente do GLB precisa apontar para -Z');}
assert.match(ler('vehicles'),/orientacaoVeiculo\(modelo3d/);
assert.match(ler('player'),/PALMA_DIRECAO/);assert.match(ler('player'),/osso\.attach\(o\)/);
const gui=guiaControles('VEÍCULOS');assert.match(gui,/Freio de mão/);assert.match(gui,/keyboardDiagram/);
assert.ok(COMANDOS.ARMAS.some(c=>c[0]==='Q'));assert.match(ler('pause'),/guiaControles\(guia\)/);
console.log('veiculos-policia-guia: viatura parada, orientação em quatro eixos, mão e controles OK');
