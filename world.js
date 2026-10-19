/* =========================================================
   AeroBMSCE — site-wide 3D background ("the sky")

   One fixed, full-screen Three.js canvas sits behind every
   page: drifting gold dust, wind streaks that speed up while
   you scroll, and a runway grid that slides underneath.
   The camera climbs as you scroll, so the whole page feels
   like one continuous flight. It is deliberately light:
   no post-processing, capped pixel ratio, paused when hidden.
   ========================================================= */

import * as THREE from "three";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

// Round, soft-edged sprite for the dust particles
function dotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function createWorld() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.domElement.className = "world-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0a09, 8, 34);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  camera.position.set(0, 0, 8);

  /* --- gold dust --- */
  const DUST = 900;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 40;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    dustPos[i * 3 + 2] = -Math.random() * 30 + 4;
    dustSeed[i] = Math.random() * Math.PI * 2;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    size: 0.09,
    map: dotTexture(),
    color: 0xe8b955,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  }));
  scene.add(dust);

  /* --- wind streaks --- */
  const STREAKS = 160;
  const streakPos = new Float32Array(STREAKS * 6);
  const streakCol = new Float32Array(STREAKS * 6);
  const streaks = [];
  const warm = new THREE.Color(0xffd98a);
  const cool = new THREE.Color(0xbfd0ff);

  function resetStreak(i, anywhere) {
    const s = streaks[i] || (streaks[i] = {});
    s.x = anywhere ? (Math.random() - 0.5) * 40 : 20 + Math.random() * 10;
    s.y = (Math.random() - 0.5) * 30;
    s.z = -Math.random() * 20;
    s.speed = 3 + Math.random() * 6;
    const c = Math.random() < 0.7 ? warm : cool;
    const b = 0.15 + Math.random() * 0.45;
    streakCol.set([c.r * b, c.g * b, c.b * b, 0, 0, 0], i * 6);
  }
  for (let i = 0; i < STREAKS; i++) resetStreak(i, true);

  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakPos, 3));
  streakGeometry.setAttribute("color", new THREE.BufferAttribute(streakCol, 3));
  scene.add(new THREE.LineSegments(streakGeometry, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  /* --- runway grid floor --- */
  const grid = new THREE.GridHelper(120, 160, 0xe0a019, 0xe0a019);
  grid.material.transparent = true;
  grid.material.opacity = 0.05;
  grid.position.y = -4;
  scene.add(grid);

  /* --- input --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let lastScroll = window.scrollY;
  let boost = 0;

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  let running = false;

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const motion = reduceMotion ? 0 : 1;

    // scroll: the camera climbs; scroll speed pushes the streaks
    const delta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    boost += (Math.min(Math.abs(delta) * 0.25, 8) - boost) * 0.08;
    const climb = window.scrollY * 0.0035;

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    camera.position.x = pointer.x * 0.6;
    camera.position.y = -climb * 0.35 - pointer.y * 0.4;
    camera.lookAt(0, camera.position.y - 0.6, -10);

    // dust drifts gently and wraps vertically around the camera
    for (let i = 0; i < DUST; i++) {
      const k = i * 3;
      dustPos[k] -= dt * (0.15 + boost * 0.4) * motion;
      dustPos[k + 1] += Math.sin(t * 0.3 + dustSeed[i]) * 0.002 * motion;
      if (dustPos[k] < -20) dustPos[k] = 20;
      const rel = dustPos[k + 1] - camera.position.y;
      if (rel > 30) dustPos[k + 1] -= 60;
      if (rel < -30) dustPos[k + 1] += 60;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < STREAKS; i++) {
      const s = streaks[i];
      s.x -= s.speed * dt * (1 + boost) * motion;
      if (s.x < -20) resetStreak(i, false);
      const y = s.y + camera.position.y;
      const len = 0.4 + s.speed * 0.1 * (1 + boost * 0.4);
      streakPos.set([s.x, y, s.z, s.x + len, y, s.z], i * 6);
    }
    streakGeometry.attributes.position.needsUpdate = true;

    grid.position.y = camera.position.y - 4;
    grid.position.z = ((t * 1.5 * (1 + boost)) % 0.75) * motion;

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    render();
  }
  function start() {
    if (running || document.hidden) return;
    running = true;
    clock.getDelta();
    loop();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else start();
  });

  document.documentElement.classList.add("has-world");
  render();
  start();
}

if (hasWebGL()) createWorld();
