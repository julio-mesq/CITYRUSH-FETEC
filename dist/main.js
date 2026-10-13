// City Rush — ponto de entrada: liga todos os módulos e roda o loop do jogo.
import { iniciarOffline, online, iniciarLinkCelular, linkPublico } from './src/offline.js';
import { criarLuzesDinamicas } from './src/luzes.js';
import * as THREE from 'three';
import { criarMundo, LUGARES, INT, colide, distanciaLivre } from './src/world.js';
import { criarDecoracoes } from './src/decor.js';
import { saidaCasa } from './src/casas-catalogo.js';
import { Jogador, teclas, animar, trocarArma, pontaDaArma, atualizarArmaTerceiraPessoa, aplicarAparencia, K2, habilitarControles, limparControles, digitando } from './src/player.js';
import { Carro, MODELOS } from './src/vehicles.js';
import { criarNPCs, criarOrganizador } from './src/npcs.js';
import { ARMAS, ICONES_ARMA, FORMAS } from './src/weapons.js';
import { criarMaosGLB } from './src/fps-hands.js';
import { criarVisualArma } from './src/weapon-models.js';
import * as Assets from './src/assets.js';
import * as A from './src/audio.js';
import * as UI from './src/ui.js';
import * as Esc from './src/choices.js';
import { atualizarCamera } from './src/pov.js';
import * as FX from './src/effects.js';
import * as M from './src/missions.js';
import * as Tel from './src/phone.js';
import * as DB from './src/db.js';
import * as MG from './src/minigames.js';
import * as TR from './src/traffic.js';
import { criarInterior } from './src/interiors.js';
import { criarClima } from './src/weather.js';
import * as Crt from './src/creator.js';
import { detectarMobile, iniciarControlesMobile } from './src/mobile.js';
import { prepararGraficos } from './src/graphics.js';
import * as Oficina from './src/workshop.js';
import * as Online from './src/multiplayer.js';
import { Arsenal, receberDano } from './src/combat.js';
import { criarPolicia } from './src/police.js';
import * as Moradia from './src/housing.js';
import * as Prog from './src/progression.js';
import * as Conq from './src/achievements.js';
import * as Pause from './src/pause.js';
iniciarLinkCelular((t)=>UI.notificar(t)); // botão LINK PARA CELULAR (UI é definido logo abaixo; só é usado ao clicar)
// O cache offline começa depois da preparação do jogo, sem disputar a carga inicial.

const cv = document.getElementById('c'), $ = id => document.getElementById(id);
const mobile = detectarMobile();
document.body.classList.toggle('mobile', mobile);
const inicioCarga=performance.now(),esperarCarrossel=()=>new Promise(r=>setTimeout(r,Math.max(0,5000-(performance.now()-inicioCarga))));
const passo = async (p, t) => { $('cb').style.width = p + '%'; $('ct').textContent = t; await new Promise(r => setTimeout(r, 40)); }; // tela de carregamento
await passo(5, 'Abrindo banco de dados…'); await DB.abrir(); const save = await DB.ler() || {};Prog.carregar(save.progressao);Conq.carregar(save.conquistas);
const arsenal = new Arsenal(ARMAS,save.arsenal);

// Criação de personagem: só aparece se não houver personagem salvo (primeira vez)
const novoJogador = !save.personagem;
let personagem = save.personagem;
if (!personagem) { await esperarCarrossel(); $('carga').classList.add('off'); personagem = await Crt.escolher(); $('carga').classList.remove('off'); }

await passo(15, 'Carregando veículos e personagens…');
await Assets.carregarEssenciais(f => { $('cb').style.width = (15 + f * 20) + '%'; });
let iniciarExtras;const extrasEmSegundoPlano=new Promise(r=>{iniciarExtras=()=>Assets.carregarExtras(null,mobile).then(r);}); // prédios e detalhes continuam baixando sem prender a entrada

const memoria=navigator.deviceMemory||4;
const fraco = mobile || (navigator.hardwareConcurrency || 4) <= 4 || memoria<=4; // celular/notebook básico recebe perfil leve
const config=Object.assign({qualidade:fraco?'baixa':'media',sensibilidade:1,volume:.6},save.config||{});
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !fraco });
renderer.setPixelRatio(config.qualidade==='baixa'?1:config.qualidade==='media'?Math.min(devicePixelRatio,1.15):Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = config.qualidade!=='baixa'&&!fraco; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; // atualizada a cada 2 quadros no loop (metade do custo de sombras)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); scene.fog = new THREE.Fog(0x87ceeb, 150, fraco ? 500 : 900);
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 1500), cam2 = new THREE.PerspectiveCamera(70, 1, .1, 1500); scene.add(cam);
const cinema = prepararGraficos(renderer, scene, cam, fraco,config.qualidade);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cinema?.resize(innerWidth, innerHeight); });

