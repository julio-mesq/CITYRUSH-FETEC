import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [main,assets,decor,mobile]=await Promise.all([
  readFile(new URL('../dist/main.js',import.meta.url),'utf8'),
  readFile(new URL('../dist/src/assets.js',import.meta.url),'utf8'),
  readFile(new URL('../dist/src/decor.js',import.meta.url),'utf8'),
  readFile(new URL('../dist/src/mobile.js',import.meta.url),'utf8')
]);
assert.match(assets,/export function carregarEssenciais/);
assert.match(assets,/export function carregarExtras/);
assert.match(main,/iniciarExtras=\(\)=>Assets\.carregarExtras/);
assert.ok(main.indexOf('iniciarOffline();iniciarExtras();')>main.indexOf('await renderer.compileAsync'), 'cache e decoração só após preparar shaders');
assert.ok(main.indexOf('await Assets.carregarEssenciais') < main.indexOf('extrasEmSegundoPlano.then'), 'somente o essencial deve bloquear a entrada');
assert.match(main,/aplicarQualidade\('baixa',true\)/);
assert.match(decor,/fraco \? 210 : 360/);
assert.match(mobile,/pointer: coarse/); assert.match(mobile,/touchLook/); assert.match(mobile,/joystick/);
console.log('otimização: carga dividida, LOD, qualidade adaptativa e touch OK');
