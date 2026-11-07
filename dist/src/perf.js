// City Rush — painel de desempenho (F3) e gancho de diagnóstico (?perf na URL).
// Mede FPS, tempo de quadro, chamadas de desenho, triângulos e memória do renderer.
export function criarPainelDesempenho(renderer, extras = {}) {
  const el = document.createElement('div');
  el.id = 'perfHud';
  el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:60;font:12px/1.35 ui-monospace,monospace;color:#d8f5c8;background:rgba(0,0,0,.62);padding:6px 9px;border-radius:6px;pointer-events:none;display:none;white-space:pre';
  document.body.appendChild(el);
  let visivel = false, acc = 0, quadros = 0, piorMs = 0;
  const amostras = [];
  const stats = { fps: 0, ms: 0, piorMs: 0, calls: 0, tris: 0, geos: 0, texs: 0, progs: 0 };
  addEventListener('keydown', e => { if (e.code === 'F3') { e.preventDefault(); visivel = !visivel; el.style.display = visivel ? 'block' : 'none'; } });
  function quadro(dtMs) {
    acc += dtMs; quadros++; piorMs = Math.max(piorMs, dtMs);
    const r = renderer.info.render;
    stats.calls = r.calls; stats.tris = r.triangles;
    if (acc >= 500) {
      stats.fps = Math.round(quadros * 1000 / acc); stats.ms = +(acc / quadros).toFixed(1); stats.piorMs = +piorMs.toFixed(1);
      stats.geos = renderer.info.memory.geometries; stats.texs = renderer.info.memory.textures; stats.progs = renderer.info.programs?.length || 0;
      amostras.push({ ...stats, t: performance.now() }); if (amostras.length > 600) amostras.shift();
      acc = 0; quadros = 0; piorMs = 0;
      if (visivel) {
        const mem = performance.memory ? ` · heap ${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)} MB` : '';
        el.textContent = `${stats.fps} FPS · ${stats.ms} ms (pior ${stats.piorMs})\n${stats.calls} draw calls · ${(stats.tris / 1000).toFixed(0)}k triângulos\n${stats.geos} geometrias · ${stats.texs} texturas · ${stats.progs} shaders${mem}` + (extras.texto ? '\n' + extras.texto() : '');
      }
    }
  }
  return { quadro, stats, amostras };
}
