// Culling por distância para os InstancedMesh da cidade.
// Prédios, árvores, calçadas e faixas eram enviados à GPU para o mapa inteiro
// (2 km × 2 km), mesmo atrás da neblina. Aqui cada InstancedMesh grande guarda
// as matrizes originais e, quando a câmera anda ou gira o bastante, reescreve só
// as instâncias dentro do raio visível (e à frente da câmera, com margem).
// Nada muda na colisão: ela usa listas próprias em world.js, não as instâncias.
import * as THREE from 'three';

const _esf = new THREE.Sphere(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();

export function criarCullingInstancias(scene, { minimo = 48 } = {}) {
  const lista = [];
  scene.traverse(o => {
    if (!o.isInstancedMesh || o.count < minimo || o.userData.semCull) return;
    const n = o.count, orig = o.instanceMatrix.array.slice(0, n * 16);
    const cores = o.instanceColor ? o.instanceColor.array.slice(0, n * 3) : null;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const rg = o.geometry.boundingSphere.radius, cx = new Float32Array(n), cz = new Float32Array(n), r = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      _m.fromArray(orig, i * 16); _m.decompose(_p, _q, _s);
      _esf.center.copy(o.geometry.boundingSphere.center).applyMatrix4(_m);
      cx[i] = _esf.center.x; cz[i] = _esf.center.z; r[i] = rg * Math.max(_s.x, _s.y, _s.z);
    }
    o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (o.instanceColor) o.instanceColor.setUsage(THREE.DynamicDrawUsage);
    lista.push({ o, n, orig, cores, cx, cz, r });
  });
  let ux = 1e9, uz = 1e9, ufx = 0, ufz = 0, uRaio = 0, uSplit = false, ativo = true;
  const stats = { malhas: lista.length, total: lista.reduce((a, l) => a + l.n, 0), visiveis: 0 };
  const dir = new THREE.Vector3();

  function aplicar(posicoes, fx, fz, raio, usarDirecao) {
    let vis = 0;
    for (const l of lista) {
      const { o, n, orig, cores, cx, cz, r } = l, arr = o.instanceMatrix.array, ca = cores && o.instanceColor.array;
      let k = 0;
      for (let i = 0; i < n; i++) {
        let ok = false;
        for (const p of posicoes) {
          const dx = cx[i] - p.x, dz = cz[i] - p.z, d = Math.hypot(dx, dz) - r[i];
          if (d > raio) continue;
          // Atrás da câmera (com folga para sombras e giros rápidos) não é desenhado.
          if (usarDirecao && d > 70 && (dx * fx + dz * fz) < -.25 * (d + r[i])) continue;
          ok = true; break;
        }
        if (!ok) continue;
        { arr.set(orig.subarray(i * 16, i * 16 + 16), k * 16); if (ca) ca.set(cores.subarray(i * 3, i * 3 + 3), k * 3); }
        k++;
      }
      o.count = k; vis += k;
      const im = o.instanceMatrix; if (im.clearUpdateRanges) { im.clearUpdateRanges(); im.addUpdateRange(0, k * 16); } im.needsUpdate = true;
      if (ca) { const ic = o.instanceColor; if (ic.clearUpdateRanges) { ic.clearUpdateRanges(); ic.addUpdateRange(0, k * 3); } ic.needsUpdate = true; }
    }
    stats.visiveis = vis;
  }

  return {
    stats,
    /** cams: câmeras ativas (1 ou 2 em tela dividida); raio: alcance visível em metros. */
    atualizar(cams, raio) {
      if (!ativo || !lista.length) return;
      const c = cams[0]; c.getWorldDirection(dir); const h = Math.hypot(dir.x, dir.z) || 1, fx = dir.x / h, fz = dir.z / h;
      const split = cams.length > 1, mov = Math.hypot(c.position.x - ux, c.position.z - uz), giro = fx * ufx + fz * ufz;
      if (!split && !uSplit && mov < 6 && giro > .985 && Math.abs(raio - uRaio) < 1) return;
      ux = c.position.x; uz = c.position.z; ufx = fx; ufz = fz; uRaio = raio; uSplit = split;
      aplicar(cams.map(k => k.position), fx, fz, raio, !split);
    },
    /** Liga/desliga (desligado = todas as instâncias de volta, como antes). */
    definirAtivo(v) {
      ativo = v; if (v) { ux = 1e9; return; }
      for (const l of lista) { l.o.instanceMatrix.array.set(l.orig); if (l.cores) l.o.instanceColor.array.set(l.cores); l.o.count = l.n; if (l.o.instanceMatrix.clearUpdateRanges) l.o.instanceMatrix.clearUpdateRanges(); l.o.instanceMatrix.needsUpdate = true; if (l.cores) { l.o.instanceColor.clearUpdateRanges?.(); l.o.instanceColor.needsUpdate = true; } }
      stats.visiveis = stats.total;
    },
  };
}
