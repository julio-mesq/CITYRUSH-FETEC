// Cenário urbano: espalha pela cidade os objetos estáticos do "City Pack" (bancos,
// hidrantes, lixeiras, placas, cercas, prédios-vitrine etc). Cada modelo é normalizado
// pelo tamanho real (bounding box), igual ao que vehicles.js/player.js já fazem para
// carros e armas — assim funciona bem independente da escala original do arquivo .glb.
import * as THREE from 'three';
import * as Assets from './assets.js';
import { LUGARES, PREDIOS_PACK, alinharColisorPredio } from './world.js';
import { criarCasasAnexadas } from './casas-modelos.js';
import { casaDefinida } from './casas-catalogo.js';

const R = (a, b) => a + Math.random() * (b - a);

// Instancia "chave" (de Assets.DECOR), com o maior lado redimensionado para "alvoTam"
// metros, base encostada no chão (y=0) e centralizada em (x,z). ry = rotação em Y.
function por(scene, chave, x, z, alvoTam, ry = 0) {
  const modelo = Assets.clonarCena(chave);
  if (!modelo) { console.warn('[decor] modelo não encontrado no cache (não carregou?):', chave); return null; }
  const caixa = new THREE.Box3().setFromObject(modelo), centro = new THREE.Vector3();
  caixa.getCenter(centro);
  const tam = Math.max(caixa.max.x - caixa.min.x, caixa.max.y - caixa.min.y, caixa.max.z - caixa.min.z) || 1;
  const wrapper = new THREE.Group();
  modelo.position.set(-centro.x, -caixa.min.y, -centro.z);
  wrapper.add(modelo);
  wrapper.scale.setScalar(alvoTam / tam);
  wrapper.rotation.y = ry;
  wrapper.position.set(x, 0, z);
  wrapper.traverse(n => {
    if (!n.isMesh) return;
    n.castShadow = false; n.receiveShadow = true;
    const materiais = Array.isArray(n.material) ? n.material : [n.material];
    materiais.forEach(m => {
      if (!m || m.userData?.cityRushAjustado) return;
      m.userData.cityRushAjustado = true;
      if ('roughness' in m) m.roughness = /glass|vidro|window/i.test(n.name) ? .16 : Math.min(.86, Math.max(.28, m.roughness ?? .65));
      if ('metalness' in m) m.metalness = /metal|car|rail|window|glass/i.test(n.name) ? Math.max(.28, m.metalness ?? 0) : Math.min(.18, m.metalness ?? 0);
      if ('envMapIntensity' in m) m.envMapIntensity = /glass|vidro|window/i.test(n.name) ? 1.02 : .46;
      if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 4; }
      m.needsUpdate = true;
    });
  });
  scene.add(wrapper);
  if(/^kit(Torre|Grande|Baixo)/.test(chave)){
    wrapper.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(wrapper),s=b.getSize(new THREE.Vector3());alinharColisorPredio(x,z,s.x,s.z);
  }
  return wrapper;
}

