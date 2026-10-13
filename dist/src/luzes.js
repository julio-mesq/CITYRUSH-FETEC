// Luzes dinâmicas compartilhadas (v32). Cada luz de ponto custa processamento em TODO pixel da tela,
// mesmo com intensidade 0, e mudar a QUANTIDADE de luzes recompila todos os materiais (trava).
// Por isso existe um conjunto pequeno e FIXO de luzes (4 no computador, 2 no celular) que é
// reaproveitado: à noite elas viram os postes mais próximos do jogador; dentro de casas e lojas
// viram as lâmpadas do cômodo. Antes eram 8 postes + 4 de interior sempre ativos.
import * as THREE from 'three';

export function criarLuzesDinamicas(scene, quantidade) {
  const slots = Array.from({ length: quantidade }, () => {
    const luz = new THREE.PointLight(0xffc978, 0, 52, 2); scene.add(luz);
    return { luz, px: 0, py: 0, pz: 0, int: 0, dist: 52 };
  });
  let pontosRua = [], noite = 0, interior = [], estavaDentro = false;
  const ordem = [], distancias = [];
  const desejado = Array.from({ length: quantidade }, () => ({ ativo: false, x: 0, y: 0, z: 0, i: 0, d: 52 }));

  function escolherRua(pos) {
    ordem.length = 0;
    for (let k = 0; k < pontosRua.length; k++) { const p = pontosRua[k], dx = p[0] - pos.x, dz = p[1] - pos.z; distancias[k] = dx * dx + dz * dz; ordem.push(k); }
    ordem.sort((a, b) => distancias[a] - distancias[b]);
    for (let s = 0; s < slots.length; s++) {
      const d = desejado[s], k = ordem[s];
      if (k === undefined || noite < .02) { d.ativo = false; continue; }
      const p = pontosRua[k]; d.ativo = true; d.x = p[0]; d.y = 6.8; d.z = p[1]; d.i = noite * 2.2; d.d = 52;
    }
  }
  return {
    capacidade: quantidade,
    definirRua(pontos) { pontosRua = pontos; },
    noite(v) { noite = v; },
    // lista de { x, y, z, i, d } em coordenadas do MUNDO (já somadas à origem do interior)
    definirInterior(lista) { interior = lista.slice(0, quantidade); estavaDentro = null; /* força ajuste imediato */ },
    atualizar(dt, pos, dentro) {
      const trocou = dentro !== estavaDentro; estavaDentro = dentro;
      if (dentro) {
        for (let s = 0; s < slots.length; s++) {
          const d = desejado[s], l = interior[s];
          if (!l) { d.ativo = false; continue; }
          d.ativo = true; d.x = l.x; d.y = l.y; d.z = l.z; d.i = l.i; d.d = l.d;
        }
      } else escolherRua(pos);
      const suave = 1 - Math.exp(-7 * dt);
      for (let s = 0; s < slots.length; s++) {
        const sl = slots[s], d = desejado[s], l = sl.luz;
        const mudouLugar = d.ativo && ((sl.px - d.x) ** 2 + (sl.pz - d.z) ** 2 > .04 || Math.abs(sl.py - d.y) > .05);
        if (trocou) { // entrou/saiu de um interior: ajuste imediato, sem apagão
          sl.px = d.x; sl.py = d.y; sl.pz = d.z; l.position.set(d.x, d.y, d.z); l.distance = d.d; sl.int = l.intensity = d.ativo ? d.i : 0; continue;
        }
        if (mudouLugar) { // outro poste ficou mais perto: apaga este, troca de lugar e acende de novo (sem "pulo" de luz)
          sl.int += (0 - sl.int) * (1 - Math.exp(-14 * dt));
          if (sl.int < .05) { sl.px = d.x; sl.py = d.y; sl.pz = d.z; l.position.set(d.x, d.y, d.z); l.distance = d.d; }
        } else sl.int += ((d.ativo ? d.i : 0) - sl.int) * suave;
        l.intensity = sl.int < .005 ? 0 : sl.int;
      }
    }
  };
}
