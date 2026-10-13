import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [main, graphics, audio, pov] = await Promise.all([
  readFile(new URL('../dist/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/src/graphics.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/src/audio.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/src/pov.js', import.meta.url), 'utf8')
]);
const dialogo = main.indexOf("if (Esc.aberto())");
const bloqueio = main.indexOf('if(telaAberta)return;', dialogo - 150);
assert.ok(dialogo >= 0 && bloqueio > dialogo, 'o diálogo deve receber o clique antes do bloqueio de telas');
assert.match(graphics, /AfterimagePass/); assert.match(graphics, /UnrealBloomPass/); assert.match(graphics, /RoomEnvironment/);
assert.match(audio, /export function radio/); assert.match(audio, /export const passo/); assert.match(audio, /export const tiro/);
assert.match(pov, /pov === 1/); assert.match(pov, /pov === 4/);
console.log('imersão: diálogo clicável, reflexos, bloom, movimento, áudio, rádio e câmeras OK');