// fraco: mesma detecção de dispositivo fraco do main.js — reduz a quantidade de
// objetos (cada um é um draw call à parte, sem InstancedMesh) pra não pesar no celular.
export async function criarDecoracoes(scene, fraco) {
  const respirar=()=>new Promise(r=>requestAnimationFrame(r));
  const casasAnexadas=criarCasasAnexadas(scene,LUGARES);
  let total = 0, falhas = 0;
  const objetos = [];
  const p = (...args) => { const r = por(...args); if (r) { r.visible=false;total++; objetos.push(r); } else falhas++; return r; };
  // Mobiliário urbano na pracinha livre no meio de cada quarteirão (entre os 4 lotes).
  const miudezas = fraco
    ? [['banco', 1.6], ['hidrante', .8], ['lixeira', .9], ['vaso', .7], ['cone', .7]]
    : [['banco', 1.6], ['hidrante', .8], ['correio', 1.1], ['lixeira', .9], ['vaso', .7], ['bueiro', .8], ['cone', .7], ['papel', .3], ['cacamba', 1.8]];
  const chanceBloco = fraco ? .8 : .5, passo = fraco ? 2 : 1; // fraco: 1 a cada ~5 quarteirões (pula de 2 em 2 + 80% de chance de nada)
  for (let bx = -10; bx < 10; bx += passo) for (let bz = -10; bz < 10; bz += passo) {
    if(bz===-10&&bx%4===0)await respirar();
    if (Math.random() < chanceBloco) continue; // nem todo quarteirão recebe algo, pra não poluir
    const cx = bx * 100 + 50, cz = bz * 100 + 50, n = !fraco && Math.random() < .35 ? 2 : 1;
    for (let i = 0; i < n; i++) { const [chave, tam] = miudezas[R(0, miudezas.length) | 0]; p(scene, chave, cx + R(-3.5, 3.5), cz + R(-3.5, 3.5), tam, R(0, Math.PI * 2)); }
  }
  // Vegetação nova na calçada perto dos locais úteis, sem ocupar a pista.
  LUGARES.forEach((l,i)=>{
    if(l.tipo!=='casa'&&l.tipo!=='mercado'&&l.tipo!=='oficina')return;
    const x=Math.round(l.x/100)*100+11;
    p(scene,i%2?'arvoreFolhosa':'arvoreConica',x,l.z+12,4.5);
    if(!fraco){p(scene,'arvoreFolhosa',x,l.z-12,4.1);p(scene,'arbustoDecor',x+2,l.z+15,1.1);}
  });
  // GLBs novos em jardins e calçadas, mantendo livres pistas e entradas.
  LUGARES.forEach((l,i)=>{
    const x=Math.floor(l.x/100)*100+50,z=Math.floor(l.z/100)*100+50;
    p(scene,'florVermelha',x-4,z+4,.7);
    p(scene,'florAmarela',x+4,z+4,.65);
    if(!fraco){p(scene,'pedraJardim',x-4,z-4,.7);p(scene,'banco',x+3,z-3,1.65,Math.PI/2);}
  });
  for(let i=0;i<(fraco?5:10);i++){
    const x=(i%3-1)*100+9,z=(Math.floor(i/3)-1)*100+46;
    p(scene,'posteDetalhado',x,z,6,Math.PI/2);
  }
  p(scene,'placaAvenida',9,-160,6,Math.PI/2);
  p(scene,'barreiraObra',-9,55,1.7,Math.PI/2);
  // Placas de "PARE" e pontos de ônibus na calçada — usando o mesmo ponto de
  // referência das árvores/postes já existentes em world.js (x/z = quarteirão+9),
  // que é a faixa de calçada livre entre a rua e os lotes dos prédios.
  const pPare = fraco ? 4 : 2, pOnibus = fraco ? 8 : 4;
  for (let bx = -10; bx <= 10; bx += pPare) for (let bz = -10; bz <= 10; bz += pPare) p(scene, 'pare', bx * 100 + 9, bz * 100 + 9, 2.2, Math.PI / 2);
  const mapaPonto=document.createElement('canvas');mapaPonto.width=256;mapaPonto.height=256;const ctxPonto=mapaPonto.getContext('2d');
  ctxPonto.fillStyle='#f1e7d3';ctxPonto.fillRect(0,0,256,256);ctxPonto.strokeStyle='#547888';ctxPonto.lineWidth=10;
  for(let i=35;i<256;i+=55){ctxPonto.beginPath();ctxPonto.moveTo(i,45);ctxPonto.lineTo(i,220);ctxPonto.stroke();ctxPonto.beginPath();ctxPonto.moveTo(20,i);ctxPonto.lineTo(236,i);ctxPonto.stroke();}
  ctxPonto.fillStyle='#102837';ctxPonto.font='bold 23px sans-serif';ctxPonto.fillText('CITY RUSH • BUS',20,28);ctxPonto.fillStyle='#d6a22f';ctxPonto.beginPath();ctxPonto.arc(145,145,12,0,Math.PI*2);ctxPonto.fill();
  const mapaMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(mapaPonto),side:THREE.DoubleSide});mapaMat.map.colorSpace=THREE.SRGBColorSpace;
  for(let bx=-9;bx<10;bx+=pOnibus)for(let bz=-9;bz<10;bz+=pOnibus){
    const x=bx*100+9,z=bz*100+20;
    const abrigo=p(scene,'pontoOnibus',x,z,4.5,-Math.PI / 2);
    p(scene,'placaPonto',x,z+3,2.4,-Math.PI/2);
    if(abrigo){const painel=new THREE.Mesh(new THREE.PlaneGeometry(.75,.9),mapaMat);painel.position.set(x+.65,1.7,z+.9);painel.rotation.y=-Math.PI/2;scene.add(painel);objetos.push(painel);total++;}
  }
  // Outdoors espalhados perto de algumas ruas principais.
  for (let i = 0; i < (fraco ? 4 : 12); i++) p(scene, 'outdoor', Math.round(R(-9, 9)) * 100 + 9, Math.round(R(-9, 9)) * 100 + 50, 6, Math.PI / 2);
  // Caixas eletrônicas em frente a mercados/postos. Casas ficam sem grades.
  LUGARES.forEach(l => {
    if (l.tipo === 'mercado' || l.tipo === 'posto') p(scene, 'caixaEletronico', l.x + 8, l.z - 8, 1.6, R(0, Math.PI * 2));
  });
  LUGARES.filter(l=>l.tipo==='mercado'||l.tipo==='posto').forEach(l=>{
    p(scene,'guardaSolNovo',l.x+11,l.z+10,2.7);
    p(scene,'banco',l.x+11,l.z+7,1.65,Math.PI/2);
  });
  // Novos pontos do pack: detalhes de rua e fachadas, com quantidade limitada para manter desempenho.
  const detalhes = [
    ['arvore', 3.5, 11, 35], ['canteiro', 2.6, 13, 48],
    ['vasoFlorido', 1.2, 14, 58], ['pizza', 4.5, 16, 72],
    ['quadroEletrico', 1.5, 12, 78], ['caixa', 1, 18, 52],
    ['sacoLixo', .8, 17, 60], ['placaPonto', 2.6, 10, 22],
    ['pecaCerca', 2.5, 20, 48], ['cartaz', 1.3, 17, 36],
    ['escadaIncendio', 6, 24, 70], // sinais são os funcionais de traffic.js, sem cópias apagadas do pack
    ['saidaTelhado', 2, 25, 77], ['arCondicionado', 1, 24, 62],
    ['varal', 3.5, 24, 56], ['buraco', 1.3, 19, 39],
  ];
  const detalhesAtivos = fraco ? detalhes.filter(([chave]) => ['arvore', 'canteiro', 'vasoFlorido', 'placaPonto', 'luzTransito', 'arCondicionado'].includes(chave)) : detalhes;
  detalhesAtivos.forEach(([chave, tamanho, ox, oz], i) => {
    const bx = ((i * 7) % 18 - 9) * 100, bz = ((i * 11) % 18 - 9) * 100;
    p(scene, chave, bx + ox, bz + oz, tamanho, i % 2 ? Math.PI / 2 : 0);
  });
  // Edifícios de verdade ocupam lotes centrais; os cubos desses lotes foram retirados em world.js.
  // Os arquivos do City Kit são leves; todas as seis variações de cada família
  // ficam disponíveis também no celular. O culling abaixo limita o que é desenhado.
  const kitTorres = ['kitTorre1', 'kitTorre2', 'kitTorre3', 'kitTorre4', 'kitTorre5', 'kitTorre6'];
  const kitGrandes = ['kitGrande1', 'kitGrande2', 'kitGrande3', 'kitGrande4', 'kitGrande5', 'kitGrande6'];
  const kitBaixos = ['kitBaixo1', 'kitBaixo2', 'kitBaixo3', 'kitBaixo4', 'kitBaixo5', 'kitBaixo6'];
  const kitCasas = ['kitCasa1', 'kitCasa2', 'kitCasa3', 'kitCasa4', 'kitCasa5', 'kitCasa6'];
  const medievais = fraco ? ['medCasa', 'medTaverna'] : ['medCasa', 'medCasa2', 'medTaverna', 'medTorre', 'medMoinho'];
  const usados = { torre: 0, grande: 0, baixo: 0, casa: 0 };
  for(const [i,l] of PREDIOS_PACK.entries()){
    if(i%12===0)await respirar();
    let modelo, tamanho;
    if (l.medieval) { modelo = medievais[i % medievais.length]; tamanho = modelo === 'medTorre' ? 25 : 19; }
    else if (l.casa || l.familia === 'casa') { modelo = kitCasas[usados.casa++ % kitCasas.length]; tamanho = l.casa ? 16 : 19; }
    else {
      const chave = l.familia === 'torre' ? 'torre' : l.familia === 'grande' ? 'grande' : 'baixo';
      const familia = chave === 'torre' ? kitTorres : chave === 'grande' ? kitGrandes : kitBaixos;
      modelo = familia[usados[chave]++ % familia.length]; tamanho = chave === 'torre' ? 42 : chave === 'grande' ? 33 : 25;
    }
    // As casas especiais ficam orientadas para a rua da frente, em vez de girarem
    // aleatoriamente como os prédios; assim a entrada e o caminho ficam coerentes.
    if(!l.casa){
      const predio=p(scene,modelo,l.x,l.z,tamanho,(i%4)*Math.PI/2);
      if(predio&&!l.medieval&&i%(fraco?4:2)===0){
        const limite=new THREE.Box3().setFromObject(predio),w=Math.min(5.2,limite.max.x-limite.min.x-1);
        const toldo=p(scene,'toldoNovo',l.x,limite.max.z-.2,w);if(toldo)toldo.position.y=2.65;
        if(!fraco){const marquise=p(scene,'marquiseNova',l.x,limite.max.z-.3,w);if(marquise)marquise.position.y=5.3;}
      }
    }
    if (l.casa) {
      const pedra = new THREE.MeshStandardMaterial({ color: 0xb9b5aa, roughness: .92 });
      const madeira = new THREE.MeshStandardMaterial({ color: 0x76503a, roughness: .78 });
      const verde = new THREE.MeshStandardMaterial({ color: 0x426b3b, roughness: .9 });
      const criarBloco = (w, h, d, material, x, y, z) => {
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o);
        objetos.push(o); total++; return o;
      };
      const indice=LUGARES.find(q=>q.tipo==='casa'&&q.x===l.x&&q.z===l.z)?.idx||0,def=casaDefinida(indice);
      const frente=def.profundidade/2+.8,extra=frente-8.5;
      const blocoCasa=criarBloco;
      // Todos os detalhes acompanham a fachada ampliada, mantendo altura humana.
      const detalhe=(w,h,d,material,x,y,z)=>blocoCasa(w,h,d,material,x,y,z+extra);
      // Área da frente: o carro chega pela rua sem atravessar a piscina.
      if(def.externa){
        detalhe(6,.12,7,pedra,l.x-8,.06,l.z+10.5);
        detalhe(6.2,.16,7.2,madeira,l.x-8,3.15,l.z+10.5);
        for(const dx of [-10.9,-5.1])for(const dz of [7.1,13.9])detalhe(.14,3.1,.14,madeira,l.x+dx,1.55,l.z+dz);
      }
      if(def.piscina&&def.modelo!=='campo'){
        const azulejo=new THREE.MeshStandardMaterial({color:0xc8dedb,roughness:.55}),agua=new THREE.MeshStandardMaterial({color:0x3c9fb6,roughness:.22,metalness:.2});
        detalhe(5.6,.18,7.2,pedra,l.x+10,.09,l.z+9.5);
        detalhe(4.6,.05,6.2,agua,l.x+10,.2,l.z+9.5);
        for(const dx of [-2.5,2.5])detalhe(.3,.22,6.8,azulejo,l.x+10+dx,.11,l.z+9.5);
        for(const dz of [-3.4,3.4])detalhe(5.3,.22,.3,azulejo,l.x+10,.11,l.z+9.5+dz);
      }
      // Caminho de pedras até a entrada, pequeno degrau e cobertura da varanda.
      for (let k = 0; k < 3; k++) detalhe(1.65, .09, 1.15, pedra, l.x, .045, l.z + 8.8 + k * 1.1);
      detalhe(3.5, .18, 1.8, pedra, l.x, .09, l.z + 8.5);
      detalhe(3.8, .16, 1.65, madeira, l.x, 3.35, l.z + 8.25);
      for (const dx of [-1.65, 1.65]) detalhe(.16, 3.25, .16, madeira, l.x + dx, 1.62, l.z + 8.35);
      // Jardineiras baixas dos dois lados da entrada.
      for (const dx of [-4.7, 4.7]) {
        detalhe(1.7, .42, .85, madeira, l.x + dx, .21, l.z + 8.7);
        for (let q = 0; q < 3; q++) {
          const arbusto = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), verde);
          arbusto.position.set(l.x + dx - .42 + q * .42, .58, l.z + 8.7 + extra);
          arbusto.castShadow = true; scene.add(arbusto); objetos.push(arbusto); total++;
        }
      }
    }
    if (l.medieval) {
      p(scene, i % 3 ? 'medBanco' : 'medCarroca', l.x - 5, l.z + 13, 2.8);
      if (i % 4 === 0) p(scene, 'medPoco', l.x + 5, l.z + 13, 2);
      if (i % 5 === 0) p(scene, 'medMercado', l.x + 5, l.z + 13, 3);
    } else {
      p(scene, 'vasoFlorido', l.x - 4, l.z + 14, 1.1);
      p(scene, 'canteiro', l.x + 4, l.z + 14, 2.1);
      if (!l.casa && i % 3 === 0) p(scene, 'arCondicionado', l.x + 7, l.z + 12, 1.1);
    }
  }
  console.log(`[decor] ${total} objetos de cenário criados, ${falhas} falharam (modelo ausente no cache).`);
  for(const o of objetos){o.updateMatrixWorld(true);o.traverse(n=>{n.matrixAutoUpdate=false;n.matrixWorldAutoUpdate=false;});}
  let ultimoX = Infinity, ultimoZ = Infinity;
  return { atualizar(alvo) {
    casasAnexadas.atualizar(alvo);
    if (Math.hypot(alvo.x - ultimoX, alvo.z - ultimoZ) < 25) return;
    ultimoX = alvo.x; ultimoZ = alvo.z;
    const limite2 = (fraco ? 210 : 360) ** 2;
    objetos.forEach(o => { const dx = o.position.x - alvo.x, dz = o.position.z - alvo.z; o.visible = dx * dx + dz * dz < limite2; });
  } };
}
