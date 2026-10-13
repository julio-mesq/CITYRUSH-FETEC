// Modo offline do City Rush: registra o service worker, guarda a biblioteca 3D (CDN) para uso
// sem internet e mostra no menu se o jogo já está pronto para jogar offline.
// "Jogar sozinho" funciona sem internet; o multiplayer exige conexão.
const $ = id => document.getElementById(id);
let pronto = false;

function mostrar(texto, classe) {
  const chip = $('offlineChip'); if (!chip) return;
  chip.textContent = texto; chip.className = classe || '';
}
export function online() { return navigator.onLine !== false; }

function atualizarBotaoOnline() {
  const botao = $('onlinePlay'), msg = $('onlineMsg'); if (!botao) return;
  const tem = online();
  botao.disabled = !tem; botao.title = tem ? '' : 'Sem internet: o multiplayer precisa de conexão. Use JOGAR para jogar sozinho.';
  if (msg && !tem) msg.textContent = 'SEM INTERNET · SÓ MODO SOLO';
  else if (msg && /SEM INTERNET/.test(msg.textContent)) msg.textContent = 'PRONTO';
}
function atualizarChip() {
  if (!('serviceWorker' in navigator)) return mostrar(window.isSecureContext === false
    ? 'Offline só funciona pelo link público (https) ou em localhost — por IP da rede local o navegador não permite'
    : 'Offline indisponível neste navegador', 'aviso');
  if (!online()) return mostrar(pronto ? '● OFFLINE · jogo salvo no aparelho (modo solo)' : '● SEM INTERNET · arquivos ainda não salvos', pronto ? 'ok' : 'aviso');
  mostrar(pronto ? '● Pronto para jogar offline (modo solo)' : 'Salvando o jogo para funcionar offline…', pronto ? 'ok' : '');
}
function coletarCdn() {
  const urls = performance.getEntriesByType('resource').map(r => r.name).filter(u => u.startsWith('http') && !u.startsWith(location.origin) && /jsdelivr|cdnjs|fonts\.(googleapis|gstatic)/.test(u));
  return [...new Set(urls)];
}
export function iniciarOffline() {
  addEventListener('online', () => { atualizarBotaoOnline(); atualizarChip(); });
  addEventListener('offline', () => { atualizarBotaoOnline(); atualizarChip(); });
  atualizarBotaoOnline();
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) { atualizarChip(); return; }
  navigator.serviceWorker.addEventListener('message', e => {
    const d = e.data || {};
    if (d.tipo === 'offline-progresso') mostrar(`Salvando para offline… ${Math.min(99, Math.round(d.feitos / Math.max(1, d.total) * 100))}%`);
    if (d.tipo === 'offline-pronto' || d.tipo === 'offline-status') { pronto = !!d.completo; atualizarChip(); }
  });
  const registrar = async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
      const sw = navigator.serviceWorker.controller || reg.active; if (!sw) return;
      sw.postMessage({ tipo: 'cachear', urls: coletarCdn() });   // three.js e fontes carregados nesta visita
      sw.postMessage({ tipo: 'status' });
      sw.postMessage({tipo:'atividade',jogando:document.getElementById('menu')?.classList.contains('off')||false});
      sw.postMessage({tipo:'preparar-offline'});
    } catch (erro) { console.warn('[offline] service worker indisponível:', erro); atualizarChip(); }
  };
  if (document.readyState === 'complete') setTimeout(registrar, 1500); else addEventListener('load', () => setTimeout(registrar, 3000));
  // Se o jogo carregou mais bibliotecas depois, guarda de novo (barato e idempotente).
  setTimeout(() => navigator.serviceWorker.controller?.postMessage({ tipo: 'cachear', urls: coletarCdn() }), 20000);
}

// ---------------------------------------------------------------- link para celular (independente do computador)
const ehRedeLocal = h => h === 'localhost' || h === '127.0.0.1' || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h.endsWith('.local');
// Endereço público (https) do jogo: o configurado em link-publico.json ou o da própria página quando ela já está hospedada.
export async function linkPublico() {
  try {
    const r = await fetch('link-publico.json', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); if (j.url && /^https:\/\//i.test(j.url)) return j.url.replace(/\/?$/, '/'); }
  } catch (_) {}
  if (location.protocol === 'https:' && !ehRedeLocal(location.hostname)) return location.origin + location.pathname.replace(/[^/]*$/, '');
  return null;
}
export function iniciarLinkCelular(notificar = () => {}) {
  const botao = $('linkCelular'), caixa = $('linkBox'); if (!botao || !caixa) return;
  const campo = $('linkUrl'), texto = $('linkTexto'), copiar = $('linkCopiar'), compartilhar = $('linkCompartilhar');
  const fechar = () => caixa.classList.remove('on');
  $('linkFechar').onclick = e => { e.stopPropagation(); fechar(); };
  caixa.onclick = e => e.stopPropagation();
  copiar.onclick = async e => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(campo.value); notificar('Link copiado. Abra no celular!'); }
    catch (_) { campo.select(); notificar('Selecione e copie o link.'); }
  };
  compartilhar.onclick = async e => { e.stopPropagation(); try { await navigator.share({ title: 'City Rush', text: 'Jogue City Rush no celular:', url: campo.value }); } catch (_) {} };
  botao.onclick = async e => {
    e.stopPropagation(); caixa.classList.add('on');
    const url = await linkPublico();
    campo.style.display = copiar.style.display = url ? '' : 'none';
    compartilhar.style.display = url && navigator.share ? '' : 'none';
    if (url) {
      campo.value = url;
      texto.textContent = 'Abra este link no navegador do celular — ele funciona sozinho, sem o computador ligado. Depois use "Adicionar à tela inicial" para instalar e jogar offline no modo solo.';
    } else {
      texto.textContent = 'O jogo está rodando no seu computador, então este endereço só funciona no seu Wi-Fi (use o QR code em /celular). Para ter um link que funcione no celular sem o computador, publique a pasta dist e cole o endereço em dist/link-publico.json — passo a passo no arquivo PUBLICAR.txt.';
    }
  };
}
