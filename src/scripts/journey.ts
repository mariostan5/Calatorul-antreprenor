/* The home page flight, in three.js, played like a film: a scroll (wheel, swipe, arrow keys) starts the
   footage towards the next stop and it runs on its own, forward, at film speed (a GSAP tween of the
   footage clock); going back cuts through a short fade. The frames play on a screen-filling plane mixed by
   a shader (frame blending, a door whose leaves slide open onto the next room, grain, vignette). In front:
   dust and one clickable marker per page; the community photos are a DepthCarousel (React Bits) on top. */
import * as THREE from 'three';
import { Observer } from 'gsap/Observer';
import { $, $$, gsap, SplitText, lenis, reducedMotion, finePointer } from './animations/motion';
import { createDepthCarousel } from './depth-carousel';

gsap.registerPlugin(Observer);

/* ---------- the footage: 24 fps frame sequences cut from the clips with ffmpeg (public/journey/<clip>/NNN.webp)
   every frame must be 1280×720: two textures swap images, and WebGL can't resize a texture in place ---------- */
const FPS = 24;
const CLIPS = [
  ['f', 192], // the jet turns to face you (letterbox cropped: ×1.098)
  ['g', 74], //  flying up to the windshield (letterbox cropped: ×1.30)
  ['i', 118], // through the glass, the panels part on the cabin
  ['c', 169], // walking down the aisle to the door
  ['l', 192], // the lounge, its door, the cinema lounge
] as const;
const OFF: Record<string, number> = {}, END_OF: number[] = [];
let total = 0;
const SRC = CLIPS.flatMap(([c, n]) => {
  OFF[c] = total; total += n;
  END_OF.push(total - 1);
  return Array.from({ length: n }, (_, i) => `/journey/${c}/${String(i + 1).padStart(3, '0')}.webp`);
});
/** frame `n` (1-based, as in the file name) of clip `c` */
const at = (c: string, n: number) => OFF[c] + n - 1;
const clipEnd = (i: number) => END_OF.find((e) => e >= i)!;
const clipStart = (i: number) => (END_OF.filter((e) => e < i).at(-1) ?? -1) + 1;
const LOOP = -1; // the hero: the jet side-on, a video loop

/* ---------- the path, on a clock in seconds of footage. play: frames run at 24 fps between two keys;
   blend: both shots keep running while one crossfades into the other (A's z/o morphs to az/ao so the
   jets line up); door: push in on the door, its leaves slide open. stop: a chapter rests there. ---------- */
type Move = 'play' | 'blend' | 'door';
type Key = { f: number; move?: Move; dur?: number; z?: number; o?: [number, number]; az?: number; ao?: [number, number]; door?: [number, number, number]; stop?: boolean; t?: number };
const KEYS: Key[] = [
  { f: LOOP, stop: true }, //                                                           I   the jet, side-on
  { f: at('f', 17), move: 'blend', dur: 0.7 }, //                                           it turns towards you (the loop's jet is lined up by LOOP_FIT)
  { f: at('f', 96), z: 1.1, o: [0.022, -0.066] }, //                                         facing you, cut before it drifts off
  { f: at('g', 7), move: 'blend', dur: 0.25 }, //                                            flying up to the nose
  { f: at('g', 74) },
  { f: at('i', 4), move: 'blend', dur: 0.15, z: 1.2995 }, //                                 through the glass
  { f: at('i', 40) },
  { f: at('i', 118), stop: true }, //                                                     II  the cabin: the community
  { f: at('c', 5), move: 'blend', dur: 0.2 },
  { f: at('c', 165) }, //                                                                    down the aisle to the door
  { f: at('l', 1), move: 'door', dur: 1.5, door: [0.475, 0.63, 1.55], stop: true }, //    III the lounge: the club
  { f: at('l', 100), stop: true }, //                                                     IV  by the next door: the academy
  { f: at('l', 108) },
  { f: at('l', 150), move: 'door', dur: 1.5, door: [0.496, 0.6, 2] },
  { f: at('l', 192), stop: true }, //                                                     V   the screen: destinations
];
// each key's time on the footage clock: plays take their frames at 24 fps, blends and doors their dur
KEYS.reduce((t, k, i) => (k.t = i === 0 ? 0 : t + ((k.move ?? 'play') === 'play' ? (k.f - KEYS[i - 1].f) / FPS : k.dur!)), 0);
const STOPS = KEYS.filter((k) => k.stop).map((k) => k.t!);
// the jet drifts within the hero loop, so where it must move to meet the turning shot depends on the
// loop's time: [loop second, zoom, shift y] fitted offline on the silhouettes (shift x is a steady -0.02)
const LOOP_FIT = [[0, 1.21, -0.09], [1, 1.18, -0.08], [2, 1.14, -0.08], [3, 1.16, -0.07], [4, 1.18, -0.07], [5, 1.2, -0.06], [6, 1.2, -0.06], [7, 1.21, -0.09]];
const loopFit = (s: number) => {
  const i = Math.min(LOOP_FIT.length - 2, Math.floor(s)), [t0, z0, y0] = LOOP_FIT[i], [, z1, y1] = LOOP_FIT[i + 1], k = Math.min(1, s - t0);
  return { z: lerp(z0, z1, k), o: [-0.02, lerp(y0, y1, k)] as [number, number] };
};
const GALLERY = 1;
// how long each hop between chapters plays on screen (seconds): the footage runs a little faster than life
const HOP = [6, 4, 2.2, 2.2];

