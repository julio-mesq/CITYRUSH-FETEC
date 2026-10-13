// Banco de dados local (IndexedDB) com fallback em memória: guarda o progresso no navegador.
let db = null, mem = null;
export const abrir = () => new Promise(ok => {
  try { const r = indexedDB.open('city-rush', 1); r.onupgradeneeded = () => r.result.createObjectStore('save'); r.onsuccess = () => { db = r.result; ok(); }; r.onerror = () => ok(); } catch (e) { ok(); }
});
export const ler = () => new Promise(ok => {
  if (!db) return ok(mem);
  try { const q = db.transaction('save').objectStore('save').get('dados'); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); } catch (e) { ok(null); }
});
export function gravar(d) { mem = d; if (db) try { db.transaction('save', 'readwrite').objectStore('save').put(d, 'dados'); } catch (e) { /* ignora */ } }
export function apagar() { mem = null; return new Promise(ok => { if (!db) return ok(); try { const t = db.transaction('save', 'readwrite'); t.objectStore('save').delete('dados'); t.oncomplete = ok; t.onerror = ok; } catch (e) { ok(); } }); }
