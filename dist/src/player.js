// Jogador e humanos: modelo 3D real (com animações) quando carregado, com reserva
// procedural (proporções básicas + rosto pintado) caso o modelo não esteja disponível.
import * as THREE from 'three';
import { colide, destinoParkour } from './world.js';
import { clamp, smooth, direcao, pontoSalto } from './mechanics.js';
import { criarVisualArma } from './weapon-models.js';
import * as Assets from './assets.js';
export const teclas = {};
let controlesAtivos = false;
export function habilitarControles(on) { controlesAtivos = on; if (!on) limparControles(); }
export function limparControles() { Object.keys(teclas).forEach(k => teclas[k] = false); }
export const digitando = e => /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || e.target?.isContentEditable;
addEventListener('keydown', e => { if (!controlesAtivos || digitando(e)) return; if (['Space','ControlLeft','ControlRight'].includes(e.code)) e.preventDefault(); teclas[e.code] = true; });
addEventListener('keyup', e => teclas[e.code] = false);
addEventListener('blur', limparControles);
const K1 = { f: 'KeyW', b: 'KeyS', l: 'KeyA', r: 'KeyD', run: 'ShiftLeft', ag: 'KeyC', pulo: 'Space' };
export const K2 = { f: 'KeyI', b: 'KeyK', l: 'KeyJ', r: 'KeyL', run: 'ShiftRight', ag: 'KeyN', pulo: 'KeyU', giro: true }; // jogador 2 (split-screen)

// Cada "tipo" de humano 3D: qual modelo usar, prefixo dos clipes de animação daquele
// modelo, nomes dos clipes (idle/andar/correr/soco) e o nome do osso da mão direita
// (onde a arma é encaixada). Ajuste "mao"/rotação da arma em trocarArma() se, ao
// testar no navegador, a arma aparecer torta na mão — não há como conferir isso sem
// abrir o jogo de verdade.
const TIPOS_HUMANO = {
  jogador: { chave: 'homemNegocios', prefixo: 'CharacterArmature|', idle: 'Idle', andar: 'Walk', correr: 'Run', soco: 'Punch_Right', mao: 'Wrist.R', altura: 1.85, rotY: Math.PI },
  homem: { chave: 'homem', prefixo: 'HumanArmature|Man_', idle: 'Idle', andar: 'Walk', correr: 'Run', soco: 'Punch', mao: 'Palm.R', altura: 1.78, rotY: Math.PI },
  mulher: { chave: 'mulher', prefixo: 'HumanArmature|Female_', idle: 'Idle', andar: 'Walk', correr: 'Run', soco: 'Punch', mao: 'Palm.R', altura: 1.72, rotY: Math.PI },
  // Modelo extra do "City Pack" (rig Mixamo: ossos LeftHand/RightHand em vez de Palm.L/.R).
  mulher2: { chave: 'mulher2', prefixo: 'Armature|', idle: 'Idle', andar: 'Walking', correr: 'Running', soco: 'Punch', mao: 'RightHand', altura: 1.72, rotY: Math.PI },
  soldado: { chave: 'soldado', prefixo: 'Armature|', idle: 'Standing', andar: 'Standing', correr: 'Standing', soco: 'Standing', mao: 'hand.R', altura: 1.78, rotY: Math.PI },
};
for(const [nome,chave] of Object.entries({miniCivilA:'miniCivilA',miniCivilB:'miniCivilB',miniCivilC:'miniCivilC',miniPolicial:'miniPolicial',miniFuncionario:'miniFuncionario'})){
  TIPOS_HUMANO[nome]={chave,prefixo:'',idle:'idle',andar:'walk',correr:'sprint',soco:'attack-melee-right',mao:'arm-right',altura:1.78,rotY:Math.PI,mini:true};
}
// Material.name -> qual parâmetro de cor de criarHumano() tinge aquele material.
const TINGIVEIS = { cor: ['Suit', 'Shirt', 'Jacket'], calca: ['Pants'], cabelo: ['Hair', 'HairBase'], pele: ['Skin'] };
export function aplicarAparencia(g,cores){
  g.traverse(n=>{if(!n.isMesh||!n.material)return;const mats=Array.isArray(n.material)?n.material:[n.material];for(const mat of mats)for(const campo in TINGIVEIS)if(TINGIVEIS[campo].includes(mat.name)&&cores[campo]!==undefined){mat.color.setHex(cores[campo]);mat.needsUpdate=true;}});
}