await passo(40, 'Construindo a cidade…');
const luzes = criarLuzesDinamicas(scene, fraco ? 2 : 4); // postes à noite + lâmpadas de interiores (conjunto fixo)
const ceu = criarMundo(scene, fraco, luzes), interior = criarInterior(scene, fraco, luzes);
// Luzes dinâmicas FIXAS: nunca são criadas, ligadas ou desligadas durante o jogo.
// Mudar a quantidade de luzes da cena obriga o Three.js a recompilar todos os
// materiais, e era isso que congelava o jogo ao entrar em carros e prédios.
const farolGlobal = new THREE.SpotLight(0xd9edff, 0, 42, .46, .68, 1.45); scene.add(farolGlobal, farolGlobal.target);
const neonGlobal = fraco ? null : new THREE.PointLight(0x00e5ff, 0, 5.5, 2); if (neonGlobal) scene.add(neonGlobal);
let decoracao = null;
extrasEmSegundoPlano.then(async()=>{try{decoracao=await criarDecoracoes(scene,fraco);if(renderer.compileAsync)renderer.compileAsync(scene,cam).catch(()=>{});UI.notificar('Detalhes da cidade carregados.');}catch(e){console.error('[decor] falhou ao criar decoração extra, seguindo sem ela:',e);}}); // prédios e objetos chegam sem travar a tela inicial
await passo(65, 'Criando pessoas, trânsito e aviões…');
const jog = new Jogador(scene, { cor: personagem.camisa, pele: personagem.pele, cabelo: personagem.cabelo, calca: personagem.calca }), jog2 = new Jogador(scene, { k: K2, cor: 0xb03a2e, x: 9 }), npcs = criarNPCs(scene, fraco ? 14 : 24), org = criarOrganizador(scene);
jog2.obj.visible = false;
FX.iniciar(scene);M.iniciar(scene,personagem.tipo,{dialogo:t=>Esc.abrir(t,[{t:'Continuar'}]),spawnAlvos:criarAlvosMissao,aviso:UI.notificar,procurado:n=>{estrelas=Math.max(estrelas,n);semCrime=0;}}); MG.iniciar(scene);
const clima = criarClima(scene), sem = TR.criarSemaforos(scene), av = TR.criarAvioes(scene), transito = Array.from({ length: fraco ? 7 : 12 }, (_, i) => new TR.Transito(scene, i));
const policia=criarPolicia(scene);
{ // placa do organizador de mini-jogos
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#000a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#ffcc00'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('MINI-JOGOS [G]', 128, 42);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide })); s.position.set(0, 2.3, 0); org.obj.add(s);
}
const customizacoes = save.custom || {};
const carros = Array.from({ length: MODELOS.length }, (_, i) => { // um de cada modelo (inclui os 6 novos do City Pack: índices 13-18)
  const h = i % 2, rua = (i % 5 - 2) * 100, livre = (Math.random() - .5) * 400;
  const idx = i === 0 ? 1 : i, c = i === 0 ? new Carro(scene, 0, 32, MODELOS[idx], 0) : new Carro(scene, h ? livre : rua, h ? rua : livre, MODELOS[idx], h * Math.PI / 2);
  c.indiceModelo = idx; if (customizacoes[idx]) c.aplicarCustomizacao(customizacoes[idx]); return c;
});
const ossosCondutor = ['Hips', 'Chest', 'UpperLeg.L', 'UpperLeg.R', 'LowerLeg.L', 'LowerLeg.R', 'Foot.L', 'Foot.R', 'UpperArm.L', 'UpperArm.R', 'LowerArm.L', 'LowerArm.R'];
const transformacoesOriginais = new Map();
function posarCondutor(c) {
  const modelo = jog.obj;
  const tipo=c.tipoCondutor;
  const pose = tipo==='bike'?{
    Hips:{x:.08,py:-.0018},Chest:{x:.24},
    'UpperLeg.L':{x:-1.18,z:.05},'UpperLeg.R':{x:-1.18,z:-.05},'LowerLeg.L':{x:1.36},'LowerLeg.R':{x:1.36},'Foot.L':{x:-.24},'Foot.R':{x:-.24},
    'UpperArm.L':{x:-1.24,z:-.2},'UpperArm.R':{x:-1.24,z:.2},'LowerArm.L':{x:-.54},'LowerArm.R':{x:-.54}
  }:tipo==='moto'?{
    Hips: { x: .16, py: -.0018 }, Chest: { x: .2 },
    'UpperLeg.L': { x: -1.38, z: .08 }, 'UpperLeg.R': { x: -1.38, z: -.08 },
    'LowerLeg.L': { x: 1.62 }, 'LowerLeg.R': { x: 1.62 }, 'Foot.L': { x: -.34 }, 'Foot.R': { x: -.34 },
    'UpperArm.L': { x: -1.18, z: -.18 }, 'UpperArm.R': { x: -1.18, z: .18 },
    'LowerArm.L': { x: -.62 }, 'LowerArm.R': { x: -.62 }
  } : {
    Hips: { x: .1, py: -.0015 }, Chest: { x: .08 },
    'UpperLeg.L': { x: -1.28, z: .06 }, 'UpperLeg.R': { x: -1.28, z: -.06 },
    'LowerLeg.L': { x: 1.5 }, 'LowerLeg.R': { x: 1.5 }, 'Foot.L': { x: -.24 }, 'Foot.R': { x: -.24 },
    'UpperArm.L': { x: -.92, z: -.12 }, 'UpperArm.R': { x: -.92, z: .12 },
    'LowerArm.L': { x: -.55 }, 'LowerArm.R': { x: -.55 }
  };
  ossosCondutor.forEach(nome => {
    const osso = modelo.getObjectByName(nome);
    if (!osso) return;
    if (!transformacoesOriginais.has(nome)) transformacoesOriginais.set(nome, {
      x: osso.rotation.x, y: osso.rotation.y, z: osso.rotation.z,
      px: osso.position.x, py: osso.position.y, pz: osso.position.z
    });
    const base = transformacoesOriginais.get(nome), a = pose[nome] || {};
    osso.rotation.set(base.x + (a.x || 0), base.y + (a.y || 0), base.z + (a.z || 0));
    osso.position.set(base.px + (a.px || 0), base.py + (a.py || 0), base.pz + (a.pz || 0));
  });
  modelo.userData.poseCondutor=new Map(ossosCondutor.map(nome=>{const o=modelo.getObjectByName(nome);return[nome,o?{x:o.rotation.x,y:o.rotation.y,z:o.rotation.z}:null];}));
  modelo.userData.tipoCondutor=tipo;modelo.userData.pedal=0;
  modelo.updateMatrixWorld(true);
}
function atualizarPoseCondutor(c,dt){
  const pose=jog.obj.userData.poseCondutor;if(!pose)return;
  const ajustar=(nome,dx=0,dy=0,dz=0)=>{const o=jog.obj.getObjectByName(nome),b=pose.get(nome);if(o&&b)o.rotation.set(b.x+dx,b.y+dy,b.z+dz);};
  const volante=c.volante||0,tipo=c.tipoCondutor;
  if(tipo==='carro'){
    ajustar('UpperArm.L',0,0,-volante*.12);ajustar('UpperArm.R',0,0,-volante*.12);ajustar('LowerArm.L',0,volante*.18);ajustar('LowerArm.R',0,volante*.18);ajustar('Chest',0,0,-volante*.035);
  }else{
    ajustar('UpperArm.L',0,volante*.16,0);ajustar('UpperArm.R',0,volante*.16,0);ajustar('Chest',0,0,c.obj.rotation.z*.28);
    if(tipo==='bike'){
      jog.obj.userData.pedal+=Math.abs(c.v)*dt*2.8;const p=Math.sin(jog.obj.userData.pedal)*.38;
      ajustar('UpperLeg.L',p);ajustar('UpperLeg.R',-p);ajustar('LowerLeg.L',-p*.7);ajustar('LowerLeg.R',p*.7);
    }
  }
  jog.obj.updateMatrixWorld(true);
}
function liberarCondutor() {
  ossosCondutor.forEach(nome => {
    const osso = jog.obj.getObjectByName(nome);
    const base = transformacoesOriginais.get(nome);
    if (osso && base) { osso.rotation.set(base.x, base.y, base.z); osso.position.set(base.px, base.py, base.pz); }
  });
  const u = jog.obj.userData;
  u.poseCondutor=null;u.tipoCondutor=null;u.acoes?.idle?.reset().play(); u.animAtual = 'idle';
}
// Transição exclusiva dos veículos: aproximar, abrir, entrar/montar e fechar.
let transicaoVeiculo=null;
function iniciarEntradaVeiculo(c){
  if(transicaoVeiculo||c.destruido||c.guardado)return;
  c.v=0;jog.vx=jog.vz=0;jog.mira=false;
  const u=jog.obj.userData;u.mixer?.stopAllAction();u.acoes?.idle?.reset().play();u.mixer?.update(0);
  posarCondutor(c);const sentada=new Map();
  for(const nome of ossosCondutor){const o=jog.obj.getObjectByName(nome);if(o)sentada.set(nome,o.quaternion.clone());}
  liberarCondutor();u.mixer?.stopAllAction();
  const emPe=new Map();for(const nome of ossosCondutor){const o=jog.obj.getObjectByName(nome);if(o)emPe.set(nome,o.quaternion.clone());}
  c.obj.updateMatrixWorld(true);
  const banco=new THREE.Vector3();c.encaixeCondutor.getWorldPosition(banco);
  const lado=c.obj.localToWorld(new THREE.Vector3((c.ladoCondutor||-1)*(c.m.w*.5+.55),0,c.m.portaFrente!==undefined?(c.m.portaFrente+c.m.portaTras)/2:-c.m.l*.08));
  transicaoVeiculo={c,t:0,inicio:jog.obj.position.clone(),lado,banco,sentada,emPe,povAnterior:pov};pov=0;
}
function atualizarEntradaVeiculo(dt){
  const a=transicaoVeiculo;if(!a)return;const c=a.c;a.t+=dt;
  if(c.destruido||jog.morto){c.portaAbertura=0;transicaoVeiculo=null;liberarCondutor();jog.obj.scale.setScalar(1);pov=a.povAnterior;return;}
  const duracao=c.duasRodas?1.35:1.65,p=Math.min(1,a.t/duracao),suave=x=>x*x*(3-2*x),aproxima=suave(Math.min(1,p/.28)),senta=suave(Math.max(0,Math.min(1,(p-.35)/.48)));
  jog.obj.position.copy(a.inicio).lerp(a.lado,aproxima).lerp(a.banco,senta);
  jog.obj.scale.setScalar(1+(c.encaixeCondutor.userData.escala-1)*senta);jog.obj.rotation.y=c.yaw;jog.obj.visible=true;
  for(const [nome,q] of a.emPe){const o=jog.obj.getObjectByName(nome);o.quaternion.copy(q).slerp(a.sentada.get(nome),senta);}
  if(c.duasRodas){const perna=jog.obj.getObjectByName('UpperLeg.R');if(perna)perna.rotateZ(-Math.sin(Math.PI*senta)*.9);}
  else{c.portaAbertura=p<.28?suave(p/.28):p>.83?1-suave((p-.83)/.17):1;const braco=jog.obj.getObjectByName('UpperArm.R');if(braco&&p<.45)braco.rotateX(-Math.sin(Math.PI*Math.min(1,p/.45))*.85);}
  jog.obj.updateMatrixWorld(true);
  if(p>=1){c.portaAbertura=0;jog.veiculo=c;ultimoVeiculo=c;jog.olho=0;posarCondutor(c);pov=a.povAnterior;transicaoVeiculo=null;}
}
const frota = new Map(); // carros comprados (garagem)
function chamar(i) {
  let c = frota.get(i); const p = jog.obj.position;
  if(c?.guardado)return UI.notificar('Este veículo está guardado em uma casa. Retire-o pelo modo construção (B).');
  if (!c) { c = new Carro(scene, p.x + 4, p.z + 4, MODELOS[i], jog.yaw); c.indiceModelo = i; if (customizacoes[i]) c.aplicarCustomizacao(customizacoes[i]); frota.set(i, c); carros.push(c); } else { c.obj.visible=true;c.obj.position.set(p.x + 4, 0, p.z + 4); c.hp = 100; c.v = 0; }
  UI.notificar('Seu ' + c.nome + ' chegou!');
}
const fp = new THREE.Group(); cam.add(fp); // arma visível na primeira pessoa
let fpMuzzle = null;
// Primeira pessoa: arma e braços em escala de FPS (a arma ocupa ~20% da altura da tela).
// Fator único de tamanho da arma/braços em primeira pessoa (celular e computador).
// v29 usava 1.0 (arma pequena na tela). Aumente/diminua aqui se quiser ajustar.
const FP_ESCALA=1.34,FP_AFASTA=1.08;
const _fp=(lista,mira)=>lista.map(o=>({x:o.x*FP_AFASTA,y:o.y*(mira?1.04:1.12),z:o.z*(mira?1.02:1.06),s:o.s*FP_ESCALA}));
const FP_MIRA=_fp([
  {x:0,y:-.15,z:-.46,s:.78},{x:0,y:-.17,z:-.5,s:.56},{x:0,y:-.18,z:-.52,s:.52},
  {x:0,y:-.18,z:-.54,s:.52},{x:0,y:-.18,z:-.56,s:.46},{x:.12,y:-.22,z:-.6,s:.44}
],true),FP_QUADRIL=_fp([
  {x:.2,y:-.17,z:-.5,s:.78},{x:.21,y:-.19,z:-.55,s:.56},{x:.22,y:-.2,z:-.6,s:.52},
  {x:.22,y:-.2,z:-.62,s:.52},{x:.23,y:-.2,z:-.64,s:.46},{x:.24,y:-.24,z:-.66,s:.46}
],false);
let maosGLB=null;
function bracosFP(i){
  const g=new THREE.Group(),matPele=new THREE.MeshStandardMaterial({color:personagem.pele??0xd9a376,roughness:.82}),matManga=new THREE.MeshStandardMaterial({color:personagem.camisa??0x243b55,roughness:.88});
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const segmento=(a,b,r,mat)=>{const v=b.clone().sub(a),l=v.length(),o=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.01,l-r*2),5,10),mat);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=false;g.add(o);return o;};
  const elipse=(p,r,sx,sy,sz,mat)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat);o.position.copy(p);o.scale.set(sx,sy,sz);o.castShadow=false;g.add(o);return o;};
  // Braço: manga até perto do punho (a pele só aparece no punho e na mão).
  const braco=(ombro,cot,mao)=>{const p=cot.clone().lerp(mao,.9);segmento(ombro,cot,.053,matManga);segmento(cot,p,.048,matManga);segmento(p,mao,.032,matPele);};
  const comp=FORMAS[i]?.[2]||.3,maoD=V(0,0,.015),maoE=i===0?V(-.045,-.03,.03):V(0,-.03,-comp*.42);
  braco(V(.36,-.58,.8),V(.31,-.4,.44),maoD);
  braco(V(-.38,-.58,.78),V(-.33,-.4,.42),maoE);
  // Mão direita na empunhadura (com polegar) e mão esquerda de apoio.
  elipse(V(0,.004,0),.04,1,.95,1.45,matPele);segmento(V(-.032,.03,.035),V(-.034,.034,-.045),.013,matPele);
  elipse(maoE,.04,1,.9,1.35,matPele);if(i!==0)segmento(V(.03,.012,maoE.z+.03),V(.034,.018,maoE.z-.045),.013,matPele);
  return g;
}
function armaFP(i) {
  fp.clear(); fpMuzzle = null; maosGLB=null;
  const visual = criarVisualArma(i); if (!visual) return;
  visual.traverse(n => { if (n.isMesh) { n.frustumCulled = false; n.castShadow = false; } });
  maosGLB=criarMaosGLB(i,FORMAS[i]?.[2]||.3);fp.add(visual,maosGLB||bracosFP(i)); fpMuzzle = visual.userData.muzzle;
}
armaFP(0);

