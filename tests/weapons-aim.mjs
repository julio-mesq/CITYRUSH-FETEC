import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync(new URL('../dist/main.js',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('../dist/src/player.js',import.meta.url),'utf8');
const weapons=fs.readFileSync(new URL('../dist/src/weapon-models.js',import.meta.url),'utf8');
const pov=fs.readFileSync(new URL('../dist/src/pov.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const npcs=fs.readFileSync(new URL('../dist/src/npcs.js',import.meta.url),'utf8');

for(const tipo of ['homem','mulher','mulher2','soldado']){
  assert.match(player,new RegExp(`${tipo}: \\{[^\\n]+rotY: Math\\.PI`),`${tipo} precisa olhar para a direção do movimento`);
}
assert.match(weapons,/export function criarVisualArma/);
assert.match(weapons,/BocaDaArma/);
assert.match(weapons,/origem seja o centro do cabo/);
assert.match(weapons,/corpo\.position\.sub\(cabo\)/);
assert.match(weapons,/lança-foguetes completo/);
assert.match(main,/pontaDaArma\(jog\.obj/);
assert.match(main,/fpMuzzle\.getWorldPosition/);
assert.match(main,/tracante\(ini, fim, !!a\.area\)/);
assert.match(main,/function abrirRoda/);
assert.match(main,/classList\.toggle\('scope'/);
assert.match(pov,/jogador continua visível à esquerda/);
assert.match(html,/id="weaponWheel"/);
assert.match(html,/id="scopeOverlay"/);
assert.match(html,/id="ironSight"/);
assert.match(player,/export function atualizarArmaTerceiraPessoa/);
assert.match(player,/acompanha posição E rotação do pulso/);
assert.match(player,/getWorldPosition\(MAO_MUNDO\)/);
assert.match(player,/ESCALA_TP=/);
assert.match(main,/FP_MIRA=_fp\(\[/);
assert.match(main,/fp\.scale\.setScalar/);
assert.match(main,/function bracosFP/,'a primeira pessoa precisa mostrar mãos e braços segurando a arma');
assert.match(css,/clip-path:polygon\(50% 49%,25% 0,75% 0\)/,'a roda precisa ter setores circulares');
assert.match(css,/body\.firstPerson\.aiming:not\(\.scope\) #ironSight/);
assert.match(npcs,/const personalidades=/);
assert.match(npcs,/const acessorios=/);
assert.doesNotMatch(main,/wrapper\.rotation\.y = Math\.PI \/ 2/,'a primeira pessoa não pode forçar a mesma rotação em todas as armas');

console.log('weapons-aim: ok');
