import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [online, html] = await Promise.all([
  readFile(new URL('../dist/src/multiplayer.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
]);

assert.match(online, /trystero@0\.25\.4/, 'a versão da rede deve ser fixa');
assert.match(online, /\.onMessage\s*=/, 'ações devem usar a API objeto atual');
assert.match(online, /\.send\(dados, target \? \{ target \}/, 'envio direcionado deve usar options.target');
assert.doesNotMatch(online, /const \[sendEstado/, 'a API de tupla antiga não pode voltar');
assert.match(online, /modo !== 'deathmatch'/, 'dano entre jogadores deve ficar restrito ao Deathmatch');
assert.match(online, /modo !== 'coop'/, 'reanimar deve ficar restrito ao cooperativo');
assert.match(html, /id="chatPanel"/); assert.match(html, /value="coop"/); assert.match(html, /value="deathmatch"/);
console.log('multiplayer: contrato de sala, chat, coop e deathmatch aprovado');