await passo(85, 'Carregando seu progresso…');
jog.dinheiro = save.dinheiro ?? personagem.dinheiro ?? 500; jog.colete = save.colete ?? 100; Tel.carregar(save.tel); if(!Tel.dados().garagem.length)Tel.adicionarCarro(0); M.definir(save.missao || 0);
Esc.carregar(save.karma || { karma: personagem.karma || 0, hist: [] });
if (novoJogador && personagem.casa != null) Tel.definirInicial(personagem.casa); // casa de brinde escolhida na criação do personagem
$('uname').textContent = personagem.nome + ' · ' + personagem.tipoNome;
$('menu').querySelector('p').textContent = 'Bem-vindo(a), ' + personagem.nome + '! Escolha como jogar';
if (mobile) $('controles').textContent = 'Use o controle redondo para se mover. Arraste o lado direito para olhar. Os botões mudam automaticamente ao entrar em um veículo.';
const rec = { corrida: save.corrida || 0, kills: save.kills || 0 };
let apagando = false;
let moradia=null;
const gravar = () => { if (!apagando) DB.gravar({ dinheiro: jog.dinheiro, tel: Tel.dados(), missao: M.indice(), karma: Esc.estado, corrida: rec.corrida, kills: rec.kills, personagem, custom: customizacoes, arsenal: arsenal.dados(), colete:jog.colete, moradia:moradia?.dados()||save.moradia,progressao:Prog.dados(),config,conquistas:Conq.dados() }); };
setInterval(gravar, 8000); addEventListener('beforeunload', () => { gravar(); Online.sair(); });
Tel.dados().garagem.forEach(i => { const c = new Carro(scene, 4 + (i % 4) * 5, 45 + i * 5, MODELOS[i], 0); c.indiceModelo = i; if (customizacoes[i]) c.aplicarCustomizacao(customizacoes[i]); frota.set(i, c); carros.push(c); }); // carros comprados aparecem perto do início

