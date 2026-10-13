import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { CASAS, saidaCasa } from '../dist/src/casas-catalogo.js';

assert.equal(CASAS.length,4);
assert.equal(new Set(CASAS.map(c=>c.modelo)).size,4,'cada escolha deve usar um modelo diferente');
const hashes=[];
for(const c of CASAS){
  const bytes=fs.readFileSync(new URL('../dist/assets/models/casas/'+(c.arquivo||c.modelo+'.glb'),import.meta.url));
  let json;
  if(c.arquivo?.endsWith('.gltf')){
    json=JSON.parse(bytes.toString());
    for(const b of json.buffers)assert.equal(fs.statSync(new URL('../dist/assets/models/casas/'+b.uri,import.meta.url)).size,b.byteLength);
  }else{
    assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
    json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  }
  assert.equal(json.meshes.length,1,'as fachadas devem estar agrupadas por material');
  for(const a of json.accessors)assert.ok(a.count>0);
  for(const p of json.meshes[0].primitives){assert.ok(json.materials[p.material]);assert.equal(json.accessors[p.attributes.POSITION].count,json.accessors[p.attributes.NORMAL].count);}
  hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));
}
assert.equal(new Set(hashes).size,4,'os quatro GLBs devem ser distintos');
assert.ok(CASAS[2].piscina&&CASAS[3].piscina);
assert.ok(CASAS[1].externa&&CASAS[3].externa);
for(const c of CASAS){assert.ok(c.tamanho>=25);assert.ok(c.tamanho<=36);assert.ok(c.profundidade<=36);}
CASAS.forEach((c,i)=>assert.ok(saidaCasa(i)>c.profundidade/2,'saída deve ficar fora da casa ampliada'));
const src=n=>fs.readFileSync(new URL('../dist/src/'+n+'.js',import.meta.url),'utf8');
assert.match(src('creator'),/CASAS.map/);assert.match(src('phone'),/import \{ CASAS \}/);
assert.match(src('housing'),/i<CASAS.length/);assert.match(src('world'),/'casa3'/);
assert.match(src('interiors'),/variantesCasa.forEach/);
assert.doesNotMatch(src('decor'),/p\(scene, 'cerca', l\.x/,'as grades das casas devem ser removidas');
console.log('casas-anexadas: quatro escolhas distintas, modelos válidos, interiores e garagens persistentes OK');
