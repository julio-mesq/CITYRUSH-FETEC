import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CLASSES, classeDoModelo } from '../dist/src/vehicle-classes.js';
const veic = await readFile(new URL('../dist/src/vehicles.js', import.meta.url), 'utf8');
const lista = veic.slice(veic.indexOf('export const MODELOS'), veic.indexOf('];', veic.indexOf('export const MODELOS')));
const glbs = [...lista.matchAll(/glb:\s*'([^']+)'/g)].map(m => m[1]);
assert.ok(glbs.length >= 20, 'MODELOS lidos');
// todo modelo tem classe própria (nenhum cai no padrão por acidente, exceto o sedã)
for (const g of glbs) { const c = classeDoModelo({ glb: g }); assert.ok(CLASSES[c.id], g); if (g !== 'carroUrbano') assert.notEqual(c.id, 'sedan', `${g} sem classe`); }
// o sedã reproduz os valores antigos (sensação preservada)
const s = CLASSES.sedan; assert.deepEqual([s.freio, s.giro, s.volanteVel, s.arrasto, s.arrastoAcel, s.re, s.aderencia, s.rolagem, s.altaVel], [34, 1.85, 9, .46, .14, 9, 1, .025, .62]);
// coerência física: pesados freiam e viram menos; esportivos seguram mais a curva
assert.ok(CLASSES.onibus.freio < CLASSES.sedan.freio && CLASSES.caminhao.freio < CLASSES.suv.freio);
assert.ok(CLASSES.onibus.giro < CLASSES.van.giro && CLASSES.van.giro < CLASSES.sedan.giro);
assert.ok(CLASSES.super.aderencia > CLASSES.esportivo.aderencia && CLASSES.esportivo.aderencia > CLASSES.sedan.aderencia);
assert.ok(CLASSES.moto.rolagem > CLASSES.sedan.rolagem * 5, 'moto inclina na curva');
for (const [k, c] of Object.entries(CLASSES)) for (const v of ['freio', 'giro', 'volanteVel', 'arrasto', 'arrastoAcel', 're', 'aderencia', 'rolagem', 'altaVel', 'impacto']) assert.ok(Number.isFinite(c[v]) && c[v] > 0, `${k}.${v}`);
// vehicles.js usa o perfil no lugar das constantes fixas
for (const trecho of ['f.freio', 'f.giro', 'f.volanteVel', 'this.fis.arrasto', 'this.fis.re', 'this.fis.aderencia', 'this.fis.rolagem', 'this.fis.impacto']) assert.ok(veic.includes(trecho), trecho);
assert.equal(classeDoModelo({ glb: 'x', classe: 'onibus' }).id, 'onibus', 'campo classe tem prioridade');
console.log(`física por classe: ${glbs.length} modelos em ${Object.keys(CLASSES).length} classes OK`);
