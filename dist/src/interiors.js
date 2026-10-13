// Interiores jogáveis e detalhados. Eles ficam em uma área separada do mapa;
// somente o prédio atual é exibido para manter o desempenho no celular.
import * as THREE from 'three';
import { INT } from './world.js';
import { criarHumano } from './player.js';
import * as Assets from './assets.js';

import { PAREDES, PORTAS, MOVEIS, COMODOS, JANELAS, LUZES, VAGA_CARRO } from './casa-layout.js';
import { criarMovel, aplicarEstilo, fundirMoveis } from './furniture.js';
import { fundirEstaticos } from './static-models.js';
import { CASAS, casaDefinida } from './casas-catalogo.js';
export function criarInterior(scene, fraco = false, luzes = null) {
  const raiz = new THREE.Group();
  raiz.position.set(INT.x, 0, INT.z); scene.add(raiz);
  const mat = (c, metalness = 0, roughness = .75, emissive = 0) => new THREE.MeshStandardMaterial({ color: c, metalness, roughness, emissive, emissiveIntensity: emissive ? .65 : 0 });
  const B = (pai, w, h, d, c, x, y, z, metal = 0, rough = .75, emissive = 0) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, metal, rough, emissive));
    o.position.set(x, y, z); o.castShadow = h > .3; o.receiveShadow = true; pai.add(o); return o;
  };
  const C = (pai, raio, h, c, x, y, z, ry = 0, metal = 0, deitado = false) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, h, 20), mat(c, metal, .55));
    o.position.set(x, y, z); o.rotation.set(deitado ? Math.PI / 2 : 0, ry, 0); o.castShadow = true; o.receiveShadow = true; pai.add(o); return o;
  };
  const mob = (pai, chave, x, z, tamanho, ry = 0, y = .12) => {
    const o = Assets.clonarCena(chave); if (!o) return null;
    const box = new THREE.Box3().setFromObject(o), centro = new THREE.Vector3(); box.getCenter(centro);
    const tam = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z) || 1;
    const base = new THREE.Group(); o.position.set(-centro.x, -box.min.y, -centro.z); base.add(o);
    base.scale.setScalar(tamanho / tam); base.position.set(x, y, z); base.rotation.y = ry;
    base.traverse(n => { if (n.isMesh) { n.receiveShadow = true; n.castShadow = true; } }); pai.add(base);if(pai.userData.colisoes&&y<=.13){base.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(base),t=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());pai.worldToLocal(c);if(t.y>.45)pai.userData.colisoes.push([c.x,c.z,t.x,t.z,t.y]);}return base;
  };
  const texto = (pai, msg, x, y, z, w, h, cor = '#fff', fundo = '#111d', ry = 0) => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const ctx = cv.getContext('2d');
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = cor; ctx.lineWidth = 8; ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = cor; ctx.font = '900 58px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, 256, 68);
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, side: THREE.DoubleSide }));
    o.position.set(x, y, z); o.rotation.y = ry; pai.add(o); return o;
  };
  // IMPORTANTE (anti-travamento): o Three.js recompila TODOS os materiais da cena
  // quando a quantidade de luzes visíveis muda. Por isso nenhuma luz é criada,
  // ligada ou desligada ao entrar/sair de um prédio. Existe um conjunto fixo de
  // luzes (sempre na cena) que apenas muda de posição e intensidade.
  const luz = (pai, x, y, z, intensidade = 1.5, distancia = 10) => {
    B(pai, 2.4, .06, .34, 0xffffff, x, y, z, .1, .2, 0xffffff);
    (pai.userData.luzes || (pai.userData.luzes = [])).push({ x, y: y - .18, z, i: intensidade, d: distancia });
  };
  const AMBIENTES = { loja: [0xffffff, 0x777777, 0], casa: [0xfff1d0, 0x4b5360, .55], oficina: [0xe9f5ff, 0x343b42, .7] };
  const janela = (pai, x, y, z, w, h, ry = 0) => {
    const moldura = new THREE.Group(); moldura.position.set(x, y, z); moldura.rotation.y = ry; pai.add(moldura);
    B(moldura, w, .1, .09, 0x303942, 0, h / 2, 0); B(moldura, w, .1, .09, 0x303942, 0, -h / 2, 0);
    B(moldura, .1, h, .09, 0x303942, -w / 2, 0, 0); B(moldura, .1, h, .09, 0x303942, w / 2, 0, 0);
    B(moldura, .06, h, .08, 0x303942, 0, 0, 0);
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(w - .14, h - .14), new THREE.MeshPhysicalMaterial({ color: 0x8ac7e8, transparent: true, opacity: .45, roughness: .12, metalness: .05, side: THREE.DoubleSide }));
    vidro.position.z = .015; moldura.add(vidro);
  };
  const ambiente = (w, d, piso, parede, abertura = 0, altura = 4.2) => {
    const g = new THREE.Group(); raiz.add(g);
    const pisoObj = B(g, w, .18, d, piso, 0, 0, 0);
    B(g, w, altura, .25, parede, 0, altura / 2, -d / 2);
    B(g, .25, altura, d, parede, -w / 2, altura / 2, 0); B(g, .25, altura, d, parede, w / 2, altura / 2, 0);
    if (abertura > 0) {
      const lateral = (w - abertura) / 2;
      B(g, lateral, altura, .25, parede, -(abertura + lateral) / 2, altura / 2, d / 2);
      B(g, lateral, altura, .25, parede, (abertura + lateral) / 2, altura / 2, d / 2);
      B(g, abertura, .7, .25, parede, 0, altura - .35, d / 2);
    } else B(g, w, altura, .25, parede, 0, altura / 2, d / 2);
    B(g, w, .16, d, 0xf4f0e8, 0, altura, 0);
    // Rodapés deixam a ligação entre parede e piso mais natural.
    B(g, w - .3, .14, .09, 0x7b7065, 0, .16, -d / 2 + .15);
    B(g, .09, .14, d - .3, 0x7b7065, -w / 2 + .15, .16, 0); B(g, .09, .14, d - .3, 0x7b7065, w / 2 - .15, .16, 0);
    g.userData.piso = pisoObj; return g;
  };
  const paredeX = (pai, x, z, d, c = 0xd7d1c7, h = 3.75) => B(pai, .16, h, d, c, x, h / 2, z);
  const paredeZ = (pai, x, z, w, c = 0xd7d1c7, h = 3.75) => B(pai, w, h, .16, c, x, h / 2, z);

  // Mercado/posto: corredores organizados, caixa, geladeira e área de espera.
  const loja = ambiente(16, 12, 0x7e878d, 0xe7e3da, 3.2);
  B(loja, 15.4, .035, 1.1, 0xcfd5d7, 0, .11, 0);
  const detalhesLoja = new THREE.Group(); loja.add(detalhesLoja);detalhesLoja.userData.colisoes=[];
  [-5.5,-2.5,.5,3.5].forEach((x,i)=>mob(detalhesLoja,i%2?'mobMercadoSacolas':'mobMercadoPrateleira',x,-.9,2.15,Math.PI/2));
  mob(loja, 'mobBalcao', 0, -4.5, 3.1); mob(detalhesLoja, 'mobMercadoCaixa', -.8, -4.45, .62,0,1.04); mob(loja, 'mobCadeira', 1.65, -4.25, 1.05);
  mob(detalhesLoja, 'mobMercadoFreezer', -6.35, 3.25, 2.15); mob(loja, 'mobPlanta', 6.2, 3.9, 1.3); mob(loja, 'mobSofa', 4.7, 4.1, 2.2, Math.PI);
  mob(detalhesLoja,'mobMercadoFruta',-5.5,-3.7,1.5);mob(detalhesLoja,'mobMercadoPao',3.5,-3.7,1.5);
  mob(detalhesLoja,'mobTrabalhoCaixa',-6.5,-4.7,.7);
  mob(detalhesLoja,'mobMercadoCarrinho',-6.4,4.8,1.1);mob(detalhesLoja,'mobMercadoCesta',-.8,-4.1,.45,0,1.05);
  fundirEstaticos(detalhesLoja);
  const placaLoja = B(loja, 6, 1, .1, 0x0b6b2e, 0, 3.3, -5.82);
  luz(loja, -4.2, 3.9, 0, 1.15, 9); luz(loja, 4.2, 3.9, 0, 1.15, 9);
  const caixa = criarHumano(0xffffff,0xc68642,0x2b1b12,0x24354c,'npc',{modelo:'miniFuncionario',nome:'Atendente'}); caixa.position.set(0, 0, -5.35); caixa.rotation.y = Math.PI; loja.add(caixa);

  // Casa (v31): planta coerente e validada em tests/house-layout.mjs (dados em casa-layout.js).
  //   Oeste: GARAGEM na frente (onde o carro entra) · QUARTO atrás · BANHEIRO no canto.
  //   Leste: SALA na frente (porta social ao centro) · COZINHA/JANTAR atrás.
  // Frente aberta o suficiente para a garagem à esquerda e a porta social ao centro.
  const casa = ambiente(24, 18, 0x845f42, 0xe8e3d9, 18); casa.visible = false;
  B(casa, 1.7, 4.2, .25, 0xe8e3d9, -1.9, 2.1, 9);B(casa, 7.4, 4.2, .25, 0xe8e3d9, 5.3, 2.1, 9);
  B(casa, 6.4, .35, .35, 0x3d464c, -6.3, 3.85, 8.86,.5,.35);for(const x of [-9.35,-3.25])B(casa,.35,3.9,.35,0x3d464c,x,1.95,8.86,.5,.35);
  const pisoCasa = casa.userData.piso;
  const PISOS = { concreto: [0x343b41, .25, .58], madeira: [0x956f50, 0, .6], azulejo: [0xd5d0c4, 0, .35] };
  const pisosMadeira = [];
  for (const c of COMODOS) { const [cor, m, r] = PISOS[c.piso]; const o = B(casa, c.w, .04, c.d, cor, c.x, .12, c.z, m, r); o.castShadow = false; if (c.piso === 'madeira') pisosMadeira.push(o); }
  for (const x of [VAGA_CARRO.x - VAGA_CARRO.w / 2 - .1, VAGA_CARRO.x + VAGA_CARRO.w / 2 + .1]) B(casa, .12, .02, VAGA_CARRO.d + .4, 0xd2a800, x, .15, VAGA_CARRO.z); // vaga marcada no piso
  // Paredes internas: cada trecho vem de PAREDES; os vãos entre eles recebem as portas.
  for (const w of PAREDES) for (const [ini, fim] of w.trechos) {
    if (w.eixo === 'x') paredeX(casa, w.linha, (ini + fim) / 2, fim - ini); else paredeZ(casa, (ini + fim) / 2, w.linha, fim - ini);
  }
  // Portas reais: batente, verga, folha presa por dobradiça exatamente no vão da
  // parede, maçanetas nos dois lados e abertura/fechamento com a tecla E.
  // eixo 'x' = parede ao longo de Z (porta no plano x=fixo); eixo 'z' = parede ao longo de X.
  // A dobradiça fica sempre na ponta "ini" do vão; (abreX, abreZ) é para onde a folha aponta aberta.
  const portas = [];
  const ALT_PORTA = 2.45, ALT_PAREDE = 3.75, JAMBA = .09, FOLGA = .02, MADEIRA = 0x6e4d34, BATENTE = 0x4a3524;
  const criarPorta = (pai, eixo, fixo, ini, fim, abreX, abreZ) => {
    const vao = fim - ini, centro = (ini + fim) / 2;
    const P = (t, y, off = 0) => eixo === 'x' ? [fixo + off, y, t] : [t, y, fixo + off]; // (ao longo da parede, altura, espessura)
    const peca = (comp, h, esp, cor, t, y) => B(pai, eixo === 'x' ? esp : comp, h, eixo === 'x' ? comp : esp, cor, ...P(t, y), 0, .7);
    peca(JAMBA, ALT_PORTA, ESP_PAREDE_PORTA, BATENTE, ini + JAMBA / 2, ALT_PORTA / 2);
    peca(JAMBA, ALT_PORTA, ESP_PAREDE_PORTA, BATENTE, fim - JAMBA / 2, ALT_PORTA / 2);
    peca(vao, .08, ESP_PAREDE_PORTA, BATENTE, centro, ALT_PORTA + .04);
    const alturaVerga = ALT_PAREDE - ALT_PORTA - .08;
    peca(vao, alturaVerga, .16, 0xd7d1c7, centro, ALT_PORTA + .08 + alturaVerga / 2).userData.parede = true; // acompanha a cor da parede
    const largura = vao - JAMBA * 2 - FOLGA * 2;
    const pivo = new THREE.Group(); pivo.position.set(...P(ini + JAMBA + FOLGA, 0)); pai.add(pivo);
    const folha = new THREE.Group(); folha.position.x = largura / 2; pivo.add(folha); // a folha se estende em +X local
    const parte = (w, h, d, cor, x, y, z, metal = 0, rough = .62) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(cor, metal, rough)); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; folha.add(o); return o;
    };
    parte(largura, ALT_PORTA - .05, .055, MADEIRA, 0, (ALT_PORTA - .05) / 2 + .03, 0);
    for (const lado of [-1, 1]) { // almofadas em relevo e maçaneta nas duas faces
      parte(largura * .72, .8, .014, 0x80583a, 0, 1.75, lado * .033); parte(largura * .72, .8, .014, 0x80583a, 0, .7, lado * .033);
      parte(.07, .07, .05, 0xc9ced1, largura / 2 - .12, 1.05, lado * .05, .9, .3);
    }
    const ang = (dx, dz) => Math.atan2(-dz, dx); // giro em Y que leva +X local para (dx, dz)
    const fechada = eixo === 'x' ? ang(0, 1) : ang(1, 0);
    let aberta = ang(abreX, abreZ);
    while (aberta - fechada > Math.PI) aberta -= Math.PI * 2; while (aberta - fechada < -Math.PI) aberta += Math.PI * 2;
    pivo.rotation.y = fechada;
    const col = eixo === 'x' ? { x: fixo, z: centro, w: .24, d: vao, h: 2.5, off: false } : { x: centro, z: fixo, w: vao, d: .24, h: 2.5, off: false };
    const porta = { pivo, col, ang: fechada, fechada, aberta, alvo: 0, x: col.x, z: col.z, vao };
    portas.push(porta); return porta;
  };
  const ESP_PAREDE_PORTA = .24;
  for (const p of PORTAS) criarPorta(casa, p.eixo, p.linha, p.ini, p.fim, p.abre[0], p.abre[1]);
  // Móveis com acabamento (pés, almofadas, portas, puxadores) — ver furniture.js
  const mobiliario = new THREE.Group(); casa.add(mobiliario);
  for (const m of MOVEIS) {
    const o = criarMovel(m.t, m.w, m.d, m.h); o.position.set(m.x, .14 + (m.y || 0), m.z); o.rotation.y = m.ry || 0; mobiliario.add(o);
  }
  fundirMoveis(mobiliario); // poucas malhas por material = interior leve no celular
  for (const j of JANELAS) {
    if (j.parede === 'fundo') janela(casa, j.pos, 2.25, -8.84, j.w, 1.45); else janela(casa, 11.84, 2.25, j.pos, j.w, 1.45, -Math.PI / 2);
  }
  texto(casa, 'GARAGEM', -6.0, 3.05, 1.12, 3.8, .85, '#ffd52a');
  for (const l of LUZES) luz(casa, l.x, 3.92, l.z, l.i, l.d);

  // Apenas a residência ganha jardins laterais. Mantemos as coordenadas da
  // cama, portas, móveis e vaga existentes para preservar interação e saves.
  const tetoCasa=casa.children.find(o=>o.isMesh&&o.geometry.parameters.width===24&&o.geometry.parameters.height===.16&&o.geometry.parameters.depth===18);
  const paredeDireita=casa.children.find(o=>o.isMesh&&o.position.x===12&&o.geometry.parameters.height===4.2);
  const paredeEsquerda=casa.children.find(o=>o.isMesh&&o.position.x===-12&&o.geometry.parameters.height===4.2);
  paredeDireita.visible=false;
  B(casa,.25,4.2,9.5,0xe8e3d9,12,2.1,-4.25);B(casa,.25,4.2,4,0xe8e3d9,12,2.1,7);B(casa,.25,1,4.5,0xe8e3d9,12,3.7,2.75);
  const variantesCasa=CASAS.map((def,i)=>{
    const g=new THREE.Group();g.name='interior-casa-'+def.modelo;casa.add(g);g.visible=false;
    const madeira=i===3?0x6c452c:i===2?0x3e4249:0xb59472;
    B(g,6,.1,18,i===3?0x658b4e:0xb6b6aa,15,.02,0);
    for(const z of [-8.8,8.8])B(g,6,.6,.18,0x9b9c90,15,.3,z);
    B(g,.18,.6,18,0x9b9c90,17.85,.3,0);
    if(def.piscina){
      B(g,4.3,.09,5.5,0xa4cbd1,15,.08,-3.5);B(g,3.8,.025,5,0x309bb5,15,.14,-3.5,.25,.18);
      for(const x of [12.9,17.1])B(g,.15,.15,5.5,0xe8e1d2,x,.16,-3.5);
      for(const z of [-6.2,-.8])B(g,4.3,.15,.15,0xe8e1d2,15,.16,z);
      for(const x of [14,16]){B(g,.8,.18,1.9,madeira,x,.26,6.1);B(g,.8,.55,.14,0xe1d9bf,x,.54,6.9);}
    }else{
      for(const z of [-5,6]){const planta=criarMovel('planta',.8,.8,1.7);planta.position.set(15,.14,z);g.add(planta);}
    }
    // Sala: estante compacta, painéis modernos, obras e acabamento rústico.
    if(i===0){const prateleira=criarMovel('estante',1.2,.32,1.8);prateleira.position.set(10.8,.14,6.7);prateleira.rotation.y=Math.PI/2;g.add(prateleira);}
    if(i===1){for(const z of [6.2,7.1,8])B(g,.05,1.3,.5,0x36556a,11.8,2.3,z);B(g,2.5,.06,.6,0x51575b,5,2.9,-8.1);}
    if(i===2){B(g,2.5,1.6,.05,0x293a52,5.6,2.35,8.8);for(const x of [4.4,6.8])B(g,.045,1.65,.06,0xc4a060,x,2.35,8.76);B(g,.55,1.8,.55,0xb7ad96,10.8,1,2.3);}
    if(i===3){for(const x of [-10,-5,0,5,10])B(g,.2,.22,17.8,madeira,x,3.85,0);for(const z of [-7,-5,-3,-1])B(g,.045,.1,2,0x88603c,-11.8,1.4,z);}
    if(def.externa){
      B(g,6,.1,18,0x848779,-15,.02,0);
      // A vaga original vira garagem externa coberta, aberta lateralmente.
      B(g,14.5,.16,18,0xf4f0e8,4.75,4.2,0);B(g,9.5,.16,10,0xf4f0e8,-7.25,4.2,-4);
      B(g,.25,4.2,10,0xe8e3d9,-12,2.1,-4);B(g,.25,.85,8,0x9b9c90,-12,.42,5);
      for(const z of [2,4,6,8])B(g,10,.18,.16,madeira,-7.2,3.95,z);
      for(const x of [-11.8,-2.7])B(g,.16,3.95,.16,madeira,x,1.97,8.8);
    }
    return g;
  });

  // Oficina ampla e dirigível: portão central aberto, boxes, elevadores e recepção.
  const oficina = ambiente(32, 24, 0x454c51, 0x2b343b, 13.5, 7.2); oficina.visible = false;
  // Epóxi e faixas que guiam o carro do portão ao elevador.
  B(oficina, 13.4, .035, 22.8, 0x252c31, 0, .115, 0, .15, .38);
  for (const x of [-5.9, 5.9]) B(oficina, .22, .045, 22, 0xe4b90b, x, .145, 0, .1, .3);
  B(oficina, 10.8, .05, 6.2, 0x1c2226, 0, .16, -2.1, .55, .28);
  // Elevador principal, com espaço suficiente para estacionar.
  for (const x of [-4.8, 4.8]) {
    B(oficina, .42, 3.8, .42, 0xe1aa00, x, 2, -2.1, .45, .28);
    B(oficina, 4.25, .14, .48, 0xe1aa00, x > 0 ? 2.7 : -2.7, .34, -3.55, .45, .28);
    B(oficina, 4.25, .14, .48, 0xe1aa00, x > 0 ? 2.7 : -2.7, .34, -.65, .45, .28);
  }
  B(oficina, 10.1, .1, .28, 0xe1aa00, 0, 4.02, -2.1, .45, .28);
  texto(oficina, 'BOX PRINCIPAL', 0, 5.6, -11.84, 7.4, 1.25, '#ffd11a');
  // Área de ferramentas à esquerda.
  for (const x of [-13.8, -11.4, -9]) {
    B(oficina, 2.05, 1.15, .78, 0x9d2d2d, x, .67, -10.9, .15, .42);
    for (let k = 0; k < 3; k++) B(oficina, 1.7, .04, .08, 0x252a2d, x, .48 + k * .27, -10.48, .2);
  }
  B(oficina, 7.8, 2.35, .14, 0x4c555a, -11.6, 2.6, -11.72, .25, .5);
  for (let x = -14.4; x <= -8.8; x += .7) B(oficina, .07, .72, .08, 0xbfc8cc, x, 2.7, -11.61, .72, .25);
  for (const z of [-8.4, -6.6, -4.8]) C(oficina, .64, .34, 0x121416, -14.5, .68, z, Math.PI / 2, .1, true);
  for (const z of [-8.4, -6.6, -4.8]) C(oficina, .34, .62, z === -6.6 ? 0xd83a2d : 0x2263a2, -12.9, .38, z, 0, .55);
  // Bancada de motor e guincho.
  B(oficina, 5.5, .92, 1.1, 0x596267, -11.5, .58, .8, .45, .35);
  B(oficina, .25, 3.3, .25, 0xd33a2f, -8.5, 1.78, 2.8, .5); B(oficina, 3.1, .25, .25, 0xd33a2f, -10, 3.32, 2.8, .5);
  B(oficina, .1, 1.85, .1, 0xc7cdd0, -11.5, 2.35, 2.8, .8); C(oficina, .68, .9, 0x30363a, -11.5, .72, 2.8, 0, .65);
  const detalhesOficina = new THREE.Group();oficina.add(detalhesOficina);detalhesOficina.userData.colisoes=[];
  for(const x of [-13.8,-10.2]){
    const bancada=mob(detalhesOficina,'mobOficinaBancada',x,-9.5,2.8);const topo=bancada?new THREE.Box3().setFromObject(bancada).max.y:1.08;
    mob(detalhesOficina,'mobOficinaFerramentas',x,-11.4,2.45,0,1.9);
    mob(detalhesOficina,'mobOficinaMaleta',x,-9.5,.6,0,topo+.01);
  }
  mob(detalhesOficina,'mobOficinaChave',-11.7,.7,.55,0,1.1);
  mob(detalhesOficina,'mobOficinaPistao',-10.4,.8,.5,0,1.1);
  mob(detalhesOficina,'mobOficinaEngrenagem',-12.5,.7,.48,0,1.1);
  mob(detalhesOficina,'mobOficinaScanner',-11.5,.8,.65,0,1.1);
  mob(detalhesOficina,'mobTrabalhoPaleteira',12.3,-7,1.7,Math.PI/2);
  mob(detalhesOficina,'mobTrabalhoCarrinho',12.4,-3.8,1.4);
  for(const z of [-5.5,-2.5])mob(detalhesOficina,'mobTrabalhoCaixa',12.4,z,.7);
  mob(detalhesOficina,'mobTrabalhoContainer',12.2,.4,1.5);
  fundirEstaticos(detalhesOficina);
  // Recepção e computador de customização.
  B(oficina, 6.4, 1.05, 1.05, 0x252d32, -11.6, .64, 9.7, .25, .52);
  B(oficina, 6.45, .13, 1.2, 0xb8b4aa, -11.6, 1.22, 9.7, 0, .3);
  mob(oficina, 'mobComputador', -12.2, 9.55, .7); mob(oficina, 'mobCadeira', -11.2, 8.45, 1, Math.PI);
  texto(oficina, 'CUSTOMIZAÇÃO', -11.6, 3.1, 11.82, 6.3, 1.05, '#5ee7ff', '#10252fee', Math.PI);
  // Estoque de peças à direita, sem bloquear a pista central.
  for (const z of [-8.9, -5.8, -2.7, .4, 3.5, 6.6]) mob(oficina, 'mobEstante', 14.25, z, 2.35, Math.PI / 2);
  for (const z of [-8.6, -6.75, -4.9]) C(oficina, .67, .34, 0x141617, 11.9, .7, z, Math.PI / 2, .1, true);
  for (const [x, z, c] of [[9.8, 8.7, 0xd74232], [11.2, 8.7, 0x2f65a3], [12.6, 8.7, 0xd9ac22]]) C(oficina, .45, .9, c, x, .58, z, 0, .55);
  // Escritório envidraçado no canto direito.
  B(oficina, 6.2, 3.2, .15, 0x556169, 12.5, 1.68, 11.25, .2, .45);
  B(oficina, .15, 3.2, 5.1, 0x556169, 9.35, 1.68, 8.75, .2, .45);
  janela(oficina, 9.27, 2.1, 8.75, 3.7, 1.6, Math.PI / 2);
  mob(oficina, 'mobSofa', 12.6, 9.6, 2.2, Math.PI); mob(oficina, 'mobPlanta', 14.6, 10.2, 1.3);
  // Estrutura do portão suspenso e luzes industriais.
  for (const x of [-6.9, 6.9]) B(oficina, .35, 6.4, .45, 0x58636a, x, 3.2, 11.65, .65, .3);
  B(oficina, 14.2, .42, .52, 0x58636a, 0, 6.35, 11.65, .65, .3);
  for (const x of [-10.5, -3.5, 3.5, 10.5]) { luz(oficina, x, 6.72, -5.7, 1.7, 13); luz(oficina, x, 6.72, 4.8, 1.7, 13); }

  const grupos = { mercado: loja, posto: loja, casa, oficina };
  // Colisores simples dos móveis e divisórias. Eles acompanham o interior ativo
  // e mantêm jogador, câmera e veículos fora de paredes, balcões e estantes.
  const colisoresCasa = [
    ...PAREDES.flatMap(w => w.trechos.map(([ini, fim]) => w.eixo === 'x' ? [w.linha, (ini + fim) / 2, .22, fim - ini, 4] : [(ini + fim) / 2, w.linha, fim - ini, .22, 4])),
    ...MOVEIS.filter(m => !m.semColisao).map(m => { const g = Math.abs(Math.sin(m.ry || 0)) > .7; return [m.x, m.z, g ? m.d : m.w, g ? m.w : m.d, Math.max(.5, m.h)]; })
  ];
  const colisores={
    mercado:[[-5.5,-.9,1.35,2.5,2.4],[-2.5,-.9,1.35,2.5,2.4],[.5,-.9,1.35,2.5,2.4],[3.5,-.9,1.35,2.5,2.4],[0,-4.5,4.3,1.1,1.6],[-6.35,3.25,1.4,1.2,2.3],[4.7,4.1,2.6,1.2,1.2]],
    posto:[[-5.5,-.9,1.35,2.5,2.4],[-2.5,-.9,1.35,2.5,2.4],[.5,-.9,1.35,2.5,2.4],[3.5,-.9,1.35,2.5,2.4],[0,-4.5,4.3,1.1,1.6]],
    casa: colisoresCasa,
    oficina:[[-11.6,-10.9,8.2,1.2,2.4],[-14.4,-6.6,2.4,6.8,1.4],[-11.5,.8,5.8,1.35,1.4],[-11.6,9.7,6.8,1.35,1.6],[14.25,-1.15,2.2,18.8,2.7],[12.5,11.25,6.4,.3,3.4],[9.35,8.75,.3,5.2,3.4]]
  };
  colisores.mercado.push(...detalhesLoja.userData.colisoes);colisores.posto.push(...detalhesLoja.userData.colisoes);colisores.oficina.push(...detalhesOficina.userData.colisoes);
  const estilosCasa = [
    { piso: 0x845f42, parede: 0xe8e3d9, madeira: 0x956f50 }, { piso: 0xb0b7b9, parede: 0xe9eff1, madeira: 0xb08a63 }, { piso: 0x56616b, parede: 0xe6e9ee, madeira: 0x6c4d38 }, { piso: 0x946941, parede: 0xeee3cd, madeira: 0x8b603a }
  ];
  function mostrar(tipo, idx = 0) {
    Object.values(grupos).forEach(g => { g.visible = false; });
    const atual = grupos[tipo] || loja; atual.visible = true;
    if (tipo === 'mercado' || tipo === 'posto') {
      INT.w = 16; INT.d = 12; placaLoja.material.color.setHex(tipo === 'mercado' ? 0x0b6b2e : 0xb00020);
    } else if (tipo === 'casa') {
      INT.w = 36; INT.d = 18; const s = estilosCasa[idx] || estilosCasa[0]; pisoCasa.material.color.setHex(s.piso); pisosMadeira.forEach(o => o.material.color.setHex(s.madeira)); aplicarEstilo(idx);
      variantesCasa.forEach((g,i)=>g.visible=i===idx);const def=casaDefinida(idx);tetoCasa.visible=!def.externa;paredeEsquerda.visible=!def.externa;
      casa.children.filter(n => n.isMesh && (n.userData.parede || n.geometry?.parameters?.height > 3)).forEach(p => { if (p.material?.color) p.material.color.setHex(s.parede); });
    } else { INT.w = 32; INT.d = 24; }
    INT.colisores=(colisores[tipo]||[]).map(([x,z,w,d,h])=>({x,z,w,d,h}));
    if(tipo==='casa'){
      INT.colisores.push({x:12,z:-4.25,w:.25,d:9.5,h:4.2},{x:12,z:7,w:.25,d:4,h:4.2});
      if(casaDefinida(idx).piscina)INT.colisores.push({x:15,z:-3.5,w:3.8,d:5,h:.4});
      if(!casaDefinida(idx).externa)INT.colisores.push({x:-12,z:0,w:.25,d:18,h:4.2});
      else INT.colisores.push({x:-12,z:-4,w:.25,d:10,h:4.2},{x:-12,z:5,w:.25,d:8,h:.85});
    }
    if (tipo === 'casa') portas.forEach(p => INT.colisores.push(p.col)); // portas fechadas bloqueiam; abertas liberam
    // As lâmpadas do cômodo vão para o conjunto compartilhado de luzes (src/luzes.js): nada é criado nem ligado/desligado.
    const specs = atual.userData.luzes || [], n = luzes ? luzes.capacidade : 0;
    const usar = specs.length <= n ? specs.map((_, k) => k) : Array.from({ length: n }, (_, k) => Math.round(k * (specs.length - 1) / (n - 1 || 1)));
    const reforco = specs.length > n ? Math.min(1.8, Math.sqrt(specs.length / n)) : 1;
    luzes?.definirInterior(usar.map(k => { const sp = specs[k]; return { x: INT.x + sp.x, y: sp.y, z: INT.z + sp.z, i: sp.i * reforco, d: sp.d * (reforco > 1 ? 1.3 : 1) }; }));
    const amb = AMBIENTES[tipo === 'casa' ? 'casa' : tipo === 'oficina' ? 'oficina' : 'loja'];
    INT.ambInt = amb[2]; // a luz de céu do mundo recebe este reforço enquanto o jogador está dentro (sem criar outra luz)
    if (tipo === 'casa') portas.forEach(p => { p.alvo = 0; p.ang = p.fechada; p.pivo.rotation.y = p.fechada; p.col.off = false; }); // sempre entra com as portas fechadas
    return atual;
  }
  mostrar('mercado');
  return {
    caixa: { x: INT.x, z: INT.z - 4.45 }, cama: { x: INT.x - 8.3, z: INT.z - 7.6 },
    oficina: { x: INT.x - 12.2, z: INT.z + 9.5 },
    casaGrupo:casa, mostrar, cor: tipo => mostrar(tipo), mostrarTodos: () => Object.values(grupos).forEach(g => { g.visible = true; }),
    // Portas: devolve a porta mais próxima (até ~2 m) para o E abrir/fechar.
    portaProxima(px, pz) {
      let melhor = null, md = 2.1;
      for (const p of portas) { const d = Math.hypot(px - (INT.x + p.x), pz - (INT.z + p.z)); if (d < md) { md = d; melhor = p; } }
      return melhor;
    },
    // Retorna 'aberta' | 'fechada' | 'bloqueada' (alguém parado no vão ao fechar).
    alternarPorta(p, px, pz) {
      if (p.alvo === 1) { // fechando: não prende o jogador no vão
        if (Math.hypot(px - (INT.x + p.x), pz - (INT.z + p.z)) < .85) return 'bloqueada';
        p.alvo = 0; return 'fechada';
      }
      p.alvo = 1; return 'aberta';
    },
    atualizarPortas(dt) {
      for (const p of portas) {
        const meta = p.alvo ? p.aberta : p.fechada;
        if (Math.abs(meta - p.ang) > .002) { p.ang += (meta - p.ang) * (1 - Math.exp(-9 * dt)); p.pivo.rotation.y = p.ang; }
        else if (p.ang !== meta) { p.ang = meta; p.pivo.rotation.y = meta; }
        // Colisão só some quando a folha já saiu do caminho (≥ 55% aberta) e volta assim que começa a fechar.
        const prog = (p.ang - p.fechada) / (p.aberta - p.fechada);
        p.col.off = p.alvo === 1 && prog > .55;
      }
    },
    estadoPorta: p => p.alvo === 1
  };
}
