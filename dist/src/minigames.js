// Mini-jogos: Corrida (6 pontos em 90 s, de carro) e Sobrevivência (60 s contra NPCs hostis).
import * as THREE from 'three';
let modo = null, t = 0, cp = 0, pts = [], limite = 0, farol, prox = 0;
export const iniciar = scene => { farol = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x33ff66, transparent: true, opacity: .4, side: THREE.DoubleSide })); farol.visible = false; scene.add(farol); };
export const destino = () => modo === 'corrida' ? pts[cp] : null;
const mostrar = () => { const d = destino(); farol.visible = !!d; if (d) farol.position.set(d.x, 30, d.z); };
export function comecar(tipo, jog) {
  if (modo) return 'Já há um mini-jogo em andamento';
  if (tipo === 'corrida') { if (!jog.veiculo) return 'Entre em um carro para correr!'; pts = Array.from({ length: 6 }, () => ({ x: Math.round((Math.random() * 2 - 1) * 8) * 100, z: Math.round((Math.random() * 2 - 1) * 8) * 100 })); cp = 0; limite = 90; }
  else { limite = 60; prox = 0; }
  modo = tipo; t = 0; mostrar(); return null;
}
export const texto = () => modo === 'corrida' ? `🏁 Corrida: ponto ${cp + 1}/6 — ${Math.max(0, limite - t) | 0}s` : modo ? `🛡 Sobreviva: ${Math.max(0, limite - t) | 0}s` : '';
export function atualizar(dt, jog, npcs) {
  if (!modo) return null; t += dt;
  const p = jog.veiculo ? jog.veiculo.obj.position : jog.obj.position; let fim = null;
  if (modo === 'corrida') {
    const d = pts[cp]; if (Math.hypot(p.x - d.x, p.z - d.z) < 12) { cp++; if (cp >= 6) fim = { ok: true, premio: Math.round(1500 + (limite - t) * 20), tempo: t }; else mostrar(); }
    if (t > limite) fim = { ok: false };
  } else {
    prox -= dt;
    if (prox <= 0) { prox = 4; let n0 = npcs.filter(n => n.briga > 0).length; for (const n of npcs) { if (n0 >= 10) break; if (n.policia || n.briga > 0) continue; const a = Math.random() * 6.28, r = 14 + Math.random() * 10; n.hostil(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r); n0++; } }
    if (t >= limite) fim = { ok: true, premio: 2000 };
  }
  if (jog.morto) fim = { ok: false };
  if (fim) { if (modo === 'sobrevivencia') npcs.forEach(n => { n.briga = 0; }); modo = null; farol.visible = false; }
  return fim;
}
