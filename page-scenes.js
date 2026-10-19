import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMaterials, emblem, turbine, drone, flight, satellite } from './aerospace-models.js';

// Every [data-scene] on the page gets its own model: the hero study plus any
// inline "stages" placed further down the page.
document.querySelectorAll('[data-scene]').forEach(host => mount(host).catch(error => {
  host.classList.remove('scene-ready');
  host.querySelector('canvas')?.remove();
  const toggle = host.querySelector('.scene-toggle');
  if (toggle) toggle.hidden = true;
  console.warn('Showing static artwork: 3D scene unavailable.', error);
}));

async function mount(host) {
  const kind = host.dataset.scene;
  const isHeroStage = !!host.closest('.page-hero');
  const materials = createMaterials();
  const study = await ({index:emblem, about:turbine, build:drone, achievements:flight, partners:satellite}[kind])(materials);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new THREE.Scene();
  const environment = new RoomEnvironment();
  if (kind === 'index') {
    const softbox = new THREE.Mesh(new THREE.PlaneGeometry(3, 8), new THREE.MeshBasicMaterial({color:new THREE.Color(3, 3, 3)}));
    softbox.position.set(-2, 1, 6); softbox.lookAt(0, 0, 0); environment.add(softbox);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(environment, .04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 1.1;
  environment.dispose(); pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(34,1,.1,80);
  const isLogo = kind === 'index';
  const view = isLogo ? new THREE.Vector3(0,.2,12) : kind === 'about' ? new THREE.Vector3(.5,.6,10) : new THREE.Vector3(5,4.4,8);
  camera.position.copy(view);camera.lookAt(0,0,0);
  const rig = new THREE.Group();scene.add(rig);rig.add(study.root);
  const key = new THREE.DirectionalLight(0xffecd4,2);key.position.set(-3,5,5);scene.add(key);
  const rim = new THREE.DirectionalLight(0xa9c8ef,2.5);rim.position.set(4,1,2);scene.add(rim);
  const edge = new THREE.DirectionalLight(0xe0a44c,2.5);edge.position.set(-4,-1,-2);scene.add(edge);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const button=host.querySelector('.scene-toggle');
  let paused=motion.matches,visible=true,frame=0,last=null,elapsed=0,disposed=false;
  let targetX=0,targetY=0;
  const offset=new THREE.Vector2();
  function render(now=0) {
    frame=0;
    if(last!==null&&!paused)elapsed+=Math.min((now-last)/1000,.05);
    last=now;
    study.update(elapsed);
    offset.lerp(new THREE.Vector2(targetX,targetY),.045);
    rig.rotation.y=offset.x*.22;rig.rotation.x=offset.y*.13;
    // A restrained turn from three-quarter to front on the logo's first appearance.
    if(isLogo&&!motion.matches){const intro=Math.exp(-elapsed*1.7);rig.rotation.y+=intro*-.48;rig.position.z=-intro*.5;}
    key.position.x=-3+Math.sin(elapsed*.22)*1.6;
    renderer.render(scene,camera);
    if(!paused&&visible&&!document.hidden&&!disposed)frame=requestAnimationFrame(render);
  }
  function resume(){cancelAnimationFrame(frame);last=null;if(visible&&!document.hidden&&!disposed)render();}
  function resize(){
    const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    // Match the model's apparent scale on portrait and landscape canvases.
    camera.position.copy(view).multiplyScalar(Math.max(1.15,1.18/camera.aspect));
    if(!isHeroStage)camera.position.multiplyScalar(1.3); // inline stages: leave room for the soft edge fade
    camera.lookAt(0,0,0);
    // The canvas spans the whole hero; reserve negative space for the copy.
    // Only hero canvases span the whole width and need room for the copy;
    // inline stages are framed centrally.
    const mobile = width <= 860;
    if (isHeroStage) camera.setViewOffset(width,height,mobile ? 0 : -width*.23,mobile ? height*.22 : 0,width,height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();resume();
  }
  function updateButton(){if(!button)return;button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));}
  button?.addEventListener('click',()=>{paused=!paused;updateButton();resume();});
  const onMotion=()=>{paused=motion.matches;updateButton();resume();};motion.addEventListener('change',onMotion);
  host.addEventListener('pointermove',event=>{if(paused)return;const r=host.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;});
  host.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});observer.observe(host);
  document.addEventListener('visibilitychange',resume);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();paused=true;cancelAnimationFrame(frame);host.classList.remove('scene-ready');if(button)button.hidden=true;renderer.domElement.hidden=true;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  function dispose(event){
    if(event.persisted)return;
    disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',resume);motion.removeEventListener('change',onMotion);
    const geometries=new Set(),mats=new Set(),textures=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material){for(const material of [].concat(object.material))mats.add(material);}});
    Object.values(materials).forEach(material=>mats.add(material));
    mats.forEach(material=>{Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value);});material.dispose();});
    textures.forEach(texture=>texture.dispose());geometries.forEach(geometry=>geometry.dispose());envTarget.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',dispose,{once:true});
  host.prepend(renderer.domElement);resize();host.classList.add('scene-ready');if(button)button.hidden=false;updateButton();
}
