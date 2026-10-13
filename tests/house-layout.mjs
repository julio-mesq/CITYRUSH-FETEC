// v31: a casa tem planta coerente — sem móveis um dentro do outro, sem móvel na porta, na parede ou na vaga do carro.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CASA, PAREDES, PORTAS, MOVEIS, PONTOS, RAIO_PONTO, VAGA_CARRO, COMODOS, validarCasa, retangulo, sobrepoe } from '../dist/src/casa-layout.js';
const ler = f => fs.readFileSync(new URL('../dist/' + f, import.meta.url), 'utf8');

const problemas = validarCasa();
assert.deepEqual(problemas, [], 'planta inválida:\n' + problemas.join('\n'));
assert.equal(PORTAS.length, 4);
assert.ok(PONTOS.length >= 12, 'modo construção precisa de pelo menos 12 pontos livres');

// A garagem fica NA FRENTE (onde o carro entra) e a vaga está dentro dela.
const garagem = COMODOS.find(c => c.id === 'garagem');
assert.ok(VAGA_CARRO.z - VAGA_CARRO.d / 2 >= garagem.z - garagem.d / 2 && VAGA_CARRO.z + VAGA_CARRO.d / 2 <= garagem.z + garagem.d / 2 + .01, 'vaga dentro da garagem');
assert.ok(Math.abs(VAGA_CARRO.x + 7) < .01 && Math.abs(VAGA_CARRO.z - 4.8) < .01, 'main.js estaciona o carro em x=-7, z=4.8');
const quarto = COMODOS.find(c => c.id === 'quarto');
assert.ok(garagem.z - garagem.d / 2 >= 1 && quarto.z + quarto.d / 2 <= 1.01, 'garagem e quarto não se sobrepõem');

// Cada cômodo tem móveis coerentes (cama só no quarto, geladeira só na cozinha etc.).
const dentro = (m, c) => m.x >= c.x - c.w / 2 && m.x <= c.x + c.w / 2 && m.z >= c.z - c.d / 2 && m.z <= c.z + c.d / 2;
const onde = t => MOVEIS.filter(m => m.t === t).map(m => COMODOS.filter(c => dentro(m, c)).map(c => c.id.replace('2', '')));
assert.ok(onde('cama').every(l => l.includes('quarto')), 'cama no quarto');
assert.ok(onde('geladeira').every(l => l.includes('cozinha')) && onde('fogao').every(l => l.includes('cozinha')), 'cozinha equipada');
assert.ok(onde('sofa').every(l => l.includes('sala')), 'sofá na sala');
assert.ok(onde('vaso').every(l => l.includes('banheiro')) && onde('banheira').every(l => l.includes('banheiro')), 'banheiro equipado');
assert.ok(onde('bancadaOficina').every(l => l.includes('garagem')), 'bancada na garagem');

// Móveis do catálogo cabem no ponto reservado, mesmo girados.
const housing = ler('src/housing.js');
for (const m of housing.matchAll(/w:([\d.]+),d:([\d.]+),h:([\d.]+)\}/g)) {
  assert.ok(Math.max(+m[1], +m[2]) <= RAIO_PONTO * 2, `item do catálogo grande demais para o ponto (${m[0]})`);
}
assert.match(housing, /LAYOUT_PONTOS/); assert.match(housing, /criarMovel/);
assert.doesNotMatch(housing, /mobSofa|Assets\.clonarCena/, 'móveis sem acabamento (GLB cor lisa) não podem voltar na casa');

// interiors.js constrói a casa a partir dos dados (e não de coordenadas soltas).
const inter = ler('src/interiors.js');
assert.match(inter, /for \(const m of MOVEIS\)/); assert.match(inter, /for \(const w of PAREDES\)/); assert.match(inter, /for \(const p of PORTAS\) criarPorta/);
assert.match(inter, /colisoresCasa/);
assert.doesNotMatch(inter, /mob\(casa,/, 'casa não usa mais os GLBs de cor lisa');
// Todo móvel tem construtor próprio.
const furn = ler('src/furniture.js');
for (const t of new Set(MOVEIS.map(m => m.t))) assert.match(furn, new RegExp(`\\b${t}\\(w, d, h\\)`), `falta construtor de ${t}`);
for (const t of [...housing.matchAll(/tipo:'(\w+)'/g)].map(m => m[1])) assert.match(furn, new RegExp(`\\b${t}\\(w, d, h\\)`), `falta construtor de ${t}`);
console.log(`house-layout: ${MOVEIS.length} móveis, ${PAREDES.length} paredes, ${PORTAS.length} portas, ${PONTOS.length} pontos de construção — sem sobreposição`);
