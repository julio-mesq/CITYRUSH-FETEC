// Oficina de customização: upgrades persistentes aplicados ao veículo atual.
const $ = id => document.getElementById(id);
const CORES = [0x111827, 0xf3f4f6, 0xd71920, 0x2563eb, 0x16a34a, 0xf5b800, 0x7c3aed, 0xf97316, 0x8b5e3c, 0xb8c1ca];
const NEONS=[0,0x00e5ff,0xff2bd6,0x39ff88,0x8b5cff,0xff3b30];
const fmt = n => '$' + n.toLocaleString('pt-BR');
let carro = null, jogador = null, cb = null;
export const aberto = () => $('oficinaPanel').classList.contains('on');
export function fechar() { $('oficinaPanel').classList.remove('on'); cb?.aoAbrir?.(false); }

export function abrir(alvo, jog, callbacks) {
  if (!alvo) return callbacks.aviso('Traga ou use um veículo antes de entrar na oficina.');
  carro = alvo; jogador = jog; cb = callbacks; render(); $('oficinaPanel').classList.add('on'); cb.aoAbrir?.(true);
}

function comprar(preco, mudanca, texto) {
  if (jogador.dinheiro < preco) return cb.aviso('Saldo insuficiente para esta modificação.');
  jogador.dinheiro -= preco; carro.aplicarCustomizacao(mudanca); cb.salvar(carro); cb.aviso(texto); render();
}

function botao(acao, texto, ativo, pequeno, extra = '') {
  return '<button data-o="' + acao + '" class="' + (ativo ? 'sel' : '') + '" ' + extra + '>' + texto + (pequeno ? '<small>' + pequeno + '</small>' : '') + '</button>';
}
function render() {
  const t = carro.tuning, moto = carro.duasRodas;
  const motores = [0,1,2,3].map(n => botao('motor:' + n, n ? 'Stage ' + n : 'Original', t.motor === n, n ? fmt(n * 4500) : 'padrão')).join('');
  const cores = CORES.map(c => '<button data-o="cor:' + c + '" style="--c:#' + c.toString(16).padStart(6, '0') + '" aria-label="Pintar veículo"></button>').join('');
  const neons=NEONS.map(c=>'<button data-o="neon:'+c+'" class="'+(t.neon===c?'sel':'')+'" style="--c:#'+(c||0x222222).toString(16).padStart(6,'0')+'" aria-label="Neon"></button>').join('');
  const aeros = botao('aero:0', 'Sem aerofólio', t.aerofolio === 0, '', moto ? 'disabled' : '') +
    botao('aero:1', 'Aerofólio Sport', t.aerofolio === 1, fmt(3500), moto ? 'disabled' : '') +
    botao('aero:2', 'Aerofólio Race', t.aerofolio === 2, fmt(6500), moto ? 'disabled' : '');
  const rodas = ['Rodas urbanas','Rodas sport','Rodas off-road'].map((n,i) => botao('rodas:' + i, n, t.rodas === i, i ? fmt(i * 2800) : 'padrão')).join('');
  const susp = ['Suspensão baixa','Suspensão padrão','Suspensão rally'].map((n,i) => botao('susp:' + i, n, t.suspensao === i, fmt(2200))).join('');
  const velocidade = Math.round(carro.vmaxBase * (1 + t.motor * .1 + (t.turbo ? .13 : 0)) * 3.6);
  $('oficinaPanel').innerHTML = '<div class="ofHead"><div><small>CITY CUSTOMS</small><h2>' + carro.nome + '</h2></div><button data-o="fechar">×</button></div>' +
    '<div class="ofSaldo">Saldo: ' + fmt(jogador.dinheiro) + '<span>Velocidade ' + velocidade + ' km/h</span></div>' +
    '<section><h3>Motor</h3><div class="ofGrid">' + motores + botao('turbo:' + (t.turbo ? 0 : 1), 'Turbo', t.turbo, t.turbo ? 'instalado' : fmt(12000)) + '</div></section>' +
    '<section><h3>Pintura</h3><div class="ofCores">' + cores + '</div><small>Pintura completa: ' + fmt(1500) + '</small></section>' +
    '<section><h3>Neon inferior</h3><div class="ofCores">'+neons+'</div><small>Kit de neon: '+fmt(2500)+'</small></section>'+
    '<section><h3>Carroceria e condução</h3><div class="ofGrid">' + aeros + rodas + susp + '</div></section>' +
    '<div class="ofRodape"><button data-o="reparo">Reparo completo · ' + fmt(1200) + '</button><button data-o="fechar">Concluir</button></div>';
}

$('oficinaPanel').onclick = e => {
  const acao = e.target.closest('[data-o]')?.dataset.o; if (!acao) return;
  const [tipo, raw] = acao.split(':'), v = Number(raw);
  if (tipo === 'fechar') return fechar();
  if (tipo === 'motor') return comprar(v * 4500, { motor: v }, 'Motor atualizado para ' + (v ? 'Stage ' + v : 'original') + '.');
  if (tipo === 'turbo') return comprar(v ? 12000 : 0, { turbo: !!v }, v ? 'Turbo instalado!' : 'Turbo removido.');
  if (tipo === 'cor') return comprar(1500, { pintura: v }, 'Nova pintura aplicada.');
  if(tipo==='neon')return comprar(v?2500:0,{neon:v},v?'Neon instalado.':'Neon removido.');
  if (tipo === 'aero') return comprar(v * 3250, { aerofolio: v }, v ? 'Aerofólio instalado.' : 'Aerofólio removido.');
  if (tipo === 'rodas') return comprar(v * 2800, { rodas: v }, 'Novo conjunto de rodas instalado.');
  if (tipo === 'susp') return comprar(2200, { suspensao: v }, 'Suspensão ajustada.');
  if (tipo === 'reparo') {
    if (jogador.dinheiro < 1200) return cb.aviso('Saldo insuficiente.');
    jogador.dinheiro -= 1200; carro.hp = 100; cb.salvar(carro); cb.aviso('Veículo reparado.'); render();
  }
};