let rodando = false, telaAberta = false, pov = 0, povAntes = 0, estrelas = 0, semCrime = 0, arma = 0, tiroT = 0, tempoDia = .25, tempoJogo = 0, buf = '', passoT = 0, lento = 0, reduzido = false, crime = 0, semMouse = 0, split = false, cool2 = 0, saida = null, ultimoVeiculo = null,conqT=0,uiT=1,mapT=1;
let armaHudEstado='';
const municao = arsenal.carregador;
let veiculoPainel = null;
function atualizarPainel(c) {
  const painel = $('vehicleHud'); painel.classList.toggle('on', !!c); if (!c) { veiculoPainel = null; return; }
  if (veiculoPainel !== c) { veiculoPainel = c; $('dashName').textContent = c.nome.toUpperCase(); }
  const kmh = Math.round(Math.abs(c.v) * 3.6), limite = c.vmaxBase * (1 + c.tuning.motor * .1 + (c.tuning.turbo ? .13 : 0)) * 3.6;
  $('dashSpeed').textContent = kmh; $('dashGear').textContent = c.marcha; $('dashRpm').textContent = Math.round(c.rpm / 100) * 100 + ' rpm'; $('dashHp').textContent = 'CARRO ' + Math.max(0, c.hp | 0) + '%';
  painel.style.setProperty('--speed', Math.min(100, kmh / Math.max(1, limite) * 100).toFixed(1));
}
jog.aoRenascer = () => { INT.on = false; UI.wasted(false); UI.notificar('Você foi levado ao hospital (-10% do dinheiro)'); };
function iniciarJogo(t) { const r = MG.comecar(t, jog); UI.notificar(r || (t === 'corrida' ? 'Corrida! Passe pelos 6 pontos em 90 s' : 'Sobreviva por 60 s!')); }
const aoAbrirTela = on => { telaAberta = on; habilitarControles(!on&&rodando); jog.mira=false; if (!mobile) { if (on) document.exitPointerLock(); else cv.requestPointerLock?.()?.catch?.(()=>{}); } };
let rodaAberta = false;
function atualizarRoda() {
  const slots = $('weaponSlots'); slots.replaceChildren();
  ARMAS.forEach((a, i) => {
    const liberada = Tel.temArma(i), b = document.createElement('button');
    b.className = 'weaponSlot' + (i === arma ? ' sel' : '') + (liberada ? '' : ' locked');
    const ang=i*360/ARMAS.length;b.style.setProperty('--a',ang+'deg');b.style.setProperty('--na',-ang+'deg'); b.dataset.weapon = i;
    const conteudo=document.createElement('span'),icone = document.createElement('b'), nome = document.createElement('span'), ammo = document.createElement('small');
    conteudo.className='slotContent';icone.className='weaponArt weapon-'+i;icone.textContent = i===6?'✊':''; nome.textContent = (i + 1) + ' · ' + a.n;
    ammo.textContent = liberada ? (a.melee ? 'corpo a corpo' : municao[i] + ' / ' + arsenal.reserva[i]) : 'bloqueada';
    conteudo.append(icone,nome,ammo);b.append(conteudo);b.onmouseenter=()=>{$('wheelWeaponName').textContent=a.n.toUpperCase();$('wheelWeaponAmmo').textContent=liberada?(a.melee?'CORPO A CORPO':municao[i]+' / '+arsenal.reserva[i]):'BLOQUEADA';}; b.onclick = () => { if (liberada) { equiparArma(i); fecharRoda(); } else UI.notificar('Compre ou desbloqueie esta arma primeiro.'); };
    slots.append(b);
  });
  $('wheelWeaponName').textContent=ARMAS[arma].n.toUpperCase();$('wheelWeaponAmmo').textContent=ARMAS[arma].melee?'CORPO A CORPO':municao[arma]+' / '+arsenal.reserva[arma];
}
function abrirRoda() { if (jog.veiculo || jog.morto) return; rodaAberta = true; atualizarRoda(); $('weaponWheel').classList.add('on'); aoAbrirTela(true); }
function fecharRoda() { if (!rodaAberta) return; rodaAberta = false; $('weaponWheel').classList.remove('on'); aoAbrirTela(false); }
function equiparArma(i) {
  if (!Tel.temArma(i)) return false;
  arma = i; trocarArma(jog.obj, i); armaFP(i); atualizarRoda(); A.click(); return true;
}
Esc.configurar(aoAbrirTela);
// Resolução dinâmica: se o aparelho não sustenta a taxa de quadros, a resolução cai em degraus pequenos
// (e volta quando sobra folga) em vez de o jogo travar ou pular direto para a qualidade mínima.
const prDaQualidade=q=>q==='baixa'?1:q==='media'?Math.min(devicePixelRatio,1.15):Math.min(devicePixelRatio,1.5);
let prMax=prDaQualidade(config.qualidade),prAtual=prMax,msMedio=16,resT=0,resEspera=0,resNoMinimo=0,sombrasDesligadas=false;
function definirResolucao(pr){prAtual=pr;renderer.setPixelRatio(pr);cinema?.escala(pr);}
function aplicarQualidade(q,auto=false){config.qualidade=q;prMax=prDaQualidade(q);prAtual=prMax;renderer.setPixelRatio(prMax);if(!auto&&!fraco&&!sombrasDesligadas)renderer.shadowMap.enabled=q!=='baixa';clima.reduzir(q==='baixa'?300:q==='media'?520:750);cinema?.qualidade(q);cinema?.resize(innerWidth,innerHeight);cinema?.escala(prMax);gravar();}
Pause.iniciar(config,{aoAbrir:aoAbrirTela,qualidade:aplicarQualidade,volume:A.volume,salvar:gravar,conquistas:Conq.lista});
function retirarDaGaragem(casaIdx,modelo){
  let c=frota.get(modelo);if(!c){c=new Carro(scene,INT.x-7,INT.z+INT.d/2-4.2,MODELOS[modelo],0);c.indiceModelo=modelo;frota.set(modelo,c);carros.push(c);}
  c.guardado=false;c.obj.visible=true;c.hp=Math.max(25,c.hp);c.v=0;c.yaw=0;c.obj.position.set(INT.x-7,0,INT.z+INT.d/2-4.2);Moradia.removerGuardado(casaIdx,modelo);UI.notificar(c.nome+' retirado para a garagem.');
}
function guardarNaGaragem(casaIdx){
  const c=ultimoVeiculo;
  if(!c||c.indiceModelo==null||c.obj.position.distanceTo(new THREE.Vector3(INT.x-7,0,INT.z+4))>10)return UI.notificar('Estacione seu veículo dentro da garagem primeiro.');
  const erro=Moradia.registrarGuardado(casaIdx,c.indiceModelo);if(erro)return UI.notificar(erro);
  if(jog.veiculo===c){jog.veiculo=null;liberarCondutor();}c.v=0;c.guardado=true;c.obj.visible=false;UI.notificar(c.nome+' guardado nesta casa.');gravar();
}
moradia=Moradia.iniciar(interior.casaGrupo,jog,{aviso:UI.notificar,aoAbrir:aoAbrirTela,salvar:gravar,guardar:guardarNaGaragem,retirar:retirarDaGaragem,nomeVeiculo:i=>MODELOS[i]?.marca+' '+MODELOS[i]?.nome||'Veículo'},save.moradia||{});
for(const modelo of moradia.guardados()){const c=frota.get(modelo);if(c){c.guardado=true;c.obj.visible=false;}}
Tel.iniciar(jog, {
  ligar: (t, n) => UI.notificar(M.dar(t) ? n + ': "Tenho um trabalho pra você. Veja o GPS."' : 'Termine a missão atual primeiro.'),
  chamar, jogo: t => { Tel.alternar(false); iniciarJogo(t); }, aviso: UI.notificar, salvar: gravar,nivel:Prog.nivel,
  arma:i=>{arsenal.reserva[i]+=ARMAS[i].mun*2;equiparArma(i);UI.notificar(ARMAS[i].n+' adicionada ao inventário.');},
  roupa:r=>{personagem.camisa=r.camisa;personagem.calca=r.calca;aplicarAparencia(jog.obj,{cor:r.camisa,calca:r.calca,cabelo:personagem.cabelo,pele:personagem.pele});UI.notificar('Visual '+r.n+' equipado.');},
  aoAbrir: aoAbrirTela
});
$('vol').value=Math.round(config.volume*100);A.volume(config.volume);$('vol').oninput = e => {config.volume=e.target.value/100;A.volume(config.volume);gravar();};
$('pendrive').onclick = e => {
  e.stopPropagation();
  const url = new URL(location.href); url.search = ''; url.hash = '';
  const blob = new Blob(['[InternetShortcut]\r\nURL=' + url.href + '\r\n'], {type:'application/octet-stream'});
  const href = URL.createObjectURL(blob), a = document.createElement('a'); a.href = href; a.download = 'City-Rush.url'; a.click(); setTimeout(()=>URL.revokeObjectURL(href), 1000);
  $('pendriveHint').textContent = 'Copie City-Rush.url para o pendrive. Abra no Windows com internet. É um atalho para a versão atualizada; o progresso fica neste navegador.';
};
$('novo').onclick = async e => { e.stopPropagation(); apagando = true; await DB.apagar(); location.reload(); };
function comecar() { if (!mobile) cv.requestPointerLock?.()?.catch?.(()=>{}); rodando = true;habilitarControles(true); $('menu').classList.add('off'); A.iniciar(); A.click();M.ativar(); }
$('menu').onclick = comecar;
$('startDemo').onclick=e=>{e.stopPropagation();comecar();};
function adicionarChat(nome,texto,proprio=false){
  const p=document.createElement('p');if(proprio)p.className='me';if(nome==='SISTEMA')p.className='system';
  if(nome!=='SISTEMA'){const b=document.createElement('b');b.textContent=nome+': ';p.append(b);}p.append(document.createTextNode(texto));
  $('chatLog').append(p);while($('chatLog').children.length>40)$('chatLog').firstChild.remove();$('chatLog').scrollTop=$('chatLog').scrollHeight;
}
function abrirChat(){if(!Online.conectado())return UI.notificar('Entre em uma sala online para usar o chat.');$('chatPanel').classList.add('on');aoAbrirTela(true);setTimeout(()=>$('chatInput').focus(),0);}
function fecharChat(){if(!$('chatPanel').classList.contains('on'))return;$('chatPanel').classList.remove('on');$('chatInput').blur();aoAbrirTela(false);}
$('chatClose').onclick=fecharChat;$('mChat').onclick=e=>{e.preventDefault();abrirChat();};
$('chatForm').onsubmit=e=>{e.preventDefault();if(Online.enviarChat($('chatInput').value))$('chatInput').value='';};
const parametrosSala = new URLSearchParams(location.search), salaDaUrl = parametrosSala.get('sala'), modoDaUrl=parametrosSala.get('modo');
if (salaDaUrl) $('roomCode').value = salaDaUrl.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'cidade-1';
if(modoDaUrl==='deathmatch')$('roomMode').value='deathmatch';
$('soloPlay').onclick = e => { e.stopPropagation(); Online.sair(); $('netHud').textContent = 'SOZINHO'; $('shareRoom').classList.remove('on');$('chatPanel').classList.remove('on'); comecar(); };
$('shareRoom').onclick = async e => {
  e.stopPropagation();
  try { const base = await linkPublico(); await navigator.clipboard.writeText(base ? base + location.search : location.href); $('onlineMsg').textContent = base ? 'LINK COPIADO' : 'LINK LOCAL COPIADO (só funciona no seu Wi-Fi)'; UI.notificar('Link da sala copiado. Envie para seus amigos!'); }
  catch (_) { $('onlineMsg').textContent = 'COPIE O LINK DO NAVEGADOR'; UI.notificar('Copie o endereço desta página e envie para seus amigos.'); }
};
$('onlinePlay').onclick = async e => {
  e.stopPropagation(); const b = e.currentTarget, msg = $('onlineMsg');
  if (!online()) { msg.textContent = 'SEM INTERNET · SÓ MODO SOLO'; UI.notificar('Sem internet: o multiplayer precisa de conexão. Toque em JOGAR para jogar sozinho, offline.'); return; }
  b.disabled = true; msg.textContent = 'CONECTANDO…';
  try {
    const modo=$('roomMode').value;
    const codigo = await Online.entrar(scene, jog, personagem, $('roomCode').value, modo, {
      status:s => {
        const placar=s.modo==='deathmatch'?' · '+s.kills+'×'+s.deaths:'';
        $('netHud').textContent = s.online ? '● '+(s.modo==='deathmatch'?'DEATHMATCH':'COOP')+' · '+s.sala.toUpperCase()+' · '+s.jogadores+' jogador'+(s.jogadores===1?'':'es')+placar : 'SOZINHO';
        $('netHud').classList.toggle('on', s.online);
      },
      mensagem:adicionarChat,
      dano:(valor,nome)=>{const vivo=!jog.morto&&jog.hp>0;receberDano(jog,valor);if(vivo&&jog.hp<=0)UI.notificar(nome+' eliminou você.');return vivo&&jog.hp<=0;},
      reviver:nome=>{jog.morto=false;jog.tm=0;jog.hp=50;jog.st=60;jog.obj.rotation.x=0;jog.obj.position.y=0;UI.wasted(false);UI.notificar(nome+' reanimou você!');}
    });
    const url = new URL(location.href); url.searchParams.set('sala', codigo);url.searchParams.set('modo',modo); history.replaceState(null, '', url);
    $('shareRoom').classList.add('on'); msg.textContent = (modo==='deathmatch'?'DEATHMATCH · ':'COOP · ') + codigo.toUpperCase(); comecar(); UI.notificar('Online conectado. Enter abre o chat; copie o link para chamar seus amigos.');
  } catch (erro) {
    console.error('[online]', erro); msg.textContent = online() ? 'NÃO FOI POSSÍVEL CONECTAR' : 'SEM INTERNET · SÓ MODO SOLO'; UI.notificar('Modo online indisponível'+(online()?'':' (sem internet)')+'. Você ainda pode jogar sozinho, até offline.');
  } finally { b.disabled = false; }
};
document.addEventListener('pointerlockchange', () => { if (!mobile && !document.pointerLockElement && !telaAberta) { rodando = false;habilitarControles(false); $('menu').classList.remove('off'); } });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => { if (!rodando || !document.pointerLockElement) return; if (e.button === 0) teclas.Mouse0 = true; if (e.button === 2) jog.mira = true; });
addEventListener('mouseup', e => { if (e.button === 0) teclas.Mouse0 = false; if (e.button === 2) jog.mira = false; });
addEventListener('mousemove', e => {
  if (!document.pointerLockElement) return; const s = (jog.mira ? .0012 : .0025)*config.sensibilidade; semMouse = 0;
  if (jog.veiculo) jog.olho -= e.movementX * s; else jog.cameraYaw -= e.movementX * s; // câmera livre a pé e no carro
  jog.pitch = Math.max(-1, Math.min(1, jog.pitch - e.movementY * s));
});

