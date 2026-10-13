// Carrega e armazena modelos .glb em duas etapas: veículos/personagens/móveis
// essenciais primeiro; prédios e detalhes depois, em segundo plano.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtilsNS from 'three/addons/utils/SkeletonUtils.js';
// Versões diferentes do three.js exportam esse módulo de formas diferentes
// (objeto nomeado "SkeletonUtils" ou funções soltas) — cobre os dois casos.
const SkeletonUtils = SkeletonUtilsNS.SkeletonUtils || SkeletonUtilsNS;

export const VEICULOS = {
  spectral: 'assets/models/visual-cc0/spectral/spectral.glb',
  ambulancia: 'assets/models/veiculos/kenney/ambulance.glb',
  bombeiros: 'assets/models/veiculos/kenney/firetruck.glb',
  coleta: 'assets/models/veiculos/kenney/garbage-truck.glb',
  entrega: 'assets/models/veiculos/kenney/delivery.glb',

  carroUrbano: 'assets/models/veiculos/kenney/sedan.glb',
  carroCompacto: 'assets/models/veiculos/kenney/hatchback-sports.glb',
  esportivoPack: 'assets/models/veiculos/kenney/race.glb',
  suv: 'assets/models/veiculos/kenney/suv.glb',
  policial: 'assets/models/veiculos/kenney/police.glb',
  rollsroyce: 'assets/models/veiculos/kenney/suv-luxury.glb',
  dodge: 'assets/models/veiculos/kenney/sedan-sports.glb',
  rx7: 'assets/models/veiculos/kenney/race.glb',
  antigo: 'assets/models/veiculos/kenney/sedan.glb',
  moto: 'assets/models/veiculos/moto.glb',
  // Novos, a partir do "City Pack":
  lambo: 'assets/models/veiculos/kenney/race-future.glb',
  van: 'assets/models/veiculos/kenney/van.glb',
  pickup: 'assets/models/veiculos/kenney/truck.glb',
  onibus: 'assets/models/veiculos/onibus.glb',
  moto2: 'assets/models/veiculos/moto2.glb',
  bike: 'assets/models/veiculos/bike.glb',
};
export const PERSONAGENS = {
  miniCivilA: 'assets/models/visual-cc0/mini-characters/character-male-a.glb',
  miniCivilB: 'assets/models/visual-cc0/mini-characters/character-female-a.glb',
  miniCivilC: 'assets/models/visual-cc0/mini-characters/character-female-d.glb',
  miniPolicial: 'assets/models/visual-cc0/mini-characters/character-male-c.glb',
  miniFuncionario: 'assets/models/visual-cc0/mini-market/character-employee.glb',
  homemNegocios: 'assets/models/personagens/homem_negocios.glb',
  homem: 'assets/models/personagens/homem.glb',
  mulher: 'assets/models/personagens/mulher.glb',
  mulher2: 'assets/models/personagens/mulher2.glb',
  soldado: 'assets/models/personagens/soldado.glb',
};
export const ARMAS_3D = {
  pistola: 'assets/models/armas/pistola.glb',
  submetralhadora: 'assets/models/armas/submetralhadora.glb',
  rifle: 'assets/models/armas/rifle.glb',
  shotgun: 'assets/models/armas/shotgun.glb',
  sniper: 'assets/models/armas/sniper.glb',
};
// Cenário: objetos estáticos (sem animação) do "City Pack", espalhados pela cidade em decor.js.
export const DECOR = {
  toldoNovo: 'assets/models/visual-cc0/city-kit-commercial/detail-awning-wide.glb',
  marquiseNova: 'assets/models/visual-cc0/city-kit-commercial/detail-overhang-wide.glb',
  guardaSolNovo: 'assets/models/visual-cc0/city-kit-commercial/detail-parasol-a.glb',

  posteDetalhado: 'assets/models/visual-cc0/city-kit-roads/light-curved.glb',
  placaAvenida: 'assets/models/visual-cc0/city-kit-roads/sign-highway-detailed.glb',
  barreiraObra: 'assets/models/visual-cc0/city-kit-roads/construction-barrier.glb',
  florVermelha: 'assets/models/visual-cc0/nature-kit/flower_redA.glb',
  florAmarela: 'assets/models/visual-cc0/nature-kit/flower_yellowA.glb',
  pedraJardim: 'assets/models/visual-cc0/nature-kit/rock_smallA.glb',

  arvoreFolhosa: 'assets/models/visual-cc0/nature-kit/tree_default.glb',
  arvoreConica: 'assets/models/visual-cc0/nature-kit/tree_cone.glb',
  arbustoDecor: 'assets/models/visual-cc0/nature-kit/plant_bushDetailed.glb',
  banco: 'assets/models/visual-cc0/furniture-kit/bench.glb',
  arCondicionado: 'assets/models/decor/arCondicionado.glb',
  caixa: 'assets/models/decor/caixa.glb',
  placaPonto: 'assets/models/decor/placaPonto.glb',
  pecaCerca: 'assets/models/decor/pecaCerca.glb',
  escadaIncendio: 'assets/models/decor/escadaIncendio.glb',
  buraco: 'assets/models/decor/buraco.glb',
  vasoFlorido: 'assets/models/decor/vasoFlorido.glb',
  canteiro: 'assets/models/decor/canteiro.glb',
  quadroEletrico: 'assets/models/decor/quadroEletrico.glb',
  pizza: 'assets/models/decor/pizza.glb',
  luzTransito: 'assets/models/decor/luzTransito.glb',
  arvore: 'assets/models/visual-cc0/nature-kit/tree_detailed.glb',
  cartaz: 'assets/models/decor/cartaz.glb',
  saidaTelhado: 'assets/models/decor/saidaTelhado.glb',
  sacoLixo: 'assets/models/decor/sacoLixo.glb',
  varal: 'assets/models/decor/varal.glb',

  hidrante: 'assets/models/decor/hidrante.glb',
  correio: 'assets/models/decor/caixa_correio.glb',
  lixeira: 'assets/models/decor/lixeira.glb',
  pare: 'assets/models/visual-cc0/city-kit-roads/road-sign-stop.glb',
  pontoOnibus: 'assets/models/decor/ponto_onibus.glb',
  caixaEletronico: 'assets/models/decor/caixa_eletronico.glb',
  bueiro: 'assets/models/decor/bueiro.glb',
  vaso: 'assets/models/decor/vaso.glb',
  cacamba: 'assets/models/visual-cc0/city-kit-roads/dumpster.glb',
  outdoor: 'assets/models/decor/outdoor.glb',
  papel: 'assets/models/decor/lixo_papel.glb',
  cone: 'assets/models/visual-cc0/city-kit-roads/construction-cone.glb',
};