function tingir(material, cores) {
  for (const campo in TINGIVEIS) if (TINGIVEIS[campo].includes(material.name)) { const m2 = material.clone(); m2.color.setHex(cores[campo]); return m2; }
  return material;
}

// tipo: 'jogador' | 'npc' (sorteia homem/mulher) | 'soldado' (NPC fixo do mini-jogo)
export function criarHumano(cor, pele = 0xe0ac82, cabelo = 0x2b1b12, calca = 0x2b2b3a, tipo = 'npc', estilo = null) {
  const g = new THREE.Group();
  const tipoNpc = estilo?.modelo && TIPOS_HUMANO[estilo.modelo] ? estilo.modelo : ['homem', 'mulher', 'mulher2'][Math.random() * 3 | 0];
  const def = tipo === 'jogador' ? TIPOS_HUMANO.jogador : tipo === 'soldado' ? TIPOS_HUMANO.soldado : TIPOS_HUMANO[tipoNpc];
  const cena = Assets.clonarCena(def.chave);
  if (cena) {
    // Normaliza a altura (o "l" do MODELOS não existe aqui — usamos uma altura-alvo fixa por tipo).
    const caixa = new THREE.Box3().setFromObject(cena), altura = (caixa.max.y - caixa.min.y) || 1, s = def.altura / altura;
    cena.scale.setScalar(s); cena.position.y -= caixa.min.y * s; cena.rotation.y = def.rotY || 0; // pés no chão + frente correta
    const cores = { cor, calca, cabelo, pele };
    cena.traverse(n => {
      if (!n.isMesh || !n.material) return;
      n.material = Array.isArray(n.material) ? n.material.map(mat => tingir(mat, cores)) : tingir(n.material, cores);
      n.castShadow = n.receiveShadow = true; n.frustumCulled = false; // esqueleto clonado/redimensionado: bounding box não acompanha a animação — sem isto ele some ao sair do box original
    });
    g.add(cena);
    const mixer = new THREE.AnimationMixer(cena), clipes = Assets.animacoesDe(def.chave);
    const pegar = nome => { const c = clipes.find(cl => cl.name === def.prefixo + nome); return c ? mixer.clipAction(nome===def.andar||nome===def.correr?locomocaoLocal(c):c) : null; };
    const roll = clipes.find(c => /\|Roll$/.test(c.name));
    // Remove deslocamento embutido no clipe: a colisão controla o movimento.
    const rollLocal = roll?.clone(); if (rollLocal) rollLocal.tracks = rollLocal.tracks.filter(t => !t.name.endsWith('.position'));
    const jump = pegar(def.mini?'jump':'Jump');
    const tracks = [];
    if (!jump) for (const [nome,amplitude] of [['UpperLeg.L',-.9],['UpperLeg.R',-.55],['LowerLeg.L',1.1],['LowerLeg.R',.8],['UpperArm.L',-.6],['UpperArm.R',-.6]]) {
      const b = cena.getObjectByName(nome); if (b) tracks.push(new THREE.NumberKeyframeTrack(b.uuid+'.rotation[x]',[0,.16,.45,.75],[b.rotation.x,b.rotation.x+amplitude,b.rotation.x+amplitude*.7,b.rotation.x]));
    }
    const acoes = { idle: pegar(def.idle), andar: pegar(def.andar), correr: pegar(def.correr), soco: pegar(def.soco), pulo: jump || (tracks.length ? mixer.clipAction(new THREE.AnimationClip('salto',.75,tracks)) : null), rolar: rollLocal ? mixer.clipAction(rollLocal) : null };
    for (const a of [acoes.pulo,acoes.rolar]) if(a) {a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}
    if (acoes.soco) { acoes.soco.setLoop(THREE.LoopOnce, 1); acoes.soco.clampWhenFinished = true; }
    acoes.idle?.play(); mixer.update(0); // mede depois de aplicar a pose, pois o esqueleto muda o tamanho aparente
    cena.updateMatrixWorld(true);
    const visivel = new THREE.Box3().setFromObject(cena, true);
    const alturaVisivel = visivel.max.y - visivel.min.y;
    if (Number.isFinite(alturaVisivel) && alturaVisivel > .01) {
      cena.scale.multiplyScalar(def.altura / alturaVisivel);
      cena.updateMatrixWorld(true);
      const ajustada = new THREE.Box3().setFromObject(cena, true);
      cena.position.y -= ajustada.min.y;
    }
    g.userData = { miniRig:!!def.mini, modelo3d: true, mixer, acoes, animAtual: 'idle', mao: cena.getObjectByName(def.mao) || null, tipoModelo:tipoNpc, gun: null, muzzle: null, cena3d:cena,agachamento:0 };
    if(def.mini&&g.userData.mao){
      const socket=new THREE.Object3D();socket.name='MiniPalm.R';socket.position.set(-.26,0,.03);g.userData.mao.add(socket);g.userData.mao=socket;
    }
    if(estilo?.acessorio==='policia'&&!def.mini)cena.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const material of mats){if(/shirt|pants|socks|shoes/i.test(material.name)){material.color.setHex(/shirt/i.test(material.name)?0x24394c:0x17222e);material.roughness=.9;}}});
  } else {
    // ---- reserva procedural (usada só se o modelo 3D ainda não carregou) ----
    const L = (c, r = .85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const P = (geo, c, x, y, z, r) => { const o = new THREE.Mesh(geo, L(c, r)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
    const torso = P(new THREE.CapsuleGeometry(.2, .36, 8, 14), cor, 0, 1.3, 0); torso.scale.z = .6;
    const quad = P(new THREE.CapsuleGeometry(.19, .1, 8, 14), calca, 0, .98, 0); quad.scale.z = .62;
    const cab = P(new THREE.SphereGeometry(.12, 18, 16), pele, 0, 1.76, 0, .5); cab.scale.set(.92, 1.12, 1);
    const escuro = c => new THREE.Color(c).multiplyScalar(.6).getHex();
    const gola = P(new THREE.TorusGeometry(.1, .022, 6, 10), escuro(cor), 0, 1.52, 0, .9); gola.rotation.x = Math.PI / 2;
    const cinto = P(new THREE.BoxGeometry(.32, .05, .22), 0x1a1a1a, 0, 1.02, 0, .7);
    const fc = document.createElement('canvas'); fc.width = 64; fc.height = 64; const x = fc.getContext('2d');
    x.fillStyle = '#fff'; [20, 44].forEach(cx => { x.beginPath(); x.ellipse(cx, 28, 7, 4, 0, 0, 7); x.fill(); });
    x.fillStyle = '#3b2a1a'; [20, 44].forEach(cx => { x.beginPath(); x.arc(cx, 28, 3.2, 0, 7); x.fill(); });
    x.strokeStyle = '#' + cabelo.toString(16).padStart(6, '0'); x.lineWidth = 3; x.beginPath(); x.moveTo(12, 20); x.lineTo(28, 18); x.moveTo(36, 18); x.lineTo(52, 20); x.stroke();
    x.strokeStyle = '#8a3b3b'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(24, 50); x.quadraticCurveTo(32, 54, 40, 50); x.stroke();
    const tx = new THREE.CanvasTexture(fc); tx.colorSpace = THREE.SRGBColorSpace;
    const rosto = new THREE.Mesh(new THREE.PlaneGeometry(.17, .2), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); rosto.position.set(0, 1.765, -.108);
    const perna = px => { const p = new THREE.Group(); p.position.set(px, .95, 0); p.add(P(new THREE.CapsuleGeometry(.085, .62, 5, 10), calca, 0, -.42, 0), P(new THREE.BoxGeometry(.13, .09, .29), 0x151515, 0, -.9, -.06, .4)); return p; };
    const braco = px => { const p = new THREE.Group(); p.position.set(px, 1.5, 0); p.add(P(new THREE.CapsuleGeometry(.065, .2, 5, 10), cor, 0, -.15, 0), P(new THREE.CapsuleGeometry(.05, .24, 5, 10), pele, 0, -.42, 0, .5), P(new THREE.SphereGeometry(.055, 10, 8), pele, 0, -.6, 0, .5)); return p; };
    g.userData = { modelo3d: false, pe: perna(-.1), pd: perna(.1), be: braco(-.27), bd: braco(.27), gun: null, muzzle: null };
    g.add(torso, quad, cab, rosto, gola, cinto, P(new THREE.CylinderGeometry(.05, .06, .1, 8), pele, 0, 1.6, 0, .5), P(new THREE.SphereGeometry(.023, 8, 6), pele, 0, 1.75, -.118, .5),
      P(new THREE.SphereGeometry(.025, 8, 6), pele, -.115, 1.76, 0, .5), P(new THREE.SphereGeometry(.025, 8, 6), pele, .115, 1.76, 0, .5),
      P(new THREE.SphereGeometry(.13, 16, 12, 0, 6.283, 0, 1.35), cabelo, 0, 1.78, .01, .6), P(new THREE.SphereGeometry(.12, 12, 10), cabelo, 0, 1.74, .05, .6),
      P(new THREE.SphereGeometry(.08, 10, 8), cor, -.26, 1.5, 0), P(new THREE.SphereGeometry(.08, 10, 8), cor, .26, 1.5, 0), g.userData.pe, g.userData.pd, g.userData.be, g.userData.bd);
  }
  if (estilo?.acessorio && !def.mini) {
    // Acessórios de cabeça seguem a altura real do modelo carregado. Os GLBs têm
    // esqueletos e proporções diferentes; uma altura fixa fazia o chapéu flutuar.
    const caixaAcessorio=new THREE.Box3().setFromObject(g,true),topoCabeca=Number.isFinite(caixaAcessorio.max.y)?caixaAcessorio.max.y:1.82;
    const m=(c,metal=.05)=>new THREE.MeshStandardMaterial({color:c,roughness:.65,metalness:metal}), add=(geo,c,x,y,z)=>{const o=new THREE.Mesh(geo,m(c));o.position.set(x,y,z);o.castShadow=true;g.add(o);if(estilo.acessorio==='policia'&&g.userData.modelo3d){const osso=g.getObjectByName(y>topoCabeca-.2?'Head':y>1.15?'Chest':'Hips');if(osso){g.updateMatrixWorld(true);osso.attach(o);}}return o;};
    if(estilo.acessorio==='bone'){
      add(new THREE.CylinderGeometry(.135,.145,.075,14),estilo.detalhe,0,topoCabeca-.015,0);add(new THREE.BoxGeometry(.18,.025,.12),estilo.detalhe,0,topoCabeca-.045,-.12);
    }else if(estilo.acessorio==='chapeu'){
      add(new THREE.CylinderGeometry(.13,.145,.14,14),estilo.detalhe,0,topoCabeca+.02,0);add(new THREE.CylinderGeometry(.23,.23,.025,18),estilo.detalhe,0,topoCabeca-.045,0);
    }else if(estilo.acessorio==='mochila'){
      const b=add(new THREE.BoxGeometry(.34,.48,.16),estilo.detalhe,0,1.27,.16);b.geometry.translate(0,0,.02);
    }else if(estilo.acessorio==='oculos'){
      for(const x of [-.065,.065]){const l=add(new THREE.TorusGeometry(.052,.009,6,14),0x17191c,x,topoCabeca-.14,-.115);l.rotation.x=Math.PI/2;}add(new THREE.BoxGeometry(.035,.012,.014),0x17191c,0,topoCabeca-.14,-.12);
    }else if(estilo.acessorio==='fones'){
      const arco=add(new THREE.TorusGeometry(.135,.022,7,18,Math.PI),estilo.detalhe,0,topoCabeca-.015,0);arco.rotation.z=Math.PI;for(const x of [-.14,.14])add(new THREE.BoxGeometry(.05,.13,.07),estilo.detalhe,x,topoCabeca-.16,0);
    }else if(estilo.acessorio==='bolsa'){
      const alca=add(new THREE.TorusGeometry(.27,.018,7,22,Math.PI),estilo.detalhe,.13,1.32,.08);alca.rotation.z=-.65;add(new THREE.BoxGeometry(.25,.25,.1),estilo.detalhe,.25,1.03,.09);
    }else if(estilo.acessorio==='gorro'){
      add(new THREE.SphereGeometry(.145,14,8,0,Math.PI*2,0,Math.PI/2),estilo.detalhe,0,topoCabeca-.025,0);add(new THREE.TorusGeometry(.13,.025,6,16),estilo.detalhe,0,topoCabeca-.055,0).rotation.x=Math.PI/2;
    }else if(estilo.acessorio==='policia'){
      // Colete fino; o antigo bloco atravessava o tronco e parecia uma caixa.
      add(new THREE.BoxGeometry(.32,.35,.045),0x172b46,0,1.34,-.13); // colete
      add(new THREE.BoxGeometry(.055,.075,.018),0xe1b84c,-.11,1.44,-.1); // distintivo
      add(new THREE.BoxGeometry(.32,.045,.2),0x111923,0,1.02,0); // cinto tático
      add(new THREE.BoxGeometry(.075,.16,.1),0x16191d,.2,.96,.03); // coldre
      add(new THREE.CylinderGeometry(.135,.145,.07,14),0x142b4a,0,topoCabeca-.015,0);add(new THREE.BoxGeometry(.18,.022,.12),0x142b4a,0,topoCabeca-.045,-.12);
    }
    g.userData.personalidade=estilo.nome||'Cidadão';
  }
  return g;
}
export function trocarArma(g, i) { // 0-5 armas; 6 = punhos (mãos livres)
  const u = g.userData; if (u.gun) { u.gun.removeFromParent(); u.gun = null; }
  u.muzzle = null;
  const visual = criarVisualArma(i); u.armado = !!visual; if (!visual) return;
  // A arma fica no espaço local do personagem: assim não desaparece dentro do
  // pulso de esqueletos diferentes. atualizarArmaTerceiraPessoa a mantém na mão.
  visual.userData.indice=i;u.gun = visual; u.muzzle = visual.userData.muzzle; g.add(visual);
  atualizarArmaTerceiraPessoa(g,false);
}
// Cada modelo de personagem (Wrist.R, Palm.R, RightHand, hand.R...) tem o osso da mão girado de um jeito,
// e a arma já apareceu virada para trás em alguns. Em vez de ajustar modelo por modelo, a arma confere para
// onde o cano aponta (a frente do personagem é -Z) e, se estiver para trás, gira 180° em torno do eixo vertical.
const BOCA_DIR=new THREE.Vector3(),GIRO_Y=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),GIRO_X=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI);
function corrigirSentidoCano(arma,boca,frenteMinima,paraBaixo=false){
  if(!boca||boca.position.lengthSq()<1e-6)return;
  BOCA_DIR.copy(boca.position).normalize().applyQuaternion(arma.quaternion);
  if(-BOCA_DIR.z<frenteMinima){arma.quaternion.premultiply(GIRO_Y);BOCA_DIR.applyQuaternion(GIRO_Y);}
  // Arma relaxada com o cano apontando para cima (mão girada ao contrário): vira para baixo.
  if(paraBaixo&&BOCA_DIR.y>.35)arma.quaternion.premultiply(GIRO_X);
}
const MAO_MUNDO=new THREE.Vector3(),MAO_LOCAL=new THREE.Vector3(),MAO_Q=new THREE.Quaternion(),CORPO_Q=new THREE.Quaternion(),AJUSTE_Q=new THREE.Quaternion(),COTOVELO_MUNDO=new THREE.Vector3(),PALMA_DIRECAO=new THREE.Vector3();
// Escala em terceira pessoa (personagem ~1,8 m): comprimento final aprox. pistola .31 m,
// submetralhadora .57 m, fuzil 1.04 m, shotgun .98 m, sniper 1.2 m, lança-foguetes .99 m.
const ESCALA_TP=[1.3,1.5,1.3,1.3,1.2,1.1];
function restaurarPoseArma(g){const pose=g?.userData?.poseArma;if(!pose)return;for(const p of pose)p.osso.quaternion.copy(p.q);g.userData.poseArma=null;g.updateMatrixWorld(true);}
export function atualizarArmaTerceiraPessoa(g, mirando=false, ocultar=false) {
  const u=g?.userData,arma=u?.gun;if(!arma)return;restaurarPoseArma(g);
  arma.visible=!ocultar;if(ocultar)return;
  const i=arma.userData.indice||0;
  const escala=ESCALA_TP[i]||1;arma.scale.setScalar(escala);
  if(mirando&&u.miniRig){
    if(!u.miniMira){const clip=Assets.animacoesDe(u.tipoModelo).find(c=>c.name==='holding-both-shoot');u.miniMira=['arm-right','arm-left'].map(nome=>({osso:g.getObjectByName(nome),track:clip?.tracks.find(t=>t.name===nome+'.quaternion')}));}
    u.poseArma=[];for(const p of u.miniMira)if(p.osso&&p.track){u.poseArma.push({osso:p.osso,q:p.osso.quaternion.clone()});p.osso.quaternion.fromArray(p.track.values,0);}g.updateMatrixWorld(true);
  }
  if(mirando&&u.modelo3d&&!u.miniRig){
    const ajustes=[['UpperArm.R',-1.02,.12],['LowerArm.R',-.58,0],['UpperArm.L',-1.08,-.16],['LowerArm.L',-.72,0]],pose=[];
    if(!u.ossosMira)u.ossosMira=ajustes.map(([nome])=>g.getObjectByName(nome)); // procurar por nome a cada quadro percorria o esqueleto inteiro
    ajustes.forEach(([nome,rx,rz],k)=>{const osso=u.ossosMira[k];if(!osso)return;pose.push({osso,q:osso.quaternion.clone()});osso.rotateX(rx);if(rz)osso.rotateZ(rz);});
    u.poseArma=pose;g.updateMatrixWorld(true);
  }
  let mao=null;
  if(u.mao){
    u.mao.getWorldPosition(MAO_MUNDO);
    // Usa o centro anatômico da palma, entre o pulso e a base dos dedos.
    // A direção do antebraço não acompanha a flexão do pulso e afastava o cabo.
    if(u.dedosArma===undefined)u.dedosArma=g.getObjectByName('Middle2.R')||g.getObjectByName('mixamorigRightHandMiddle1')||null;
    if(u.dedosArma){u.dedosArma.getWorldPosition(COTOVELO_MUNDO);MAO_MUNDO.lerp(COTOVELO_MUNDO,.55);}
    else if(/wrist/i.test(u.mao.name)&&u.mao.parent){u.mao.parent.getWorldPosition(COTOVELO_MUNDO);PALMA_DIRECAO.copy(MAO_MUNDO).sub(COTOVELO_MUNDO).normalize();MAO_MUNDO.addScaledVector(PALMA_DIRECAO,.035);}
    MAO_LOCAL.copy(MAO_MUNDO);g.worldToLocal(MAO_LOCAL);mao=MAO_LOCAL;
    // A arma acompanha posição E rotação do pulso. Antes ela seguia somente a
    // posição, por isso parecia flutuar ao lado da mão durante animações.
    u.mao.getWorldQuaternion(MAO_Q);g.getWorldQuaternion(CORPO_Q);CORPO_Q.invert();arma.quaternion.copy(CORPO_Q).multiply(MAO_Q);
  }else arma.quaternion.identity();
  if(mirando){
    if(mao)arma.position.copy(mao);
    else arma.position.set(.29,1.32,-.34);
    AJUSTE_Q.setFromEuler(new THREE.Euler(i===5?.02:-.08,Math.PI,i===0?.04:0,'YXZ'));arma.quaternion.multiply(AJUSTE_Q);
    if(u.miniRig)arma.quaternion.identity();
    corrigirSentidoCano(arma,u.muzzle,.45); // mirando: o cano precisa apontar para a frente
  }else{
    // Posição relaxada: a empunhadura continua dentro da mão, com o cano para
    // baixo, em vez de a arma ficar solta ou atravessar o braço.
    if(mao)arma.position.copy(mao);
    else arma.position.set(.27,.88,.03);
    AJUSTE_Q.setFromEuler(new THREE.Euler(-Math.PI/2,Math.PI,i===0?.1:0,'YXZ'));arma.quaternion.multiply(AJUSTE_Q);
    corrigirSentidoCano(arma,u.muzzle,-.25,true); // relaxada: pode apontar para baixo, nunca para trás
  }
}
export function pontaDaArma(g, destino = new THREE.Vector3()) {
  const boca = g?.userData?.muzzle;
  if (!boca) return null;
  boca.getWorldPosition(destino); return destino;
}
export function animar(g, vel, t, dt) {
  const u = g.userData;
  restaurarPoseArma(g);
  restaurarAgachamento(u);
  if (u.modelo3d) {
    u.mixer?.update(dt || 0);
    let alvo = 'idle';
    if (u.movimento === 'rolar') alvo = 'rolar'; else if (u.movimento === 'pulo' || u.movimento === 'parkour') alvo = 'pulo'; else if (u.socoAte && t < u.socoAte) alvo = 'soco'; else if (vel > 6) alvo = 'correr'; else if (vel > .15) alvo = 'andar';
    if (alvo !== u.animAtual) {
      const prox = u.acoes[alvo] || u.acoes.idle, atual = u.acoes[u.animAtual];
      if (prox && prox !== atual) { prox.reset().setEffectiveWeight(1).fadeIn(.12).play(); atual?.fadeOut(.12); } u.animAtual = alvo;
    }
    aplicarAgachamento(g,u);
    return;
  }
  // reserva procedural
  const a = Math.sin(t * 8) * Math.min(1, vel / 3) * .8; u.pe.rotation.x = a; u.pd.rotation.x = -a;
  if (u.socoAte && t < u.socoAte) { u.bd.rotation.x = 1.57; u.be.rotation.x = -.4; } // soco
  else if (u.armado) { u.bd.rotation.x = 1.45; u.be.rotation.x = 1.15; u.be.rotation.z = .3; } else { u.be.rotation.x = -a; u.bd.rotation.x = a; u.be.rotation.z = 0; }
}

