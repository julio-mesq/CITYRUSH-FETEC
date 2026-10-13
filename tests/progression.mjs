import assert from 'node:assert/strict';
import * as P from '../dist/src/progression.js';
P.carregar({xp:0});assert.equal(P.nivel(),1);assert.equal(P.bonus(),1);
const subiu=P.ganhar(720);assert.equal(subiu,3);assert.equal(P.nivel(),3);assert.ok(P.bonus()>1);
const d=P.dados();P.carregar(d);assert.equal(P.dados().xp,720);
console.log('Progressão: níveis, bônus e persistência OK');
