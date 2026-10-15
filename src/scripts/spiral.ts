/* The hero vortex (after getartcraft.com): photo and video cards drift slowly along a spiral out of the
   depth towards you, around the name, between thin coloured arcs. Pointing at a card brings the spiral to
   rest and grows that card in place, in front of the others, playing its clip; the others stay still frames.
   Clicking a card hands it and its place on screen to `onOpen` (the full-screen view). */
import * as THREE from 'three';
import { gsap, reducedMotion, finePointer } from './animations/motion';

export type SpiralItem = { kind: 'image' | 'video'; thumb: string; full: string; poster?: string; caption: string };

const FAR = -42, NEAR = 1; //   the cards travel from FAR to NEAR along the axis (camera at z = 6)
const R = 4.3; //               the spiral's radius
const TWIST = 0.11; //          radians of turn per unit of depth: the path is a helix
const CARD_W = 1.7, CARD_H = 1.06;
const SPEED = 0.8; //           units of depth per second: a slow drift
const GROW = 0.27; //           a card under the pointer grows to this share of the screen width, wherever it is
const BRAND = ['#FACC15', '#115089', '#2BA3A8', '#D9B88F', '#FACC15'];

/** A rounded-rectangle alpha mask, shared by every card. */
const roundMask = () => {
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 160 });
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 160);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(2, 2, 252, 156, 14); g.fill();
  return new THREE.CanvasTexture(c);
};
/** A card bent like a screen on the inside of the tunnel. */
const cardGeometry = () => {
  const g = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 1), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, -x * x * 0.12); }
  g.computeVertexNormals();
  return g;
};
/** Crop a texture to cover the card, like object-fit: cover. */
const cover = (t: THREE.Texture, w: number, h: number) => {
  const card = CARD_W / CARD_H, media = w / h;
  if (media > card) { t.repeat.set(card / media, 1); t.offset.set((1 - card / media) / 2, 0); }
  else { t.repeat.set(1, media / card); t.offset.set(0, (1 - media / card) / 2); }
};

