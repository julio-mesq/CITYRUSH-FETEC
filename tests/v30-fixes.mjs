// v30: portas encaixadas nos vãos, luzes fixas (sem recompilar shaders) e tiro sem custo por projétil.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ler = f => fs.readFileSync(new URL('../dist/' + f, import.meta.url), 'utf8');
const main = ler('main.js'), inter = ler('src/interiors.js'), veic = ler('src/vehicles.js'), world = ler('src/world.js'), fx = ler('src/effects.js');

// 1) As portas vêm do projeto da casa e cada vão fica entre dois trechos de parede (validado em house-layout.mjs).
import { PORTAS, validarCasa } from '../dist/src/casa-layout.js';
assert.equal(PORTAS.length, 4, 'a casa precisa de 4 portas');
assert.deepEqual(validarCasa().filter(p => p.includes('porta')), [], 'portas desencaixadas ou bloqueadas');
assert.match(inter, /for \(const p of PORTAS\) criarPorta/);
assert.doesNotMatch(inter, /\.rotation\.y = ry \+ \.85/, 'portas tortas (rotação fixa de 0.85 rad) não podem voltar');
assert.match(inter, /alternarPorta/); assert.match(inter, /atualizarPortas/); assert.match(inter, /portaProxima/);
assert.match(world, /!c\.off&&y<c\.h/, 'porta aberta precisa liberar a colisão');
assert.match(main, /portaProxima/); assert.match(main, /E: abrir a porta/);

// 2) Nenhuma luz criada/ligada/desligada durante o jogo (isso recompila todos os materiais).
assert.doesNotMatch(veic, /new THREE\.(Spot|Point)Light/, 'carros não podem criar luzes próprias');
assert.doesNotMatch(inter, /HemisphereLight\([^)]*\);\s*casa\.visible/);
assert.equal((inter.match(/new THREE\.PointLight/g) || []).length, 0, 'interiores não criam luzes (usam o conjunto compartilhado de src/luzes.js)');
assert.match(main, /farolGlobal/); assert.match(main, /neonGlobal/);
assert.doesNotMatch(main, /\.add\(new THREE\.(Spot|Point)Light/);
assert.match(main, /renderer\.compile\(scene,cam\)/, 'shaders pré-compilados na tela de carregamento');
assert.match(main, /FX\.preaquecer\(\)/); assert.match(fx, /export function preaquecer/);
assert.match(main, /aplicarQualidade\(q,auto=false\)/); assert.match(main, /if\(!auto&&!fraco&&!sombrasDesligadas\)renderer\.shadowMap\.enabled/);
assert.match(main, /Math\.min\(bruto, \.1\)/, 'um quadro travado não pode ativar sozinho o modo desempenho');

// 3) Tiro: caixa dos carros calculada uma vez por disparo, nunca dentro do loop de projéteis.
const tiro = main.slice(main.indexOf('function atirar'), main.indexOf('function atirar') + 4200);
const iniLoop = tiro.indexOf('for (let p = 0; p < a.pel; p++)');
assert.ok(iniLoop > 0 && tiro.indexOf('setFromObject') > 0 && tiro.indexOf('setFromObject') < iniLoop, 'setFromObject deve ficar fora do loop de projéteis');
assert.ok(!tiro.slice(iniLoop).includes('setFromObject'), 'sem setFromObject por projétil');

// 4) Arma maior em primeira pessoa.
assert.match(main, /FP_ESCALA=1\.\d+/);
console.log('v30-fixes: portas, luzes fixas, tiro e arma OK');
