// Móveis procedurais (v31): peças com acabamento (pés, almofadas, portas, puxadores, tampos),
// materiais compartilhados e paleta por estilo de casa. Origem = centro do móvel no chão;
// com ry = 0 a frente aponta para -z (veja casa-layout.js).
import * as THREE from 'three';
import * as Assets from './assets.js';

// ---------------------------------------------------------------- materiais compartilhados
const cache = new Map();
const mat = (chave, cor, rough = .7, metal = 0, extra = {}) => {
  if (!cache.has(chave)) cache.set(chave, new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: metal, ...extra }));
  return cache.get(chave);
};
// Paleta: os materiais "de estilo" mudam de cor conforme a casa (ver aplicarEstilo).
export const PALETAS = [
  { madeira: 0x9a6b43, madeiraEscura: 0x5e3f2a, tecido: 0x5d6b78, tecido2: 0x7d8c99, almofada: 0xd9a441, manta: 0x8c3b3b, parede: 0xe9e2d4 },
  { madeira: 0xb98b5e, madeiraEscura: 0x6d5033, tecido: 0x6f7f68, tecido2: 0x8fa088, almofada: 0xe8dfc8, manta: 0x3f5f7a, parede: 0xe3eadf },
  { madeira: 0x6f4a32, madeiraEscura: 0x3e2a1d, tecido: 0x7a5a52, tecido2: 0x9a7a70, almofada: 0x4f7a8c, manta: 0x2f4a62, parede: 0xdfe3ea },
  { madeira: 0x94623e, madeiraEscura: 0x583720, tecido: 0x6f7853, tecido2: 0x929573, almofada: 0xdda765, manta: 0x9d583b, parede: 0xeee3cd }
];
const estilo = {
  madeira: mat('madeira', 0x9a6b43, .62), madeiraEscura: mat('madeiraEscura', 0x5e3f2a, .65),
  tecido: mat('tecido', 0x5d6b78, .95), tecido2: mat('tecido2', 0x7d8c99, .95),
  almofada: mat('almofada', 0xd9a441, .95), manta: mat('manta', 0x8c3b3b, .95)
};
export function aplicarEstilo(i) {
  const p = PALETAS[Math.max(0, Math.min(PALETAS.length - 1, i | 0))];
  for (const k of Object.keys(estilo)) estilo[k].color.setHex(p[k]);
  return p;
}
const M = {
  branco: () => mat('branco', 0xeeeeea, .45), azulejo: () => mat('azulejoMov', 0xdfe8ea, .35),
  aco: () => mat('aco', 0xaab2b8, .35, .85), acoEscuro: () => mat('acoEscuro', 0x4b5258, .45, .7),
  preto: () => mat('preto', 0x15181b, .5), cinza: () => mat('cinza', 0x8a8f94, .8),
  vidro: () => mat('vidroMov', 0x9fc4d2, .08, .1, { transparent: true, opacity: .45 }),
  tela: () => mat('tela', 0x0a1c2c, .15, .2, { emissive: 0x0a2740, emissiveIntensity: .55 }),
  vaso: () => mat('vaso', 0xb45f3c, .85), folha: () => mat('folha', 0x2f7d46, .8), folha2: () => mat('folha2', 0x4a9a52, .8),
  folha3: () => mat('folha3', 0x246b3b, .8), terra: () => mat('terra', 0x3a2a20, 1),
  abajur: () => mat('abajur', 0xfff0c8, .9, 0, { emissive: 0xffd78a, emissiveIntensity: .45 }),
  borracha: () => mat('borracha', 0x1b1b1d, .95), vermelho: () => mat('vermelhoFerr', 0xb52a22, .55, .2),
  amarelo: () => mat('amareloFerr', 0xe0b21f, .6), azul: () => mat('azulFerr', 0x2c5f9e, .6),
  tapete1: () => mat('tapete1', 0x6a7580, 1), tapete2: () => mat('tapete2', 0x9aa4ad, 1),
  agua: () => mat('agua', 0xcfe9f2, .15, .05), concreto: () => mat('concretoMov', 0x6e7276, .9),
  livro: [0xa23b3b, 0x35607e, 0x3d7a4c, 0xc9a13a, 0x6b4b7a, 0xd9d3c3].map((c, i) => () => mat('livro' + i, c, .85))
};

