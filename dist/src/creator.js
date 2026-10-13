// Criação de personagem: aparência, roupa, tipo de pessoa, dinheiro inicial, casa inicial e nome de usuário.
// Aparece antes do menu principal apenas na primeira vez (sem save no banco de dados).
import { CASAS } from './casas-catalogo.js';
const $ = id => document.getElementById(id);
export const PELE = [0xe0ac82, 0xf4cfa0, 0xc68642, 0x8d5524, 0x5c3a21];
export const CABELO = [0x2b1b12, 0x0a0a0a, 0x8b5a2b, 0xd4a017, 0xb0b0b0, 0x7a2e2e];
export const CAMISA = [0x1f4e79, 0xc0392b, 0x1e8449, 0x222222, 0xf5f5f5, 0xf1c40f, 0x8e44ad];
export const CALCA = [0x2b2b3a, 0x111111, 0x5b5b5b, 0x3b2a1a, 0x1c2833];
export const TIPOS = [
  { id: 'trabalhador', n: 'Trabalhador(a) Honesto(a)', d: 'Começa a vida do zero, na raça.', karma: 10 },
  { id: 'criminoso', n: 'Criminoso(a) de Rua', d: 'Já nasceu correndo da polícia.', karma: -25 },
  { id: 'policial', n: 'Ex-Policial', d: 'Aposentado, mas de olho na lei.', karma: 25 },
  { id: 'executivo', n: 'Herdeiro(a) Rico(a)', d: 'Nunca precisou trabalhar um dia na vida.', karma: 0 },
];
export const DINHEIRO = [500, 2000, 10000, 50000];
const NOMES_CASA = ['Nenhuma (compre depois)', ...CASAS.map(c => c.n)];
const CASAS_IDX = [null, ...CASAS.map((_, i) => i)];
const cor = c => '#' + c.toString(16).padStart(6, '0');
const fmt = n => '$' + n.toLocaleString('pt-BR');
const swatches = (g, lista) => lista.map((c, i) => `<i class="sw${i === 0 ? ' sel' : ''}" style="background:${cor(c)}" data-g="${g}" data-v="${i}"></i>`).join('');

// Retorna uma Promise que resolve com o objeto do personagem quando o jogador confirma.
export function escolher() {
  return new Promise(ok => {
    const el = $('criar');
    el.innerHTML = `<div class="cwrap">
      <h1 class="logo-heading"><img class="cityRushLogo" src="assets/branding/city-rush-logo.png" alt="CITY RUSH" width="1536" height="1024"></h1><h2>Crie seu personagem</h2>
      <label>Nome de usuário<input id="cnome" maxlength="16" placeholder="Seu nome no jogo" value="Jogador" autocomplete="off"></label>
      <label>Tipo de pessoa<select id="ctipo">${TIPOS.map((t, i) => `<option value="${i}">${t.n}</option>`).join('')}</select></label>
      <p id="ctipoDesc" class="desc">${TIPOS[0].d}</p>
      <div class="linha"><span>Pele</span><div class="swrow">${swatches('pele', PELE)}</div></div>
      <div class="linha"><span>Cabelo</span><div class="swrow">${swatches('cabelo', CABELO)}</div></div>
      <div class="linha"><span>Camisa</span><div class="swrow">${swatches('camisa', CAMISA)}</div></div>
      <div class="linha"><span>Calça</span><div class="swrow">${swatches('calca', CALCA)}</div></div>
      <label>Dinheiro inicial<select id="cdinheiro">${DINHEIRO.map((d, i) => `<option value="${i}">${fmt(d)}</option>`).join('')}</select></label>
      <label>Casa inicial<select id="ccasa">${NOMES_CASA.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label>
      <p class="desc">Você começará dentro da casa escolhida, com sala, cozinha, quarto e garagem.</p>
      <button id="ccomecar">Começar a nova vida</button>
    </div>`;
    const sel = { pele: 0, cabelo: 0, camisa: 0, calca: 0 };
    el.onclick = e => {
      const t = e.target;
      if (t.dataset.g) { sel[t.dataset.g] = +t.dataset.v; el.querySelectorAll(`.sw[data-g="${t.dataset.g}"]`).forEach(s => s.classList.toggle('sel', s === t)); }
      if (t.id === 'ccomecar') {
        const tipo = TIPOS[+$('ctipo').value];
        const nome = ($('cnome').value || 'Jogador').trim().slice(0, 16) || 'Jogador';
        el.classList.add('off'); el.onclick = null;
        ok({
          nome, tipo: tipo.id, tipoNome: tipo.n, karma: tipo.karma,
          pele: PELE[sel.pele], cabelo: CABELO[sel.cabelo], camisa: CAMISA[sel.camisa], calca: CALCA[sel.calca],
          dinheiro: DINHEIRO[+$('cdinheiro').value], casa: CASAS_IDX[+$('ccasa').value],
        });
      }
    };
    $('ctipo').onchange = () => { $('ctipoDesc').textContent = TIPOS[+$('ctipo').value].d; };
    el.classList.remove('off');
  });
}