export const NOVOS = {
  mobMercadoCaixa: 'assets/models/visual-cc0/mini-market/cash-register.glb',
  mobMercadoFruta: 'assets/models/visual-cc0/mini-market/display-fruit.glb',
  mobMercadoPao: 'assets/models/visual-cc0/mini-market/display-bread.glb',
  mobMercadoFreezer: 'assets/models/visual-cc0/mini-market/freezers-standing.glb',
  mobMercadoPrateleira: 'assets/models/visual-cc0/mini-market/shelf-boxes.glb',
  mobMercadoSacolas: 'assets/models/visual-cc0/mini-market/shelf-bags.glb',
  mobMercadoCarrinho: 'assets/models/visual-cc0/mini-market/shopping-cart.glb',
  mobMercadoCesta: 'assets/models/visual-cc0/mini-market/shopping-basket.glb',
  mobOficinaBancada: 'assets/models/visual-cc0/tools-workshop/workbench.glb',
  mobOficinaFerramentas: 'assets/models/visual-cc0/tools-workshop/pegboard-tool-wall.glb',
  mobOficinaMaleta: 'assets/models/visual-cc0/tools-workshop/toolbox.glb',
  mobOficinaChave: 'assets/models/visual-cc0/tools-workshop/wrench.glb',
  mobTrabalhoCarrinho: 'assets/models/visual-cc0/tools-workshop/hand-truck.glb',
  mobTrabalhoPaleteira: 'assets/models/visual-cc0/tools-workshop/pallet-jack.glb',
  mobTrabalhoCaixa: 'assets/models/visual-cc0/factory-kit/box-small.glb',
  mobTrabalhoContainer: 'assets/models/visual-cc0/factory-kit/box-large.glb',
  mobOficinaPistao: 'assets/models/visual-cc0/factory-kit/piston-round.glb',
  mobOficinaEngrenagem: 'assets/models/visual-cc0/factory-kit/cog-a.glb',
  mobOficinaScanner: 'assets/models/visual-cc0/factory-kit/screen-wide.glb',
  mobBracosFP: 'assets/models/visual-cc0/wrad-arms/arms.glb',

  mobVisual_sofa: 'assets/models/visual-cc0/furniture-kit/loungeDesignSofa.glb',
  mobVisual_poltrona: 'assets/models/visual-cc0/furniture-kit/loungeDesignChair.glb',
  mobVisual_mesaCentro: 'assets/models/visual-cc0/furniture-kit/tableCoffee.glb',
  mobVisual_rackTv: 'assets/models/visual-cc0/furniture-kit/cabinetTelevisionDoors.glb',
  mobVisual_tv: 'assets/models/visual-cc0/furniture-kit/televisionModern.glb',
  mobVisual_planta: 'assets/models/visual-cc0/furniture-kit/pottedPlant.glb',
  mobVisual_abajur: 'assets/models/visual-cc0/furniture-kit/lampRoundFloor.glb',
  mobVisual_balcao: 'assets/models/visual-cc0/furniture-kit/kitchenCabinet.glb',
  mobVisual_fogao: 'assets/models/visual-cc0/furniture-kit/kitchenStove.glb',
  mobVisual_pia: 'assets/models/visual-cc0/furniture-kit/kitchenSink.glb',
  mobVisual_geladeira: 'assets/models/visual-cc0/furniture-kit/kitchenFridge.glb',
  mobVisual_mesaJantar: 'assets/models/visual-cc0/furniture-kit/table.glb',
  mobVisual_cadeira: 'assets/models/visual-cc0/furniture-kit/chairCushion.glb',
  mobVisual_cama: 'assets/models/visual-cc0/furniture-kit/bedDouble.glb',
  mobVisual_criado: 'assets/models/visual-cc0/furniture-kit/cabinetBedDrawer.glb',
  mobVisual_escrivaninha: 'assets/models/visual-cc0/furniture-kit/desk.glb',
  mobVisual_vaso: 'assets/models/visual-cc0/furniture-kit/toilet.glb',
  mobVisual_banheira: 'assets/models/visual-cc0/furniture-kit/bathtub.glb',
  mobVisual_estante: 'assets/models/visual-cc0/furniture-kit/bookcaseOpen.glb',
  kitTorre1: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-a.glb',
  kitTorre2: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-b.glb',
  kitTorre3: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-c.glb',
  kitTorre4: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-d.glb',
  kitTorre5: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-e.glb',
  kitTorre6: 'assets/models/visual-cc0/city-kit-commercial/building-skyscraper-b.glb',
  kitGrande1: 'assets/models/visual-cc0/city-kit-commercial/building-e.glb',
  kitGrande2: 'assets/models/visual-cc0/city-kit-commercial/building-f.glb',
  kitGrande3: 'assets/models/visual-cc0/city-kit-commercial/building-g.glb',
  kitGrande4: 'assets/models/visual-cc0/city-kit-commercial/building-h.glb',
  kitGrande5: 'assets/models/visual-cc0/city-kit-commercial/building-c.glb',
  kitGrande6: 'assets/models/visual-cc0/city-kit-commercial/building-d.glb',
  kitBaixo1: 'assets/models/visual-cc0/city-kit-commercial/building-a.glb',
  kitBaixo2: 'assets/models/visual-cc0/city-kit-commercial/building-b.glb',
  kitBaixo3: 'assets/models/visual-cc0/city-kit-commercial/building-c.glb',
  kitBaixo4: 'assets/models/visual-cc0/city-kit-commercial/building-d.glb',
  kitBaixo5: 'assets/models/visual-cc0/city-kit-commercial/building-a.glb',
  kitBaixo6: 'assets/models/visual-cc0/city-kit-commercial/building-b.glb',
  kitCasa1: 'assets/models/cidade_nova/kitCasa1.glb',
  kitCasa2: 'assets/models/cidade_nova/kitCasa2.glb',
  kitCasa3: 'assets/models/cidade_nova/kitCasa3.glb',
  kitCasa4: 'assets/models/cidade_nova/kitCasa4.glb',
  kitCasa5: 'assets/models/cidade_nova/kitCasa5.glb',
  kitCasa6: 'assets/models/cidade_nova/kitCasa6.glb',
  mobEstante: 'assets/models/mobiliario/mobEstante.glb',
  mobBalcao: 'assets/models/mobiliario/mobBalcao.glb',
  mobCadeira: 'assets/models/mobiliario/mobCadeira.glb',
  mobSofa: 'assets/models/mobiliario/mobSofa.glb',
  mobPlanta: 'assets/models/mobiliario/mobPlanta.glb',
  mobComputador: 'assets/models/mobiliario/mobComputador.glb',
  medCasa: 'assets/models/cidade_nova/medCasa.glb',
  medCasa2: 'assets/models/cidade_nova/medCasa2.glb',
  medTaverna: 'assets/models/cidade_nova/medTaverna.glb',
  medTorre: 'assets/models/cidade_nova/medTorre.glb',
  medMoinho: 'assets/models/cidade_nova/medMoinho.glb',
  medMercado: 'assets/models/cidade_nova/medMercado.glb',
  medPoco: 'assets/models/cidade_nova/medPoco.glb',
  medCarroca: 'assets/models/cidade_nova/medCarroca.glb',
  medBanco: 'assets/models/cidade_nova/medBanco.glb',
};