export function startSpiral(canvas: HTMLCanvasElement, items: SpiralItem[], onOpen: (item: SpiralItem, from: DOMRect) => void) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch { return null; } // no WebGL: the hero keeps its text and buttons
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
  camera.position.z = 6;
  const rm = reducedMotion();

  /* ---------- the cards ---------- */
  const geo = cardGeometry(), mask = roundMask(), loader = new THREE.TextureLoader();
  const cards = items.map((item, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#E7E5E4', alphaMap: mask, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    if (item.kind === 'video') {
      const v = Object.assign(document.createElement('video'), { src: item.thumb, muted: true, loop: true, playsInline: true, preload: 'auto', width: 480, height: 270 });
      if (item.poster) v.poster = item.poster;
      const tex = new THREE.Texture(v);
      tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      cover(tex, 16, 9);
      v.addEventListener('loadeddata', () => { tex.needsUpdate = true; mat.map = tex; mat.color.set('#ffffff'); mat.needsUpdate = true; }, { once: true });
      mesh.userData.video = v; mesh.userData.tex = tex;
    } else {
      loader.load(item.thumb, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        cover(tex, (tex.image as HTMLImageElement).width, (tex.image as HTMLImageElement).height);
        mat.map = tex; mat.color.set('#ffffff'); mat.needsUpdate = true;
      });
    }
    // evenly spread in depth, a golden-angle apart around the spiral
    mesh.userData = { ...mesh.userData, item, phase: i / items.length, angle: i * 2.39996, hover: 0 };
    scene.add(mesh);
    return mesh;
  });

  /* ---------- the arcs: thin partial rings in the brand colours, turning slowly ---------- */
  const arcs = BRAND.map((color, i) => {
    const r = R * (1.02 + i * 0.07);
    const m = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.018, 160, 1, i * 1.3, Math.PI * (0.55 + (i % 3) * 0.25)),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    m.position.z = -6 - i * 7;
    m.userData.spin = (i % 2 ? -1 : 1) * (0.05 + i * 0.015);
    scene.add(m);
    return m;
  });

  /* ---------- size, pointer, visibility ---------- */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const mouse = new THREE.Vector2(-9, -9), look = new THREE.Vector2(), ray = new THREE.Raycaster();
  let hovered: THREE.Mesh | null = null, down = { x: 0, y: 0 };
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  canvas.addEventListener('pointerleave', () => mouse.set(-9, -9));
  canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener('click', (e) => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const hit = pick();
    if (hit) onOpen(hit.userData.item, screenRect(hit));
  });
  const pick = () => {
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(cards.filter((c) => c.visible && (c.material as THREE.MeshBasicMaterial).opacity > 0.3), false).map((h) => h.object as THREE.Mesh);
    // a grown card keeps the pointer while it is under it, even if another passes in front
    return hovered && hits.includes(hovered) ? hovered : hits[0] ?? null;
  };
  // the card's corners projected to the page: where the enlargement starts from
  const screenRect = (m: THREE.Mesh) => {
    const r = canvas.getBoundingClientRect(), pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) =>
      new THREE.Vector3((sx * CARD_W) / 2, (sy * CARD_H) / 2, 0).applyMatrix4(m.matrixWorld).project(camera));
    const xs = pts.map((p) => r.left + ((p.x + 1) / 2) * r.width), ys = pts.map((p) => r.top + ((1 - p.y) / 2) * r.height);
    return new DOMRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  };

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  // only the card under the pointer plays
  let playing: HTMLVideoElement | null = null;
  const playOnly = (v: HTMLVideoElement | null) => {
    if (v === playing) return;
    playing?.pause();
    playing = v;
    v?.play().catch(() => {});
  };

  /* ---------- the loop ---------- */
  const clock = { t: 0, speed: 1 };
  let paused = false; //  while a card is open
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    // pointing at a card slows everything down, so it can be caught
    hovered = finePointer() ? pick() : null;
    canvas.style.cursor = hovered ? 'pointer' : '';
    canvas.classList.toggle('hovering', !!hovered); // the page lifts the veil behind the words
    // a card under the pointer brings the spiral to rest
    clock.speed += ((hovered ? 0 : 1) - clock.speed) * Math.min(1, dt * 3);
    playOnly(visible && hovered ? (hovered.userData.video as HTMLVideoElement | undefined) ?? null : null);
    if (!rm && !paused) clock.t += dt * clock.speed;

    look.lerp(finePointer() ? mouse.clone().clampScalar(-1, 1) : new THREE.Vector2(), Math.min(1, dt * 2));
    camera.position.x = look.x * 0.5; camera.position.y = look.y * 0.35;
    camera.lookAt(0, 0, -24);

    const span = NEAR - FAR;
    for (const m of cards) {
      const u = m.userData;
      const z = FAR + (((u.phase * span + clock.t * SPEED) % span) + span) % span;
      const a = u.angle + z * TWIST + clock.t * 0.05;
      m.position.set(Math.cos(a) * R * 1.25, Math.sin(a) * R, z);
      m.rotation.set(0, -m.position.x * 0.06, 0);
      // the card under the pointer grows where it is and comes in front of the others
      u.hover += ((m === hovered ? 1 : 0) - u.hover) * Math.min(1, dt * 6);
      const h = u.hover * u.hover * (3 - 2 * u.hover);
      const across = 2 * (camera.position.z - z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      m.scale.setScalar(1 + h * (Math.max(1.6, (GROW * across) / CARD_W) - 1));
      m.position.z += h * 0.6;
      // fade in out of the far fog, out as it passes the lens
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.smoothstep(z, FAR, FAR + 12) * (1 - THREE.MathUtils.smoothstep(z, -1, NEAR));
      m.visible = mat.opacity > 0.01;
      m.renderOrder = u.hover > 0.01 ? 10000 : Math.round(z * 10);
      if (u.video === playing && m.visible && playing!.readyState >= 2) (u.tex as THREE.Texture).needsUpdate = true;
    }
    for (const a of arcs) a.rotation.z += a.userData.spin * dt * (rm || paused ? 0 : clock.speed);
    renderer.render(scene, camera);
  };
  gsap.ticker.add(() => frame(performance.now()));

  // dev only: look inside (for checking the hover without a real mouse)
  if (import.meta.env.DEV) Object.assign(window, { __spiral: { cards, camera, canvas, hovered: () => hovered, playing: () => playing, step: () => frame(performance.now()) } });
  return { pause: (p: boolean) => { paused = p; } };
}
