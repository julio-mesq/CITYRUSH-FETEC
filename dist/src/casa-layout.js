// Projeto da casa (v31): dados puros, sem Three.js, para poder ser validado em teste.
// Coordenadas locais ao centro da casa (24 × 18 m). A frente (entrada/garagem) fica em z = +9.
// Orientação dos móveis: com ry = 0 a "frente" do móvel aponta para -z.
//   ry = π   → frente para +z      ry = π/2 → frente para -x      ry = -π/2 → frente para +x
//
// Planta:
//   Oeste (x -12 … -2.5):  GARAGEM na frente (z 1 … 9) · QUARTO atrás (z -9 … 1) · BANHEIRO no canto (x -5.5 … -2.5, z -9 … -3)
//   Leste (x -2.5 … 12):   SALA na frente (z 0.5 … 9) · COZINHA/JANTAR atrás (z -9 … 0.5)
// Nenhum móvel invade parede, porta (vão e giro da folha) ou a vaga do carro.

export const CASA = { w: 24, d: 18, altura: 4.2, alturaParede: 3.75 };

// Paredes internas. eixo 'x' = parede ao longo de Z (x = linha); eixo 'z' = parede ao longo de X (z = linha).
// "trechos" são os pedaços sólidos; os vãos entre eles recebem portas (ou ficam livres como arcos).
export const PAREDES = [
  { eixo: 'x', linha: -2.5, trechos: [[-9, -2.0], [-0.4, 5.5], [7.0, 9]] },   // oeste | leste
  { eixo: 'z', linha: 1, trechos: [[-12, -10.2], [-8.6, -2.5]] },             // garagem | quarto
  { eixo: 'x', linha: -5.5, trechos: [[-9, -6.6], [-5.2, -3]] },              // quarto | banheiro
  { eixo: 'z', linha: -3, trechos: [[-5.5, -2.5]] },                          // fecha o banheiro
  { eixo: 'z', linha: 0.5, trechos: [[-2.5, 2.0], [8.0, 12]] }                // sala | cozinha (passagem livre no meio)
];

// Portas: [eixo, linha, início do vão, fim do vão, direção em que a folha aponta aberta]. Dobradiça na ponta "início".
export const PORTAS = [
  { nome: 'garagem-sala', eixo: 'x', linha: -2.5, ini: 5.5, fim: 7.0, abre: [1, 0] },
  { nome: 'quarto-cozinha', eixo: 'x', linha: -2.5, ini: -2.0, fim: -0.4, abre: [1, 0] },
  { nome: 'garagem-quarto', eixo: 'z', linha: 1, ini: -10.2, fim: -8.6, abre: [0, 1] },
  { nome: 'quarto-banheiro', eixo: 'x', linha: -5.5, ini: -6.6, fim: -5.2, abre: [1, 0] }
];

// Vaga do carro dentro da garagem (main.js estaciona o carro em x = -7, z = 4.8).
export const VAGA_CARRO = { x: -7, z: 4.8, w: 2.6, d: 5.6 };

// Pisos por cômodo: [cor do material, x, z, largura, profundidade]
export const COMODOS = [
  { id: 'garagem', x: -7.25, z: 5, w: 9.5, d: 8, piso: 'concreto' },
  { id: 'quarto', x: -8.75, z: -4, w: 6.5, d: 10, piso: 'madeira' },
  { id: 'quarto2', x: -4, z: -1, w: 3, d: 4, piso: 'madeira' },
  { id: 'banheiro', x: -4, z: -6, w: 3, d: 6, piso: 'azulejo' },
  { id: 'sala', x: 4.75, z: 4.75, w: 14.5, d: 8.5, piso: 'madeira' },
  { id: 'cozinha', x: 4.75, z: -4.25, w: 14.5, d: 9.5, piso: 'azulejo' }
];

