import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CASAS } from './casas-catalogo.js';

// As quatro casas são carregadas por proximidade, uma de cada vez. Os arquivos
// estáticos já foram agrupados por material sem remover as fachadas originais.
export function criarCasasAnexadas(scene, lugares) {
  const loader=new GLTFLoader(),casas=lugares.filter(l=>l.tipo==='casa').map(l=>({l,def:CASAS[l.idx],grupo:new THREE.Group(),estado:'pendente',tentativa:0}));
  let ocupado=false;
  for(const c of casas){c.grupo.position.set(c.l.x,.03,c.l.z);c.grupo.name='casa-escolha-'+c.l.idx;scene.add(c.grupo);}
  function carregar(c){
    ocupado=true;c.estado='carregando';
    loader.load('assets/models/casas/'+(c.def.arquivo||c.def.modelo+'.glb'),gltf=>{
      const modelo=gltf.scene,box=new THREE.Box3().setFromObject(modelo),size=box.getSize(new THREE.Vector3()),centro=box.getCenter(new THREE.Vector3());
      const escala=c.def.tamanho/Math.max(size.x,size.z,.001),base=new THREE.Group();
      // A casa de campo inclui um terreno espesso e uma piscina abaixo do piso.
      // Alinhar a superfície habitável, em vez do fundo da fundação.
      const nivelTerreno=Number.isFinite(c.def.nivelTerreno)?c.def.nivelTerreno:box.min.y;
      modelo.position.set(-centro.x,-nivelTerreno,-centro.z);base.add(modelo);base.scale.setScalar(escala);base.rotation.y=c.def.rotacao;c.grupo.add(base);
      modelo.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
      if(c.def.modelo==='campo'){
        // Superfície dentro da piscina original, nas coordenadas do GLB.
        // Material opaco mantém a água visível sobre o plano urbano contínuo.
        const agua=new THREE.Mesh(new THREE.PlaneGeometry(6.17,3.81),new THREE.MeshStandardMaterial({color:0x279bb6,roughness:.24,metalness:.16,side:THREE.DoubleSide}));
        agua.name='agua-piscina-campo';agua.rotation.x=-Math.PI/2;
        agua.position.set(20.058192,-nivelTerreno+3.145,-15.51047);
        // Mesmo centro, escala e rotação da casa; a translação pertence ao modelo.
        agua.position.x-=centro.x;agua.position.z-=centro.z;base.add(agua);
      }
      c.grupo.updateMatrixWorld(true);c.grupo.traverse(o=>{o.matrixAutoUpdate=false;o.matrixWorldAutoUpdate=false;});
      c.estado='pronto';ocupado=false;
    },undefined,erro=>{console.warn('[casas] não foi possível carregar',c.def.modelo,erro);c.estado='pendente';c.tentativa=performance.now()+15000;ocupado=false;});
  }
  return {atualizar(alvo){
    let proxima=null,dist=Infinity;
    for(const c of casas){const d=c.grupo.position.distanceToSquared(alvo);c.grupo.visible=d<360*360;if(c.estado==='pendente'&&performance.now()>c.tentativa&&d<200*200&&d<dist){dist=d;proxima=c;}}
    if(proxima&&!ocupado)carregar(proxima);
  }};
}
