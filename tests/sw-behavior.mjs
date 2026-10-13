// Executa sw.js em uma sandbox simulando o navegador: instala, vai offline e confere o que é servido.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const codigo = fs.readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8');

class Resp { constructor(corpo, ok = true, type = 'basic') { this.corpo = corpo; this.ok = ok; this.type = type; } clone() { return new Resp(this.corpo, this.ok, this.type); } async json() { return JSON.parse(this.corpo); } }
const chave = r => (typeof r === 'string' ? r : r.url).replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '');
const lojas = new Map(); let online = true; const rede = new Map(), pedidos = [];
const caches = {
  async open(n) { if (!lojas.has(n)) lojas.set(n, new Map()); const m = lojas.get(n); return { async put(r, v) { m.set(chave(r), v); }, async match(r) { return m.get(chave(r)); }, async keys() { return [...m.keys()]; } }; },
  async keys() { return [...lojas.keys()]; }, async delete(n) { lojas.delete(n); },
  async match(r) { for (const m of lojas.values()) if (m.has(chave(r))) return m.get(chave(r)); }
};
const ouvintes = {}, mensagens = [];
const sandbox = {
  self: { location: { origin: 'https://jogo.test' }, addEventListener: (t, f) => { ouvintes[t] = f; }, skipWaiting() {}, clients: { claim: async () => {}, matchAll: async () => [{ postMessage: m => mensagens.push(m) }] } },
  caches, URL, Promise, setTimeout, console,
  Request: class { constructor(u, o) { this.url = u.startsWith('http') ? u : 'https://jogo.test/' + u; this.method = 'GET'; this.mode = 'cors'; } },
  fetch: async r => { const u = typeof r === 'string' ? r : r.url; pedidos.push(u); if (!online) throw new TypeError('offline'); const k = chave(u); if (!rede.has(k)) return new Resp('404', false); return new Resp(rede.get(k)); }
};
vm.createContext(sandbox); vm.runInContext(codigo, sandbox);

rede.set('precache.json', JSON.stringify({ arquivos: ['./', 'index.html', 'main.js', 'assets/models/a.glb'] }));
rede.set('', '<html>inicio</html>'); rede.set('index.html', '<html>inicio</html>'); rede.set('main.js', 'versao-1'); rede.set('assets/models/a.glb', 'GLB');
rede.set('npm/three@0.160.0/build/three.module.js', 'THREE');

let esperar; ouvintes.install({ waitUntil: p => { esperar = p; } }); await esperar;
assert.ok(!pedidos.some(u=>u.endsWith('.glb')), 'instalação não disputa modelos com o jogo');
await ouvintes.message({data:{tipo:'atividade',jogando:true}});
const preparando=ouvintes.message({data:{tipo:'preparar-offline'},waitUntil:p=>{esperar=p;}});
await new Promise(r=>setTimeout(r,30));assert.ok(!pedidos.some(u=>u.endsWith('.glb')),'offline não baixa GLBs durante a partida');
await ouvintes.message({data:{tipo:'atividade',jogando:false}});await preparando;await esperar;
const totalAntes=pedidos.length;await ouvintes.message({data:{tipo:'preparar-offline'},waitUntil:p=>{esperar=p;}});await esperar;assert.ok(pedidos.slice(totalAntes).every(u=>!u.endsWith('.glb')),'modelo já guardado não é baixado novamente');
const pronto = mensagens.find(m => m.tipo === 'offline-pronto'); assert.ok(pronto?.completo, 'precache deve terminar completo: ' + JSON.stringify(pronto));

const buscar = async (url, extra = {}) => { let r; ouvintes.fetch({ request: { url, method: 'GET', mode: 'cors', ...extra }, respondWith: p => { r = p; } }); return r && await r; };
// Online: código vem da rede (atualizações chegam).
rede.set('main.js', 'versao-2'); assert.equal((await buscar('https://jogo.test/main.js?v=32')).corpo, 'versao-2');
// Cliente pede o CDN uma vez (online) → fica guardado.
const cdn = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'; assert.equal((await buscar(cdn)).corpo, 'THREE');

online = false; // ---- sem internet
assert.equal((await buscar('https://jogo.test/main.js?v=32')).corpo, 'versao-2', 'código offline vem do cache (última versão baixada)');
assert.equal((await buscar('https://jogo.test/assets/models/a.glb')).corpo, 'GLB', 'modelo offline');
assert.equal((await buscar('https://jogo.test/', { mode: 'navigate' })).corpo, '<html>inicio</html>', 'abrir o jogo offline');
assert.equal((await buscar(cdn)).corpo, 'THREE', 'three.js da CDN guardado serve offline');
// Multiplayer / hosts desconhecidos não são interceptados.
let interceptou = false; ouvintes.fetch({ request: { url: 'https://esm.run/trystero@0.25.4', method: 'GET', mode: 'cors' }, respondWith: () => { interceptou = true; } }); assert.equal(interceptou, false);
ouvintes.fetch({ request: { url: 'https://jogo.test/api', method: 'POST', mode: 'cors' }, respondWith: () => { interceptou = true; } }); assert.equal(interceptou, false);
// Mensagem 'status' informa que está completo.
let status; await ouvintes.message({ data: { tipo: 'status' }, source: { postMessage: m => { status = m; } } }); assert.equal(status.completo, true);
console.log('sw-behavior: instala, atualiza online e serve tudo offline OK');