// Móveis. w × d = tamanho SEM rotação (x × z); h = altura; y = elevação (itens sobre outros); ruido: ignora colisão.
export const MOVEIS = [
  // ---------- Sala
  { t: 'tapete', x: 5.6, z: 4.9, w: 5.2, d: 3.4, h: .03, ry: 0, semColisao: true },
  { t: 'sofa', x: 5.6, z: 2.9, w: 2.4, d: 1.0, h: .9, ry: Math.PI },
  { t: 'mesaCentro', x: 5.6, z: 5.2, w: 1.2, d: .6, h: .4, ry: 0 },
  { t: 'rackTv', x: 5.6, z: 8.58, w: 1.9, d: .42, h: .5, ry: Math.PI },
  { t: 'tv', x: 5.6, z: 8.8, w: 1.5, d: .06, h: .86, y: 1.1, ry: Math.PI, semColisao: true },
  { t: 'poltrona', x: 9.5, z: 4.6, w: .95, d: .95, h: .85, ry: Math.PI / 2 },
  { t: 'planta', x: 11.2, z: 8.2, w: .6, d: .6, h: 1.3, ry: 0 },
  { t: 'planta', x: 11.2, z: 1.5, w: .6, d: .6, h: 1.1, ry: 0 },
  { t: 'abajur', x: 8.0, z: 2.3, w: .4, d: .4, h: 1.6, ry: 0 },
  // ---------- Cozinha e jantar
  { t: 'balcao', x: 1.65, z: -8.53, w: 4.1, d: .65, h: .9, ry: Math.PI },
  { t: 'fogao', x: 4.1, z: -8.53, w: .8, d: .65, h: .9, ry: Math.PI },
  { t: 'balcao', x: 5.1, z: -8.53, w: 1.2, d: .65, h: .9, ry: Math.PI },
  { t: 'pia', x: 6.5, z: -8.53, w: 1.6, d: .65, h: .9, ry: Math.PI },
  { t: 'balcao', x: 8.235, z: -8.53, w: 1.87, d: .65, h: .9, ry: Math.PI },
  { t: 'geladeira', x: 9.6, z: -8.45, w: .85, d: .8, h: 1.85, ry: Math.PI },
  { t: 'mesaJantar', x: 5.0, z: -4.2, w: 2.2, d: 1.1, h: .76, ry: 0 },
  { t: 'cadeira', x: 4.2, z: -5.3, w: .5, d: .5, h: .9, ry: Math.PI },
  { t: 'cadeira', x: 5.8, z: -5.3, w: .5, d: .5, h: .9, ry: Math.PI },
  { t: 'cadeira', x: 4.2, z: -3.1, w: .5, d: .5, h: .9, ry: 0 },
  { t: 'cadeira', x: 5.8, z: -3.1, w: .5, d: .5, h: .9, ry: 0 },
  { t: 'aparador', x: 11.55, z: -4.0, w: 1.6, d: .42, h: 1.0, ry: Math.PI / 2 },
  { t: 'planta', x: -1.5, z: -8.2, w: .5, d: .5, h: 1.0, ry: 0 },
  // ---------- Quarto
  { t: 'tapete', x: -8.3, z: -4.9, w: 3.2, d: 2.2, h: .03, ry: 0, semColisao: true },
  { t: 'cama', x: -8.3, z: -7.6, w: 1.9, d: 2.2, h: .62, ry: Math.PI },
  { t: 'criado', x: -10.3, z: -8.55, w: .5, d: .42, h: .5, ry: Math.PI },
  { t: 'criado', x: -6.3, z: -8.55, w: .5, d: .42, h: .5, ry: Math.PI },
  { t: 'guardaRoupa', x: -11.5, z: -4.9, w: 2.4, d: .7, h: 2.1, ry: -Math.PI / 2 },
  { t: 'escrivaninha', x: -11.5, z: -1.45, w: 1.5, d: .7, h: .75, ry: -Math.PI / 2 },
  { t: 'computador', x: -11.55, z: -1.45, w: .5, d: .3, h: .45, y: .75, ry: -Math.PI / 2, semColisao: true },
  { t: 'cadeira', x: -10.5, z: -1.45, w: .5, d: .5, h: .9, ry: Math.PI / 2 },
  { t: 'planta', x: -4.9, z: .25, w: .5, d: .5, h: 1.0, ry: 0 },
  // ---------- Banheiro
  { t: 'vaso', x: -2.95, z: -7.2, w: .4, d: .7, h: .75, ry: Math.PI / 2 },
  { t: 'pia', x: -4.5, z: -8.62, w: 1.0, d: .5, h: .85, ry: Math.PI },
  { t: 'banheira', x: -3.1, z: -4.8, w: .8, d: 1.7, h: .55, ry: 0 },
  // ---------- Garagem
  { t: 'bancadaOficina', x: -11.5, z: 4.6, w: 3.0, d: .7, h: 1.0, ry: -Math.PI / 2 },
  { t: 'estanteMetal', x: -4.3, z: 1.7, w: 1.6, d: .45, h: 1.9, ry: Math.PI },
  { t: 'pneus', x: -3.3, z: 3.4, w: .75, d: .75, h: 1.0, ry: 0 },
  { t: 'caixaFerramentas', x: -10.4, z: 8.1, w: .9, d: .45, h: .7, ry: 0 }
];

