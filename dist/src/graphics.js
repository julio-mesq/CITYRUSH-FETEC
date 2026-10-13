// Acabamento cinematográfico do render. O celular mantém o mesmo estilo visual,
// mas evita passes de pós-processamento para preservar a fluidez.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function prepararGraficos(renderer, scene, camera, fraco, qualidade='media') {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Exposição mais baixa preserva céu, fachadas claras e faróis sem o aspecto
  // “estourado” que aparecia principalmente ao meio-dia.
  renderer.toneMappingExposure = fraco ? .8 : .84;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Uma iluminação ambiente neutra dá leitura melhor a lataria, vidro e metais
  // dos modelos GLB sem exigir um mapa HDR externo pesado.
  if (!fraco) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const ambiente = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environment = ambiente;
    pmrem.dispose();
  }

  if (fraco || !renderer.capabilities.isWebGL2) return null;
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  const cena = new RenderPass(scene, camera);
  const brilho = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .045, .18, 1.04);
  const movimento = new AfterimagePass(.66); // só é ligado em alta velocidade
  const saida = new OutputPass();
  composer.addPass(cena);
  composer.addPass(brilho);
  composer.addPass(movimento);
  composer.addPass(saida);
  let ativa=false;
  let perfil=qualidade,velocidade=0;
  // O perfil médio preserva tone mapping, reflexos e luzes, mas renderiza a
  // cena diretamente. Bloom e afterimage ficam no perfil alto, pois dobrar os
  // passes de tela era caro em notebooks e celulares.
  const definir=q=>{perfil=q;ativa=q==='alta';brilho.enabled=q==='alta';movimento.enabled=q==='alta'&&velocidade>24;};
  definir(qualidade);
  // O bloom (brilho suave) é caro e quase invisível em resolução total: calcula-o na metade.
  let prAtual = Math.min(devicePixelRatio, 1.35);
  const bloomMetade = (w, h) => brilho.setSize(Math.max(2, Math.floor(w * prAtual * .5)), Math.max(2, Math.floor(h * prAtual * .5)));
  bloomMetade(innerWidth, innerHeight);
  return {
    render(cam) { cena.camera = cam; ativa?composer.render():renderer.render(scene,cam); },
    resize(w, h) { composer.setSize(w, h); bloomMetade(w, h); },
    escala(pr) { prAtual = Math.min(pr, 1.35); composer.setPixelRatio(prAtual); bloomMetade(innerWidth, innerHeight); }, // resolução dinâmica
    qualidade:definir,
    velocidade(v){velocidade=Math.abs(v||0);movimento.enabled=perfil==='alta'&&velocidade>24;}
  };
}
