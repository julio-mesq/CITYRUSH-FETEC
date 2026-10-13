import assert from 'node:assert/strict';
import fs from 'node:fs';

const traffic=fs.readFileSync(new URL('../dist/src/traffic.js',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('../dist/src/player.js',import.meta.url),'utf8');
const world=fs.readFileSync(new URL('../dist/src/world.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../dist/main.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');

assert.match(traffic,/export function estadoSemaforo/);
assert.match(traffic,/BoxGeometry\(\.72,2,\.56\)/,'o semáforo precisa ter caixa própria');
assert.match(traffic,/p<5\?'verde':p<6\?'amarelo'/,'o ciclo precisa incluir amarelo');
assert.match(traffic,/const lente=new THREE\.CircleGeometry/,'as lentes devem ficar dentro da caixa');
assert.match(player,/topoCabeca=Number\.isFinite/,'chapéus precisam acompanhar a altura real de cada modelo');
assert.match(world,/const faixaPed=new THREE\.InstancedMesh/);
assert.match(world,/foDetalhe=new THREE\.InstancedMesh/);
assert.match(main,/5000-\(performance\.now\(\)-inicioCarga\)/,'o carrossel deve permanecer por pelo menos cinco segundos');
assert.match(html,/cargaFoto foto1/);assert.match(html,/cargaFoto foto2/);assert.match(html,/cargaFoto foto3/);
assert.match(css,/@keyframes fotoCarga/);assert.match(css,/loading\/cidade-avenida\.png/);

console.log('visual-polish: ok');
