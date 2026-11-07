// Smoke test no navegador: sobe a pasta dist, cria um personagem, entra no jogo e
// falha se houver erro de página. Pesado (WebGL por software leva minutos), então
// só roda com SMOKE=1:  SMOKE=1 node tests/smoke-navegador.mjs
// Requer o pacote playwright com Chromium instalado.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
if (!process.env.SMOKE) { console.log('smoke no navegador: pulado (defina SMOKE=1)'); process.exit(0); }
import { createRequire } from 'node:module';
// import() de ESM ignora NODE_PATH; o require de CommonJS respeita (playwright instalado globalmente).
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const raiz = fileURLToPath(new URL('../dist/', import.meta.url));
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.bin': 'application/octet-stream' };
const srv = createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const arq = !caminho || caminho.endsWith('/') ? caminho + 'index.html' : caminho;
  try { const dados = await readFile(join(raiz, arq)); res.writeHead(200, { 'content-type': tipos[extname(arq)] || 'application/octet-stream' }); res.end(dados); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const porta = srv.address().port, erros = [];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => erros.push(e.message));
  await p.goto(`http://localhost:${porta}/?perf&fixo`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('#criar:not(.off) button', { timeout: 120000 });
  await p.locator('#criar button').last().click();
  for (let t = 0; ; t += 2) { // falha na hora se a página quebrar durante o carregamento
    if (erros.length) throw new Error('erros de página: ' + erros.join(' | '));
    if (await p.evaluate(() => !!window.__CR && document.getElementById('carga').classList.contains('off'))) break;
    if (t > 600) throw new Error('o jogo não terminou de carregar em 10 min');
    await p.waitForTimeout(2000);
  }
  await p.evaluate(() => document.getElementById('startDemo')?.click());
  await p.waitForTimeout(8000);
  const r = await p.evaluate(() => ({ calls: window.__CR.renderer.info.render.calls, carros: window.__CR.carros.length, fisica: window.__CR.carros.every(c => c.fis && c.fis.freio > 0) }));
  if (erros.length) throw new Error('erros de página: ' + erros.join(' | '));
  if (!r.calls || !r.carros || !r.fisica) throw new Error('estado inesperado: ' + JSON.stringify(r));
  console.log(`smoke no navegador: jogo carregou e renderizou (${r.calls} draw calls, ${r.carros} veículos) sem erros OK`);
} finally { await b.close(); srv.close(); }
