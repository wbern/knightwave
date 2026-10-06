import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Vector3} from '@babylonjs/core/Maths/math.vector';

// Turned chess silhouettes, built as real meshes to share lighting and shadows.
export function createCapturePiece(scene,parent,kind,porcelain,ink){
  const root=new TransformNode(`capture ${kind}`,scene);root.parent=parent;root.position.y=.06;
  const shape=[[0,0],[.89,0],[.96,.12],[.87,.23],[.66,.31],[.57,.44],[.35,1.15],[.43,1.45],[.58,1.51],[.58,1.63],[0,1.65]].map(([x,y])=>new Vector3(x,y,0));
  const body=MeshBuilder.CreateLathe(`${kind} turned body`,{shape,tessellation:32,cap:Mesh.CAP_ALL},scene);body.parent=root;body.material=porcelain;
  const ring=MeshBuilder.CreateTorus(`${kind} plinth inlay`,{diameter:1.82,thickness:.065,tessellation:32},scene);ring.position.y=.13;ring.parent=root;ring.material=ink;
  if(kind==='pawn'){
    const head=MeshBuilder.CreateSphere('pawn round head',{diameter:.85,segments:24},scene);head.position.y=1.99;head.parent=root;head.material=porcelain;
  }else if(kind==='rook'){
    const crown=MeshBuilder.CreateCylinder('rook tower',{height:.42,diameter:1.2,tessellation:32},scene);crown.position.y=1.84;crown.parent=root;crown.material=porcelain;
    for(let i=0;i<6;i++){
      const tooth=MeshBuilder.CreateBox('rook battlement',{width:.28,height:.32,depth:.29},scene);const a=i*Math.PI/3;tooth.position.set(Math.cos(a)*.46,2.17,Math.sin(a)*.46);tooth.rotation.y=-a;tooth.parent=root;tooth.material=porcelain;
    }
  }else{
    const cap=MeshBuilder.CreateSphere('bishop mitre',{diameter:.93,segments:24},scene);cap.position.y=2.05;cap.scaling.set(.85,1.4,.85);cap.parent=root;cap.material=porcelain;
    const slit=MeshBuilder.CreateBox('bishop diagonal cut',{width:.055,height:.60,depth:.77},scene);slit.position.set(.07,2.26,0);slit.rotation.z=-.42;slit.parent=root;slit.material=ink;
    const tip=MeshBuilder.CreateSphere('bishop finial',{diameter:.22,segments:12},scene);tip.position.y=2.78;tip.parent=root;tip.material=porcelain;
  }
  root.setEnabled(false);return root;
}
