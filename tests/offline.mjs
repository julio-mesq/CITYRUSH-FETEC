// v31: modo solo funciona offline (service worker + three.js local/CDN guardada); multiplayer exige internet.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const raiz = new URL('..', import.meta.url).pathname, dist = path.join(raiz, 'dist');
const ler = f => fs.readFileSync(path.join(dist, f), 'utf8');
const html = ler('index.html'), sw = ler('sw.js'), off = ler('src/offline.js'), main = ler('main.js'), mp = ler('src/multiplayer.js');

// 1) three.js: importmap dinâmico (vendor local → CDN) e fonte que não bloqueia o carregamento.
assert.doesNotMatch(html, /<script type="importmap">/, 'importmap fixo na CDN impediria usar a cópia local');
assert.match(html, /vendor\/three\//); assert.match(html, /cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//);
assert.ok(html.indexOf('createElement(\'script\')') < html.indexOf('main.js?v=32'), 'importmap precisa existir antes do main.js');
assert.match(html, /media="print" onload="this\.media='all'"/, 'fonte do Google não pode bloquear o jogo offline');
assert.match(html, /manifest\.webmanifest/); assert.match(html, /id="offlineChip"/);
const manifest = JSON.parse(ler('manifest.webmanifest')); assert.equal(manifest.start_url, './'); assert.ok(manifest.icons.every(i => fs.existsSync(path.join(dist, i.src))));

// 2) Service worker: precache, rede-primeiro para código, cache-primeiro para modelos, CDN guardada.
for (const trecho of ['precache.json', 'redePrimeiro', 'cachePrimeiro', 'cdn.jsdelivr.net', "'cachear'", 'skipWaiting', 'clients.claim']) assert.ok(sw.includes(trecho), 'sw.js sem ' + trecho);
assert.doesNotMatch(sw.split('\n').filter(l => !l.trim().startsWith('//')).join('\n'), /trystero|esm\.run|wss?:/i, 'multiplayer nunca passa pelo cache');
assert.match(sw, /ignoreSearch: true/, 'index usa ?v=32 nos scripts');

// 3) precache.json cobre tudo que o jogo usa (modelos, scripts, estilos, ícones).
const lista = JSON.parse(ler('precache.json')).arquivos;
const todos = []; (function varre(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? varre(p) : todos.push(path.relative(dist, p).split(path.sep).join('/')); } })(dist);
const faltando = todos.filter(f => !['sw.js', 'precache.json'].includes(f) && !f.endsWith('.md') && !lista.includes(f));
assert.deepEqual(faltando, [], 'arquivos fora do precache (rode python tools/offline.py --so-lista): ' + faltando.join(', '));
assert.ok(lista.includes('main.js') && lista.some(f => f.endsWith('.glb')) && lista.includes('index.html'));

// 4) Solo não depende de rede: Trystero só é importado ao entrar online; sem internet o botão avisa.
assert.equal((main.match(/https?:\/\//g) || []).length, 0, 'main.js não pode chamar a internet no modo solo');
assert.match(mp, /await import\('https:\/\/esm\.run\/trystero/); assert.ok(!/^import .*trystero/m.test(mp), 'Trystero não pode ser import estático');
assert.match(main, /iniciarOffline\(\)/); assert.match(main, /if \(!online\(\)\)/);
assert.match(off, /navigator\.onLine/); assert.match(off, /SEM INTERNET/); assert.match(off, /offline-pronto/);
// Nenhuma outra dependência de CDN além de three.js, fontes e Trystero (online).
const externos = new Set();
for (const f of ['main.js', ...fs.readdirSync(path.join(dist, 'src')).filter(f => f.endsWith('.js')).map(f => 'src/' + f)]) for (const m of ler(f).matchAll(/https?:\/\/[\w.-]+/g)) externos.add(m[0]);
for (const e of externos) assert.ok(/esm\.run/.test(e) || /w3\.org|example/.test(e), 'dependência externa inesperada: ' + e);

// 5) tools/offline.py resolve as dependências dos addons do three.js (testado com um pacote sintético).
const py = `
import sys, json; sys.path.insert(0, ${JSON.stringify(path.join(raiz, 'tools'))})
import offline
tar = {
 'examples/jsm/loaders/GLTFLoader.js': b"import { A } from 'three';\\nimport {\\n  mergeGeometries,\\n  x\\n} from '../utils/BufferGeometryUtils.js';\\nexport class GLTFLoader {}",
 'examples/jsm/utils/BufferGeometryUtils.js': b"import { B } from 'three'; export function mergeGeometries(){}",
 'examples/jsm/postprocessing/EffectComposer.js': b"import { C } from 'three'; import { CopyShader } from '../shaders/CopyShader.js'; import { ShaderPass } from './ShaderPass.js'; export * from './MaskPass.js';",
 'examples/jsm/shaders/CopyShader.js': b"export const CopyShader = {};",
 'examples/jsm/postprocessing/ShaderPass.js': b"import { Pass } from './Pass.js'; export class ShaderPass {}",
 'examples/jsm/postprocessing/Pass.js': b"export class Pass {}",
 'examples/jsm/postprocessing/MaskPass.js': b"import { Pass } from './Pass.js'; export class MaskPass {}",
}
r = offline.fechamento(tar, ['loaders/GLTFLoader.js', 'postprocessing/EffectComposer.js'])
print(json.dumps(sorted(r)))
try:
    offline.fechamento({'examples/jsm/a.js': b"import './nao-existe.js';"}, ['a.js']); print('SEM ERRO')
except FileNotFoundError: print('ERRO-OK')
`;
const saida = execFileSync('python3', ['-c', py]).toString().trim().split('\n');
assert.deepEqual(JSON.parse(saida[0]), ['examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/postprocessing/EffectComposer.js', 'examples/jsm/postprocessing/MaskPass.js', 'examples/jsm/postprocessing/Pass.js', 'examples/jsm/postprocessing/ShaderPass.js', 'examples/jsm/shaders/CopyShader.js', 'examples/jsm/utils/BufferGeometryUtils.js']);
assert.equal(saida[1], 'ERRO-OK');
// Todos os addons que o jogo importa são encontrados pelo script de preparação.
const usados = JSON.parse(execFileSync('python3', ['-c', `import sys,json;sys.path.insert(0,${JSON.stringify(path.join(raiz, 'tools'))});import offline;print(json.dumps(offline.addons_usados()))`]).toString());
for (const a of ['environments/RoomEnvironment.js', 'postprocessing/EffectComposer.js', 'postprocessing/UnrealBloomPass.js', 'loaders/GLTFLoader.js', 'utils/SkeletonUtils.js']) assert.ok(usados.includes(a), 'addon não detectado: ' + a);
console.log('offline: solo sem internet (service worker + three.js local/CDN guardada), multiplayer só online OK');
