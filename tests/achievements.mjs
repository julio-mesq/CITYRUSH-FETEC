import assert from 'node:assert/strict';
import * as A from '../dist/src/achievements.js';
A.carregar({desbloqueadas:[],stats:{parkour:4}});A.registrar('parkour');
const novas=A.avaliar({tempo:6,carros:1,casas:1,missoes:1,estrelas:5,kills:10,rep:5,dinheiro:100000,corrida:40,custom:1,online:true});
assert.equal(novas.length,12);assert.equal(A.lista().filter(x=>x.ok).length,12);assert.equal(A.avaliar({}).length,0);
console.log('Conquistas: gatilhos e persistência sem duplicação OK');
