import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync(new URL('../dist/main.js',import.meta.url),'utf8');
const missions=fs.readFileSync(new URL('../dist/src/missions.js',import.meta.url),'utf8');
const vehicles=fs.readFileSync(new URL('../dist/src/vehicles.js',import.meta.url),'utf8');
const world=fs.readFileSync(new URL('../dist/src/world.js',import.meta.url),'utf8');
const phone=fs.readFileSync(new URL('../dist/src/phone.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');

assert.match(missions,/const BASE=\[/);
assert.equal((missions.match(/tipo:'(?:carro|rota|fuga)'/g)||[]).length>=5,true,'a demo precisa de cinco missões dirigíveis');
assert.match(missions,/checkpoint/);
assert.match(phone,/Demo Pública · 5 missões/);
assert.match(main,/if\(!Tel\.dados\(\)\.garagem\.length\)Tel\.adicionarCarro\(0\)/,'todo jogador precisa de um veículo inicial');
assert.match(vehicles,/EncaixeCondutor/,'veículos precisam de ponto próprio para o motorista');
assert.match(main,/atualizarPoseCondutor/,'carro, moto e bicicleta precisam de poses próprias');
assert.match(world,/colisores:\[\]/,'interiores precisam registrar colisores');
assert.match(html,/id="startDemo"/,'o menu precisa de botão explícito para iniciar');

console.log('public-demo: ok');
