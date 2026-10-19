import * as THREE from 'three';

// Original procedural display models. Units are visual, not engineering dimensions.
export function createMaterials() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) {
    ctx.fillStyle = (x / 8 + y / 8) % 2 ? '#999' : '#555'; ctx.fillRect(x, y, 7, 7);
    ctx.fillStyle = '#777'; ctx.fillRect(x + 2, y, 1, 7);
  }
  const weave = new THREE.CanvasTexture(canvas); weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(3, 3);
  return {
    silver: new THREE.MeshPhysicalMaterial({ color: 0xb8c1c7, metalness: .95, roughness: .26, clearcoat: .25 }),
    pearl: new THREE.MeshPhysicalMaterial({ color: 0xe1e5e2, metalness: .45, roughness: .28, clearcoat: .8 }),
    gold: new THREE.MeshPhysicalMaterial({ color: 0xd69c39, metalness: 1, roughness: .24, clearcoat: .3 }),
    carbon: new THREE.MeshPhysicalMaterial({ color: 0x242a30, metalness: .65, roughness: .35, bumpMap: weave, bumpScale: .012, clearcoat: .5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x11151a, metalness: .65, roughness: .32 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x15333e, metalness: .75, roughness: .08, clearcoat: 1 }),
    blue: new THREE.MeshPhysicalMaterial({ color: 0x153a61, metalness: .8, roughness: .23, clearcoat: 1 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffc56a }),
  };
}
function mesh(parent, geometry, material, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geometry, material); m.position.set(x,y,z); parent.add(m); return m;
}
function cylinder(parent, material, r1, r2, height, x=0, y=0, z=0) {
  return mesh(parent, new THREE.CylinderGeometry(r1,r2,height,48),material,x,y,z);
}
function ring(parent, material, radius, tube, x=0,y=0,z=0) {
  return mesh(parent,new THREE.TorusGeometry(radius,tube,12,96),material,x,y,z);
}
function rounded(parent, material, width, depth, height, x=0,y=0,z=0) {
  const r=Math.min(width,depth)*.15, s=new THREE.Shape();
  s.moveTo(-width/2+r,-depth/2);s.lineTo(width/2-r,-depth/2);s.quadraticCurveTo(width/2,-depth/2,width/2,-depth/2+r);
  s.lineTo(width/2,depth/2-r);s.quadraticCurveTo(width/2,depth/2,width/2-r,depth/2);
  s.lineTo(-width/2+r,depth/2);s.quadraticCurveTo(-width/2,depth/2,-width/2,depth/2-r);
  s.lineTo(-width/2,-depth/2+r);s.quadraticCurveTo(-width/2,-depth/2,-width/2+r,-depth/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,curveSegments:8});
  g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);return mesh(parent,g,material,x,y,z);
}
function rod(parent,material,a,b,r=.035){
  const delta=b.clone().sub(a); const m=cylinder(parent,material,r,r,delta.length());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
}

export async function emblem(materials) {
  const response=await fetch('assets/logo-shape.json');if(!response.ok)throw Error('Logo outline unavailable');
  const data=await response.json(); const root=new THREE.Group();
  const graphite=materials.silver.clone();graphite.color.set(0x292e35);graphite.roughness=.22;
  for(const [key,mat,depth] of [['body',graphite,.19],['gold',materials.gold,.25]]) {
    const shapes=data[key].map(item=>{const s=new THREE.Shape(item.outer.map(p=>new THREE.Vector2(...p)));item.holes.forEach(h=>s.holes.push(new THREE.Path(h.map(p=>new THREE.Vector2(...p)))));return s;});
    const geo=new THREE.ExtrudeGeometry(shapes,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.008,bevelSegments:4,curveSegments:2});geo.translate(0,0,-depth/2);
    mesh(root,geo,mat);
  }
  root.scale.setScalar(3.35);
  return {root,update(t){root.rotation.set(-.1+Math.sin(t*.3)*.035,-.23+Math.sin(t*.26)*.23,-.045);root.position.y=Math.sin(t*.5)*.055;}};
}

