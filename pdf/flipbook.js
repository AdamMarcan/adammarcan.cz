/* ------------------------------------------------------------------
   3D listovací kniha (Three.js)

   const book = createFlipbook(container, {
     pages: ['p1.webp', 'p2.webp', …],   // URL obrázků stránek (i blob: URL)
     aspect: 1.286,                        // výška / šířka stránky
     onChange: ({ index, total, label, atStart, atEnd }) => {},
     onReady: () => {},
   });
   book.next(); book.prev(); book.go(n); book.destroy();

   Rozvržení: 1. stránka = přední deska, poslední = zadní deska,
   mezi nimi listy po dvou stranách.
------------------------------------------------------------------- */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const SEGMENTS = 30;          // počet kostí na šířku listu
const TURN_TIME = 0.95;       // s – délka otočení listu
const CURL = 0.028;           // ohyb na jednu kost (rad)
const STEP_DELAY = 0.11;      // s – rozestup při přeskakování více listů
const BOARD_T = 0.016;
const BOARD_OVER = 0.022;     // přesah desek přes stránky

const PAPER = new THREE.Color('#efe5d3');
const PAPER_EDGE = new THREE.Color('#e3d6bf');
const BOARD_EDGE = new THREE.Color('#3b2a1f');

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const damp = THREE.MathUtils.damp;

