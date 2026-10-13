import * as THREE from 'three';
// Calçadas e jardins em instâncias: poucas chamadas de desenho para toda a cidade.
export function criarSuperficiesUrbanas(scene,fraco){
  const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');
  ctx.fillStyle='#acafac';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#848b88';ctx.lineWidth=2;
  for(let k=0;k<=128;k+=32){ctx.beginPath();ctx.moveTo(k,0);ctx.lineTo(k,128);ctx.moveTo(0,k);ctx.lineTo(128,k);ctx.stroke();}
  const textura=new THREE.CanvasTexture(cv);textura.colorSpace=THREE.SRGBColorSpace;textura.wrapS=textura.wrapT=THREE.RepeatWrapping;textura.repeat.set(1,20);
  const pavimento=new THREE.MeshStandardMaterial({color:0xe1dfd8,map:textura,roughness:.94});
  const bordaMat=new THREE.MeshStandardMaterial({color:0xd4d3c9,roughness:.92});
  const gramaMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
  const caminhoMat=new THREE.MeshStandardMaterial({color:0xc3bbaa,roughness:.96});
  const calcadas=new THREE.InstancedMesh(new THREE.BoxGeometry(4,.12,82),pavimento,1600);
  const meiosFios=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,.16,82),bordaMat,1600);
  const cantos=new THREE.InstancedMesh(new THREE.BoxGeometry(4,.10,4),bordaMat,1600);
  const jardins=new THREE.InstancedMesh(new THREE.BoxGeometry(12,.035,12),gramaMat,400);
  const caminhos=new THREE.InstancedMesh(new THREE.BoxGeometry(1.35,.045,12.1),caminhoMat,800);
  calcadas.name='CalcadasUrbanas';jardins.name='GramadosUrbanos';
  const matriz=new THREE.Matrix4(),rotacao=new THREE.Quaternion(),escala=new THREE.Vector3(1,1,1),eixo=new THREE.Vector3(0,1,0),pos=new THREE.Vector3();let n=0,j=0,c=0;
  const por=(o,i,x,y,z,ry=0)=>{rotacao.setFromAxisAngle(eixo,ry);matriz.compose(pos.set(x,y,z),rotacao,escala);o.setMatrixAt(i,matriz);};
  for(let bx=-10;bx<10;bx++)for(let bz=-10;bz<10;bz++){
    const x=bx*100,z=bz*100;
    for(const [ox,oz,ry,fx,fz] of [[9,50,0,7.12,50],[91,50,0,92.88,50],[50,9,Math.PI/2,50,7.12],[50,91,Math.PI/2,50,92.88]]){
      por(calcadas,n,x+ox,.07,z+oz,ry);por(meiosFios,n++,x+fx,.08,z+fz,ry);
    }
    for(const ox of [9,91])for(const oz of [9,91])por(cantos,c++,x+ox,.06,z+oz);
    por(jardins,j,x+50,.018,z+50);jardins.setColorAt(j,new THREE.Color().setHSL(.29+((bx+bz+40)%3)*.008,.25,.35+((bx*7+bz+60)%4)*.015));
    por(caminhos,j*2,x+50,.023,z+50);por(caminhos,j*2+1,x+50,.023,z+50,Math.PI/2);j++;
  }
  for(const o of [calcadas,meiosFios,cantos,jardins,caminhos]){o.instanceMatrix.needsUpdate=true;o.receiveShadow=!fraco;o.castShadow=false;o.frustumCulled=false;scene.add(o);}
  jardins.instanceColor.needsUpdate=true;
  return {calcadas,meiosFios,cantos,jardins,caminhos};
}