// ---------------------------------------------------------------- utilidades
function peca(g, w, h, d, material, x, yBase, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, yBase + h / 2, z); g.add(m); return m;
}
function cilindro(g, r, h, material, x, yBase, z, seg = 14, rTopo = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTopo, r, h, seg), material);
  m.position.set(x, yBase + h / 2, z); g.add(m); return m;
}
function pes(g, w, d, h, r, material, margem = .06) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cilindro(g, r, h, material, sx * (w / 2 - margem), 0, sz * (d / 2 - margem), 8);
}
const puxador = (g, x, y, z, horizontal = true) => peca(g, horizontal ? .12 : .02, horizontal ? .02 : .12, .025, M.aco(), x, y, z);

// ---------------------------------------------------------------- construtores
const B = {
  sofa(w, d, h) {
    const g = new THREE.Group(), lugares = w > 1.7 ? 3 : w > 1.1 ? 2 : 1, braco = .2, baseH = .42;
    pes(g, w, d, .1, .035, M.preto(), .1);
    peca(g, w, baseH - .1, d, estilo.tecido, 0, .1, 0);
    const largAssento = (w - braco * 2) / lugares;
    for (let i = 0; i < lugares; i++) peca(g, largAssento - .02, .15, d - .26, estilo.tecido2, -w / 2 + braco + largAssento * (i + .5), baseH, -.1);
    peca(g, w - braco * 2, h - baseH, .22, estilo.tecido, 0, baseH, d / 2 - .11);
    for (const s of [-1, 1]) peca(g, braco, .3, d, estilo.tecido, s * (w / 2 - braco / 2), baseH - .02, 0);
    if (lugares > 1) for (const s of [-1, 1]) { const a = peca(g, .38, .36, .13, estilo.almofada, s * (w / 2 - braco - .3), baseH + .15, d / 2 - .3); a.rotation.set(-.25, s * .2, 0); }
    return g;
  },
  poltrona(w, d, h) { return B.sofa(w, d, h); },
  mesaCentro(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, .05, d, estilo.madeira, 0, h - .05, 0); peca(g, w - .1, .03, d - .1, estilo.madeiraEscura, 0, .14, 0);
    pes(g, w, d, h - .05, .022, M.acoEscuro(), .05);
    peca(g, .22, .03, .16, M.branco(), -w * .25, h, 0); // porta-copos/decoração
    return g;
  },
  rackTv(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h - .1, d, estilo.madeiraEscura, 0, .1, 0); peca(g, w + .04, .03, d + .02, estilo.madeira, 0, h - .03, 0);
    pes(g, w, d, .1, .02, M.preto(), .08);
    for (const s of [-1, 1]) { peca(g, w / 2 - .06, h - .2, .02, estilo.madeira, s * (w / 4), .15, -d / 2 - .005); puxador(g, s * (w / 4) - s * .12, h * .55, -d / 2 - .02); }
    return g;
  },
  tv(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h, d, M.preto(), 0, 0, 0); peca(g, w - .06, h - .06, .01, M.tela(), 0, .03, -d / 2 - .002);
    return g;
  },
  planta(w, d, h) {
    const g = new THREE.Group(), r = Math.min(w, d) * .42;
    cilindro(g, r * .75, .32, M.vaso(), 0, 0, 0, 16, r); cilindro(g, r * .9, .02, M.terra(), 0, .32, 0, 16);
    cilindro(g, .02, h * .55, mat('caule', 0x4a6b33), 0, .32, 0, 6);
    const folhas = [M.folha(), M.folha2(), M.folha3()];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, rr = .08 + (i % 3) * .07, y = .55 + (i / 9) * (h - .7);
      const f = new THREE.Mesh(new THREE.SphereGeometry(.17 - (i % 3) * .02, 8, 6), folhas[i % 3]);
      f.scale.set(1.2, .55, .8); f.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); f.rotation.set(0, a, .5); g.add(f);
    }
    return g;
  },
  abajur(w, d, h) {
    const g = new THREE.Group();
    cilindro(g, .15, .03, M.acoEscuro(), 0, 0, 0, 16); cilindro(g, .014, h - .38, M.acoEscuro(), 0, .03, 0, 8);
    cilindro(g, .21, .3, M.abajur(), 0, h - .33, 0, 18, .12);
    return g;
  },
  balcao(w, d, h) {
    const g = new THREE.Group();
    peca(g, w - .02, h - .08, d - .04, estilo.madeira, 0, .08, .01);          // corpo (recuado para o rodapé)
    peca(g, w - .06, .08, d - .12, M.preto(), 0, 0, .04);                       // rodapé escuro
    peca(g, w + .02, .04, d + .02, M.concreto(), 0, h - .04, 0);                // tampo
    const n = Math.max(1, Math.round(w / .62)), larg = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + larg * (i + .5);
      peca(g, larg - .04, h - .2, .02, estilo.madeiraEscura, x, .12, -d / 2 - .002);
      puxador(g, x + (i % 2 ? -.16 : .16) * (larg > .5 ? 1 : 0), h - .26, -d / 2 - .02);
    }
    return g;
  },
  fogao(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h - .02, d, M.branco(), 0, 0, 0); peca(g, w, .03, d, M.preto(), 0, h - .03, 0);
    for (const [x, z] of [[-.19, -.12], [.19, -.12], [-.19, .14], [.19, .14]]) { cilindro(g, .085, .012, M.acoEscuro(), x, h, z, 18); cilindro(g, .04, .016, M.preto(), x, h, z, 12); }
    peca(g, w - .12, h * .5, .02, M.preto(), 0, .08, -d / 2 - .003); peca(g, w - .24, h * .26, .012, M.vidro(), 0, .2, -d / 2 - .014);
    peca(g, w - .2, .025, .03, M.aco(), 0, h - .2, -d / 2 - .03);
    for (let i = 0; i < 4; i++) cilindro(g, .018, .02, M.preto(), -.27 + i * .18, h - .1, -d / 2 - .01, 8).rotation.x = Math.PI / 2;
    return g;
  },
  pia(w, d, h) {
    const g = B.balcao(w, d, h), bacia = Math.min(.6, w * .55);
    peca(g, bacia, .012, d * .62, M.acoEscuro(), 0, h, 0);
    peca(g, bacia - .08, .008, d * .62 - .08, M.agua(), 0, h + .008, 0);
    cilindro(g, .014, .24, M.aco(), 0, h, d * .24, 8); peca(g, .016, .016, .16, M.aco(), 0, h + .22, d * .17);
    return g;
  },
  geladeira(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h, d, M.aco(), 0, 0, 0); peca(g, w - .02, .015, .01, M.acoEscuro(), 0, h * .66, -d / 2 - .004);
    peca(g, .03, h * .24, .035, M.acoEscuro(), w / 2 - .1, h * .72, -d / 2 - .02); peca(g, .03, h * .3, .035, M.acoEscuro(), w / 2 - .1, h * .25, -d / 2 - .02);
    peca(g, w - .04, .04, d - .06, M.acoEscuro(), 0, h, 0.0).scale.y = .4;
    return g;
  },
  mesaJantar(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, .05, d, estilo.madeira, 0, h - .05, 0); peca(g, w - .22, .07, d - .22, estilo.madeiraEscura, 0, h - .12, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) peca(g, .07, h - .05, .07, estilo.madeiraEscura, sx * (w / 2 - .12), 0, sz * (d / 2 - .12));
    cilindro(g, .11, .02, M.branco(), 0, h, 0, 16); // centro de mesa
    return g;
  },
  cadeira(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, .05, d, estilo.madeira, 0, .43, 0); peca(g, w - .06, .04, d - .06, estilo.tecido2, 0, .48, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) peca(g, .04, .43, .04, estilo.madeiraEscura, sx * (w / 2 - .04), 0, sz * (d / 2 - .04));
    peca(g, w, .36, .04, estilo.madeira, 0, .52, d / 2 - .03);
    for (const sx of [-1, 1]) peca(g, .04, h - .5, .04, estilo.madeiraEscura, sx * (w / 2 - .04), .5, d / 2 - .03);
    return g;
  },
  aparador(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h - .06, d, estilo.madeiraEscura, 0, .06, 0); peca(g, w + .04, .04, d + .03, estilo.madeira, 0, h - .04, 0);
    pes(g, w, d, .06, .02, M.preto(), .06);
    const n = 3, larg = w / n;
    for (let i = 0; i < n; i++) { const x = -w / 2 + larg * (i + .5); peca(g, larg - .05, h - .22, .02, estilo.madeira, x, .12, -d / 2 - .005); puxador(g, x, h * .55, -d / 2 - .02, false); }
    cilindro(g, .07, .22, M.vaso(), w * .3, h, 0, 12, .05);
    return g;
  },
  cama(w, d, h) {
    // Cabeceira em +z (com ry = π a cabeceira encosta na parede de fundo).
    const g = new THREE.Group();
    peca(g, w, .26, d, estilo.madeiraEscura, 0, .1, 0); pes(g, w, d, .1, .03, M.preto(), .05);
    peca(g, w - .08, .22, d - .1, M.branco(), 0, .36, -.02);
    peca(g, w + .06, .95, .1, estilo.madeira, 0, .1, d / 2 + .02); peca(g, w + .06, .4, .08, estilo.madeira, 0, .1, -d / 2 - .02);
    for (const s of [-1, 1]) peca(g, .5, .13, .32, M.branco(), s * (w * .24), .58, d / 2 - .3).rotation.x = -.18;
    const manta = peca(g, w - .02, .1, d * .55, estilo.manta, 0, .55, -d * .17);
    peca(g, w, .12, .22, estilo.almofada, 0, .56, -d * .17 + d * .275 - .04);
    return g;
  },
  criado(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h - .06, d, estilo.madeira, 0, .06, 0); pes(g, w, d, .06, .018, M.preto(), .05);
    peca(g, w - .06, .16, .02, estilo.madeiraEscura, 0, h - .26, -d / 2 - .004); peca(g, w - .06, .16, .02, estilo.madeiraEscura, 0, h - .44, -d / 2 - .004);
    puxador(g, 0, h - .18, -d / 2 - .02); puxador(g, 0, h - .36, -d / 2 - .02);
    cilindro(g, .07, .02, M.acoEscuro(), .05, h - .06 + .06, .02, 12); cilindro(g, .012, .2, M.acoEscuro(), .05, h, .02, 6);
    cilindro(g, .11, .15, M.abajur(), .05, h + .18, .02, 14, .07);
    return g;
  },
  guardaRoupa(w, d, h) {
    const g = new THREE.Group(), n = Math.max(2, Math.round(w / .8)), larg = w / n;
    peca(g, w, h, d, estilo.madeira, 0, 0, 0);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + larg * (i + .5); peca(g, larg - .035, h - .12, .02, estilo.madeiraEscura, x, .06, -d / 2 - .004);
      puxador(g, x + (i % 2 ? -.1 : .1), h * .5, -d / 2 - .02, false);
    }
    return g;
  },
  escrivaninha(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, .04, d, estilo.madeira, 0, h - .04, 0);
    peca(g, .04, h - .04, d - .06, estilo.madeiraEscura, -w / 2 + .03, 0, 0); peca(g, .5, h - .04, d - .06, estilo.madeiraEscura, w / 2 - .27, 0, 0);
    for (let i = 0; i < 2; i++) { peca(g, .44, .26, .02, estilo.madeira, w / 2 - .27, .08 + i * .32, -d / 2 + .02); puxador(g, w / 2 - .27, .19 + i * .32, -d / 2 + .0); }
    return g;
  },
  computador(w, d, h) {
    const g = new THREE.Group();
    peca(g, .22, .02, .16, M.acoEscuro(), 0, 0, .02); peca(g, .04, .12, .04, M.acoEscuro(), 0, .02, .04);
    peca(g, w, h * .68, .03, M.preto(), 0, .15, .05); peca(g, w - .04, h * .68 - .04, .01, M.tela(), 0, .17, .033);
    peca(g, w * .8, .015, .14, M.cinza(), 0, 0, -.1); peca(g, .08, .02, .06, M.cinza(), w * .5, 0, -.08);
    return g;
  },
  estacaoPC(w, d, h) {
    const g = B.escrivaninha(w, d, .75); const pc = B.computador(.5, .3, .45); pc.position.set(0, .75, .06); g.add(pc); return g;
  },
  estante(w, d, h) {
    const g = new THREE.Group(), niveis = 5, vao = (h - .04) / niveis;
    for (const s of [-1, 1]) peca(g, .03, h, d, estilo.madeira, s * (w / 2 - .015), 0, 0);
    peca(g, w, h, .015, estilo.madeiraEscura, 0, 0, d / 2 - .008);
    for (let i = 0; i <= niveis; i++) peca(g, w, .03, d, estilo.madeira, 0, i * vao, 0);
    let k = 0;
    for (let n = 0; n < niveis - 1; n++) { let x = -w / 2 + .06; while (x < w / 2 - .12) { const e = .035 + ((k * 7) % 4) * .01, a = vao * (.55 + ((k * 5) % 4) * .1); peca(g, e, a, d * .7, M.livro[k % 6](), x + e / 2, n * vao + .03, 0); x += e + .005; k++; } }
    return g;
  },
  vaso(w, d, h) { // vaso sanitário (frente em -z, caixa acoplada em +z)
    const g = new THREE.Group();
    peca(g, w * .8, .08, d * .55, M.branco(), 0, 0, -d * .12);
    const bacia = new THREE.Mesh(new THREE.CylinderGeometry(w * .46, w * .36, .38, 16), M.branco()); bacia.scale.z = 1.3; bacia.position.set(0, .26, -d * .14); g.add(bacia);
    peca(g, w * .85, .06, d * .55, M.branco(), 0, .45, -d * .14); peca(g, w * .9, .38, .16, M.branco(), 0, .38, d / 2 - .09); peca(g, w * .95, .03, .18, M.branco(), 0, .76, d / 2 - .09);
    cilindro(g, .02, .02, M.aco(), 0, .79, d / 2 - .09, 8);
    return g;
  },
  banheira(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h, d, M.branco(), 0, 0, 0); peca(g, w - .14, .02, d - .14, M.agua(), 0, h - .005, 0);
    cilindro(g, .018, .22, M.aco(), 0, h, d / 2 - .06, 8); peca(g, .016, .016, .12, M.aco(), 0, h + .2, d / 2 - .1);
    return g;
  },
  bancadaOficina(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, .06, d, estilo.madeiraEscura, 0, h - .06, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) peca(g, .06, h - .06, .06, M.acoEscuro(), sx * (w / 2 - .06), 0, sz * (d / 2 - .06));
    peca(g, w - .1, .04, d - .1, M.acoEscuro(), 0, .25, 0);
    peca(g, w - .1, .8, .03, mat('painel', 0x6d7479, .7, .3), 0, h + .35, d / 2 - .02);
    const cores = [M.vermelho(), M.amarelo(), M.azul()];
    for (let i = 0; i < 6; i++) peca(g, .06, .16 + (i % 3) * .04, .02, cores[i % 3], -w / 2 + .3 + i * (w - .6) / 5, h + .6 - (i % 2) * .18, d / 2 - .045);
    peca(g, .16, .08, .12, M.acoEscuro(), -w * .3, h, 0); peca(g, .3, .1, .18, M.vermelho(), w * .15, h, -.04);
    return g;
  },
  estanteMetal(w, d, h) {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) peca(g, .04, h, .04, M.acoEscuro(), sx * (w / 2 - .02), 0, sz * (d / 2 - .02));
    for (let i = 0; i < 4; i++) peca(g, w, .03, d, M.aco(), 0, .2 + i * .52, 0);
    const cores = [estilo.madeiraEscura, M.vermelho(), M.azul(), estilo.madeira];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) peca(g, .5, .28 - j * .06, d * .8, cores[(i + j) % 4], -w / 4 + j * (w / 2), .23 + i * .52, 0);
    return g;
  },
  pneus(w, d, h) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(w * .3, .1, 10, 20), M.borracha()); t.rotation.x = Math.PI / 2; t.position.set((i % 2) * .02, .1 + i * .2, 0); g.add(t); }
    return g;
  },
  caixaFerramentas(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h - .08, d, M.vermelho(), 0, .08, 0); pes(g, w, d, .08, .03, M.preto(), .07);
    for (let i = 0; i < 3; i++) { peca(g, w - .08, .015, .01, M.preto(), 0, .18 + i * .18, -d / 2 - .002); puxador(g, 0, .24 + i * .18, -d / 2 - .02); }
    peca(g, w, .03, d, M.acoEscuro(), 0, h - .03, 0);
    return g;
  },
  tapete(w, d, h) {
    const g = new THREE.Group();
    peca(g, w, h, d, M.tapete1(), 0, 0, 0); peca(g, w - .4, h + .006, d - .4, M.tapete2(), 0, 0, 0); peca(g, w - .8, h + .012, d - .8, M.tapete1(), 0, 0, 0);
    return g;
  }
};
// Aliases do catálogo do modo construção
B.sofa2 = B.sofa; B.mesa = B.mesaJantar;

