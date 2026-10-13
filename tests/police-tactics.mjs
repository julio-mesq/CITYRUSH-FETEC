import assert from 'node:assert/strict';
import fs from 'node:fs';

const main=fs.readFileSync(new URL('../dist/main.js',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('../dist/src/player.js',import.meta.url),'utf8');
const npcs=fs.readFileSync(new URL('../dist/src/npcs.js',import.meta.url),'utf8');
const audio=fs.readFileSync(new URL('../dist/src/audio.js',import.meta.url),'utf8');

assert.match(player,/ESCALA_TP=\[1\.3,1\.5,1\.3,1\.3,1\.2,1\.1\]/,'cada arma precisa de uma escala proporcional ao personagem');
assert.match(player,/getWorldPosition\(MAO_MUNDO\)/,'a arma precisa acompanhar o osso real da mão');
assert.match(player,/getWorldQuaternion\(MAO_Q\)/,'a arma precisa acompanhar também a rotação do pulso');
assert.match(player,/g\.worldToLocal\(MAO_LOCAL\)/,'a mão precisa ser convertida ao espaço local do personagem');
assert.match(player,/acessorio==='policia'/,'o uniforme policial precisa de acessórios próprios');
assert.match(npcs,/trocarArma\(this\.obj,indice%3===0\?2:0\)/,'policiais precisam portar pistola ou rifle');
assert.match(npcs,/function procurarCobertura/);
assert.match(npcs,/else if\(d<10\)andar\(-dx\/d/,'policiais precisam recuar quando o jogador se aproxima');
assert.match(npcs,/city-police-shot/,'policiais precisam disparar à distância');
assert.match(main,/addEventListener\('city-police-shot'/,'os disparos policiais precisam ter áudio e traçante');
assert.match(main,/n\.atualizarVisualArma\?\.\(\)/,'a pose armada da polícia precisa ser atualizada depois da animação');
assert.match(audio,/o1\.type=o2\.type='sine'/,'a sirene não deve usar o antigo som quadrado');
assert.match(audio,/lfo\.type='triangle'/,'a sirene precisa de varredura de frequência');

console.log('police-tactics: ok');
