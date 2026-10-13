// 6 armas: dano, cadência (s), munição, espalhamento, projéteis por tiro, alcance (m), raio de explosão
export const ARMAS = [
  { n: 'Pistola', dano: 50, cad: .35, mun: 12, esp: .01, pel: 1, alc: 80 },
  { n: 'SMG', dano: 25, cad: .08, mun: 30, esp: .03, pel: 1, alc: 70 },
  { n: 'Rifle', dano: 34, cad: .13, mun: 30, esp: .015, pel: 1, alc: 120 },
  { n: 'Shotgun', dano: 30, cad: .9, mun: 6, esp: .08, pel: 8, alc: 35 },
  { n: 'Sniper', dano: 100, cad: 1.2, mun: 5, esp: 0, pel: 1, alc: 300 },
  { n: 'Lança-foguetes', dano: 100, cad: 1.5, mun: 2, esp: 0, pel: 1, alc: 150, area: 8 },
  { n: 'Punhos', dano: 20, cad: .45, mun: 1, esp: 0, pel: 0, alc: 2.3, melee: true }
];
// Formas (largura, altura, comprimento) para desenhar cada arma na mão e na primeira pessoa
// (usadas também como fallback e como referência de tamanho ao encaixar o modelo 3D da arma)
export const FORMAS = [[.06, .14, .24], [.07, .16, .38], [.06, .14, .8], [.07, .12, .75], [.06, .14, 1], [.11, .11, .9]];
// Índices 0-4 têm modelo 3D (pistola/SMG/rifle/shotgun/sniper); 5 (lança-foguetes) e 6 (punhos) não têm.
export const ARMAS_GLB = ['pistola', 'submetralhadora', 'rifle', 'shotgun', 'sniper'];
// Rotação extra (eixo Y) ao encaixar cada modelo 3D na mão: a maioria destes .glb tem o cano
// modelado ao longo do eixo X do arquivo (por isso giram 90°), mas a submetralhadora já vem
// modelada com o cano no eixo Z — girá-la 90° também deixaria ela apontando de lado. Ajuste
// fino visual ainda pode ser necessário ao testar no navegador (ver comentário em trocarArma()).
export const ARMAS_ROT_Y = [Math.PI / 2, 0, Math.PI / 2, Math.PI / 2, Math.PI / 2];
export const ICONES_ARMA = ['▰','▱','⌁','═','┉','◉','✊'];
