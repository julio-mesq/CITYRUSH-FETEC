// Regras numéricas independentes do render, também usadas pelos testes.
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const smooth = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
export function direcao(f, lado, yaw) {
  const n = Math.hypot(f, lado) || 1, s = Math.sin(yaw), c = Math.cos(yaw);
  return { x: (-s * f + c * lado) / n, z: (-c * f - s * lado) / n };
}
export function pontoSalto(inicio, fim, t, altura) {
  const k = clamp(t, 0, 1), u = k * k * (3 - 2 * k);
  return { x: inicio.x + (fim.x - inicio.x) * u, z: inicio.z + (fim.z - inicio.z) * u, y: Math.sin(k * Math.PI) * altura };
}
export function passoDrift(lateral, velocidade, esterco, freio, aderencia, dt) {
  const alvo = freio ? esterco * velocidade * .46 : 0;
  return smooth(lateral, alvo, freio ? 3.2 : 7 * aderencia, dt);
}
