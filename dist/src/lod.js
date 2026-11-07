// LOD (nível de detalhe) para objetos com muitas malhas, como os veículos GLB.
// Cada carro tem ~14 malhas e ~13 materiais = ~14 draw calls. De longe, ele vira
// uma única malha mesclada com cores por vértice (cor do material × textura
// amostrada no UV), e o custo cai para 1 draw call por carro.
import * as THREE from 'three';

const amostras = new WeakMap(); // textura -> {w,h,dados}
const matLod = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .25 });
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _n = new THREE.Matrix3(), _c = new THREE.Color();

function pixels(tex) {
  if (amostras.has(tex)) return amostras.get(tex);
  let r = null;
  try {
    const img = tex.image, w = Math.min(128, img?.width || 0), h = Math.min(128, img?.height || 0);
    if (w && h) {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, w, h);
      r = { w, h, d: cx.getImageData(0, 0, w, h).data };
    }
  } catch (e) { r = null; }
  amostras.set(tex, r); return r;
}

function corVertice(mat, uv, i, alvo) {
  alvo.copy(mat.color || _c.setRGB(1, 1, 1));
  const px = mat.map && uv ? pixels(mat.map) : null;
  if (px) {
    let u = uv.getX(i), v = uv.getY(i);
    u = u - Math.floor(u); v = v - Math.floor(v); if (mat.map.flipY) v = 1 - v;
    const k = ((Math.min(px.h - 1, (v * px.h) | 0) * px.w) + Math.min(px.w - 1, (u * px.w) | 0)) * 4;
    const t = new THREE.Color().setRGB(px.d[k] / 255, px.d[k + 1] / 255, px.d[k + 2] / 255, THREE.SRGBColorSpace);
    alvo.multiply(t);
  }
  if (mat.emissive && mat.emissiveIntensity > .5) alvo.lerp(mat.emissive, .5);
  return alvo;
}

const ignorado = (o, raiz, ignorar) => { for (let x = o; x && x !== raiz; x = x.parent) if (x.name === 'LOD' || ignorar.includes(x)) return true; return false; };

/** Cria uma malha única (no espaço local de `raiz`) a partir das malhas visíveis dela, exceto as de `ignorar`. */
export function criarImpostor(raiz, ignorar = []) {
  raiz.updateMatrixWorld(true); _inv.copy(raiz.matrixWorld).invert();
  const pos = [], nor = [], cor = [], idx = []; let base = 0;
  raiz.traverseVisible(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || ignorado(o, raiz, ignorar)) return;
    const g = o.geometry, p = g.attributes.position; if (!p) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every(m => m.transparent && m.opacity < .3)) return;
    _m.multiplyMatrices(_inv, o.matrixWorld); _n.getNormalMatrix(_m);
    const n = g.attributes.normal, uv = g.attributes.uv, v = new THREE.Vector3(), nn = new THREE.Vector3();
    const cores = new Float32Array(p.count * 3), c = new THREE.Color();
    const grupos = g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : p.count, materialIndex: 0 }];
    for (const gr of grupos) {
      const mat = mats[gr.materialIndex] || mats[0];
      for (let j = gr.start; j < gr.start + gr.count; j++) {
        const i = g.index ? g.index.getX(j) : j; corVertice(mat, uv, i, c);
        cores[i * 3] = c.r; cores[i * 3 + 1] = c.g; cores[i * 3 + 2] = c.b;
      }
    }
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(_m); pos.push(v.x, v.y, v.z);
      if (n) { nn.fromBufferAttribute(n, i).applyMatrix3(_n).normalize(); nor.push(nn.x, nn.y, nn.z); } else nor.push(0, 1, 0);
      cor.push(cores[i * 3], cores[i * 3 + 1], cores[i * 3 + 2]);
    }
    if (g.index) for (let j = 0; j < g.index.count; j++) idx.push(g.index.getX(j) + base);
    else for (let j = 0; j < p.count; j++) idx.push(j + base);
    base += p.count;
  });
  if (!base) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  geo.setIndex(base > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, matLod); mesh.castShadow = true; mesh.receiveShadow = false; mesh.name = 'LOD'; mesh.visible = false;
  return mesh;
}

/**
 * Alterna entre o detalhe e o impostor conforme a distância à câmera.
 * As malhas detalhadas vão para a camada 31 (que nenhuma câmera desenha) em vez
 * de mudar `visible`, que outros sistemas usam (luzes de freio, setas, neon...).
 */
const CAMADA_OCULTA = 31;
function camadas(alvo, longe) {
  const ign = alvo.lodIgnorar || [];
  alvo.obj.traverse(o => {
    if (!o.isMesh || o === alvo.lod || ignorado(o, alvo.obj, ign)) return;
    if (longe) o.layers.set(CAMADA_OCULTA); else o.layers.enable(0), o.layers.disable(CAMADA_OCULTA);
  });
}
export function alternarLod(alvo, distancia, limite = 85) {
  const lod = alvo.lod; if (!lod) return false;
  const longe = distancia > (alvo.lodAtivo ? limite - 8 : limite); // histerese evita piscar na borda
  if (longe === !!alvo.lodAtivo) return longe;
  alvo.lodAtivo = longe; lod.visible = longe; camadas(alvo, longe);
  return longe;
}

/** Descarta o impostor (ex.: ao trocar pintura) para ser recriado depois. */
export function descartarImpostor(alvo) {
  if (!alvo.lod) return;
  if (alvo.lodAtivo) camadas(alvo, false);
  alvo.lod.parent?.remove(alvo.lod); alvo.lod.geometry.dispose(); alvo.lod = null; alvo.lodAtivo = false;
}