// Janelas: [parede, posição ao longo dela, largura]
export const JANELAS = [
  { parede: 'fundo', pos: 5.6, w: 3.0 },     // cozinha (z = -9)
  { parede: 'fundo', pos: -8.3, w: 2.4 },    // quarto  (z = -9)
  { parede: 'leste', pos: 5.0, w: 3.2 }      // sala    (x = 12)
];

// Luzes (o interior usa um conjunto FIXO de luzes: nunca liga/desliga luz no jogo)
export const LUZES = [
  { x: -7.2, z: 4.5, i: 1.35, d: 9 }, { x: -8.0, z: -4.0, i: 1.2, d: 9 },
  { x: 5.3, z: 4.8, i: 1.25, d: 9 }, { x: 5.0, z: -4.4, i: 1.25, d: 9 }
];

// Pontos onde o jogador pode colocar móveis no modo construção. Cada ponto reserva um quadrado
// de (2 × RAIO_PONTO) m livre de paredes, portas, móveis fixos e da vaga do carro.
export const RAIO_PONTO = .85;
export const PONTOS = [
  [2.2, 5.2], [9.0, 7.3], [1.2, 2.6], [9.6, 2.5],
  [0.2, -3.0], [9.4, -2.6], [1.6, -6.1], [8.0, -6.0],
  [-6.7, -0.4], [-9.0, -2.9], [-9.6, 7.0], [-4.4, 6.2]
];

// ---------------------------------------------------------------- geometria / validação
const MEIO_PAREDE = .11;
export function retangulo(m) {
  const girado = Math.abs(Math.sin(m.ry || 0)) > .7;
  const w = girado ? m.d : m.w, d = girado ? m.w : m.d;
  return { x0: m.x - w / 2, x1: m.x + w / 2, z0: m.z - d / 2, z1: m.z + d / 2 };
}
export function paredesComoRetangulos() {
  const lista = [];
  for (const p of PAREDES) for (const [a, b] of p.trechos) {
    lista.push(p.eixo === 'x'
      ? { x0: p.linha - MEIO_PAREDE, x1: p.linha + MEIO_PAREDE, z0: a, z1: b }
      : { x0: a, x1: b, z0: p.linha - MEIO_PAREDE, z1: p.linha + MEIO_PAREDE });
  }
  // paredes externas (face interna)
  lista.push({ x0: -12.2, x1: -11.875, z0: -9, z1: 9 }, { x0: 11.875, x1: 12.2, z0: -9, z1: 9 }, { x0: -12, x1: 12, z0: -9.2, z1: -8.875 });
  return lista;
}
// Área ocupada pela porta: vão + faixa de passagem + folha aberta (giro de 90°).
export function areaDaPorta(p, folga = .15) {
  const larg = p.fim - p.ini, [ax, az] = p.abre, hinge = p.ini + .11, passe = .75;
  const folha = larg - .22;
  if (p.eixo === 'x') {
    const aberta = ax > 0 ? { x0: p.linha, x1: p.linha + folha, z0: hinge - .06, z1: hinge + .06 } : { x0: p.linha - folha, x1: p.linha, z0: hinge - .06, z1: hinge + .06 };
    return [
      { x0: p.linha - passe, x1: p.linha + passe, z0: p.ini, z1: p.fim },
      { x0: aberta.x0 - folga, x1: aberta.x1 + folga, z0: aberta.z0 - folga, z1: aberta.z1 + folga }
    ];
  }
  const aberta = az > 0 ? { z0: p.linha, z1: p.linha + folha } : { z0: p.linha - folha, z1: p.linha };
  return [
    { x0: p.ini, x1: p.fim, z0: p.linha - passe, z1: p.linha + passe },
    { x0: hinge - .06 - folga, x1: hinge + .06 + folga, z0: aberta.z0 - folga, z1: aberta.z1 + folga }
  ];
}
export const sobrepoe = (a, b, tol = .01) => a.x0 < b.x1 - tol && a.x1 > b.x0 + tol && a.z0 < b.z1 - tol && a.z1 > b.z0 + tol;
const vagaRet = () => ({ x0: VAGA_CARRO.x - VAGA_CARRO.w / 2, x1: VAGA_CARRO.x + VAGA_CARRO.w / 2, z0: VAGA_CARRO.z - VAGA_CARRO.d / 2, z1: VAGA_CARRO.z + VAGA_CARRO.d / 2 });

