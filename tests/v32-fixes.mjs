// v32: início em casa, arma na direção certa, menos luzes/sombras (FPS) e link para celular.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const raiz = new URL('..', import.meta.url).pathname, dist = path.join(raiz, 'dist');
const ler = f => fs.readFileSync(path.join(dist, f), 'utf8');
const main = ler('main.js'), player = ler('src/player.js'), world = ler('src/world.js'), inter = ler('src/interiors.js'), luzesSrc = ler('src/luzes.js'), gfx = ler('src/graphics.js'), off = ler('src/offline.js'), html = ler('index.html');

// 1) Começar dentro de casa: a pré-compilação não pode trocar o interior ativo por "mercado".
const pre = main.slice(main.indexOf('FX.preaquecer()') - 40, main.indexOf("await passo(100, 'Pronto!')"));
assert.match(pre, /estavaDentro/); assert.match(pre, /interior\.mostrar\(estavaDentro\?tipoAtual:'mercado'/);
assert.ok(main.indexOf('entrar(casaInicial)') < main.indexOf('FX.preaquecer()'), 'a casa inicial é aberta antes do pré-aquecimento (por isso ele precisa restaurar o estado)');
assert.match(pre, /moradia\?\.mostrarCasa/);

// 1b) O veículo inicial nasce na vaga da garagem (frente da casa), nunca dentro do quarto.
import { VAGA_CARRO, MOVEIS, retangulo, sobrepoe } from '../dist/src/casa-layout.js';
assert.match(main, /inicial\.obj\.position\.set\(INT\.x-7,0,INT\.z\+INT\.d\/2-4\.2\)/);
assert.ok(Math.abs(VAGA_CARRO.z - (9 - 4.2)) < .01 && Math.abs(VAGA_CARRO.x + 7) < .01, 'a vaga do layout é onde o jogo estaciona o carro');
const jogadorNasce = { x0: -.4, x1: .4, z0: 6.6, z1: 7.4 }; // INT.z + d/2 - 2, centro da casa
assert.ok(!MOVEIS.filter(m => !m.semColisao).some(m => sobrepoe(jogadorNasce, retangulo(m))), 'o jogador nasce em espaço livre');

// 2) Arma: executa de verdade corrigirSentidoCano com matemática de quaternions.
const trecho = player.slice(player.indexOf('const BOCA_DIR'), player.indexOf('const MAO_MUNDO'));
class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  lengthSq() { return this.x ** 2 + this.y ** 2 + this.z ** 2; } normalize() { const l = Math.sqrt(this.lengthSq()) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
  applyQuaternion(q) { const { x, y, z } = this, ix = q.w * x + q.y * z - q.z * y, iy = q.w * y + q.z * x - q.x * z, iz = q.w * z + q.x * y - q.y * x, iw = -q.x * x - q.y * y - q.z * z;
    this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y; this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z; this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x; return this; } }
class Quaternion { constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
  setFromAxisAngle(a, ang) { const s = Math.sin(ang / 2); this.x = a.x * s; this.y = a.y * s; this.z = a.z * s; this.w = Math.cos(ang / 2); return this; }
  multiplyQuaternions(a, b) { const { x: ax, y: ay, z: az, w: aw } = a, { x: bx, y: by, z: bz, w: bw } = b; this.x = ax * bw + aw * bx + ay * bz - az * by; this.y = ay * bw + aw * by + az * bx - ax * bz; this.z = az * bw + aw * bz + ax * by - ay * bx; this.w = aw * bw - ax * bx - ay * by - az * bz; return this; }
  premultiply(q) { return this.multiplyQuaternions(q, this); } }
const THREE = { Vector3, Quaternion };
const corrigir = new Function('THREE', trecho + '\nreturn corrigirSentidoCano;')(THREE);
const arma = q => ({ quaternion: q }), boca = new Vector3(0, .02, -.3);       // cano aponta para -Z no espaço da arma
const giro = (eixo, ang) => new Quaternion().setFromAxisAngle(eixo, ang);
const dir = a => new Vector3().copy(boca).normalize().applyQuaternion(a.quaternion);
const Y = new Vector3(0, 1, 0), X = new Vector3(1, 0, 0);
// mirando com o cano para trás (+Z) → vira para a frente
let a = arma(giro(Y, Math.PI)); assert.ok(dir(a).z > .9, 'pré-condição: cano para trás'); corrigir(a, { position: boca }, .45); assert.ok(dir(a).z < -.9, 'cano deve apontar para a frente (-Z)');
// já correto → não mexe
a = arma(new Quaternion()); corrigir(a, { position: boca }, .45); assert.ok(dir(a).z < -.9 && Math.abs(a.quaternion.w - 1) < 1e-9, 'arma correta não pode ser girada');
// relaxada: para trás vira para frente; para cima vira para baixo; para baixo fica
a = arma(giro(Y, Math.PI)); corrigir(a, { position: boca }, -.25, true); assert.ok(-dir(a).z > -.25);
a = arma(giro(X, Math.PI / 2)); assert.ok(dir(a).y > .9, 'pré-condição: cano para cima'); corrigir(a, { position: boca }, -.25, true); assert.ok(dir(a).y < -.5, 'cano para cima deve virar para baixo');
a = arma(giro(X, -Math.PI / 2)); const antes = dir(a).y; corrigir(a, { position: boca }, -.25, true); assert.equal(dir(a).y, antes, 'cano para baixo não muda');
assert.match(player, /corrigirSentidoCano\(arma,u\.muzzle,\.45\)/); assert.match(player, /corrigirSentidoCano\(arma,u\.muzzle,-\.25,true\)/);
assert.match(player, /ossosMira/, 'ossos do braço em cache (getObjectByName percorria o esqueleto a cada quadro)');

// 3) FPS: conjunto fixo e pequeno de luzes; sombras menores e atualizadas a cada 2 quadros; resolução dinâmica.
const todos = ['main.js', ...fs.readdirSync(path.join(dist, 'src')).filter(f => f.endsWith('.js')).map(f => 'src/' + f)];
const pontuais = todos.map(f => [f, (ler(f).match(/new THREE\.PointLight/g) || []).length]).filter(([, n]) => n);
assert.deepEqual(pontuais, [['main.js', 1], ['src/luzes.js', 1]], 'luzes de ponto: 1 do neon + o conjunto compartilhado (antes: 8 postes + 4 de interior)');
assert.match(main, /criarLuzesDinamicas\(scene, fraco \? 2 : 4\)/); assert.doesNotMatch(world, /luzesRua/); assert.doesNotMatch(inter, /HemisphereLight|luzesPool/);
assert.match(main, /luzes\.atualizar\(dt, jog\.obj\.position, INT\.on\)/);
assert.match(luzesSrc, /Math\.exp\(-14 \* dt\)/, 'troca de poste sem "pulo" de luz');
assert.match(world, /left: -95, right: 95, top: 95, bottom: -95/); assert.doesNotMatch(world, /left: -180/);
assert.match(world, /Math\.round\(alvo\.x \/ 2\) \* 2/, 'alvo da sombra ancorado em grade (sem tremedeira)');
assert.match(main, /shadowMap\.autoUpdate = false/); assert.match(main, /quadroSombra\+\+\) & 1\) === 0\) renderer\.shadowMap\.needsUpdate = true/);
assert.match(main, /function definirResolucao/); assert.match(main, /msMedio > 22 && prAtual > \.76/); assert.match(main, /lento > 2\.2/);
assert.match(main, /q!=='baixa'/, 'média e alta mantêm sombras também ao trocar no menu');
assert.match(gfx, /escala\(pr\)/); assert.match(gfx, /\* \.5/, 'bloom em meia resolução');

// 4) Link para celular independente do computador.
assert.match(html, /id="linkCelular"/); assert.match(html, /id="linkBox"/); assert.match(off, /export async function linkPublico/); assert.match(off, /link-publico\.json/);
assert.match(main, /iniciarLinkCelular/); assert.match(main, /base \+ location\.search/, 'link da sala usa o endereço público');
const cfg = JSON.parse(ler('link-publico.json')); assert.ok('url' in cfg);
for (const f of ['PUBLICAR.txt', '.github/workflows/pages.yml']) assert.ok(fs.existsSync(path.join(raiz, f)), f + ' ausente');
assert.match(fs.readFileSync(path.join(raiz, 'servidor.py'), 'utf8'), /link-publico\.json/);
console.log('v32-fixes: casa inicial, arma, luzes/sombras/resolução dinâmica e link para celular OK');