export function turbine(m) {
  const root=new THREE.Group(), rotor=new THREE.Group();root.add(rotor);
  // Individually twisted swept blades with camber, assembled around the shaft.
  for(let i=0;i<24;i++) {
    const positions=[], indices=[];const rows=20,cols=8;
    for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++) {
      const u=j/rows,v=k/cols,r=.5+u*1.68;
      const angle=i/24*Math.PI*2+u*u*.34+(v-.5)*(.28-.08*u);
      positions.push(r*Math.cos(angle),r*Math.sin(angle),.12+Math.sin(v*Math.PI)*.12+(v-.5)*(.3+u*.7));
    }
    for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const mat=m.silver.clone();mat.side=THREE.DoubleSide;mesh(rotor,g,mat);
  }
  const cone=mesh(rotor,new THREE.LatheGeometry([new THREE.Vector2(0,1.05),new THREE.Vector2(.13,.95),new THREE.Vector2(.32,.68),new THREE.Vector2(.48,.2),new THREE.Vector2(.49,-.1)].reverse(),64),m.silver);cone.rotation.x=Math.PI/2;
  ring(root,m.carbon,2.29,.14,0,0,-.03);ring(root,m.silver,2.28,.035,0,0,.12);ring(root,m.gold,2.33,.022,0,0,.14);
  const shroud=mesh(root,new THREE.CylinderGeometry(2.29,2.29,.65,96,1,true),m.carbon,0,0,-.25);shroud.rotation.x=Math.PI/2;shroud.material=m.carbon.clone();shroud.material.side=THREE.DoubleSide;
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const bolt=cylinder(root,m.silver,.038,.038,.035,Math.cos(a)*2.29,Math.sin(a)*2.29,.15);bolt.rotation.x=Math.PI/2;}
  root.rotation.set(-.1,-.36,-.12);
  return {root,update(t){rotor.rotation.z=t*.19;root.rotation.y=-.36+Math.sin(t*.3)*.08;}};
}

export function drone(m) {
  const root=new THREE.Group(), props=[];
  rounded(root,m.carbon,1.15,1.75,.1);rounded(root,m.carbon,.95,1.55,.07,0,.38,0);
  rounded(root,m.black,.65,1.04,.33,0,.6,.08);
  for(const z of [-.3,.4])rounded(root,m.gold,.7,.08,.36,0,.6,z);
  // Standoffs, screws and separated electronics plates.
  for(const x of [-.43,.43])for(const z of [-.62,.62]) {
    cylinder(root,m.gold,.035,.035,.36,x,.19,z);cylinder(root,m.silver,.055,.055,.02,x,.44,z);
  }
  for(const sx of [-1,1])for(const sz of [-1,1]) {
    const x=sx*1.75,z=sz*1.6;
    rod(root,m.carbon,new THREE.Vector3(sx*.4,0,sz*.45),new THREE.Vector3(x,0,z),.095);
    rod(root,m.silver,new THREE.Vector3(sx*.4,.04,sz*.45),new THREE.Vector3(x,.04,z),.018);
    cylinder(root,m.black,.24,.24,.11,x,.06,z);
    cylinder(root,m.gold,.21,.21,.23,x,.22,z);
    cylinder(root,m.black,.2,.21,.04,x,.36,z);
    for(let j=0;j<12;j++){const a=j/12*Math.PI*2;rod(root,m.black,new THREE.Vector3(x+Math.cos(a)*.2,.16,z+Math.sin(a)*.2),new THREE.Vector3(x+Math.cos(a)*.2,.3,z+Math.sin(a)*.2),.016);}
    const prop=new THREE.Group();prop.position.set(x,.4,z);root.add(prop);props.push(prop);
    for(let j=0;j<3;j++) {
      const blade=new THREE.Shape();blade.moveTo(.07,-.04);blade.bezierCurveTo(.3,-.13,.85,-.17,1.05,-.07);blade.bezierCurveTo(1.12,0,.9,.12,.7,.12);blade.lineTo(.1,.045);
      const g=new THREE.ExtrudeGeometry(blade,{depth:.018,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2});g.rotateX(-Math.PI/2);
      const b=mesh(prop,g,m.carbon);b.rotation.y=j/3*Math.PI*2;
    }
    cylinder(prop,m.silver,.07,.07,.08,0,.035,0);
    rod(root,m.black,new THREE.Vector3(x*.8,-.08,z*.8),new THREE.Vector3(x*.88,-.48,z*.88),.04);
  }
  rounded(root,m.carbon,.5,.35,.4,0,.02,-.95);
  const lens=cylinder(root,m.silver,.16,.16,.16,0,.03,-1.18);lens.rotation.x=Math.PI/2;
  const glass=cylinder(root,m.glass,.125,.125,.015,0,.03,-1.27);glass.rotation.x=Math.PI/2;
  rod(root,m.black,new THREE.Vector3(0,.4,.7),new THREE.Vector3(.15,1.25,.95),.018);mesh(root,new THREE.SphereGeometry(.06,12,8),m.gold,.15,1.25,.95);
  root.rotation.set(.3,-.38,-.08);
  return {root,update(t){props.forEach((p,i)=>p.rotation.y=t*(i%2?-1:1)*2.1);root.position.y=Math.sin(t*.7)*.09;root.rotation.y=-.38+Math.sin(t*.25)*.12;}};
}