// Retorna a lista de problemas (vazia = projeto válido).
export function validarCasa() {
  const problemas = [], paredes = paredesComoRetangulos(), areasPorta = PORTAS.flatMap(p => areaDaPorta(p).map(a => ({ a, nome: p.nome })));
  const fixos = MOVEIS.filter(m => !m.semColisao);
  fixos.forEach((m, i) => {
    const r = retangulo(m), nome = `${m.t}@(${m.x},${m.z})`;
    if (r.x0 < -11.88 || r.x1 > 11.88 || r.z0 < -8.88 || r.z1 > 8.88) problemas.push(`${nome} fora da casa`);
    paredes.forEach(p => { if (sobrepoe(r, p)) problemas.push(`${nome} atravessa parede`); });
    areasPorta.forEach(({ a, nome: n }) => { if (sobrepoe(r, a)) problemas.push(`${nome} bloqueia a porta ${n}`); });
    if (sobrepoe(r, vagaRet())) problemas.push(`${nome} invade a vaga do carro`);
    for (let j = i + 1; j < fixos.length; j++) if (sobrepoe(r, retangulo(fixos[j]))) problemas.push(`${nome} sobrepõe ${fixos[j].t}@(${fixos[j].x},${fixos[j].z})`);
  });
  // vãos de porta precisam estar entre trechos de parede reais
  PORTAS.forEach(p => {
    const lin = PAREDES.filter(w => w.eixo === p.eixo && Math.abs(w.linha - p.linha) < .01);
    const ok = lin.some(w => w.trechos.some(([, b]) => Math.abs(b - p.ini) < .01)) && lin.some(w => w.trechos.some(([a]) => Math.abs(a - p.fim) < .01));
    if (!ok) problemas.push(`porta ${p.nome} não encaixa entre dois trechos de parede`);
  });
  // pontos do modo construção
  PONTOS.forEach(([x, z], i) => {
    const r = { x0: x - RAIO_PONTO, x1: x + RAIO_PONTO, z0: z - RAIO_PONTO, z1: z + RAIO_PONTO }, nome = `ponto ${i + 1}`;
    if (r.x0 < -11.88 || r.x1 > 11.88 || r.z0 < -8.88 || r.z1 > 8.88) problemas.push(`${nome} fora da casa`);
    paredes.forEach(p => { if (sobrepoe(r, p)) problemas.push(`${nome} atravessa parede`); });
    areasPorta.forEach(({ a, nome: n }) => { if (sobrepoe(r, a)) problemas.push(`${nome} bloqueia a porta ${n}`); });
    if (sobrepoe(r, vagaRet())) problemas.push(`${nome} invade a vaga do carro`);
    fixos.forEach(m => { if (sobrepoe(r, retangulo(m))) problemas.push(`${nome} sobrepõe ${m.t}@(${m.x},${m.z})`); });
    PONTOS.forEach(([x2, z2], j) => { if (j > i && Math.abs(x - x2) < RAIO_PONTO * 2 && Math.abs(z - z2) < RAIO_PONTO * 2) problemas.push(`${nome} encosta no ponto ${j + 1}`); });
  });
  return problemas;
}