function loja(t) {
  const c = t === 'mercado' ? 50 : 30; if (jog.dinheiro < c) return UI.notificar('Dinheiro insuficiente');
  jog.dinheiro -= c;
  if (t === 'mercado') { jog.hp = Math.min(100, jog.hp + 50); UI.notificar('Caixa: obrigado! (+50 de vida)'); } else { arsenal.reabastecer(); jog.colete=100; UI.notificar('Reserva de munição e colete reabastecidos. R para recarregar.'); }
}
function entrar(l) {
  INT.on = true; INT.tipo = l.tipo; INT.casa = l.idx || 0; interior.mostrar(l.tipo, l.idx || 0);
  if(l.tipo==='casa')moradia?.mostrarCasa(INT.casa);
  saida = { x: l.x, z: l.z + (l.tipo==='casa'?saidaCasa(l.idx):18) }; povAntes = pov; pov = 1;
  jog.obj.position.set(INT.x, 0, INT.z + INT.d / 2 - 2); jog.yaw = jog.cameraYaw = 0; jog.pitch = 0;
  UI.notificar(l.tipo === 'casa' ? 'Bem-vindo à sua casa.' : l.tipo === 'oficina' ? 'City Customs: use o computador para modificar seu veículo.' : 'Vá até o balcão e aperte E para comprar.');
}
function sair() { INT.on = false; pov = povAntes; jog.obj.position.set(saida.x, 0, saida.z); }
function entrarGaragemCasa(l,c){
  INT.on=true;INT.tipo='casa';INT.casa=l.idx||0;interior.mostrar('casa',INT.casa);moradia?.mostrarCasa(INT.casa);
  saida={x:l.x,z:l.z+saidaCasa(l.idx)};povAntes=pov;pov=0;ultimoVeiculo=c;
  c.guardado=false;c.obj.visible=true;c.obj.position.set(INT.x-7,0,INT.z+INT.d/2-4.2);c.yaw=0;c.v=0;jog.olho=0;
  UI.notificar('Você entrou na garagem. Estacione, saia e use B para guardar ou mobiliar.');
}
function sairGaragemCasa(c){INT.on=false;pov=povAntes;c.obj.position.set(saida.x,0,saida.z);c.yaw=0;c.v=0;UI.notificar('Você saiu da garagem.');}
function entrarOficinaComVeiculo(l, c) {
  INT.on = true; INT.tipo = 'oficina'; INT.casa = 0; interior.mostrar('oficina', 0);
  saida = { x: l.x, z: l.z + 18 }; povAntes = pov; pov = 0; ultimoVeiculo = c;
  c.obj.position.set(INT.x, 0, INT.z + INT.d / 2 - 4.2); c.yaw = 0; c.v = 0; jog.olho = 0;
  UI.notificar('Dirija até o elevador, estacione e saia do veículo para usar o computador.');
}
function sairOficinaComVeiculo(c) {
  INT.on = false; pov = povAntes; c.obj.position.set(saida.x, 0, saida.z); c.yaw = 0; c.v = 0;
  UI.notificar('Você saiu da oficina com o veículo.');
}
function casa(l) { if (Tel.possui(l.idx)) entrar(l); else UI.notificar('Casa à venda — compre pelo celular (T)'); }
function abrirOficina() {
  const alvo = ultimoVeiculo || [...frota.values()][0] || carros[0];
  Oficina.abrir(alvo, jog, {
    aviso: UI.notificar, aoAbrir: aoAbrirTela,
    salvar: c => { customizacoes[c.indiceModelo] = c.dadosCustomizacao(); gravar(); }
  });
}
// A casa selecionada na criação passa a ser o ponto inicial real do jogo.
const casaInicial = personagem.casa != null && LUGARES.find(l => l.tipo === 'casa' && l.idx === personagem.casa);
if (casaInicial && Tel.possui(personagem.casa)) {
  entrar(casaInicial);
  // O primeiro veículo já espera na garagem da casa escolhida. Assim a demo
  // começa em casa e segue naturalmente para celular, garagem e GPS.
  const inicial=frota.get(Tel.dados().garagem[0]);
  if(inicial){inicial.obj.position.set(INT.x-7,0,INT.z+INT.d/2-4.2);inicial.yaw=Math.PI;/* vaga da garagem (na frente da casa, virado para a saída); antes z-4.5 era a garagem da planta antiga e agora cairia dentro do quarto */inicial.v=0;ultimoVeiculo=inicial;}
}

let ultimaInteracao=0;
addEventListener('keydown', e => {
  if(e.code==='Escape'&&$('chatPanel').classList.contains('on')){fecharChat();return;}
  if(digitando(e))return;
  const k = e.code; buf = (buf + e.key).toLowerCase().slice(-7);
  if (buf === 'hesoyam') { jog.hp = 100; jog.dinheiro += 250000; UI.notificar('Cheat ativado!'); }
  if (k === 'Tab') e.preventDefault();
  if (k === 'KeyQ' && rodaAberta) { fecharRoda(); return; }
  if(k==='Escape'){
    if(rodaAberta){fecharRoda();return;}
    if(Tel.aberto()){Tel.alternar(false);return;}if(Oficina.aberto()){Oficina.fechar();return;}if(Moradia.aberto()){Moradia.alternar(false);return;}if(Esc.aberto())return;
    if(rodando&&!jog.morto){Pause.alternar();return;}
  }
  if (!rodando || jog.morto) return;
  if(k==='Enter'){abrirChat();return;}
  if (k === 'KeyT') Tel.alternar();
  if (k === 'KeyB' && INT.on && INT.tipo==='casa' && !jog.veiculo) Moradia.alternar(true,INT.casa);
  if (Esc.aberto()) { // diálogo aberto: 1-3 escolhem
    const o = /^Digit[1-3]$/.test(k) && Esc.escolher(+k.slice(5) - 1);
    if (o) { if (o.mg) iniciarJogo(o.mg); if (o.d !== undefined) { jog.dinheiro += o.d; if (o.e) { estrelas = Math.min(5, estrelas + o.e); semCrime = 0; } UI.notificar('Karma: ' + Esc.rotulo()); } }
    return;
  }
  if(telaAberta)return;
  if (k === 'Tab') { UI.inventario(jog, ARMAS, municao, Esc.rotulo(), `Recorde de corrida: ${rec.corrida ? rec.corrida.toFixed(1) + ' s' : '—'} · Abates: ${rec.kills}`); UI.alternar('inv'); }
  if (k === 'KeyM') UI.alternar('mapa');
  if (k === 'KeyK') UI.notificar(clima.alternar() ? 'Chuva ligada' : 'Chuva desligada');
  if (k === 'KeyP') document.body.classList.toggle('foto');
  if (k === 'KeyY') { split = !split; jog2.obj.visible = split; if (split) { jog2.obj.position.copy(jog.obj.position); jog2.obj.position.x += 2; } $('hud2').style.display = split ? 'block' : 'none'; }
  if (jog.veiculo && (k === 'ArrowLeft' || k === 'ArrowRight')) UI.notificar('📻 ' + A.radio(k === 'ArrowRight' ? 1 : -1));
  if (k === 'KeyV') { if (jog.veiculo) pov = pov === 4 ? 0 : 4; else do pov = (pov + 1) % 5; while (pov === 4); } // no carro: 3ª pessoa <-> interno
  if (k === 'KeyQ') { abrirRoda(); return; }
  if (k === 'KeyR' && arsenal.recarregar(arma)) A.click();
  if (/^Digit[1-7]$/.test(k)) {const n=+k.slice(5)-1;if(!equiparArma(n))return UI.notificar('Compre ou desbloqueie esta arma primeiro.');}
  if (k === 'KeyH' && jog.veiculo) A.buzina();
  if(k==='KeyL'&&jog.veiculo&&!e.repeat){const c=jog.veiculo;c.farolManual=!(c.farolManual??c.farolLigado);UI.notificar(c.farolManual?'Faróis ligados':'Faróis desligados');}
  if (k === 'KeyG' && !jog.veiculo) {
    const revivido=Online.reanimarProximo(jog.obj.position,INT.on?INT.tipo+':'+(INT.tipo==='casa'?INT.casa:0):'world');
    if(revivido)UI.notificar('Você reanimou '+revivido+'!');
    else if (org.obj.position.distanceTo(jog.obj.position) < 5) Esc.abrir('Rafa: "Quer competir?"', [{ t: 'Corrida (6 pontos, 90 s)', mg: 'corrida' }, { t: 'Sobrevivência (60 s)', mg: 'sobrevivencia' }, { t: 'Agora não' }]);
    else if (npcs.some(n => !n.policia && n.obj.position.distanceTo(jog.obj.position) < 6)) Esc.abrir();
  }
  if (k === 'KeyE' && !e.repeat) {
    if(transicaoVeiculo||performance.now()-ultimaInteracao<600 || jog.rolando || jog.salto)return;ultimaInteracao=performance.now();
    const p = jog.obj.position;
    if (jog.veiculo) {
      const c = jog.veiculo, q = c.obj.position;
      const oficinaPerto = !INT.on && LUGARES.find(l => l.tipo === 'oficina' && Math.hypot(l.x - q.x, l.z - q.z) < 34);
      const casaPerto = !INT.on && LUGARES.find(l => l.tipo === 'casa' && Math.hypot(l.x-q.x,l.z-q.z)<34);
      const portaoSaida = INT.on && INT.tipo === 'oficina' && q.z > INT.z + INT.d / 2 - 3.4;
      const portaoCasa = INT.on && INT.tipo === 'casa' && q.z > INT.z + INT.d / 2 - 3.4;
      if (oficinaPerto) entrarOficinaComVeiculo(oficinaPerto, c);
      else if(casaPerto){if(Tel.possui(casaPerto.idx))entrarGaragemCasa(casaPerto,c);else UI.notificar('Compre esta casa antes de usar a garagem.');}
      else if (portaoSaida) sairOficinaComVeiculo(c);
      else if(portaoCasa)sairGaragemCasa(c);
      else {
        ultimoVeiculo = c; c.definirCameraInterna(false);
        let saiu=false;
        for(const lado of [1,-1,2,-2]){const x=q.x+Math.cos(c.yaw)*2*lado,z=q.z-Math.sin(c.yaw)*2*lado;if(!colide(x,z,.4)){p.set(x,0,z);saiu=true;break;}}
        if(!saiu)return UI.notificar('Sem espaço para sair. Afaste o veículo da parede.');
        c.v=0;jog.yaw = jog.cameraYaw = c.yaw; jog.olho = 0; jog.veiculo = null; jog.obj.scale.setScalar(1); liberarCondutor();
      }
    } else if (INT.on) {
      const estacionado=['oficina','casa'].includes(INT.tipo)&&carros.find(c=>!c.guardado&&c.obj.visible&&c.obj.position.distanceTo(p)<4.5);
      if(estacionado){iniciarEntradaVeiculo(estacionado);return;}
      const portaPerto=INT.tipo==='casa'?interior.portaProxima(p.x,p.z):null;
      if(portaPerto){const r=interior.alternarPorta(portaPerto,p.x,p.z);A.click();if(r==='bloqueada')UI.notificar('Saia da frente da porta para fechá-la.');return;}
      const naSaida = p.z > INT.z + INT.d / 2 - 2.1;
      if (INT.tipo === 'casa') {
        if (Math.hypot(p.x - interior.cama.x, p.z - interior.cama.z) < 3) { jog.hp = 100;jog.st=100;tempoDia=.22; gravar(); UI.notificar('Você dormiu até de manhã. Vida, stamina e progresso recuperados!'); }
        else if (naSaida) sair(); else UI.notificar('Explore sua sala, cozinha, quarto e garagem.');
      } else if (INT.tipo === 'oficina') {
        if (Math.hypot(p.x - interior.oficina.x, p.z - interior.oficina.z) < 4) abrirOficina();
        else if (naSaida) sair(); else UI.notificar('Use o computador da bancada ou volte ao portão.');
      } else if (Math.hypot(p.x - interior.caixa.x, p.z - interior.caixa.z) < 4) loja(INT.tipo);
      else if (naSaida) sair(); else UI.notificar('Chegue perto do balcão para comprar ou volte à porta.');
    } else {
      const c = carros.find(v => !v.destruido && v.obj.visible && v.obj.position.distanceTo(p) < 5), l = LUGARES.find(l => Math.hypot(l.x - p.x, l.z - p.z) < 26);
      if (c) { iniciarEntradaVeiculo(c); }
      else if (l) l.tipo === 'casa' ? casa(l) : entrar(l);
    }
    A.click();
  }
});

