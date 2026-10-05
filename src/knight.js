import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export function createKnight(scene,white,purple,mint){
// A slender porcelain chess knight, sculpted for every travel direction.
const knight=new TransformNode('knight',scene),spinner=new TransformNode('spin',scene);spinner.parent=knight;
const FORWARD_YAW=Math.PI/2;
// Sculpted elliptical sections give the horse a readable neck, muzzle and
// paired ears from the rear camera as well as from the side during a turn.
function sculpt(name,sections,axis){
  const sides=32,positions=[],indices=[];
  for(const [along,cx,cy,rx,ry] of sections)for(let i=0;i<sides;i++){
    const angle=i/sides*Math.PI*2;
    if(axis==='vertical')positions.push(cx+Math.cos(angle)*rx,along,cy+Math.sin(angle)*ry);
    else positions.push(along,cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry);
  }
  for(let row=0;row<sections.length-1;row++)for(let i=0;i<sides;i++){
    const a=row*sides+i,b=row*sides+(i+1)%sides,c=a+sides,d=b+sides;
    indices.push(a,b,c,b,d,c);
  }
  for(const row of [0,sections.length-1])for(let i=1;i<sides-1;i++){
    if(row===0)indices.push(row*sides,row*sides+i+1,row*sides+i);
    else indices.push(row*sides,row*sides+i,row*sides+i+1);
  }
  const normals=[];VertexData.ComputeNormals(positions,indices,normals);
  const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;
  const mesh=new Mesh(name,scene);data.applyToMesh(mesh);mesh.material=white;mesh.parent=spinner;return mesh;
}
const neckSections=[[.65,0,0,.53,.48],[.9,.02,0,.50,.43],[1.25,.08,0,.43,.34],[1.65,.08,0,.36,.29],[2.0,-.03,0,.33,.31],[2.3,-.20,0,.30,.36],[2.55,-.25,0,.27,.37],[2.8,-.22,0,.23,.30],[2.96,-.22,0,.16,.22]];
sculpt('carved chess knight neck',neckSections,'vertical');
sculpt('sculpted horse muzzle',[[.15,2.78,0,.23,.28],[-.08,2.82,0,.36,.40],[-.38,2.73,0,.30,.38],[-.68,2.55,0,.22,.32],[-1.0,2.43,0,.17,.28],[-1.10,2.43,0,.12,.21]],'horizontal');
const manePath=neckSections.slice(1).map(([y,x,z,rx])=>new Vector3(x+rx-.015,y,z));
const mane=MeshBuilder.CreateTube('carved purple mane',{path:manePath,radius:.085,tessellation:12},scene);mane.material=purple;mane.parent=spinner;
for(const side of [-1,1]){
  const ear=MeshBuilder.CreateCylinder('pointed horse ear',{height:.48,diameterBottom:.27,diameterTop:.035,tessellation:12},scene);ear.parent=spinner;ear.material=white;ear.position.set(-.12,3.17,side*.25);ear.rotation.z=.18;ear.rotation.x=side*.16;
  const eye=MeshBuilder.CreateSphere('onyx eye',{diameter:.12,segments:16},scene);eye.parent=spinner;eye.material=purple;eye.scaling.z=.4;eye.position.set(-.4,2.83,side*.365);
  const nostril=MeshBuilder.CreateSphere('carved nostril',{diameter:.065,segments:12},scene);nostril.parent=spinner;nostril.material=purple;nostril.scaling.z=.4;nostril.position.set(-1.0,2.48,side*.27);
}
// Turned, stepped pedestal and collars make the silhouette unmistakably chess.
const profile=[[0,0],[1.02,0],[1.06,.10],[1.02,.18],[.86,.21],[.86,.30],[.68,.37],[.61,.48],[.62,.55],[.77,.57],[.77,.66],[.57,.71],[0,.71]].map(([r,y])=>new Vector3(r,y,0));
const base=MeshBuilder.CreateLathe('turned chess pedestal',{shape:profile,tessellation:64,cap:Mesh.CAP_ALL},scene);base.parent=spinner;base.material=white;
for(const [diameter,y] of [[2.05,.12],[1.55,.61]]){const ring=MeshBuilder.CreateTorus('pedestal inlay',{diameter,thickness:.055,tessellation:64},scene);ring.parent=spinner;ring.position.y=y;ring.material=purple;}
const baseRing=MeshBuilder.CreateTorus('plinth glow',{diameter:2.02,thickness:.045,tessellation:64},scene);baseRing.parent=spinner;baseRing.position.y=.035;baseRing.material=mint;
spinner.rotation.y=FORWARD_YAW;knight.scaling.setAll(1.38);
return {knight,spinner};
}
