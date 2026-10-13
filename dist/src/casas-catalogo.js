// Índices 0–2 preservados para que os saves existentes conservem sua moradia.
export const CASAS = [
  { n: 'Casa compacta mobiliada', modelo: 'compacta', tamanho: 25, profundidade: 18.7, rotacao: 0, p: 40000, r: 200, piscina: false, externa: false },
  { n: 'Casa moderna com garagem externa', modelo: 'moderna', tamanho: 34, profundidade: 18.8, rotacao: Math.PI, p: 180000, r: 900, piscina: false, externa: true },
  { n: 'Residência de luxo com piscina', modelo: 'luxo', tamanho: 36, profundidade: 36, rotacao: 0, p: 600000, r: 3200, piscina: true, externa: false },
  { n: 'Casa de campo com piscina e varanda', modelo: 'campo', arquivo: 'campo.gltf', nivelTerreno: 3.1297619342803955, tamanho: 36, profundidade: 22.1, rotacao: Math.PI, p: 260000, r: 1300, piscina: true, externa: true }
];
export const casaDefinida = indice => CASAS[indice] || CASAS[0];
export const saidaCasa = indice => Math.max(18,casaDefinida(indice).profundidade/2+3.5);