// Closed, tapered NACA-style wing surface, with a swept leading edge.
function wingGeometry(span,chord,sweep) {
  const pos=[], idx=[], rows=26, sections=40;
  for(let j=0;j<=rows;j++)for(let k=0;k<=sections;k++){
    const u=j/rows,a=k/sections*Math.PI*2,x=(1-Math.cos(a))/2,c=chord*(1-u*.68);
    const thickness=5*.12*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x*x*x-.1036*x*x*x*x);
    pos.push(u*span,Math.sign(Math.sin(a))*thickness*c+u*u*.1,(x-.28)*c+u*sweep);
  }
  for(let j=0;j<rows;j++)for(let k=0;k<sections;k++){const a=j*(sections+1)+k;idx.push(a,a+sections+1,a+1,a+1,a+sections+1,a+sections+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function aircraft(m) {
  const root=new THREE.Group();
  const body=mesh(root,new THREE.LatheGeometry([new THREE.Vector2(0,-2.7),new THREE.Vector2(.09,-2.5),new THREE.Vector2(.24,-1.9),new THREE.Vector2(.3,-.8),new THREE.Vector2(.25,.4),new THREE.Vector2(.15,1.6),new THREE.Vector2(.04,2.4),new THREE.Vector2(0,2.5)],64),m.pearl);body.rotation.x=Math.PI/2;
  for(const sign of [-1,1]) {
    const wing=mesh(root,wingGeometry(3.4,1.3,.7),m.pearl);wing.scale.x=sign;
    const tail=mesh(root,wingGeometry(1.1,.65,.4),m.carbon,0,.12,1.75);tail.scale.x=sign;
    const tip=mesh(root,wingGeometry(.28,.42,.04),m.gold,sign*3.35,.1,.75);tip.rotation.z=sign*1.1;tip.scale.x=sign;
    const seam=[];for(let i=0;i<=20;i++){const u=i/20;seam.push(new THREE.Vector3(sign*u*3.3,.035+u*u*.1,.62*1.3*(1-u*.68)+u*.7));}
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seam),new THREE.LineBasicMaterial({color:0x5f6870})));
  }
  const fin=mesh(root,wingGeometry(.95,.8,.4),m.carbon,0,.12,1.5);fin.rotation.z=Math.PI/2;
  const canopy=mesh(root,new THREE.SphereGeometry(1,40,24),m.glass,0,.2,-1);canopy.scale.set(.22,.21,.65);
  return root;
}
export function flight(m) {
  const root=new THREE.Group(),plane=aircraft(m);root.add(plane);plane.scale.setScalar(.78);plane.rotation.set(-.12,-.3,-.3);
  const trails=[];
  for(const side of [-1,1]) {
    const pts=[];for(let i=0;i<60;i++){const u=i/59;pts.push(new THREE.Vector3(side*2.62+u*u*.6,-.12-u*u*.3,.6+u*6));}
    const curve=new THREE.CatmullRomCurve3(pts);const trail=mesh(plane,new THREE.TubeGeometry(curve,60,.008,5,false),new THREE.MeshBasicMaterial({color:0xc2d4e3,transparent:true,opacity:.16}));trails.push(trail);
  }
  return {root,update(t){plane.rotation.z=-.3+Math.sin(t*.4)*.09;plane.rotation.y=-.3+Math.sin(t*.25)*.09;plane.position.y=Math.sin(t*.6)*.07;}};
}
export function satellite(m) {
  const root=new THREE.Group();
  rounded(root,m.gold,1.1,1.1,1.45);
  for(const y of [-.7,.7])rounded(root,m.silver,1.2,1.2,.06,0,y,0);
  for(const x of [-.55,.55])for(const z of [-.55,.55])rod(root,m.silver,new THREE.Vector3(x,-.75,z),new THREE.Vector3(x,.75,z),.035);
  for(const side of [-1,1]) {
    rod(root,m.silver,new THREE.Vector3(side*.5,0,0),new THREE.Vector3(side*3.3,0,0),.04);
    for(let panel=0;panel<2;panel++) {
      const x=side*(1.25+panel*1.2);rounded(root,m.silver,1.14,1.9,.045,x,0,0);
      for(let row=0;row<6;row++)for(let col=0;col<3;col++) {
        rounded(root,m.blue,.32,.275,.018,x+(col-1)*.35,.045,(row-2.5)*.3);
        rod(root,m.silver,new THREE.Vector3(x+(col-1)*.35-.12,.06,(row-2.5)*.3),new THREE.Vector3(x+(col-1)*.35+.12,.06,(row-2.5)*.3),.003);
      }
    }
  }
  const dish=new THREE.Group();dish.position.set(0,.95,0);dish.rotation.z=.3;root.add(dish);
  const points=[];for(let i=0;i<=24;i++){const r=i/24*.67;points.push(new THREE.Vector2(r,r*r*.48));}
  const dishMat=m.pearl.clone();dishMat.side=THREE.DoubleSide;mesh(dish,new THREE.LatheGeometry(points,64),dishMat);
  rod(dish,m.silver,new THREE.Vector3(0,0,0),new THREE.Vector3(0,.6,0),.025);mesh(dish,new THREE.SphereGeometry(.08,16,12),m.gold,0,.6,0);
  for(const x of [-.3,.3])cylinder(root,m.black,.07,.14,.22,x,-.85,0);
  root.rotation.set(.28,-.3,.13);
  return {root,update(t){root.rotation.y=-.3+t*.055;root.position.y=Math.sin(t*.45)*.06;}};
}