const mobileUI = mobile ? iniciarControlesMobile({
  teclas, jogador: () => jog,
  olhar: (dx, dy) => {
    const sensibilidade = .006*config.sensibilidade; semMouse = 0;
    if (jog.veiculo) jog.olho -= dx * sensibilidade; else jog.cameraYaw -= dx * sensibilidade;
    jog.pitch = Math.max(-1, Math.min(1, jog.pitch - dy * sensibilidade));
  }
}) : { atualizar() {} };

const ray = new THREE.Raycaster(), tmp = new THREE.Vector3(), bocaTmp = new THREE.Vector3(), hitTmp=new THREE.Vector3(), esferaTiro=new THREE.Sphere(tmp,.7), caixaTiro=new THREE.Box3();
addEventListener('city-police-shot',e=>{
  const {a,b,acertou}=e.detail||{};if(!a||!b)return;
  FX.tracante(a,b,false);A.tiro(0);if(!acertou)FX.impacto(b);
});
function dano(n, v) { // NPC ferido: foge ou revida
  if(n.caido)return;
  n.hp -= v; crime = Math.max(crime, n.policia ? 2 : 1);
  if (n.hp <= 0) { jog.dinheiro += n.chefe?1000:50; M.matou(n.missao,n.chefe); rec.kills++; n.morrer?.()||n.reset(); } else if (!n.policia) { if (Math.random() < .5||n.missao) n.briga = 20; else n.fuga = 6; }
}
function criarAlvosMissao(quantidade,chefe=false){
  const p=jog.veiculo?.obj.position||jog.obj.position,candidatos=npcs.filter(n=>!n.policia&&!n.fixo&&!n.missao).slice(0,quantidade);
  candidatos.forEach((n,i)=>{const a=i/Math.max(1,candidatos.length)*Math.PI*2,r=chefe?22:16+(i%3)*3;n.hostil(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,true,chefe);});
  UI.notificar(chefe?'⚠ Chefe de fase apareceu no mapa!':candidatos.length+' alvos da missão foram marcados.');
}
addEventListener('city-event',e=>Conq.registrar(e.detail?.tipo));
function socar(j) {
  j.obj.userData.socoAte = j.tt + .25; A.soco(); const p = j.obj.position, fx = -Math.sin(j.yaw), fz = -Math.cos(j.yaw);
  for (const n of npcs) { const dx = n.obj.position.x - p.x, dz = n.obj.position.z - p.z; if (Math.hypot(dx, dz) < 2.3 && dx * fx + dz * fz > 0) { dano(n, 20); break; } }
}
const alvosCarro = [], caixasTiro = [];
const listaCarrosEfeitos=[];function todosCarrosEfeitos(){const l=listaCarrosEfeitos;l.length=0;for(const c of carros)l.push(c);for(const t of transito)l.push(t.c);return l;}
function todosCarrosTiro() { const l = listaCarrosTiro; l.length = 0; for (const c of carros) l.push(c); for (const t of transito) l.push(t.c); for (const c of policia.carros) l.push(c); return l; }
const listaCarrosTiro = [];
function atirar(t) {
  const a = ARMAS[arma];
  if (transicaoVeiculo || jog.veiculo || jog.morto || jog.rolando || jog.salto || t < tiroT + a.cad) return;
  if (a.melee) { tiroT = t; socar(jog); return; }
  if (!arsenal.disparar(arma)) { if(municao[arma]<=0)arsenal.recarregar(arma); return; }
  tiroT = t; A.tiro(arma); jog.pitch = Math.min(1, jog.pitch + .006 * (arma + 1)); // recuo
  ray.setFromCamera({ x: 0, y: 0 }, cam);
  const o = ray.ray.origin.clone();
  let ini = null;
  if (pov === 1 && fpMuzzle) { fpMuzzle.getWorldPosition(bocaTmp); ini = bocaTmp.clone(); }
  else ini = pontaDaArma(jog.obj, bocaTmp)?.clone();
  if (!ini) ini = jog.obj.position.clone().setY(1.4);
  // Antes, cada projétil recalculava a caixa 3D (percorrendo todas as malhas do GLB) de TODOS
  // os carros do mapa — com escopeta isso causava quedas fortes de FPS. Agora a caixa é
  // calculada uma única vez por disparo e apenas para carros dentro do alcance.
  alvosCarro.length = 0;
  for (const c of todosCarrosTiro()) {
    if (!c.obj.visible || c.hp <= 0) continue;
    const cp = c.obj.position; if (Math.hypot(cp.x - o.x, cp.z - o.z) > a.alc + 8) continue;
    const caixa = caixasTiro[alvosCarro.length] || (caixasTiro[alvosCarro.length] = new THREE.Box3());
    caixa.setFromObject(c.obj); alvosCarro.push({ c, caixa });
  }
  for (let p = 0; p < a.pel; p++) {
    const d = ray.ray.direction.clone().add(new THREE.Vector3(...[0, 0, 0].map(() => (Math.random() - .5) * a.esp * (jog.mira?.35:1)))).normalize(), r = new THREE.Ray(o, d);
    let alvo = null, carroAlvo = null, remoto=null, md = distanciaLivre(o,d,a.alc);
    for (const n of npcs) { if(n.caido)continue;tmp.copy(n.obj.position).y+=1;esferaTiro.center.copy(tmp);const hit=r.intersectSphere(esferaTiro,hitTmp);const di=hit?hit.distanceTo(o):Infinity; if (di < md) { alvo = n; md = di; } }
    for(const {c,caixa} of alvosCarro){
      const hit=r.intersectBox(caixa,hitTmp),di=hit?hit.distanceTo(o):Infinity;
      if(di<md){md=di;carroAlvo=c;alvo=null;}
    }
    remoto=Online.alvoDoRaio(r,md,INT.on?INT.tipo+':'+(INT.tipo==='casa'?INT.casa:0):'world');
    if(remoto){md=remoto.dist;alvo=carroAlvo=null;}
    const fim = o.clone().addScaledVector(d, md);
    FX.tracante(ini, fim, !!a.area);
    if (alvo) {dano(alvo, a.dano);FX.impacto(fim,true);}
    else if(remoto){Online.danificar(remoto.id,a.dano);FX.impacto(fim,true);}
    else if(md<a.alc)FX.impacto(fim);
    if(carroAlvo){carroAlvo.hp-=a.dano*.55;crime=Math.max(crime,1);}
    if (a.area) { FX.explodir(fim, a.area); A.tiro(5); npcs.forEach(n => { if (n.obj.position.distanceTo(fim) < a.area) dano(n, 100); }); [...carros,...transito.map(t=>t.c)].forEach(c=>{if(c.obj.position.distanceTo(fim)<a.area)c.hp-=100;}); if(jog.obj.position.distanceTo(fim)<a.area)receberDano(jog,45); }
  }
  npcs.forEach(n => { if (n.obj.position.distanceTo(jog.obj.position) < 40 && n.briga <= 0) n.fuga = 4; });
}