const PE_AGACHADO=new THREE.Vector3();
const LOCOMOCAO_CACHE=new WeakMap();
export function locomocaoLocal(clipe){
  if(LOCOMOCAO_CACHE.has(clipe))return LOCOMOCAO_CACHE.get(clipe);
  const local=clipe.clone();
  for(const tr of local.tracks){
    if(!/(?:Body|Root|Hips|Armature)\.position$/.test(tr.name))continue;
    const x=tr.values[0],z=tr.values[2];
    for(let i=0;i<tr.values.length;i+=3){tr.values[i]=x;tr.values[i+2]=z;}
  }
  for(const tr of local.tracks){
    const n=tr.getValueSize();if(tr.times.length<2||n>4)continue;
    const fim=tr.values.length-n;let sinal=1;
    if(n===4&&tr.name.endsWith('.quaternion')){let dot=0;for(let k=0;k<4;k++)dot+=tr.values[k]*tr.values[fim+k];if(dot<0)sinal=-1;}
    for(let k=0;k<n;k++)tr.values[fim+k]=tr.values[k]*sinal;
  }
  LOCOMOCAO_CACHE.set(clipe,local);return local;
}
function restaurarAgachamento(u){
  if(!u.agachPoseAtiva)return;
  for(const p of u.agachPose)p.osso.quaternion.copy(p.q);
  u.cena3d.position.y-=u.agachOffset||0;u.agachOffset=0;u.agachPoseAtiva=false;
}
function aplicarAgachamento(g,u){
  const k=u.agachamento||0;if(k<.001)return;
  if(!u.agachPose){u.agachPose=[['UpperLeg.L',-.9],['UpperLeg.R',-.9],['LowerLeg.L',1.65],['LowerLeg.R',1.65],['Foot.L',-.75],['Foot.R',-.75],['Chest',.3]].map(([nome,rx])=>{const osso=g.getObjectByName(nome);return osso?{osso,rx,q:new THREE.Quaternion()}:null;}).filter(Boolean);u.pesAgachamento=['Foot.L','Foot.R'].map(nome=>g.getObjectByName(nome)).filter(Boolean);}
  const alturaPes=()=>{let y=Infinity;for(const pe of u.pesAgachamento){pe.getWorldPosition(PE_AGACHADO);y=Math.min(y,PE_AGACHADO.y);}return y;};
  const antes=alturaPes();for(const p of u.agachPose){p.q.copy(p.osso.quaternion);p.osso.rotateX(p.rx*k);}
  u.cena3d.updateMatrixWorld(true);const depois=alturaPes();
  if(Number.isFinite(antes)&&Number.isFinite(depois)){u.agachOffset=(antes-depois)/Math.max(.001,g.scale.y);u.cena3d.position.y+=u.agachOffset;}
  u.agachPoseAtiva=true;
}

