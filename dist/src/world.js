// Mundo: ruas, prédios (InstancedMesh), praia, montanhas e ciclo dia/noite.
import * as THREE from 'three';
import { casaDefinida } from './casas-catalogo.js';
import { criarSuperficiesUrbanas } from './street-surfaces.js';
export const INT = { on: false, x: 3000, z: 3000, tipo: 'mercado', w: 16, d: 12, casa: 0, colisores:[] }; // interiores separados da cidade
export const LUGARES = [];
export const PREDIOS_PACK = []; // lotes com modelos detalhados
export const MUROS_BAIXOS = [];
// Atualiza somente o lote cujo exterior GLB acabou de ser colocado.
export function alinharColisorPredio(x,z,w,d){
  const arr=lotes.get((Math.floor(x/100)+128)*512+(Math.floor(z/100)+128))||[];
  const c=arr.find(c=>Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01);
  if(c){c.w=w/2;c.d=d/2;}
}
const lotes = new Map(); // colisão: prédios por quarteirão (100x100)
const R = (a, b) => a + Math.random() * (b - a);

function texturaUrbana(base, pontos, tamanho = 128) {
  const cv = document.createElement('canvas'); cv.width = cv.height = tamanho;
  const g = cv.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, tamanho, tamanho);
  for (let i = 0; i < 1400; i++) {
    const v = R(-1, 1), a = Math.abs(v) * .12;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const s = R(.35, 1.5); g.fillRect(R(0, tamanho), R(0, tamanho), s, s);
  }
  for (let i = 0; i < pontos; i++) {
    g.strokeStyle = `rgba(0,0,0,${R(.06, .15)})`; g.lineWidth = R(.3, .8); g.beginPath();
    const x = R(0, tamanho), y = R(0, tamanho); g.moveTo(x, y); g.lineTo(x + R(-18, 18), y + R(-18, 18)); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Retorna true se o ponto (x,z) com raio r bate em algum prédio
export function colide(x, z, r = .4, y = 0) {
  if (INT.on) {
    if(Math.abs(x-INT.x)>INT.w/2-r-.2||Math.abs(z-INT.z)>INT.d/2-r-.2)return true;
    for(const c of INT.colisores||[])if(!c.off&&y<c.h&&Math.abs(x-(INT.x+c.x))<c.w/2+r&&Math.abs(z-(INT.z+c.z))<c.d/2+r)return true;
    return false;
  }
  if (Math.abs(x) > 1090 || Math.abs(z) > 1090) return true;
  for (let bx = Math.floor((x-r)/100); bx <= Math.floor((x+r)/100); bx++) for (let bz = Math.floor((z-r)/100); bz <= Math.floor((z+r)/100); bz++) {
    for (const l of lotes.get((bx + 128) * 512 + (bz + 128)) || []) if (Math.abs(x - l.x) < l.w + r && Math.abs(z - l.z) < l.d + r) return true;
  }
  for (const l of MUROS_BAIXOS) if (y < l.h - .08 && Math.abs(x-l.x) < l.w/2+r && Math.abs(z-l.z) < l.d/2+r) return true;
  return false;
}

export function destinoParkour(p, yaw) {
  if (INT.on) return null;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  for (const muro of MUROS_BAIXOS) {
    if (Math.hypot(p.x-muro.x,p.z-muro.z) > 7) continue;
    for (let a = .5; a < 2.2; a += .2) {
      const x = p.x+fx*a, z = p.z+fz*a;
      if (Math.abs(x-muro.x)>muro.w/2+.15 || Math.abs(z-muro.z)>muro.d/2+.15) continue;
      for (let b=a+.8; b<=a+3.5; b+=.2) {
        const fim = {x:p.x+fx*b,z:p.z+fz*b};
        if (!colide(fim.x,fim.z,.45)) return {...fim,h:muro.h+.45};
      }
    }
  }
  return null;
}

// Comprimento livre para projéteis e visão dos NPCs; impede tiros através de edifícios.
export function distanciaLivre(origem,direcao,limite) {
  for(let t=.6;t<limite;t+=.45){
    const y=origem.y+direcao.y*t;
    if(y<0 || colide(origem.x+direcao.x*t,origem.z+direcao.z*t,.02,y))return t;
  }
  return limite;
}

export function criarMundo(scene, fraco, luzes) {
  // Barreiras baixas de concreto nas calçadas: atravessáveis com Espaço.
  const concreto = new THREE.MeshStandardMaterial({color:0x82898a,roughness:.92});
  for (const [x,z,w,d,h] of [[9,23,4,.65,.9],[9,13,4,.65,1.05],[-10,42,4,.65,.85],[49,9,8,.65,1.1],[109,42,.65,7,1.05],[-91,48,.65,8,.85],[209,62,.65,6,1.1]]) {
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),concreto);o.position.set(x,h/2,z);o.castShadow=o.receiveShadow=true;scene.add(o);MUROS_BAIXOS.push({x,z,w,d,h});
  }
  const mat = c => new THREE.MeshLambertMaterial({ color: c });
  const texConcreto = texturaUrbana('#777f83', 16); texConcreto.repeat.set(120, 120);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x9da4a7, map: texConcreto, roughness: .97, metalness: .01 }));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = !fraco; scene.add(chao);

  criarSuperficiesUrbanas(scene,fraco);

  // Asfalto com granulação, dupla faixa amarela e limites refletivos.
  const tv = texturaUrbana('#20262a', 22); tv.repeat.set(1.4, 200);
  const th = tv.clone(); th.repeat.set(200, 1.4); th.needsUpdate = true;
  const asfV = new THREE.MeshStandardMaterial({ color: 0x4d565d, map: tv, roughness: .91, metalness: .035 });
  const asfH = new THREE.MeshStandardMaterial({ color: 0x4d565d, map: th, roughness: .91, metalness: .035 });
  const amarela = new THREE.MeshStandardMaterial({ color: 0xffc928, emissive: 0x6b4700, emissiveIntensity: .12, roughness: .6 });
  const branca = new THREE.MeshStandardMaterial({ color: 0xe8edf0, emissive: 0x333333, emissiveIntensity: .08, roughness: .55 });
  const ruasV = new THREE.InstancedMesh(new THREE.BoxGeometry(14, .1, 2000), asfV, 21);
  const ruasH = new THREE.InstancedMesh(new THREE.BoxGeometry(2000, .1, 14), asfH, 21);
  const linhasA = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), amarela, 84);
  const linhasB = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), branca, 84);
  const lm = new THREE.Matrix4(), lq = new THREE.Quaternion(); let li = 0, lj = 0, rk = 0;
  const linha = (obj, k, x, z, sx, sy, sz) => { lm.compose(new THREE.Vector3(x, sy / 2 + .1, z), lq, new THREE.Vector3(sx, sy, sz)); obj.setMatrixAt(k, lm); };
  for (let i = -10; i <= 10; i++) {
    lm.makeTranslation(i * 100, .05, 0); ruasV.setMatrixAt(rk, lm); lm.makeTranslation(0, .05, i * 100); ruasH.setMatrixAt(rk++, lm);
    for (const d of [-.42, .42]) {
      linha(linhasA, li++, i * 100 + d, 0, .13, .035, 2000);
      linha(linhasA, li++, 0, i * 100 + d, 2000, .035, .13);
    }
    for (const d of [-5.85, 5.85]) {
      linha(linhasB, lj++, i * 100 + d, 0, .11, .025, 2000);
      linha(linhasB, lj++, 0, i * 100 + d, 2000, .025, .11);
    }
  }
  ruasV.receiveShadow = ruasH.receiveShadow = !fraco;
  for (const o of [ruasV, ruasH, linhasA, linhasB]) { o.frustumCulled = false; scene.add(o); }

  // Faixas de pedestres nas esquinas deixam os cruzamentos legíveis e ajudam o
  // jogador a perceber onde carros e semáforos vão parar.
  const faixaPed=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xe8edf0,roughness:.68}),7056);let nFaixa=0;
  for(let a=-10;a<=10;a++)for(let b=-10;b<=10;b++)for(let k=-4;k<4;k++){
    lm.compose(new THREE.Vector3(a*100+k*1.45,.125,b*100+8.4),lq,new THREE.Vector3(.78,.025,3.7));faixaPed.setMatrixAt(nFaixa++,lm);
    lm.compose(new THREE.Vector3(a*100+8.4,.125,b*100+k*1.45),lq,new THREE.Vector3(3.7,.025,.78));faixaPed.setMatrixAt(nFaixa++,lm);
  }
  faixaPed.frustumCulled=false;faixaPed.receiveShadow=!fraco;scene.add(faixaPed);

  // Prédios: 4 por quarteirão (vidro azul, concreto, tijolo)
  // Janelas: textura procedural (escura de dia) + mapa emissivo que acende à noite
  const texJan = luz => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
    if (luz) { g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256); }
    else {
      const base = g.createLinearGradient(0, 0, 128, 0); base.addColorStop(0, '#858e92'); base.addColorStop(.5, '#b5bbbd'); base.addColorStop(1, '#6f797e'); g.fillStyle = base; g.fillRect(0, 0, 128, 256);
      g.fillStyle = 'rgba(25,34,39,.24)'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 2, 256);
    }
    for (let y = 9; y < 250; y += 18) {
      if (!luz) { g.fillStyle = 'rgba(55,62,65,.36)'; g.fillRect(0, y + 11, 128, 2); }
      for (let x = 8; x < 121; x += 18) {
        if (luz) { g.fillStyle = Math.random() < .46 ? (Math.random() < .22 ? '#8fd5ff' : '#ffd782') : '#000'; g.fillRect(x, y, 10, 10); }
        else { g.fillStyle = '#4c555a'; g.fillRect(x - 1, y - 1, 12, 12); const vidro = g.createLinearGradient(x, y, x + 10, y + 10); vidro.addColorStop(0, '#90bdd0'); vidro.addColorStop(.42, '#263c48'); vidro.addColorStop(.48, '#c2e5f0'); vidro.addColorStop(.58, '#334b57'); vidro.addColorStop(1, '#101b22'); g.fillStyle = vidro; g.fillRect(x, y, 10, 10); }
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const matPredio = new THREE.MeshStandardMaterial({ map: texJan(false), roughness: .66, metalness: .12, emissive: 0xffd28c, emissiveMap: texJan(true), emissiveIntensity: 0, envMapIntensity: .48 });
  const cores = [0x6f8f9f,0x9d8c78,0xa46f62,0x758a80,0x827b96,0xb09a72,0x657d91];
  // Prédios especiais (1º lote de alguns quarteirões): mercados e postos, baixos e coloridos, com placa
  const ESP = { '1,0': 'mercado', '-3,2': 'mercado', '4,-3': 'mercado', '-2,-4': 'mercado', '0,1': 'posto', '3,3': 'posto', '-4,-1': 'posto', '2,-4': 'posto', '-5,0': 'oficina', '2,2': 'casa0', '-1,3': 'casa1', '-3,-2': 'casa2', '5,4': 'casa3' };
  const placa = (tipo, x, z, h) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = tipo === 'mercado' ? '#0b6b2e' : tipo === 'posto' ? '#b00020' : tipo === 'oficina' ? '#17232d' : '#7a4a10'; g.fillRect(0, 0, 256, 64); g.fillStyle = tipo === 'oficina' ? '#ffd43b' : '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText(({ mercado: 'MERCADO', posto: 'POSTO 24h', casa: 'CASA', oficina: 'OFICINA' })[tipo], 128, 46);
    const casa = tipo === 'casa', largura = casa ? 5.2 : 12, altura = casa ? 1.3 : 3;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }));
    s.position.set(x + (casa ? 8 : 0), h + (casa ? 1.15 : 2), z); scene.add(s);
  };
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matPredio, 1600);
  // Detalhes arquitetônicos em instâncias: frisos, sacadas, vitrines, toldos e antenas.
  const matDet = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .8 }), matPorta = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: .3, metalness: .4 });
  const imParapeito = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matDet, 1600);
  const imTelhado = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x606060, roughness: .9 }), 1600);
  const imPorta = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matPorta, 1600);
  const imFrisos = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xc6c9c8, roughness: .72 }), 6400);
  const imSacadas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x727b80, roughness: .68, metalness: .12 }), 3200);
  const imGuardas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x86b7ca, transparent: true, opacity: .5, roughness: .16, metalness: .12 }), 3200);
  const imLojas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x75b7d2, emissive: 0x173746, emissiveIntensity: .35, roughness: .14, metalness: .28 }), 1600);
  const imToldos = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .65 }), 1600);
  const imAntenas = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 1, 7), new THREE.MeshStandardMaterial({ color: 0x434b50, roughness: .42, metalness: .68 }), 800);
  let nd = 0, nf = 0, ns = 0, ng = 0, nl = 0, nt = 0, na = 0;
  const m = new THREE.Matrix4(), c = new THREE.Color(); let n = 0;
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    const arr = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const esp = i + j === 0 ? ESP[bx + ',' + bz] : null;
      const casaPack = esp?.startsWith('casa');
      const medieval = bx >= -8 && bx <= -7 && bz >= 7 && bz <= 8 && !esp;
      const distanciaCentro = Math.max(Math.abs(bx), Math.abs(bz));
      // O City Kit passa a dominar a cidade: todos os lotes do núcleo usam GLB,
      // e o distrito ao redor mistura o pack com os prédios procedurais detalhados.
      const nucleoNovo = distanciaCentro <= (fraco ? 2 : 3);
      const distritoNovo = distanciaCentro <= (fraco ? 4 : 6) && Math.abs(bx * 3 + bz * 5 + i * 7 + j * 11) % (fraco ? 3 : 2) === 0;
      const avenidasNovas = !fraco && distanciaCentro <= 8 && (Math.abs(bx) <= 1 || Math.abs(bz) <= 1) && Math.abs(bx + bz + i + j) % 2 === 0;
      const predioPack = !esp && (medieval || nucleoNovo || distritoNovo || avenidasNovas);
      const substituir = casaPack || predioPack;
      const casaDim=casaPack?casaDefinida(+esp[4]):null;
      const w = casaDim?casaDim.tamanho:esp ? 30 : predioPack ? 26 : R(20, 34), d = casaDim?casaDim.profundidade:esp ? 30 : predioPack ? 26 : R(20, 34), h = esp ? 7 : predioPack ? 24 : R(10, 70);
      const x = bx * 100 + 28 + i * 44, z = bz * 100 + 28 + j * 44;
      if (substituir) {
        const seed = Math.abs(bx * 31 + bz * 17 + i * 7 + j * 13);
        const familia = casaPack ? 'casa' : distanciaCentro <= 1 ? (seed % 3 ? 'torre' : 'grande')
          : distanciaCentro <= 3 ? (seed % 2 ? 'grande' : 'torre')
          : distanciaCentro <= 5 ? (seed % 3 ? 'baixo' : 'casa') : (seed % 2 ? 'baixo' : 'casa');
        PREDIOS_PACK.push({ x, z, casa: !!casaPack, medieval, familia, indice: PREDIOS_PACK.length });
      }
      m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), substituir ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(w, h, d));
      im.setMatrixAt(n, m); im.setColorAt(n, c.setHex(esp ? (esp === 'mercado' ? 0x2ecc71 : esp === 'posto' ? 0xe74c3c : esp === 'oficina' ? 0x253746 : 0xc9a27e) : cores[Math.random() * 3 | 0])); n++;
      // Parapeito no topo (sempre) + caixa d'água/AC (só prédios altos, sem escala nos baixos) + porta na fachada (térreo)
      m.compose(new THREE.Vector3(x, h + .3, z), new THREE.Quaternion(), substituir ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(w + .6, .6, d + .6)); imParapeito.setMatrixAt(nd, m);
      const alto = h > 26 && !substituir ? 1 : 0, tx = x + R(-w * .25, w * .25), tz = z + R(-d * .25, d * .25);
      m.compose(new THREE.Vector3(tx, h + R(1, 2.2) * alto, tz), new THREE.Quaternion(), new THREE.Vector3(R(2, 4) * alto, R(1.4, 3.4) * alto, R(2, 4) * alto)); imTelhado.setMatrixAt(nd, m);
      m.compose(new THREE.Vector3(x, esp ? 0 : 1.05, z + d / 2 + .06), new THREE.Quaternion(), new THREE.Vector3(esp || substituir ? 0 : 1.4, esp || substituir ? 0 : 2.1, .12)); imPorta.setMatrixAt(nd, m);
      if (!esp && !substituir) {
        // Linhas de concreto quebram a fachada plana e evidenciam os andares.
        for (const y of [h * .34, h * .67]) {
          m.compose(new THREE.Vector3(x, y, z + d / 2 + .09), new THREE.Quaternion(), new THREE.Vector3(w + .35, .16, .2)); imFrisos.setMatrixAt(nf++, m);
          m.compose(new THREE.Vector3(x + w / 2 + .09, y, z), new THREE.Quaternion(), new THREE.Vector3(.2, .16, d + .35)); imFrisos.setMatrixAt(nf++, m);
        }
        // Sacadas com guarda-corpo de vidro nos edifícios médios e altos.
        if (h > 25) for (const y of (fraco ? [h * .58] : [h * .43, h * .7])) {
          const bw = w * .48;
          m.compose(new THREE.Vector3(x, y, z + d / 2 + .62), new THREE.Quaternion(), new THREE.Vector3(bw, .16, 1.25)); imSacadas.setMatrixAt(ns++, m);
          m.compose(new THREE.Vector3(x, y + .52, z + d / 2 + 1.22), new THREE.Quaternion(), new THREE.Vector3(bw, .9, .07)); imGuardas.setMatrixAt(ng++, m);
        }
        // Vitrine e toldo dão vida ao térreo de parte dos quarteirões.
        if ((bx * 3 + bz * 5 + i + j) % 3 === 0) {
          const lw = Math.min(w * .62, 17);
          m.compose(new THREE.Vector3(x, 1.65, z + d / 2 + .08), new THREE.Quaternion(), new THREE.Vector3(lw, 2.65, .14)); imLojas.setMatrixAt(nl++, m);
          m.compose(new THREE.Vector3(x, 3.22, z + d / 2 + .7), new THREE.Quaternion(), new THREE.Vector3(lw + .6, .18, 1.35)); imToldos.setMatrixAt(nt, m); imToldos.setColorAt(nt++, c.setHex([0x9d2235, 0x194f77, 0xd8a11d, 0x176c55][Math.abs(bx + bz + i + j) % 4]));
        }
        if (h > 38 && (bx + bz + i * 2 + j) % 3 === 0) {
          const ah = R(3.5, 7); m.compose(new THREE.Vector3(x + w * .22, h + ah / 2 + 1, z - d * .16), new THREE.Quaternion(), new THREE.Vector3(1, ah, 1)); imAntenas.setMatrixAt(na++, m);
        }
      }
      nd++;
      if (esp) {
         const ca = esp.startsWith('casa');
         LUGARES.push({ tipo: ca ? 'casa' : esp, idx: ca ? +esp[4] : 0, x, z });
         // Residências não recebem mais uma placa grande "CASA" na fachada.
         if (!ca) placa(esp, x, z + d / 2 + .3, h);
       }
      // Casas GLB incluem jardim, varanda e garagem no bounding box. Bloquear
      // esse retângulo inteiro criava uma parede invisível antes da fachada.
      // O exterior fica acessível para chegar à porta; paredes e móveis do
      // interior continuam usando os colisores detalhados existentes.
      if(!casaPack)arr.push({ x, z, w: w / 2, d: d / 2 });
    }
    lotes.set((bx + 128) * 512 + (bz + 128), arr);
  }
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = !fraco; scene.add(im);
  imParapeito.frustumCulled = imTelhado.frustumCulled = imPorta.frustumCulled = false;
  imParapeito.castShadow = imTelhado.castShadow = false;
  imFrisos.count = nf; imSacadas.count = ns; imGuardas.count = ng; imLojas.count = nl; imToldos.count = nt; imAntenas.count = na;
  for (const o of [imFrisos, imSacadas, imGuardas, imLojas, imToldos, imAntenas]) { o.frustumCulled = false; o.receiveShadow = !fraco; }
  scene.add(imParapeito, imTelhado, imPorta, imFrisos, imSacadas, imGuardas, imLojas, imToldos, imAntenas);

  // Árvores (tronco #5b3a1e, folhas #2e8b57) e postes de luz nas calçadas
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .3, 3, 7), new THREE.MeshStandardMaterial({ color: 0x56351f, roughness: 1 }), 800), fo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.8, 1), new THREE.MeshStandardMaterial({ color: 0x247f52, roughness: .92 }), 800),foDetalhe=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.05,1),new THREE.MeshStandardMaterial({color:0x319b63,roughness:.9}),1600);
  const po = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .1, 7, 8), new THREE.MeshStandardMaterial({ color: 0x323a40, metalness: .72, roughness: .32 }), 400), lu = new THREE.InstancedMesh(new THREE.SphereGeometry(.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd787 }), 400);
  const uni = new THREE.Vector3(1, 1, 1), qi = new THREE.Quaternion(); let ia = 0, ib = 0;
  const poe = (o, k, x, y, z) => { m.compose(new THREE.Vector3(x, y, z), qi, uni); o.setMatrixAt(k, m); };
  for (let bx = -10; bx < 10; bx++) for (let bz = -10; bz < 10; bz++) {
    for (const [x, z] of [[9, 36], [91, 64]]) {const tx=bx*100+x,tz=bz*100+z;poe(tr,ia,tx,1.5,tz);poe(fo,ia,tx,4.2,tz);poe(foDetalhe,ia*2,tx-.95,4.35,tz+.25);poe(foDetalhe,ia*2+1,tx+.85,4.05,tz-.35);ia++; }
    poe(po, ib, bx * 100 + 91, 3.5, bz * 100 + 15); poe(lu, ib, bx * 100 + 91, 7.2, bz * 100 + 15); ib++;
  }
  for (const o of [tr, fo,foDetalhe, po, lu]) { o.frustumCulled = false; scene.add(o); }

  // Praia (areia + mar) ao sul e montanhas ao redor
  const texAreia = texturaUrbana('#d8bf80', 5); texAreia.repeat.set(90, 5);
  const matAreia = new THREE.MeshStandardMaterial({ color: 0xf1d895, map: texAreia, roughness: 1 });
  const areia = new THREE.Mesh(new THREE.BoxGeometry(2400, .1, 100), matAreia); areia.position.set(0, .03, 1050);
  const agua = new THREE.MeshPhysicalMaterial({ color: 0x087fa9, roughness: .18, metalness: .08, clearcoat: 1, clearcoatRoughness: .16, transmission: fraco ? 0 : .08, transparent: true, opacity: .9, envMapIntensity: 1.15 });
  const mg = new THREE.PlaneGeometry(2400, 100, 100, 5); mg.rotateX(-Math.PI / 2); const mar = new THREE.Mesh(mg, agua); mar.position.set(0, .3, 1150); const mp = mg.attributes.position; // mar com ondas
  scene.add(areia, mar);
  // Praia leste + guarda-sóis nas duas praias
  const areia2 = new THREE.Mesh(new THREE.BoxGeometry(100, .1, 2000), matAreia); areia2.position.set(1050, .03, 0);
  const mg2 = new THREE.PlaneGeometry(2000, 100, 80, 5); mg2.rotateX(-Math.PI / 2); mg2.rotateY(Math.PI / 2);
  const mar2 = new THREE.Mesh(mg2, agua); mar2.position.set(1150, .3, 0); const mp2 = mg2.attributes.position; scene.add(areia2, mar2);
  const espuma = new THREE.MeshBasicMaterial({ color: 0xe7fbff, transparent: true, opacity: .52 });
  const es1 = new THREE.Mesh(new THREE.BoxGeometry(2400, .025, 1.8), espuma); es1.position.set(0, .28, 1099);
  const es2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, .025, 2000), espuma); es2.position.set(1099, .28, 0); scene.add(es1, es2);
  const gs = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, .7, 8), new THREE.MeshLambertMaterial(), 60), gp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .05, 2.2, 5), mat(0xeeeeee), 60);
  for (let k = 0; k < 60; k++) {
    const sul = k < 30, x = sul ? R(-900, 900) : 1010 + R(0, 60), z = sul ? 1010 + R(0, 60) : R(-900, 900);
    m.compose(new THREE.Vector3(x, 2.4, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); gs.setMatrixAt(k, m); gs.setColorAt(k, c.setHex([0xff3b3b, 0xffd23b, 0x3bb0ff, 0xffffff][k % 4]));
    m.compose(new THREE.Vector3(x, 1.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); gp.setMatrixAt(k, m);
  }
  gs.frustumCulled = gp.frustumCulled = false; scene.add(gs, gp);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, mt = new THREE.Mesh(new THREE.ConeGeometry(R(120, 180), R(150, 300), 6), mat(i % 2 ? 0x3cb371 : 0x8b4513));
    mt.position.set(Math.cos(a) * 1350, 100, Math.sin(a) * 1350); scene.add(mt);
  }

  // Estrelas (aparecem à noite)
  const ea = new Float32Array(1200); for (let i = 0; i < 400; i++) { const u = Math.random() * 6.283, v = Math.random() * 1.4, r = 1000; ea[i * 3] = Math.cos(u) * Math.cos(v) * r; ea[i * 3 + 1] = Math.sin(v) * r + 50; ea[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r; }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ea, 3));
  const estrelas = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); estrelas.frustumCulled = false; scene.add(estrelas);
  // Cúpula em gradiente, sol visível e nuvens suaves dão profundidade ao horizonte.
  const ceuMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {
    topo: { value: new THREE.Color(0x2d7fc7) }, meio: { value: new THREE.Color(0x82c8ef) }, horizonte: { value: new THREE.Color(0xffd29c) }
  }, vertexShader: 'varying vec3 wp; void main(){ vec4 w=modelMatrix*vec4(position,1.0); wp=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader: 'uniform vec3 topo; uniform vec3 meio; uniform vec3 horizonte; varying vec3 wp; void main(){ float h=normalize(wp-cameraPosition).y; vec3 c=mix(horizonte,meio,smoothstep(-.08,.18,h)); c=mix(c,topo,smoothstep(.18,.72,h)); gl_FragColor=vec4(c,1.0); }' });
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(1050, fraco ? 20 : 32, fraco ? 10 : 16), ceuMat); scene.add(cupula);
  const discoSol = new THREE.Mesh(new THREE.SphereGeometry(fraco ? 18 : 25, 16, 10), new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false })); scene.add(discoSol);
  const nuvemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: fraco ? .38 : .55, depthWrite: false });
  const nuvens = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), nuvemMat, fraco ? 24 : 72);
  const nm = new THREE.Matrix4(), nq = new THREE.Quaternion();
  for (let i = 0; i < nuvens.count; i++) nm.compose(new THREE.Vector3(R(-950, 950), R(115, 220), R(-950, 950)), nq, new THREE.Vector3(R(12, 30), R(2.5, 6), R(7, 18))), nuvens.setMatrixAt(i, nm);
  nuvens.frustumCulled = false; scene.add(nuvens);
  // Luz do sol + céu dinâmico (azul -> laranja -> roxo)
  const sol = new THREE.DirectionalLight(0xfff3e0, 1.5); scene.add(sol, sol.target);
  if (!fraco) { // sombras dinâmicas do sol (desligadas em dispositivos fracos)
    sol.castShadow = true; sol.shadow.mapSize.set(1536, 1536);
    Object.assign(sol.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 10, far: 900 }); // área menor = menos objetos redesenhados e sombra mais nítida
    sol.shadow.bias = -.0015; sol.shadow.normalBias = .02;
  }
  const amb = new THREE.HemisphereLight(0x87ceeb, 0x444444, .6); scene.add(amb);
  // Postes de rua: pontos entregues ao conjunto compartilhado de luzes (src/luzes.js), que acende só os mais próximos.
  if (!fraco && luzes) luzes.definirRua([[-109, -85], [91, -85], [-109, 115], [91, 115], [-209, 15], [191, 15], [-9, -185], [-9, 215]]);
  const dia = new THREE.Color(0x87ceeb), por = new THREE.Color(0xff8c00), noite = new THREE.Color(0x191970);
  return function atualizarCeu(t, alvo) { // t: 0..1 = um dia completo
    const a = t * Math.PI * 2, h = Math.sin(a);
    const gx = Math.round(alvo.x / 2) * 2, gz = Math.round(alvo.z / 2) * 2; // alvo em grade de 2 m: a sombra não "nada" enquanto o jogador anda
    sol.position.set(gx + Math.cos(a) * 500, Math.sin(a) * 500, gz + 200); sol.target.position.set(gx, alvo.y || 0, gz);
    const col = h > .3 ? dia.clone() : h > 0 ? por.clone().lerp(dia, h / .3) : por.clone().lerp(noite, Math.min(1, -h * 4));
    scene.background.copy(col); scene.fog.color.copy(col);
    cupula.position.set(alvo.x, 0, alvo.z); ceuMat.uniforms.topo.value.copy(col).multiplyScalar(h < 0 ? .38 : .63);
    ceuMat.uniforms.meio.value.copy(col).lerp(new THREE.Color(h < 0 ? 0x344d77 : 0x82bad2), .42);
    ceuMat.uniforms.horizonte.value.setHex(h < -.05 ? 0x18203d : h < .32 ? 0xe98958 : 0x79abc2);
    discoSol.position.copy(sol.position); discoSol.visible = h > -.18; discoSol.material.color.setHex(h < .25 ? 0xffa24d : 0xfff4bd);
    sol.color.setHex(h < .22 ? 0xffaa67 : 0xffe6c5); sol.intensity = Math.max(.22, h * 1.28); amb.intensity = .4 + Math.max(0, h) * .4 + (INT.on ? INT.ambInt || 0 : 0); // contraste natural sem brancos estourados
    matPredio.emissiveIntensity = Math.min(1.25, Math.max(0, (.18 - h) * 4.5)); // janelas acendem à noite
    const noiteF = Math.min(1, Math.max(0, (.1 - h) * 3)); luzes?.noite(noiteF);
    nuvemMat.color.setHex(h < 0 ? 0x6d7895 : h < .28 ? 0xffc7a8 : 0xffffff);
    estrelas.position.copy(alvo); estrelas.material.opacity = Math.min(1, Math.max(0, -h * 3));
    const tt = performance.now() / 800;
    for (let i = 0; i < mp.count; i++) mp.setY(i, Math.sin(mp.getX(i) * .05 + tt) * .25 + Math.cos(mp.getZ(i) * .3 + tt) * .15); mp.needsUpdate = true;
    for (let i = 0; i < mp2.count; i++) mp2.setY(i, Math.sin(mp2.getX(i) * .05 + tt) * .22 + Math.cos(mp2.getZ(i) * .25 + tt) * .14); mp2.needsUpdate = true; // ondas
  };
}