// Pré-compila os shaders de todos os interiores, efeitos e carros AGORA (tela de carregamento),
// para que a primeira entrada em casa/loja/oficina, o primeiro tiro e a primeira explosão
// não congelem o jogo no meio da partida.
try{
  FX.preaquecer();
  const estavaDentro=INT.on,tipoAtual=INT.tipo,casaAtual=INT.casa; // quem começa dentro de casa NÃO pode perder o interior
  interior.mostrarTodos();
  if(renderer.compileAsync)await renderer.compileAsync(scene,cam);else renderer.compile(scene,cam);
  interior.mostrar(estavaDentro?tipoAtual:'mercado',estavaDentro?casaAtual:0);
  if(estavaDentro&&tipoAtual==='casa')moradia?.mostrarCasa(casaAtual);
  FX.finalizarPreaquecimento();
}catch(e){console.warn('[preaquecer] ignorado:',e);}
await passo(100, 'Pronto!');await esperarCarrossel(); $('carga').classList.add('off');
iniciarOffline();iniciarExtras();
let atividadeOffline=null;
let ultimo = performance.now(), quadroSombra = 0;
function loop(agora) {
  requestAnimationFrame(loop);
  const atividade=rodando&&!Pause.estaAberto()&&!telaAberta;
  if(atividade!==atividadeOffline){atividadeOffline=atividade;navigator.serviceWorker?.controller?.postMessage({tipo:'atividade',jogando:atividade});}
  const bruto = (agora - ultimo) / 1000, dt = Math.min(.05, bruto); ultimo = agora;
  if (!rodando) { A.motor(-1); A.sirene(false); return; }
  if(Pause.estaAberto()){A.motor(-1);A.sirene(false);return;}
  lento = bruto > 1 / 35 ? lento + Math.min(bruto, .1) : Math.max(0, lento - bruto); // FPS baixo sustentado mesmo após reduzir a resolução => qualidade mínima
  if (lento > 2.2 && !reduzido) { const prAntes=prAtual;reduzido = true; aplicarQualidade('baixa',true);definirResolucao(Math.min(prAntes,.85));renderer.shadowMap.enabled=false; UI.notificar('Modo desempenho ativado para evitar travamentos.'); }
  msMedio += (Math.min(bruto, .1) * 1000 - msMedio) * .04; resT += bruto; resEspera = Math.max(0, resEspera - bruto);
  if (resT > 1.5) {
    resT = 0;
    if (msMedio > 22 && prAtual > .76) { definirResolucao(Math.max(.75, prAtual - .15)); resEspera = 6; resNoMinimo = 0; }
    else if (msMedio > 22) { // já na resolução mínima e ainda lento: desliga as sombras uma única vez
      if ((resNoMinimo += 1.5) >= 4.5 && renderer.shadowMap.enabled && !sombrasDesligadas) { sombrasDesligadas = true; renderer.shadowMap.enabled = false; UI.notificar('Sombras desligadas para manter a fluidez.'); }
    } else if (msMedio < 15 && prAtual < prMax && resEspera <= 0) definirResolucao(Math.min(prMax, prAtual + .1));
  }
  if (renderer.shadowMap.enabled && ((quadroSombra++) & 1) === 0) renderer.shadowMap.needsUpdate = true;
  tempoDia = (tempoDia + dt / 420) % 1; tempoJogo += dt;
  if((conqT+=dt)>=1){conqT=0;const td=Tel.dados();const novas=Conq.avaliar({tempo:tempoJogo,carros:td.garagem.length,casas:td.casas.length,missoes:M.indice(),estrelas,kills:rec.kills,rep:Prog.nivel(),dinheiro:jog.dinheiro,corrida:rec.corrida,custom:Object.keys(customizacoes).length,online:Online.conectado()});if(novas.length){novas.forEach(c=>UI.notificar('🏆 Conquista: '+c.nome));gravar();}}
  if(!telaAberta)arsenal.atualizar(dt);
  if(mobile)jog.mira=!!teclas.Mouse2 && !telaAberta;
  if(!telaAberta&&!transicaoVeiculo){
    // Subpassos mantêm aceleração, corrida e colisões suaves mesmo quando um
    // quadro demora mais no celular ou durante o carregamento de um GLB.
    const passos=Math.max(1,Math.min(3,Math.ceil(dt/(1/60)))),sub=dt/passos;
    for(let s=0;s<passos;s++){jog.atualizar(sub,false);if(jog.veiculo)jog.veiculo.atualizar(sub,true);}
    if(!jog.veiculo&&!jog.morto)animar(jog.obj,Math.hypot(jog.vx,jog.vz),jog.tt,dt); // um único mixer update por quadro
  }
  carros.forEach(c=>{if(c!==jog.veiculo&&(!INT.on||c===ultimoVeiculo))c.atualizar(dt,false);});
  const escuro = Math.sin(tempoDia * Math.PI * 2) < .12;
  carros.forEach(c => c.definirFarol(c === jog.veiculo && (c.farolManual??escuro))); atualizarPainel(jog.veiculo);
  mobileUI.atualizar();
  const miraAtiva = jog.mira && !jog.veiculo && !jog.morto && arma < 6;
  document.body.classList.toggle('aiming', miraAtiva);
  document.body.classList.toggle('firstPerson', pov === 1 && !jog.veiculo && !jog.morto);
  document.body.classList.toggle('scope', miraAtiva && pov === 1 && arma === 4);
  const fpAlvo = (miraAtiva && pov === 1 ? FP_MIRA : FP_QUADRIL)[Math.min(arma,5)];
  fp.position.x += (fpAlvo.x-fp.position.x)*(1-Math.exp(-14*dt)); fp.position.y += (fpAlvo.y-fp.position.y)*(1-Math.exp(-14*dt)); fp.position.z += (fpAlvo.z-fp.position.z)*(1-Math.exp(-14*dt));
  if(pov===1&&!jog.veiculo)maosGLB?.userData.atualizar(arsenal.recarga);
  const fpEscala=fp.scale.x+(fpAlvo.s-fp.scale.x)*(1-Math.exp(-14*dt));fp.scale.setScalar(fpEscala);
  const novoArmaHud=arma+':'+municao[arma]+':'+arsenal.reserva[arma];if(novoArmaHud!==armaHudEstado){armaHudEstado=novoArmaHud;$('weaponIcon').textContent = ICONES_ARMA[arma]; $('weaponName').textContent = ARMAS[arma].n.toUpperCase(); $('weaponAmmo').textContent = ARMAS[arma].melee ? 'CORPO A CORPO' : municao[arma] + ' / ' + arsenal.reserva[arma];}
  $('weaponCurrent').style.visibility = jog.veiculo ? 'hidden' : 'visible';
  if (split) { jog2.atualizar(dt); if (jog2.hp <= 0 && !jog2.morto) jog2.morrer(); if (teclas.KeyO && !jog2.morto && agora / 1000 > cool2 + .45) { cool2 = agora / 1000; socar(jog2); } }
  const alvo = jog.veiculo ? jog.veiculo.obj.position : jog.obj.position;
  decoracao?.atualizar(alvo);
  if (jog.veiculo) { semMouse += dt; if (semMouse > 2.5) jog.olho *= 1 - 3 * dt; } // câmera volta ao centro se o mouse parar
  const busca=policia.atualizar(dt,jog,estrelas,INT.on,npcs);
  let dn = busca.dano; if (!INT.on) npcs.forEach(n => {
    const distancia2=n.obj.position.distanceToSquared(alvo),perto=distancia2<(fraco?125*125:180*180);
    n.obj.visible=perto;n.obj.matrixWorldAutoUpdate=perto;
    n.tempoIA=(n.tempoIA||0)+dt;
    if(perto||n.tempoIA>=.2){dn+=n.atualizar(n.tempoIA,alvo,estrelas,jog.agachado&&!jog.veiculo);n.tempoIA=0;}
    n.tempoAnim=(n.tempoAnim||0)+dt;
    if(perto&&!n.caido&&(distancia2<3600||n.tempoAnim>=1/15)){animar(n.obj,n.velAtual||0,n.tt,n.tempoAnim);n.tempoAnim=0;n.atualizarVisualArma?.();}
  });
  if (!INT.on) { org.atualizar(dt, alvo, 0); animar(org.obj, 0, org.tt, dt); }
  receberDano(jog,dn);
  if (jog.veiculo && Math.abs(jog.veiculo.v) > 8) npcs.forEach(n => { if (!n.caido&&n.obj.position.distanceTo(alvo) < 2.6) { dano(n, 100); jog.veiculo.hp -= 3; } }); // atropelar
  if (!INT.on) { sem.atualizar(tempoJogo,alvo); av.atualizar(dt); }
  if (!INT.on) transito.forEach(t => { // carros de NPCs
    t.atualizar(dt, tempoJogo,transito); const tp = t.c.obj.position;
    if (t.pausa <= 0 && !INT.on) {
      if (t.c.hp<=0)return;
      if (!jog.veiculo && !jog.morto && tp.distanceTo(jog.obj.position) < 2.6) { receberDano(jog,35,true); t.pausa = 3; jog.vy = 5; UI.notificar('Você foi atropelado!'); }
      else if (jog.veiculo && tp.distanceTo(jog.veiculo.obj.position) < 3.8) { jog.veiculo.v *= -.3; jog.veiculo.hp -= 10; t.pausa = 2; A.buzina(); }
    }
  });
  todosCarrosEfeitos().forEach(c => { // fumaça, explosão única e reposição após 12 segundos
    if(c.destruido){c.respawn-=dt;if(c.respawn<=0){c.destruido=false;c.obj.visible=true;c.hp=100;c.v=0;const tr=transito.find(t=>t.c===c);if(tr)tr.reset();else c.obj.position.set(3,0,32+Math.random()*100);}return;}
    if (c.hp > 0 && c.hp < 20 && Math.random() < dt * 8) FX.fumaca(c.obj.position);
    if (c.hp <= 0) {
      FX.explodir(c.obj.position, 8); A.tiro(5); npcs.forEach(n => { if (n.obj.position.distanceTo(c.obj.position) < 8) dano(n, 100); });
      if (jog.veiculo === c) { c.definirCameraInterna(false); liberarCondutor(); jog.veiculo = null; receberDano(jog,50); jog.obj.position.set(c.obj.position.x + 3, 0, c.obj.position.z); }
      c.destruido=true;c.respawn=12;c.v=0;c.obj.visible=false;UI.notificar('Veículo destruído!');
    }
  });
  FX.atualizar(dt); clima.atualizar(dt, alvo,INT.on); Tel.tick(dt);
  const zonaOnline=INT.on ? INT.tipo + ':' + (INT.tipo === 'casa' ? INT.casa : 0) : 'world';
  Online.atualizar(dt, zonaOnline);
  if (crime) { estrelas = Math.min(5, estrelas + crime); semCrime = 0; crime = 0; }
  const rm = M.atualizar(jog, estrelas,dt);
  if (rm) {
    const extras=[];
    if(rm.arma!==undefined){Tel.adicionarArma(rm.arma);arsenal.reserva[rm.arma]+=ARMAS[rm.arma].mun*2;equiparArma(rm.arma);extras.push(ARMAS[rm.arma].n);}
    if(rm.carro!==undefined){Tel.adicionarCarro(rm.carro);chamar(rm.carro);extras.push(MODELOS[rm.carro].marca+' '+MODELOS[rm.carro].nome);}
    const subiu=Prog.ganhar(rm.historia?(rm.fim?700:180):80),bonus=Math.round(rm.recompensa*(Prog.bonus()-1));jog.dinheiro+=bonus;if(subiu)extras.push('REP nível '+subiu);
    UI.notificar('Missão concluída! +$'+(rm.recompensa+bonus)+(extras.length?' · '+extras.join(' · '):''));gravar();if(rm.fim)Esc.final();
  }
  const rg = MG.atualizar(dt, jog, npcs);
  if (rg) { if (rg.ok) { jog.dinheiro += rg.premio;const nv=Prog.ganhar(120); UI.notificar('🏆 Mini-jogo vencido! +$' + rg.premio+(nv?' · REP nível '+nv:'')); if (rg.tempo && (!rec.corrida || rg.tempo < rec.corrida)) rec.corrida = rg.tempo; gravar(); } else UI.notificar('Mini-jogo perdido!'); }
  semCrime = busca.avistado ? 0 : semCrime+dt; if (estrelas > 0 && semCrime > 20) { estrelas--; semCrime = 0; }
  if (jog.hp <= 0 && !jog.morto) { jog.morrer(); estrelas = 0; UI.wasted(true); }
  if (!telaAberta && (teclas.KeyF || teclas.Mouse0)) atirar(agora / 1000);
  if (!jog.veiculo && !jog.morto && (teclas.KeyW || teclas.KeyA || teclas.KeyS || teclas.KeyD) && jog.obj.position.y === 0 && (passoT += dt) > (teclas.ShiftLeft ? .28 : .45)) { passoT = 0; A.passo(); }
  A.motor(jog.veiculo ? Math.abs(jog.veiculo.v) : -1); A.sirene(estrelas > 0);
  cinema?.velocidade(jog.veiculo?.v||0);
  carros.forEach(c => c.definirCameraInterna(c === jog.veiculo && pov === 4));
  if (jog.veiculo) {
    const c = jog.veiculo;
    const ancora=c.encaixeCondutor,e={s:ancora?.userData?.escala||.72};
    // O piloto fica visível e sentado apenas nas duas rodas. Nos automóveis ele
    // permanece dentro da cabine, sem cabeça ou braços atravessando o teto.
    jog.obj.scale.setScalar(e.s);
    if(ancora)ancora.getWorldPosition(jog.obj.position);else jog.obj.position.copy(c.obj.position).add(new THREE.Vector3(-.4,.18,-.45));
    jog.obj.rotation.y = c.yaw; jog.obj.rotation.z = c.duasRodas ? c.obj.rotation.z : 0;
    jog.obj.visible = c.duasRodas && pov !== 4;
    atualizarPoseCondutor(c,dt);
  } else {
    jog.obj.scale.x = jog.obj.scale.z = 1; jog.obj.rotation.z = 0;
    jog.obj.visible = pov !== 1 || jog.morto;
  }
  if(!telaAberta)atualizarEntradaVeiculo(dt);
  for(const c of carros)c.animarVisual(dt,c===jog.veiculo);
  for(const t of transito){t.c.definirFarol(escuro);t.c.animarVisual(dt);}
  for(const c of policia.carros)c.animarVisual(dt);
  atualizarArmaTerceiraPessoa(jog.obj,(jog.mira||teclas.Mouse0)&&!jog.veiculo,!!jog.veiculo||!!transicaoVeiculo||pov===1||jog.morto);
  fp.visible = pov === 1 && !jog.veiculo && !jog.morto && arma < 6;
  atualizarCamera(cam, agora, dt, jog, pov, jog.mira && !jog.veiculo ? (arma === 4 ? 18 : 42) : 0); ceu(tempoDia, alvo);
  luzes.atualizar(dt, jog.obj.position, INT.on);
  { // farol e neon: uma luz fixa de cada, apenas movida/intensificada (sem recompilar shaders)
    const cf = jog.veiculo;
    if (cf && cf.farolLigado && cf.focoFarol) { cf.focoFarol.getWorldPosition(farolGlobal.position); cf.focoAlvo.getWorldPosition(farolGlobal.target.position); farolGlobal.intensity = 28; }
    else farolGlobal.intensity = 0;
    if (neonGlobal) {
      const cn = jog.veiculo || ultimoVeiculo;
      if (cn && cn.neonAtivo && cn.obj.visible && !cn.guardado) { cn.obj.getWorldPosition(neonGlobal.position); neonGlobal.position.y += .25; neonGlobal.color.setHex(cn.neonCor); neonGlobal.intensity = 2.2; }
      else neonGlobal.intensity = 0;
    }
    if (INT.on && INT.tipo === 'casa') interior.atualizarPortas(dt);
  }
  let dica = '';
  if (!jog.veiculo && !jog.morto) {
    const p = jog.obj.position;
    if (INT.on) {
      const naSaida = p.z > INT.z + INT.d / 2 - 2.1;
      if (INT.tipo === 'casa') { const pt = interior.portaProxima(p.x, p.z); dica = Math.hypot(p.x - interior.cama.x, p.z - interior.cama.z) < 3 ? 'E: dormir até de manhã' : pt ? (interior.estadoPorta(pt) ? 'E: fechar a porta' : 'E: abrir a porta') : naSaida ? 'E: sair de casa' : 'B: modo construção e garagem'; }
      else if (INT.tipo === 'oficina') dica = carros.some(c=>c.obj.position.distanceTo(p)<4.5)?'E: voltar ao veículo':Math.hypot(p.x - interior.oficina.x, p.z - interior.oficina.z) < 4 ? 'E: abrir City Customs' : naSaida ? 'E: sair da oficina' : '';
      else dica = Math.hypot(p.x - interior.caixa.x, p.z - interior.caixa.z) < 4 ? 'E: comprar ' + (INT.tipo === 'mercado' ? 'comida ($50)' : 'munição ($30)') : naSaida ? 'E: sair da loja' : '';
    }
    else { const c = carros.find(v => !v.destruido && v.obj.visible && v.obj.position.distanceTo(p) < 5), l = LUGARES.find(l => Math.hypot(l.x - p.x, l.z - p.z) < 26);
      dica = c ? 'E: entrar no ' + c.nome : l ? (l.tipo === 'casa' ? 'E: entrar em casa' : l.tipo === 'oficina' ? 'E: entrar na oficina' : 'E: entrar no ' + (l.tipo === 'mercado' ? 'mercado' : 'posto')) : org.obj.position.distanceTo(p) < 5 ? 'G: falar com o Rafa (mini-jogos)' : ''; }
  } else if (jog.veiculo) {
    const p = jog.veiculo.obj.position, oficinaPerto = !INT.on && LUGARES.some(l => l.tipo === 'oficina' && Math.hypot(l.x - p.x, l.z - p.z) < 34);
    const casaPerto=!INT.on&&LUGARES.some(l=>l.tipo==='casa'&&Tel.possui(l.idx)&&Math.hypot(l.x-p.x,l.z-p.z)<34);
    dica = oficinaPerto ? 'E: entrar na oficina com o veículo' : casaPerto?'E: entrar na garagem':INT.on && INT.tipo === 'oficina' && p.z > INT.z + INT.d / 2 - 3.4 ? 'E: sair da oficina com o veículo' : INT.on&&INT.tipo==='casa'&&p.z>INT.z+INT.d/2-3.4?'E: sair da garagem':'';
  }
  UI.dica(dica);
  uiT+=dt;mapT+=dt;
  if(uiT>=.05){uiT=0;$('missao').textContent=MG.texto()||M.texto(jog);UI.hud(jog,estrelas,ARMAS[arma],municao[arma],Esc.rotulo(),arsenal.reserva[arma],arsenal.recarga,Prog.nivel());}
  if(mapT>=.1){mapT=0;UI.mapas(jog,npcs,carros,MG.destino()||M.atual(),Online.posicoes(zonaOnline));}
  if (split) {
    $('hud2').textContent = 'J2 ❤ ' + Math.max(0, jog2.hp | 0); const p2 = jog2.obj.position, w = innerWidth >> 1, h = innerHeight;
    cam2.position.lerp(new THREE.Vector3(p2.x + Math.sin(jog2.yaw) * 5, p2.y + 2.6, p2.z + Math.cos(jog2.yaw) * 5), 1 - Math.exp(-8 * dt)); cam2.lookAt(p2.x, p2.y + 1.5, p2.z);
    renderer.setScissorTest(true); renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); renderer.render(scene, cam);
    renderer.setViewport(w, 0, w, h); renderer.setScissor(w, 0, w, h); cam2.aspect = w / h; cam2.updateProjectionMatrix(); renderer.render(scene, cam2);
  } else { renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); cinema ? cinema.render(cam) : renderer.render(scene, cam); }
}
requestAnimationFrame(loop);
