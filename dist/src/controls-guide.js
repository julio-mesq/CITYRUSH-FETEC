// Guia em texto/HTML: legível em qualquer resolução, sem imagem de controle.
export const COMANDOS = {
  'A PÉ': [['W A S D','Mover'],['Shift','Correr'],['Espaço','Pular / parkour'],['C','Agachar'],['Ctrl','Esquiva'],['E','Interagir / entrar'],['V','Trocar câmera']],
  'ARMAS': [['Mouse esquerdo','Atirar / socar'],['Mouse direito','Mirar'],['R','Recarregar'],['Q','Roda de armas'],['1–7','Escolher arma'],['Mouse','Olhar ao redor']],
  'VEÍCULOS': [['W','Acelerar'],['S','Frear / ré'],['A D','Virar'],['Espaço','Freio de mão'],['E','Sair / entrar na garagem'],['H','Buzina'],['← →','Trocar rádio'],['V','Câmera interna']],
  'MENUS': [['M','Mapa'],['Tab','Inventário'],['T','Celular / lojas'],['B','Construção na casa'],['G','Conversar / reanimar'],['Enter','Chat online'],['Esc','Pausa / configurações']]
};
export function guiaControles(aba='A PÉ'){
  const teclas=['Esc 1 2 3 4 5 6 7 8 9 0','Tab Q W E R T Y U I O P','Caps A S D F G H J K L','Shift Z X C V B N M','Ctrl Espaço'];
  const usadas=new Set(['Esc','1','2','3','4','5','6','7','Tab','Q','W','E','R','T','A','S','D','G','H','Shift','C','V','B','M','Ctrl','Espaço']);
  return `<section class="controlsGuide"><h3>GUIA DE CONTROLES · COMPUTADOR</h3><nav>${Object.keys(COMANDOS).map(n=>`<button data-pausa="guia:${n}" class="${aba===n?'sel':''}">${n}</button>`).join('')}</nav><div class="controlsLayout"><div><div class="keyboardDiagram" aria-label="Teclado do computador">${teclas.map(l=>`<div>${l.split(' ').map(t=>`<kbd class="${usadas.has(t)?'active':''}">${t}</kbd>`).join('')}</div>`).join('')}</div><div class="mouseDiagram"><span>◀ ATIRAR</span><b>🖱<small>MOVER PARA OLHAR</small></b><span>MIRAR ▶</span></div></div><dl>${(COMANDOS[aba]||COMANDOS['A PÉ']).map(([t,d])=>`<div><dt><kbd>${t}</kbd></dt><dd>${d}</dd></div>`).join('')}</dl></div></section>`;
}
