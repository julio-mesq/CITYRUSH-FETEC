// City Rush — Service Worker (v32): permite jogar SOZINHO sem internet.
// O multiplayer (Trystero/P2P) continua exigindo conexão e nunca passa por aqui.
//  • Instala: baixa todos os arquivos do jogo (lista em precache.json) para o cache do navegador.
//  • Código (html/js/css): rede primeiro (recebe atualizações) e cai para o cache se estiver offline.
//  • Modelos, imagens e áudio: cache primeiro (rápido e funciona offline).
//  • three.js / fontes (CDN): guardados no primeiro acesso; depois funcionam offline.
const VERSAO = 'cityrush-v46';
const NUCLEO = VERSAO + '-nucleo', EXTRA = VERSAO + '-extra';
const CDNS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const ehCodigo = url => /\.(?:html|js|mjs|css|json|webmanifest)$/i.test(url.pathname) || url.pathname.endsWith('/');

async function avisar(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }
async function lista() {
  const cache = await caches.open(NUCLEO);
  try { const r = await fetch('precache.json', { cache: 'reload' }); if (r.ok) { await cache.put('precache.json', r.clone()); return (await r.json()).arquivos || []; } } catch (_) {}
  const guardada = await cache.match('precache.json'); // sem internet: usa a lista salva na instalação
  try { return guardada ? (await guardada.json()).arquivos || [] : []; } catch (_) { return []; }
}
let jogando=false,preparando=null;
async function precache(somenteCodigo=false) {
  const arquivos = (await lista()).filter(u=>!somenteCodigo||ehCodigo(new URL(u,self.location.origin))), cache = await caches.open(NUCLEO); let feitos = 0;
  for (const u of arquivos) {
    while(!somenteCodigo&&jogando)await new Promise(r=>setTimeout(r,1000));
    try { if(!await cache.match(u,{ignoreSearch:true})){const r=await fetch(new Request(u));if(r.ok)await cache.put(u,r);} } catch (_) {}
    feitos++;
    if(feitos%12===0)await avisar({tipo:'offline-progresso',feitos,total:arquivos.length});
    if(!somenteCodigo)await new Promise(r=>setTimeout(r,100));
  }
  if(somenteCodigo)return;
  const guardados = (await cache.keys()).length - 1; // sem contar precache.json
  await avisar({ tipo: 'offline-pronto', guardados, total: arquivos.length, completo: guardados >= arquivos.length - 1 });
}
self.addEventListener('install', e => { e.waitUntil(precache(true)); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(VERSAO)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function redePrimeiro(req, cacheNome = NUCLEO) {
  const cache = await caches.open(cacheNome);
  try {
    const resp = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 6000))]);
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (erro) {
    const guardado = await cache.match(req, { ignoreSearch: true }) || await caches.match(req, { ignoreSearch: true });
    if (guardado) return guardado;
    if (req.mode === 'navigate') { const inicio = await cache.match('index.html') || await cache.match('./'); if (inicio) return inicio; }
    throw erro;
  }
}
async function cachePrimeiro(req, cacheNome = NUCLEO) {
  const guardado = await caches.match(req, { ignoreSearch: true });
  if (guardado) return guardado;
  const resp = await fetch(req);
  if (resp && (resp.ok || resp.type === 'opaque')) (await caches.open(cacheNome)).put(req, resp.clone());
  return resp;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/sw.js')) return;
    e.respondWith(req.mode === 'navigate' || ehCodigo(url) ? redePrimeiro(req) : cachePrimeiro(req));
  } else if (CDNS.includes(url.hostname)) {
    // fonts.googleapis.com muda o CSS de vez em quando: rede primeiro. O resto é versionado: cache primeiro.
    e.respondWith(url.hostname === 'fonts.googleapis.com' ? redePrimeiro(req, EXTRA) : cachePrimeiro(req, EXTRA));
  }
});
self.addEventListener('message', async e => {
  const d = e.data || {};
  if(d.tipo==='atividade'){jogando=!!d.jogando;return;}
  if(d.tipo==='preparar-offline'){if(!preparando)preparando=precache().finally(()=>preparando=null);e.waitUntil?.(preparando);return preparando;}
  if (d.tipo === 'cachear' && Array.isArray(d.urls)) {
    const cache = await caches.open(EXTRA);
    for (const u of d.urls.slice(0, 80)) {
      try { if (!await cache.match(u)) { const r = await fetch(u, { mode: u.includes('fonts.googleapis') ? 'no-cors' : 'cors' }); if (r.ok || r.type === 'opaque') await cache.put(u, r); } } catch (_) {}
    }
    await avisar({ tipo: 'offline-extra', guardados: (await cache.keys()).length });
  } else if (d.tipo === 'status') {
    const total = (await lista()).length, nucleo = (await (await caches.open(NUCLEO)).keys()).length - 1, extra = (await (await caches.open(EXTRA)).keys()).length;
    e.source?.postMessage({ tipo: 'offline-status', nucleo, total, extra, completo: total > 0 && nucleo >= total - 1 });
  }
});