const loader = new GLTFLoader();
const cache = {};
const emCarga = new Map(), porURL = new Map();

function carregar1(chave, url) {
  if (cache[chave]) return Promise.resolve(true);
  if (emCarga.has(chave)) return emCarga.get(chave);
  let download=porURL.get(url);
  if(!download){download=new Promise(resolve=>{loader.load(url,gltf=>resolve(gltf),undefined,erro=>{console.warn('[assets] falha em '+url,erro);porURL.delete(url);resolve(null);});});porURL.set(url,download);}
  const tarefa=download.then(gltf=>{if(!gltf)return false;cache[chave]=gltf;return true;}).finally(()=>emCarga.delete(chave));
  emCarga.set(chave,tarefa);return tarefa;
}

// No perfil leve, carrega menos variações decorativas para poupar memória no celular.
const EXTRAS_LEVES = new Set([
  'toldoNovo','marquiseNova','guardaSolNovo','posteDetalhado','placaAvenida','barreiraObra','florVermelha','florAmarela','pedraJardim',
  'arvoreFolhosa','arvoreConica','arbustoDecor',
  'banco', 'hidrante', 'correio', 'lixeira', 'pare', 'pontoOnibus', 'caixaEletronico',
  'bueiro', 'vaso', 'cacamba', 'cerca', 'papel', 'cone', 'outdoor', 'arvore', 'canteiro',
  'vasoFlorido', 'placaPonto', 'luzTransito', 'arCondicionado',
  'kitTorre1', 'kitTorre2', 'kitTorre3', 'kitTorre4', 'kitTorre5', 'kitTorre6',
  'kitGrande1', 'kitGrande2', 'kitGrande3', 'kitGrande4', 'kitGrande5', 'kitGrande6',
  'kitBaixo1', 'kitBaixo2', 'kitBaixo3', 'kitBaixo4', 'kitBaixo5', 'kitBaixo6',
  'kitCasa1', 'kitCasa2', 'kitCasa3', 'kitCasa4', 'kitCasa5', 'kitCasa6',
  'medCasa', 'medTaverna', 'medMercado',
  'medPoco', 'medCarroca', 'medBanco', 'mobEstante', 'mobBalcao', 'mobCadeira',
  'mobSofa', 'mobMesa', 'mobPlanta', 'mobGeladeira', 'mobCaixa', 'mobAbajur', 'mobComputador'
]);
async function carregarLista(lista,aoProgredir,concorrencia=3){
  if(!lista.length){aoProgredir?.(1);return;}
  let feitos=0,proximo=0;
  const trabalhador=async()=>{while(proximo<lista.length){const i=proximo++, [chave,url]=lista[i];await carregar1(chave,url);feitos++;aoProgredir?.(feitos/lista.length);await new Promise(r=>typeof requestIdleCallback==='function'?requestIdleCallback(r,{timeout:100}):setTimeout(r,16));}};
  await Promise.all(Array.from({length:Math.min(concorrencia,lista.length)},trabalhador));
}
export function carregarEssenciais(aoProgredir) {
  const moveis=Object.entries(NOVOS).filter(([chave])=>chave.startsWith('mob'));
  return carregarLista([...Object.entries(VEICULOS),...Object.entries(PERSONAGENS),...Object.entries(ARMAS_3D),...moveis],aoProgredir,3);
}
export function carregarExtras(aoProgredir, leve = false) {
  const lista=Object.entries({ ...DECOR, ...NOVOS }).filter(([chave]) => !chave.startsWith('mob')&&(!leve || EXTRAS_LEVES.has(chave)));
  return carregarLista(lista,aoProgredir,1);
}
export async function carregarTudo(aoProgredir, leve = false) {
  await carregarEssenciais(f=>aoProgredir?.(f*.6));
  await carregarExtras(f=>aoProgredir?.(.6+f*.4),leve);
}

// Devolve uma cópia nova e independente da cena (com clone do esqueleto, se houver), ou null se não carregou.
export function clonarCena(chave) {
  const g = cache[chave];
  return g ? SkeletonUtils.clone(g.scene) : null;
}
export function animacoesDe(chave) { return cache[chave]?.animations || []; }
export function temModelo(chave) { return !!cache[chave]; }