export function createFlipbook(container, { pages, aspect = 1.414, onChange = () => {}, onReady = () => {} }) {
  const PAGE_W = 1;
  const PAGE_H = aspect;
  const n = pages.length;

  /* --- rozdělení stránek na listy (indexy do pages, null = papír) --- */
  const defs = [{ front: 0, back: null, rigid: true }];
  for (let p = 1; p <= n - 2; p += 2) defs.push({ front: p, back: p + 1 <= n - 2 ? p + 1 : null });
  defs.push({ front: null, back: n >= 2 ? n - 1 : null, rigid: true });
  const N = defs.length;
  const PAGE_T = Math.min(0.003, 0.12 / Math.max(1, N - 2));

  /* --- renderer / scéna --- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight('#fff6ea', '#2a2420', 0.6));
  const sun = new THREE.DirectionalLight('#fff4e4', 2.1);
  sun.position.set(-1.6, 2.2, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const span = Math.max(2.2, PAGE_H * 1.6);
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.5, far: 12 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.015;
  scene.add(sun);

  const tilt = new THREE.Group();
  scene.add(tilt);
  const book = new THREE.Group();
  tilt.add(book);

  const totalThickness = defs.reduce((s, d) => s + (d.rigid ? BOARD_T : PAGE_T), 0);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.32 }));
  ground.position.z = -totalThickness - 0.03;
  ground.receiveShadow = true;
  tilt.add(ground);

  /* --- textury --- */
  let ready = false;
  const manager = new THREE.LoadingManager(() => { ready = true; onReady(); });
  const texLoader = new THREE.TextureLoader(manager);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const disposables = [envTex, pmrem];

  function pageMaterial(idx) {
    let mat;
    if (idx == null) {
      mat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.85 });
    } else {
      const map = texLoader.load(pages[idx]);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = maxAniso;
      disposables.push(map);
      mat = new THREE.MeshStandardMaterial({ map, roughness: 0.72, metalness: 0 });
    }
    disposables.push(mat);
    return mat;
  }

  /* --- list = SkinnedMesh s řetězem kostí podél šířky --- */
  function createLeaf(def) {
    const w = def.rigid ? PAGE_W + BOARD_OVER : PAGE_W;
    const h = def.rigid ? PAGE_H + BOARD_OVER * 2 : PAGE_H;
    const t = def.rigid ? BOARD_T : PAGE_T;

    const geo = new THREE.BoxGeometry(w, h, t, SEGMENTS, 2, 1);
    geo.translate(w / 2, 0, 0);
    const pos = geo.attributes.position;
    const segW = w / SEGMENTS;
    const skinIndex = [];
    const skinWeight = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const b = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(x / segW)));
      const f = THREE.MathUtils.clamp((x - b * segW) / segW, 0, 1);
      skinIndex.push(b, b + 1, 0, 0);
      skinWeight.push(1 - f, f, 0, 0);
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
    disposables.push(geo);

    const bones = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const bone = new THREE.Bone();
      bone.position.x = i === 0 ? 0 : segW;
      if (i > 0) bones[i - 1].add(bone);
      bones.push(bone);
    }

    const edge = new THREE.MeshStandardMaterial({ color: def.rigid ? BOARD_EDGE : PAPER_EDGE, roughness: 0.9 });
    disposables.push(edge);
    // skupiny BoxGeometry: +x, -x, +y, -y, +z (přední), -z (zadní)
    const mesh = new THREE.SkinnedMesh(geo, [edge, edge, edge, edge, pageMaterial(def.front), pageMaterial(def.back)]);
    mesh.add(bones[0]);
    const skeleton = new THREE.Skeleton(bones);
    mesh.bind(skeleton);
    disposables.push(skeleton);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    book.add(mesh);

    return { def, mesh, bones, t, progress: 0, dir: 1, z: 0 };
  }
  const leaves = defs.map(createLeaf);

  // přesná výška každého listu v obou hromádkách
  const prefix = [0];
  leaves.forEach((l, i) => prefix.push(prefix[i] + l.t));
  function stackZ(i, turned) {
    const right = -prefix[i] - leaves[i].t / 2;
    const left = -(Math.max(prefix[turned], prefix[i + 1]) - prefix[i + 1]) - leaves[i].t / 2;
    return { right, left };
  }

  /* --- stav --- */
  let current = 0;
  let goal = 0;
  let stepTimer = 0;

  function label(c) {
    if (c === 0) return 'Obálka';
    if (c === N) return 'Zadní strana';
    const nums = [defs[c - 1].back, defs[c].front].filter((x) => x != null).map((x) => x + 1);
    return nums.length ? `${nums.join('–')} / ${n}` : '';
  }
  function emit() {
    onChange({ index: goal, total: N, label: label(goal), atStart: goal === 0, atEnd: goal === N });
  }
  function go(target) {
    const g = THREE.MathUtils.clamp(Math.round(target), 0, N);
    if (g === goal) return;
    goal = g;
    emit();
  }
  const next = () => go(goal + 1);
  const prev = () => go(goal - 1);

  /* --- ovládání --- */
  const pointer = new THREE.Vector2();
  let down = null;
  const el = renderer.domElement;
  el.style.cursor = 'grab';
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; el.style.cursor = 'grabbing'; };
  const onUp = (e) => {
    el.style.cursor = 'grab';
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const r = el.getBoundingClientRect();
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
    else if (Math.hypot(dx, dy) < 8) (e.clientX - r.left > r.width / 2 ? next() : prev());
    down = null;
  };
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onKey = (e) => {
    if (e.target.closest && e.target.closest('input, textarea, button')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { next(); e.preventDefault(); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { prev(); e.preventDefault(); }
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(N);
  };
  el.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('keydown', onKey);

  /* --- kamera: kniha se vždy vejde do kontejneru --- */
  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const bookW = (PAGE_W + BOARD_OVER) * 2 * 1.12;
    const bookH = (PAGE_H + BOARD_OVER * 2) * 1.32;
    const dist = Math.max(bookH / 2 / Math.tan(fov / 2), bookW / 2 / (Math.tan(fov / 2) * camera.aspect));
    camera.position.set(0, -0.12 * PAGE_H, dist);
    camera.lookAt(0, 0.02, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* --- smyčka --- */
  const clock = new THREE.Clock();
  let raf = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 1 / 20);

    stepTimer -= dt;
    if (ready && current !== goal && stepTimer <= 0) {
      current += Math.sign(goal - current);
      stepTimer = current !== goal ? STEP_DELAY : 0;
    }

    for (let i = 0; i < N; i++) {
      const leaf = leaves[i];
      const target = i < current ? 1 : 0;
      if (leaf.progress !== target) {
        leaf.dir = Math.sign(target - leaf.progress);
        const delta = (dt / TURN_TIME) * leaf.dir;
        leaf.progress = leaf.dir > 0 ? Math.min(target, leaf.progress + delta) : Math.max(target, leaf.progress + delta);
      }
      const e = ease(leaf.progress);
      leaf.bones[0].rotation.y = -Math.PI * e;

      const bend = leaf.def.rigid ? 0 : Math.sin(Math.PI * e) * CURL * leaf.dir;
      for (let b = 1; b < leaf.bones.length; b++) {
        leaf.bones[b].rotation.y = bend * (1 - (b / leaf.bones.length) * 0.5);
      }

      const { right, left } = stackZ(i, current);
      leaf.z = damp(leaf.z, THREE.MathUtils.lerp(right, left, e), 10, dt);
      leaf.mesh.position.z = leaf.z;
    }

    const shift = current === 0 ? -PAGE_W / 2 : current === N ? PAGE_W / 2 : 0;
    book.position.x = damp(book.position.x, shift, 4, dt);
    tilt.rotation.y = damp(tilt.rotation.y, pointer.x * 0.07, 3, dt);
    tilt.rotation.x = damp(tilt.rotation.x, -0.22 + pointer.y * 0.05, 3, dt);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();
  emit();

  function destroy() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    el.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('keydown', onKey);
    disposables.forEach((d) => d.dispose && d.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    el.remove();
  }

  return { next, prev, go, first: () => go(0), last: () => go(N), destroy, get total() { return N; } };
}