export class Jogador {
  constructor(scene, opt = {}) {
    this.k = opt.k || K1; this.obj = criarHumano(opt.cor || 0x1f4e79, opt.pele, opt.cabelo, opt.calca, 'jogador'); scene.add(this.obj); trocarArma(this.obj, 0); this.obj.position.set(opt.x ?? 6, 0, 30);
    Object.assign(this, { yaw: 0, cameraYaw: 0, pitch: 0, vy: 0, hp: 100, st: 100, dinheiro: 500, veiculo: null, olho: 0, mira: false, morto: false, tm: 0, tt: 0, agachado: false, vx:0, vz:0, rolando:0, esquivaCd:0, puloPressionado:false, ctrlPressionado:false, exausto:false, salto:null });
  }
  morrer() { this.morto = true; this.tm = 0; this.veiculo = null; }
  renascer() { this.morto = false; this.obj.rotation.x = 0; this.obj.scale.setScalar(1); this.yaw = this.cameraYaw = 0; this.vx = this.vz = this.vy = this.rolando = this.esquivaCd = 0; this.salto = null; this.st = 100; this.exausto = false; this.obj.userData.movimento = 'idle'; this.hp = 100; this.dinheiro = Math.floor(this.dinheiro * .9); this.obj.position.set(6, 0, 30); this.aoRenascer?.(); }
  atualizar(dt,atualizarAnimacao=true) {
    if (this.morto) { this.tm += dt; this.obj.rotation.x = Math.min(this.tm * 4, 1.5); this.obj.position.y = .2; if (this.tm > 3.5) this.renascer(); return; }
    if (this.veiculo) return;
    const k = this.k, p = this.obj.position;
    this.esquivaCd = Math.max(0,this.esquivaCd-dt); this.tt += dt;
    if(this.st < 1) this.exausto=true; if(this.st>24) this.exausto=false;
    this.agachado = !!teclas[k.ag] && !this.rolando && !this.salto;
    this.obj.scale.y=1;this.obj.userData.agachamento=smooth(this.obj.userData.agachamento||0,this.agachado?1:0,12,dt);
    if (k.giro) this.yaw += ((teclas[k.l] ? 1 : 0) - (teclas[k.r] ? 1 : 0)) * 2.2 * dt;
    const fx = (teclas[k.f] ? 1 : 0) - (teclas[k.b] ? 1 : 0), sx = k.giro ? 0 : (teclas[k.r] ? 1 : 0) - (teclas[k.l] ? 1 : 0);
    const correr = teclas[k.run] && !this.exausto && !this.agachado && (fx || sx);
    const v = (correr ? 9 : this.agachado ? 2.2 : 4.5) * (this.mira ? .6 : 1);
    const direcaoCamera = k.giro ? this.yaw : this.cameraYaw, dir = direcao(fx,sx,direcaoCamera);
    const saltoNovo=!!teclas[k.pulo]&&!this.puloPressionado, ctrl=!!teclas[k.giro?'KeyB':'ControlLeft']||(!k.giro&&!!teclas.ControlRight), esquivaNova=ctrl&&!this.ctrlPressionado;
    this.puloPressionado=!!teclas[k.pulo];this.ctrlPressionado=ctrl;
    if(esquivaNova && !this.salto && p.y===0 && this.esquivaCd===0 && this.st>=24){
      this.rolando=.62;this.esquivaCd=1.1;this.st-=24;const d=fx||sx?dir:direcao(1,0,direcaoCamera);this.rollDir=d;this.yaw=Math.atan2(-d.x,-d.z);this.obj.userData.acoes?.rolar?.reset();
      dispatchEvent(new CustomEvent('city-event',{detail:{tipo:'esquiva'}}));
    }
    if(saltoNovo && !this.rolando && !this.salto && p.y===0){
      const alvo=destinoParkour(p,direcaoCamera);
      if(alvo && this.st>=12){this.st-=12;this.salto={inicio:{x:p.x,z:p.z},fim:alvo,t:0};dispatchEvent(new CustomEvent('city-event',{detail:{tipo:'parkour'}}));}
      else this.vy=6.2;
      this.obj.userData.acoes?.pulo?.reset();
    }
    this.vx=smooth(this.vx,dir.x*v,fx||sx?14:19,dt);this.vz=smooth(this.vz,dir.z*v,fx||sx?14:19,dt);
    let dx=this.vx*dt,dz=this.vz*dt;
    if(this.rolando>0){this.rolando=Math.max(0,this.rolando-dt);dx=this.rollDir.x*7.5*dt;dz=this.rollDir.z*7.5*dt;}
    if(this.salto){const s=this.salto;s.t+=dt;const q=pontoSalto(s.inicio,s.fim,s.t/.68,s.fim.h);p.set(q.x,q.y,q.z);if(s.t>=.68){this.salto=null;this.vy=0;}dx=dz=0;}
    else {if(!colide(p.x+dx,p.z,.35,p.y))p.x+=dx;else this.vx=0;if(!colide(p.x,p.z+dz,.35,p.y))p.z+=dz;else this.vz=0;}
    this.st = clamp(this.st + (correr && !this.rolando ? -18 : this.rolando||this.salto ? 0 : 13) * dt,0,100);
    if(!this.salto){
    this.vy -= 18 * dt; p.y = Math.max(0, p.y + this.vy * dt); if (p.y === 0) this.vy = 0;
    }
    if (!k.giro && (fx || sx) && !this.rolando) {
      const alvoYaw = Math.atan2(-dx, -dz), delta = Math.atan2(Math.sin(alvoYaw - this.yaw), Math.cos(alvoYaw - this.yaw));
      this.yaw += delta * Math.min(1, dt * 14); // corpo acompanha suavemente a direção do movimento
    } else if (!k.giro && this.mira) this.yaw = this.cameraYaw;
    this.obj.userData.movimento=this.salto?'parkour':this.rolando?'rolar':p.y>.05?'pulo':this.agachado?'agachado':correr?'correr':fx||sx?'andar':'idle';
    this.obj.rotation.y = this.yaw;if(atualizarAnimacao)animar(this.obj,Math.hypot(this.vx,this.vz),this.tt,dt);
  }
}