// one clickable marker per chapter (the community has its photo carousel instead); `at` is a point on the 16:9 frame
const HOTS = [
  { ch: 2, at: [0.585, 0.66], href: '/club', tip: 'Descoperă clubul' },
  { ch: 3, at: [0.62, 0.84], href: '/business-class#academie', tip: 'Intră în Academie' },
  { ch: 4, at: [0.84, 0.3], href: '/destinatii', tip: 'Alege destinația' },
];
// the door you go through next: its hint shows on the last photo, and at the academy
const DOORS = [{ ch: 1, at: [0.503, 0.455] }, { ch: 3, at: [0.496, 0.39] }];

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */ `
  uniform sampler2D tA, tB;
  uniform float uMix, uMode, uZA, uZB, uTime;
  uniform vec2 uOA, uOB;
  uniform vec3 uDoor;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 place(vec2 uv, float z, vec2 o) { return (uv - 0.5 - o) / z + 0.5; }
  void main() {
    vec3 c;
    if (uMode > 1.5) {
      // the door: push in on it, then its two leaves slide apart onto the next room
      float k = smoothstep(0.0, 0.55, uMix), s = smoothstep(0.45, 1.0, uMix), h = 0.5 * s;
      vec2 ctr = mix(vec2(0.5), uDoor.xy, k), p = vUv;
      float z = mix(1.0, uDoor.z, k);
      bool leaf = true;
      if (p.x < 0.5 - h) p.x += h; else if (p.x > 0.5 + h) p.x -= h; else leaf = false;
      if (leaf) {
        c = texture2D(tA, ctr + (p - 0.5) / z).rgb;
        // the leaves' inner edges catch a shadow as they open
        float d = min(abs(vUv.x - (0.5 - h)), abs(vUv.x - (0.5 + h)));
        c *= mix(1.0, mix(0.6, 1.0, smoothstep(0.0, 0.05, d)), step(0.001, s));
      } else {
        c = texture2D(tB, (vUv - 0.5) / mix(1.12, 1.0, s) + 0.5).rgb;
      }
    } else {
      c = mix(texture2D(tA, place(vUv, uZA, uOA)).rgb, texture2D(tB, place(vUv, uZB, uOB)).rgb, uMix);
    }
    c *= mix(1.0, smoothstep(0.95, 0.25, length((vUv - 0.5) * vec2(1.25, 1.0))), 0.38);
    c += (hash(vUv * 1000.0 + fract(uTime) * 61.0) - 0.5) * 0.03;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
const glowTex = (inner: string, outer: string) => canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, inner); r.addColorStop(1, outer);
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
type Photo = { src: string; destination: string; caption: string };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function startJourney(introDone: Promise<void>) {
  const root = $('.xp')!, canvasEl = $<HTMLCanvasElement>('.xp-canvas')!;
  const chapters = $$('.ch'), inners = chapters.map((c) => $('.ch-inner', c)!);
  const rm = reducedMotion();
  const photos: Photo[] = JSON.parse(root.dataset.photos || '[]');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.replace('xp-on', 'no-xp');
    return;
  }
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  const D = 10; // the footage plane's distance

  /* ---------- the footage plane ---------- */
  const texA = new THREE.Texture(), texB = new THREE.Texture();
  for (const t of [texA, texB]) { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; }
  // the hero's jet plays as real video, so the clouds flow at full frame rate
  const video = Object.assign(document.createElement('video'), { src: '/hero/jet-loop.mp4', muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', width: 1280, height: 720 });
  video.play().catch(() => {});
  // a plain texture re-uploaded each frame (VideoTexture waits on frame callbacks a hidden tab never sends)
  const videoTex = new THREE.Texture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace; videoTex.minFilter = THREE.LinearFilter; videoTex.generateMipmaps = false;
  const uni = {
    tA: { value: texA as THREE.Texture }, tB: { value: texB as THREE.Texture }, uMix: { value: 0 }, uMode: { value: 0 },
    uZA: { value: 1 }, uZB: { value: 1 }, uOA: { value: new THREE.Vector2() }, uOB: { value: new THREE.Vector2() },
    uDoor: { value: new THREE.Vector3(0.5, 0.5, 1) }, uTime: { value: 0 },
  };
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG, depthWrite: false }));
  screen.position.z = -D;
  screen.renderOrder = -1;
  scene.add(screen);
  // the 16:9 frame's size in world units at distance D, covering the view (with room for the parallax)
  const frame = { w: 1, h: 1 };
  const onFrame = (u: number, v: number, depth = D) => new THREE.Vector3((u - 0.5) * frame.w, (0.5 - v) * frame.h, -D).multiplyScalar(depth / D);

  /* ---------- dust in the light ---------- */
  const dust = (() => {
    const n = 400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 9; pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5; pos[i * 3 + 2] = -1.5 - Math.random() * 7; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.03, map: glowTex('rgba(255,250,240,1)', 'rgba(255,250,240,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  })();
  scene.add(dust);

  /* ---------- the community photos: a depth carousel at the left of the cabin (the page owns the wheel:
     one scroll, one photo; after the last one the film goes on through the door) ---------- */
  const galleryBox = $('.xp-gallery')!;
  const carousel = createDepthCarousel($('.xp-gallery-carousel')!, {
    items: photos.map((p) => ({ image: p.src, alt: `${p.destination}: ${p.caption}` })),
    depth: 220, spread: 90, tilt: 22, tiltDirection: 'right', perspective: 1400, visibleCards: 4,
    falloff: 0.2, blur: 7, autoplay: true, loop: true, cardWidth: 270, wheel: false, label: 'Poze din comunitate',
  });
  carousel.setPaused(true);
  const lastPhoto = Math.max(0, carousel.count - 1);

  /* ---------- the markers ---------- */
  // a dark glass disc with a gold ring and a bright core: reads over any part of the picture
  const ringTex = canvasTex(256, 256, (g) => {
    g.fillStyle = 'rgba(4,11,31,.5)'; g.beginPath(); g.arc(128, 128, 100, 0, 6.3); g.fill();
    g.strokeStyle = '#D8C08A'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 100, 0, 6.3); g.stroke();
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 46);
    r.addColorStop(0, 'rgba(255,248,232,1)'); r.addColorStop(0.45, 'rgba(255,240,210,1)'); r.addColorStop(1, 'rgba(216,192,138,0)');
    g.fillStyle = r; g.beginPath(); g.arc(128, 128, 46, 0, 6.3); g.fill();
  });
  const pulseTex = canvasTex(256, 256, (g) => { g.strokeStyle = 'rgba(243,238,228,.95)'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 118, 0, 6.3); g.stroke(); });
  type Hot = { ch: number; at?: number[]; href: string; tip: string; group: THREE.Group; hit: THREE.Object3D[]; fade: number };
  const hots: Hot[] = HOTS.map((h) => {
    const group = new THREE.Group();
    const dot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false }));
    const pulse = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: pulseTex, transparent: true, depthWrite: false }));
    pulse.name = 'pulse';
    group.add(dot, pulse);
    group.visible = false;
    scene.add(group);
    return { ...h, group, hit: [dot], fade: 0 };
  });
  const place = () => {
    for (const h of hots) if (h.at) {
      h.group.position.copy(onFrame(h.at[0], h.at[1], D * 0.9));
      h.group.scale.setScalar(frame.w * 0.045 * 0.9);
    }
  };

  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    const vh = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect;
    const cover = Math.max(vw / 16, vh / 9) * 1.04;
    frame.w = 16 * cover; frame.h = 9 * cover;
    screen.scale.set(frame.w, frame.h, 1);
    place();
  };
  resize();
  addEventListener('resize', resize);

  /* ---------- loading, in the order of the flight ---------- */
  const imgs: (HTMLImageElement | null)[] = SRC.map(() => null);
  let queued = 0;
  const loadNext = () => {
    if (queued >= SRC.length) return;
    const i = queued++, img = new Image();
    // onload, not awaiting decode(): decode() can stall while the tab is in the background
    img.onload = () => { imgs[i] = img; img.decode().catch(() => {}); loadNext(); };
    img.onerror = loadNext;
    img.src = SRC[i];
  };
  for (let k = 0; k < 6; k++) loadNext();
  const nearest = (i: number) => {
    for (let d = 0; d < SRC.length; d++) { if (imgs[i - d]) return imgs[i - d]; if (imgs[i + d]) return imgs[i + d]; }
    return null;
  };
  const show = (t: THREE.Texture, i: number) => {
    const img = nearest(Math.round(i));
    if (img && t.image !== img) { t.image = img; t.needsUpdate = true; }
    return t;
  };
  const source = (t: THREE.Texture, f: number) => (f === LOOP ? videoTex : show(t, f));

  /** What the screen shows at footage time `time`. */
  const view = (time: number, now: number) => {
    let k = 0;
    while (k < KEYS.length - 2 && time > KEYS[k + 1].t!) k++;
    const A = KEYS[k], B = KEYS[k + 1], t = clamp01((time - A.t!) / (B.t! - A.t!)), move = B.move ?? 'play';
    const breathe = 1 + 0.006 * Math.sin(now * 0.35);
    const za = A.z ?? 1, oa = A.o ?? [0, 0], zb = B.z ?? 1, ob = B.o ?? [0, 0];
    uni.uMode.value = move === 'door' ? 2 : 0;
    if (move === 'play') {
      // neighbouring frames blended by the fraction; the placement eases from key to key
      const f = lerp(A.f, B.f, t), i = Math.floor(f), z = lerp(za, zb, t) * breathe;
      uni.tA.value = source(texA, i); uni.tB.value = source(texB, Math.min(i + 1, B.f));
      uni.uMix.value = f - i;
      uni.uZA.value = uni.uZB.value = z;
      uni.uOA.value.set(lerp(oa[0], ob[0], t), lerp(oa[1], ob[1], t)); uni.uOB.value.copy(uni.uOA.value);
      return;
    }
    // blend and door: both shots keep running (A on from its key, B up to its key) while one becomes the other
    const run = (B.dur ?? 0) * FPS;
    const fa = A.f === LOOP || move === 'door' ? A.f : Math.min(A.f + t * run, clipEnd(A.f));
    const fb = move === 'door' ? B.f : Math.max(B.f - (1 - t) * run, clipStart(B.f));
    uni.tA.value = source(texA, fa); uni.tB.value = source(texB, fb);
    uni.uMix.value = move === 'door' ? t : t * t * (3 - 2 * t);
    const fit = A.f === LOOP ? loopFit(video.currentTime) : null;
    const az = fit?.z ?? B.az ?? za, ao = fit?.o ?? B.ao ?? oa;
    uni.uZA.value = lerp(za, az, t) * breathe; uni.uOA.value.set(lerp(oa[0], ao[0], t), lerp(oa[1], ao[1], t));
    uni.uZB.value = zb * breathe; uni.uOB.value.set(ob[0], ob[1]);
    if (B.door) uni.uDoor.value.set(...B.door);
  };

  /* ---------- chapter titles: lines rise when a chapter arrives ---------- */
  const splits = inners.map((el) => SplitText.create($$('.ch-line', el), { type: 'lines', mask: 'lines', linesClass: 'ln' }));
  gsap.set(inners, { autoAlpha: 0 });
  let shown = -1;
  const showTitle = (i: number) => {
    if (i === shown) return;
    if (shown >= 0) gsap.to(inners[shown], { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power3.in', overwrite: true });
    shown = i;
    root.dataset.chapter = String(i);
    root.dataset.align = chapters[i]?.dataset.align ?? '';
    if (i < 0) return;
    const el = inners[i];
    gsap.set(el, { autoAlpha: 1, y: 0, overwrite: true });
    if (rm) gsap.from(el, { opacity: 0, duration: 0.8 });
    else gsap.timeline()
      .from(splits[i].lines, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.08 })
      .from($$('.ch-kicker, .ch-sub, .ch-actions', el), { opacity: 0, y: 18, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0.25);
  };

  /* ---------- the film: where we are, and moving on ---------- */
  const clock = { t: 0 }; //  the footage time on screen
  let index = 0, busy = false, inFooter = false, hop: gsap.core.Tween | null = null, introOver = false;
  introDone.then(() => { introOver = true; if (!busy) showTitle(index); });

  // forward: the footage runs from this stop to the next, on its own
  const advance = () => {
    if (index === GALLERY && carousel.index < lastPhoto) { carousel.navigateBy(1); return; }
    if (index >= STOPS.length - 1) { toFooter(); return; }
    const to = index + 1;
    busy = true;
    showTitle(-1);
    if (rm) { cut(to); return; }
    hop = gsap.to(clock, {
      t: STOPS[to], duration: HOP[index], ease: 'sine.inOut',
      onUpdate() { if (this.progress() > 0.9) showTitle(to); },
      onComplete: () => { index = to; busy = false; hop = null; showTitle(to); },
    });
  };
  // back: a short fade to the previous stop (the film never plays backwards)
  const retreat = () => {
    if (index === GALLERY && carousel.index > 0) { carousel.navigateBy(-1); return; }
    if (index > 0) cut(index - 1);
  };
  const veil = $('.xp-veil')!;
  function cut(to: number) {
    busy = true;
    showTitle(-1);
    gsap.timeline({ onComplete: () => { index = to; busy = false; showTitle(to); } })
      .to(veil, { autoAlpha: 1, duration: 0.35, ease: 'power2.in' })
      .add(() => { clock.t = STOPS[to]; if (to === GALLERY) carousel.setFocus(to < index ? lastPhoto : 0, false); })
      .to(veil, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '+=0.05');
  }
  // past the last stop the page scrolls on to the footer; scrolling back to the top returns to the film
  const footerAt = () => $('.chapters')!.offsetHeight;
  function toFooter() {
    inFooter = true;
    document.documentElement.classList.remove('xp-lock');
    input.disable();
    lenis?.start();
    lenis ? lenis.scrollTo(footerAt(), { duration: 1.4 }) : scrollTo({ top: footerAt(), behavior: rm ? 'auto' : 'smooth' });
  }
  addEventListener('wheel', (e) => {
    if (inFooter && scrollY <= 2 && e.deltaY < 0) { inFooter = false; lenis?.stop(); input.enable(); document.documentElement.classList.add('xp-lock'); }
  }, { passive: true });

  const next = () => { if (inFooter || !introOver) return; if (busy) { hop?.timeScale(2.5); return; } advance(); };
  const prev = () => { if (inFooter || busy || !introOver) return; retreat(); };
  lenis?.stop();
  document.documentElement.classList.add('xp-lock');
  const input = Observer.create({
    target: window, type: 'wheel,touch', wheelSpeed: -1, tolerance: 12, preventDefault: true,
    onUp: next, onDown: prev,
  });
  addEventListener('keydown', (e) => {
    if (inFooter || (e.target as Element).closest?.('input, textarea')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
  });
  $$('[data-go]').forEach((b) => b.addEventListener('click', next));
  // a link to a chapter (/#club) lands straight on it
  const fromHash = chapters.findIndex((c) => '#' + c.id === location.hash);
  if (fromHash > 0) { index = fromHash; clock.t = STOPS[fromHash]; }

  /* ---------- the hint at the next door ---------- */
  const hint = $('.xp-door')!, hintName = $('b', hint)!;
  const toScreen = (v: THREE.Vector3) => { v.project(camera); return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight]; };

  /* ---------- pointer: a little parallax, and the clickable things ---------- */
  const mouse = new THREE.Vector2(), look = new THREE.Vector2(), ray = new THREE.Raycaster();
  let hovered: { h: Hot; obj: THREE.Object3D } | null = null, flying = false, pointed = false;
  const tip = $('.xp-tip')!;
  addEventListener('pointermove', (e) => {
    pointed = true;
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    tip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`;
  });
  canvasEl.addEventListener('click', () => hovered && board(hovered.h, hovered.obj));
  $$<HTMLAnchorElement>('.ch-actions a').forEach((a) => {
    const h = hots.find((x) => x.href === a.getAttribute('href'));
    if (h) a.addEventListener('click', (e) => { e.preventDefault(); board(h, h.hit[0]); });
  });

  // the camera closes in on the thing, then its page opens
  function board(h: Hot, obj: THREE.Object3D) {
    if (flying) return;
    flying = true;
    input.disable();
    const go = () => (location.href = h.href);
    if (rm) { gsap.to('.xp-exit', { autoAlpha: 1, duration: 0.5, onComplete: go }); return; }
    const p = obj.getWorldPosition(new THREE.Vector3()), aim = new THREE.Vector3(look.x * 0.15, look.y * 0.1, -D);
    const o = { fov: camera.fov, k: 0 };
    tip.classList.remove('on'); hint.classList.remove('on');
    gsap.timeline({ onComplete: go })
      .to(inners[shown] ?? {}, { autoAlpha: 0, duration: 0.4 }, 0)
      .to(o, {
        fov: 14, k: 1, duration: 1.5, ease: 'power3.inOut',
        onUpdate: () => { camera.fov = o.fov; camera.updateProjectionMatrix(); camera.lookAt(aim.clone().lerp(p, o.k)); },
      }, 0)
      .to('.xp-exit', { autoAlpha: 1, duration: 0.55, ease: 'power2.in' }, 1.1);
  }

  /* ---------- the loop ---------- */
  const clk = new THREE.Clock();
  let ready = false;
  const frameLoop = () => {
    const dt = Math.min(clk.getDelta(), 0.05), now = clk.elapsedTime;
    uni.uTime.value = now;
    const hero = clock.t < KEYS[1].t!;
    // the hero video only plays while you can see it
    if (hero && video.paused) video.play().catch(() => {}); else if (!hero && !video.paused) video.pause();
    if (hero && video.readyState >= 2) videoTex.needsUpdate = true;
    const pos = dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { let y = pos.getY(i) + dt * 0.04; if (y > 2.8) y = -2.8; pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(now * 0.3 + i) * dt * 0.01); }
    pos.needsUpdate = true;
    if (!flying) {
      view(clock.t, now);
      (dust.material as THREE.PointsMaterial).opacity = 0.2 * clamp01((clock.t - STOPS[1] + 3) / 3);
      if (finePointer() && !rm) look.lerp(mouse, Math.min(1, dt * 2));
      camera.lookAt(look.x * 0.15, look.y * 0.1, -D);
      const at = busy ? -1 : index;

      // the carousel shows (and plays on its own) only while you are in the community
      const inGallery = at === GALLERY && introOver;
      if (galleryBox.classList.contains('on') !== inGallery) { galleryBox.classList.toggle('on', inGallery); carousel.setPaused(!inGallery); }

      // only the things of the chapter you are at show and answer the pointer
      let hit: typeof hovered = null;
      const cyc = (now * 0.6) % 1;
      for (const h of hots) {
        h.fade += ((h.ch === at && introOver ? 1 : 0) - h.fade) * Math.min(1, dt * 5);
        h.group.visible = h.fade > 0.01;
        h.group.children.forEach((o) => { ((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = h.fade * (o.name === 'pulse' ? 1 - cyc : 1); });
        h.group.getObjectByName('pulse')!.scale.setScalar(1 + cyc * 1.2);
        const sc = hovered?.h === h ? 1.3 : 1;
        h.group.children[0].scale.lerp(new THREE.Vector3(sc, sc, 1), Math.min(1, dt * 8));
        if (h.ch === at && pointed && finePointer()) {
          ray.setFromCamera(mouse, camera);
          const obj = ray.intersectObjects(h.hit.filter((o) => o.visible), false)[0]?.object;
          if (obj) hit = { h, obj };
        }
      }
      if (hit?.obj !== hovered?.obj) {
        hovered = hit;
        document.body.style.cursor = hit ? 'pointer' : '';
        tip.classList.toggle('on', !!hit);
        if (hit) tip.textContent = hit.h.tip;
      }

      // the hint sits on the door you go through next
      const door = DOORS.find((d) => d.ch === at && (at !== GALLERY || carousel.index === lastPhoto));
      hint.classList.toggle('on', !!door);
      if (door) {
        const [x, y] = toScreen(onFrame(door.at[0], door.at[1]));
        hint.style.transform = `translate(${x}px, ${y}px)`;
        hintName.textContent = chapters[door.ch + 1].dataset.name!;
      }
    }
    // nothing to draw once the footer covers the screen
    if (!inFooter || scrollY < innerHeight) renderer.render(scene, camera);
    if (!ready && video.readyState >= 2) { ready = true; root.classList.add('ready'); }
  };
  renderer.setAnimationLoop(frameLoop);
  setTimeout(() => root.classList.add('ready'), 4000);
  // dev only: render any footage time or chapter on demand (for checking views without input)
  if (import.meta.env.DEV) Object.assign(window, { __xp: { show(t: number) { clock.t = t; frameLoop(); }, stops: STOPS, keys: KEYS, carousel, imgs, hots, camera, video, next, prev, gsap, state: () => ({ index, busy, inFooter, t: clock.t, photo: carousel.index }) } });
}
