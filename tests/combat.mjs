import assert from 'node:assert/strict';
import {Arsenal,receberDano} from '../dist/src/combat.js';
import {ARMAS} from '../dist/src/weapons.js';
const a=new Arsenal(ARMAS);a.carregador[0]=3;a.reserva[0]=5;
assert.equal(a.recarregar(0),true);assert.equal(a.disparar(0),false);a.atualizar(.1);assert.equal(a.carregador[0],3);a.atualizar(5);assert.equal(a.carregador[0],8);assert.equal(a.reserva[0],0);assert.equal(a.recarregar(0),false);
const j={hp:100,colete:10};receberDano(j,20);assert.equal(j.hp,90);assert.equal(j.colete,0);receberDano(j,20);assert.equal(j.hp,70);receberDano(j,1000);assert.equal(j.hp,0);
console.log('Combate: recarga temporizada, reserva finita e colete OK');