export function criarMovel(tipo, w, d, h) {
  const chave=tipo==='sofa2'?'sofa':tipo==='mesa'?'mesaJantar':tipo;
  const modelo=Assets.clonarCena('mobVisual_'+chave);
  if(modelo){
    // Mantém o móvel dentro do volume usado pelas colisões/layout existentes.
    modelo.rotation.y=Math.PI;modelo.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(modelo),size=box.getSize(new THREE.Vector3()),centro=box.getCenter(new THREE.Vector3());
    const escala=Math.min(w/Math.max(size.x,.001),h/Math.max(size.y,.001),d/Math.max(size.z,.001));
    const base=new THREE.Group(),encaixe=new THREE.Group();encaixe.add(modelo);encaixe.position.set(-centro.x,-box.min.y,-centro.z);base.add(encaixe);base.scale.setScalar(escala);
    modelo.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.castShadow=false;o.receiveShadow=true;}});
    base.userData.tipoMovel=tipo;base.userData.modeloGLB=chave;return base;
  }
  const f = B[tipo]; const g = f ? f(w, d, h) : B.caixaFerramentas(w, d, h);
  g.userData.tipoMovel = tipo; return g;
}

// Funde todas as malhas de um grupo por material (≈480 peças → ~30 malhas): o interior
// da casa fica leve para celular, sem mudar a aparência. Todas as geometrias do THREE
// usadas aqui (caixa, cilindro, esfera, toro) são indexadas e têm normal e uv.
function unir(lista) {
  let nv = 0, ni = 0;
  for (const g of lista) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of lista) {
    const n = g.attributes.position.count, ix = g.index.array;
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2);
    for (let i = 0; i < ix.length; i++) idx[oi + i] = ix[i] + ov;
    ov += n; oi += ix.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere(); return geo;
}
export function fundirMoveis(raiz) {
  raiz.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(raiz.matrixWorld).invert(), porMaterial = new Map();
  raiz.traverse(o => {
    if (!o.isMesh || !o.geometry || Array.isArray(o.material) || !o.geometry.index) return;
    const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inversa, o.matrixWorld));
    if (!porMaterial.has(o.material)) porMaterial.set(o.material, []);
    porMaterial.get(o.material).push(g);
  });
  const novos = [];
  for (const [material, lista] of porMaterial) { const m = new THREE.Mesh(unir(lista), material); m.matrixAutoUpdate = false; m.updateMatrix(); novos.push(m); lista.forEach(g => g.dispose()); }
  for (const c of [...raiz.children]) { c.traverse(o => o.geometry?.dispose?.()); raiz.remove(c); }
  raiz.add(...novos); return novos.length;
}
