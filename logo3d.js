/* =========================================================
   AeroBMSCE — 3D logo scene (Three.js)

   The eagle from images/logo.png was traced into vector
   outlines (assets/logo-shape.json). Here those outlines are
   extruded into a graphite-metal eagle with a raised gold
   dart, lit like a studio product shot and flown through a
   "wind tunnel" of light streaks.

   Usage: any element with data-logo3d="hero" or "mini".
   If WebGL is unavailable the element's fallback <img> stays.
   ========================================================= */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const SHAPE_URL = "assets/logo-shape.json";
const BG = 0x0b0a09;
const GOLD = 0xe0a019;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- helpers ---------- */

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

// JSON polygons -> THREE.Shape objects (with holes)
function toShapes(list) {
  return list.map((item) => {
    const shape = new THREE.Shape(item.outer.map(([x, y]) => new THREE.Vector2(x, y)));
    item.holes.forEach((hole) => {
      shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
    });
    return shape;
  });
}

function extrude(shapes, depth, bevel) {
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.6,
    bevelSegments: 5,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2); // centre on z = 0
  geometry.computeVertexNormals();
  return geometry;
}

// Soft warm glow painted on a canvas, used as a backdrop behind the eagle
function glowTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(224,160,25,0.55)");
  g.addColorStop(0.35, "rgba(224,160,25,0.14)");
  g.addColorStop(1, "rgba(224,160,25,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/* ---------- the scene ---------- */

function createScene(container, data) {
  const mode = container.getAttribute("data-logo3d"); // "hero" | "mini"
  const isHero = mode === "hero";

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "logo3d-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7, 22);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Studio reflections so the metal has something to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // Lights: warm key, gold + cool rims from behind, and a light that follows the cursor
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
  key.position.set(-3, 4, 5);
  const rimGold = new THREE.DirectionalLight(GOLD, 5);
  rimGold.position.set(-5, 2, -4);
  const rimCool = new THREE.DirectionalLight(0x9fb7ff, 3);
  rimCool.position.set(5, 1, -4);
  const cursorLight = new THREE.PointLight(0xffd27a, 6, 8, 1.6);
  cursorLight.position.set(0, 0, 2.5);
  scene.add(key, rimGold, rimCool, cursorLight);

  // Backdrop glow
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  glow.position.z = -3;
  scene.add(glow);

  /* --- the eagle --- */
  const eagle = new THREE.Group();     // animated by intro / scroll
  const tilt = new THREE.Group();      // animated by cursor + idle hover
  tilt.add(eagle);
  scene.add(tilt);

  const bodyGeometry = extrude(toShapes(data.body), 0.09, 0.025);
  const goldGeometry = extrude(toShapes(data.gold), 0.16, 0.025);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1f1d1a,
    metalness: 0.85,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: GOLD,
    metalness: 1,
    roughness: 0.2,
    emissive: 0x4a2c00,
    emissiveIntensity: 0.7,
    clearcoat: 0.6,
  });

  eagle.add(new THREE.Mesh(bodyGeometry, bodyMaterial));
  eagle.add(new THREE.Mesh(goldGeometry, goldMaterial));

  // Thin gold "blueprint" edges around the silhouette
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeometry, 40),
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.18 })
  );
  eagle.add(edges);

  /* --- wind-tunnel streaks --- */
  const STREAKS = isHero ? 420 : 160;
  const streakPos = new Float32Array(STREAKS * 6);
  const streakCol = new Float32Array(STREAKS * 6);
  const streakData = [];
  const head = new THREE.Color(0xffe2a0);
  const headCool = new THREE.Color(0xcfdcff);

  function resetStreak(i, anywhere) {
    const s = streakData[i] || (streakData[i] = {});
    s.z = -8 + Math.random() * 9;
    s.y = (Math.random() - 0.5) * 7;
    s.x = anywhere ? (Math.random() - 0.5) * 22 : 11 + Math.random() * 6;
    s.speed = 2 + Math.random() * 5;
    s.len = 0.3 + s.speed * 0.12;
    const c = Math.random() < 0.75 ? head : headCool;
    const b = 0.25 + Math.random() * 0.75;
    streakCol.set([c.r * b, c.g * b, c.b * b, 0, 0, 0], i * 6); // bright head, dark tail
  }
  for (let i = 0; i < STREAKS; i++) resetStreak(i, true);

  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute("position", new THREE.BufferAttribute(streakPos, 3));
  streakGeometry.setAttribute("color", new THREE.BufferAttribute(streakCol, 3));
  const streaks = new THREE.LineSegments(
    streakGeometry,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(streaks);

  /* --- moving runway grid (hero only) --- */
  let grid = null;
  if (isHero) {
    grid = new THREE.GridHelper(60, 120, GOLD, GOLD);
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = -2.1;
    scene.add(grid);
  }

  /* --- post-processing: subtle bloom on the gold --- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* --- layout: size + where the eagle sits --- */
  let width = 1;
  let height = 1;
  let baseX = 0;
  let baseY = 0;

  function layout() {
    width = container.clientWidth;
    height = container.clientHeight;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const narrow = width < 860;
    let logoWidth;

    if (isHero) {
      // keep the eagle in the upper part of the hero, clear of the headline
      logoWidth = narrow ? visW * 0.78 : Math.min(visW * 0.42, visH * 0.95, 2.9);
      baseX = 0;
      baseY = narrow ? visH * 0.31 : visH * 0.21;
    } else {
      logoWidth = narrow ? visW * 0.7 : Math.min(visW * 0.3, 2.3);
      baseX = narrow ? 0 : visW * 0.29;
      baseY = narrow ? visH * 0.3 : 0;
    }
    eagle.scale.setScalar(logoWidth / 2); // the traced logo is 2 units wide
    glow.position.set(baseX, baseY, -3);
    glow.scale.setScalar(Math.min(logoWidth / 2.9, 1)); // smaller eagle, smaller halo
  }

  /* --- input --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let lastScroll = window.scrollY;
  let scrollBoost = 0;

  // HUD readouts on the home hero (optional elements)
  const hud = {
    alt: document.querySelector('[data-hud="alt"]'),
    spd: document.querySelector('[data-hud="spd"]'),
    hdg: document.querySelector('[data-hud="hdg"]'),
  };

  /* --- animation loop --- */
  const clock = new THREE.Clock();
  let introStart = null;
  let running = false;
  let visible = true;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    render();
  }

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (introStart === null) introStart = t;
    const intro = reduceMotion ? 1 : easeOutExpo(clamp01((t - introStart) / 2.4));

    // smooth the pointer
    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);

    // scroll progress through this element (0 at top, 1 once scrolled past)
    const rect = container.getBoundingClientRect();
    const progress = clamp01(-rect.top / Math.max(rect.height, 1));
    const scrollDelta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    scrollBoost = lerp(scrollBoost, Math.min(Math.abs(scrollDelta) * 0.35, 12), 0.1);

    // intro: the eagle swoops in from the distance, banking
    eagle.position.set(baseX, baseY + (1 - intro) * -0.8, (1 - intro) * -6);
    eagle.rotation.set((1 - intro) * 0.9, (1 - intro) * -1.6, (1 - intro) * 0.5);

    // idle hover + cursor tilt
    const hover = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.05;
    tilt.position.y = hover;
    tilt.rotation.y = pointer.x * 0.38;
    tilt.rotation.x = pointer.y * 0.22 - 0.06;
    tilt.rotation.z = -pointer.x * 0.12 + (reduceMotion ? 0 : Math.sin(t * 0.5) * 0.035);

    // scroll: climb up and away out of the hero
    if (isHero) {
      eagle.position.y += progress * 2.4;
      eagle.position.z -= progress * 2.5;
      eagle.rotation.x -= progress * 0.7;
    }

    cursorLight.position.set(pointer.x * 3, -pointer.y * 2, 2.5);

    // streaks rush past; faster while scrolling
    const speedFactor = 1 + scrollBoost;
    for (let i = 0; i < STREAKS; i++) {
      const s = streakData[i];
      s.x -= s.speed * dt * speedFactor * (reduceMotion ? 0 : 1);
      if (s.x < -12) resetStreak(i, false);
      const len = s.len * (1 + scrollBoost * 0.25);
      streakPos.set([s.x, s.y, s.z, s.x + len, s.y, s.z], i * 6);
    }
    streakGeometry.attributes.position.needsUpdate = true;
    streakGeometry.attributes.color.needsUpdate = true;

    if (grid && !reduceMotion) {
      grid.position.z = (t * 1.2 * speedFactor) % 0.5;
    }

    composer.render();

    if (hud.alt) {
      const alt = Math.round(1200 + progress * 8800 + hover * 400);
      hud.alt.textContent = String(alt).padStart(5, "0");
      hud.spd.textContent = String(Math.round(140 + scrollBoost * 18 + pointer.x * 6)).padStart(3, "0");
      hud.hdg.textContent = String(Math.round((360 + pointer.x * 40) % 360)).padStart(3, "0");
    }
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    clock.getDelta();
    frame();
  }
  function stop() {
    running = false;
  }

  layout();
  new ResizeObserver(() => { layout(); if (!running) render(); }).observe(container);

  // Only animate while on screen and while the tab is visible
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }).observe(container);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  render();
  container.classList.add("logo3d-ready");
  if (!reduceMotion) start();
}

/* ---------- boot ---------- */

const targets = document.querySelectorAll("[data-logo3d]");
if (targets.length && hasWebGL()) {
  fetch(SHAPE_URL)
    .then((response) => response.json())
    .then((data) => targets.forEach((el) => createScene(el, data)))
    .catch(() => { /* keep the fallback image */ });
}
