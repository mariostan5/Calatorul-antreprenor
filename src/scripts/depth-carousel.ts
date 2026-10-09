/* DepthCarousel from React Bits (JS + CSS variant), ported from its React component to plain DOM:
   same props and defaults, same layout maths, GSAP transitions, wheel, drag, keys, autoplay, controls.
   Added: `wheel` (false lets the page own the mouse wheel), `paused`, and Romanian aria labels. */
import { gsap } from 'gsap';
import './depth-carousel.css';

export type DepthItem = string | { image: string; alt?: string };
export type DepthOptions = {
  items?: DepthItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  wheel?: boolean;
  label?: string;
  onChange?: (index: number, item: { image: string; alt: string }) => void;
};

const DEFAULT_ITEMS = [1, 2, 3, 4, 5, 6].map((i) => ({ image: `https://picsum.photos/seed/depth${i}/800/1000`, alt: `Slide ${i}` }));
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeItem = (it: DepthItem) => (typeof it === 'string' ? { image: it, alt: '' } : { image: it.image, alt: it.alt ?? '' });
const arrow = (d: string) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createDepthCarousel(root: HTMLElement, opts: DepthOptions = {}) {
  const cfg = {
    cardWidth: 300, cardHeight: 380, radius: 18, tint: '#05060a', depth: 220, spread: 90, tilt: 22,
    tiltDirection: 'right' as 'left' | 'right', perspective: 1400, visibleCards: 4, falloff: 0.2, blur: 6,
    duration: 700, ease: 'power3.out', autoplay: false, autoplayDelay: 3200, loop: true,
    showControls: true, showIndicators: true, wheel: true, label: 'Depth carousel', ...opts,
  };
  const data = (Array.isArray(opts.items) ? opts.items : DEFAULT_ITEMS).map(normalizeItem);
  const count = data.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pos = 0, focus = 0, scale = 1, paused = false, dragged = false;
  let tween: gsap.core.Tween | null = null, wheelTimer = 0, autoTimer = 0;
  let drag: { x: number; startPos: number; lastX: number; lastT: number; v: number; moved: boolean; id: number } | null = null;

  /* ---------- markup ---------- */
  root.classList.add('depth-carousel');
  root.style.setProperty('--dc-perspective', `${cfg.perspective}px`);
  Object.assign(root, { role: 'group', tabIndex: 0 });
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', cfg.label);

  const stage = document.createElement('div');
  stage.className = 'depth-carousel__stage';
  root.append(stage);
  const overlays: HTMLElement[] = [];
  const cards = data.map((item, i) => {
    const card = document.createElement('div');
    card.className = 'depth-carousel__card';
    Object.assign(card.style, { width: `${cfg.cardWidth}px`, height: `${cfg.cardHeight}px`, borderRadius: `${cfg.radius}px` });
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${i + 1} din ${count}`);
    const img = Object.assign(document.createElement('img'), { className: 'depth-carousel__img', src: item.image, alt: item.alt, draggable: false });
    const tint = Object.assign(document.createElement('span'), { className: 'depth-carousel__tint' });
    tint.style.background = cfg.tint;
    card.append(img, tint);
    // a drag ends with a click on whatever card is under the pointer: that one doesn't count
    card.addEventListener('click', () => { if (dragged) { dragged = false; return; } setFocus(i, true); });
    stage.append(card);
    overlays.push(tint);
    return card;
  });

  if (cfg.showControls && count > 1) {
    for (const [cls, label, d, step] of [['prev', 'Poza anterioară', 'M15 5l-7 7 7 7', -1], ['next', 'Poza următoare', 'M9 5l7 7-7 7', 1]] as const) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: `depth-carousel__arrow depth-carousel__arrow--${cls}`, innerHTML: arrow(d) });
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => navigateBy(step));
      root.append(b);
    }
  }
  const dots: HTMLButtonElement[] = [];
  if (cfg.showIndicators && count > 1) {
    const wrap = document.createElement('div');
    wrap.className = 'depth-carousel__dots';
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Poze');
    data.forEach((_, i) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'depth-carousel__dot' });
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Mergi la poza ${i + 1}`);
      b.addEventListener('click', () => setFocus(i, true));
      wrap.append(b);
      dots.push(b);
    });
    root.append(wrap);
  }

  /* ---------- layout: each card's place along the depth rail at position `p` ---------- */
  const layout = (p: number) => {
    if (!count) return;
    const dir = cfg.tiltDirection === 'left' ? -1 : 1;
    for (let i = 0; i < count; i++) {
      const el = cards[i];
      let d = i - p;
      if (cfg.loop && count > 1) {
        d = ((d % count) + count) % count;
        if (d > count / 2) d -= count;
      }
      const back = Math.max(0, d);
      const shown = Math.abs(d) <= cfg.visibleCards + 0.5;
      const tz = -cfg.depth * d, tx = dir * cfg.spread * d, ry = dir * cfg.tilt * clamp(d, 0, 1);
      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;
      const brightness = Math.max(0.15, 1 - back * cfg.falloff);
      const blurPx = cfg.blur > 0 ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur) : 0;
      el.style.transform = `translate(-50%, -50%) scale(${scale}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(2000 - d * 20));
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';
      overlays[i].style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  };

  const markActive = (idx: number) => {
    cards.forEach((c, i) => c.setAttribute('aria-hidden', String(i !== idx)));
    dots.forEach((b, i) => { b.classList.toggle('is-active', i === idx); b.setAttribute('aria-selected', String(i === idx)); });
  };

  const tweenTo = (target: number, animate: boolean) => {
    tween?.kill();
    const proxy = { p: pos };
    tween = gsap.to(proxy, {
      p: target, duration: animate && !reduced ? cfg.duration / 1000 : 0, ease: cfg.ease,
      onUpdate: () => { pos = proxy.p; layout(proxy.p); },
      onComplete: () => { if (count > 0) pos = ((pos % count) + count) % count; layout(pos); },
    });
  };

  function setFocus(rawIndex: number, animate = true) {
    if (!count) return;
    const idx = cfg.loop ? ((rawIndex % count) + count) % count : clamp(rawIndex, 0, count - 1);
    let delta = idx - pos;
    if (cfg.loop && count > 1) {
      delta = ((delta % count) + count) % count;
      if (delta > count / 2) delta -= count;
    }
    tweenTo(pos + delta, animate);
    if (idx !== focus) {
      focus = idx;
      markActive(idx);
      opts.onChange?.(idx, data[idx]);
    }
  }
  const navigateBy = (step: number) => setFocus(focus + step, true);

  /* ---------- scale the stack down when its box is narrow ---------- */
  const ro = new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    scale = clamp(w / (cfg.cardWidth + Math.abs(cfg.spread) * 2 + 120), 0.4, 1);
    layout(pos);
  });
  ro.observe(root);

  /* ---------- wheel, drag, keys ---------- */
  const onWheel = (e: WheelEvent) => {
    if (count < 2) return;
    e.preventDefault();
    tween?.kill();
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const delta = e.deltaMode === 1 ? raw * 24 : raw;
    pos += clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6);
    layout(pos);
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => setFocus(Math.round(pos), true), 130);
  };
  if (cfg.wheel) root.addEventListener('wheel', onWheel, { passive: false });

  const stepPx = () => Math.max(cfg.cardWidth * 0.55 * scale, 40);
  root.addEventListener('pointerdown', (e) => {
    if (count < 2) return;
    tween?.kill();
    dragged = false;
    drag = { x: e.clientX, startPos: pos, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; root.setPointerCapture(drag.id); }
    if (!drag.moved) return;
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1);
    drag.lastX = e.clientX; drag.lastT = now;
    pos = drag.startPos - dx / stepPx();
    layout(pos);
  });
  const onPointerEnd = () => {
    const d = drag;
    if (!d) return;
    drag = null;
    dragged = d.moved;
    if (!d.moved) return;
    setFocus(Math.round(pos - (d.v * 180) / stepPx()), true);
  };
  root.addEventListener('pointerup', onPointerEnd);
  root.addEventListener('pointercancel', onPointerEnd);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigateBy(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navigateBy(1); }
  });

  /* ---------- autoplay, resting while hovered, focused or paused ---------- */
  if (cfg.autoplay && !reduced && count > 1) {
    let hovered = false, focused = false;
    root.addEventListener('mouseenter', () => (hovered = true));
    root.addEventListener('mouseleave', () => (hovered = false));
    root.addEventListener('focusin', () => (focused = true));
    root.addEventListener('focusout', () => (focused = false));
    autoTimer = window.setInterval(() => { if (!hovered && !focused && !paused) navigateBy(1); }, Math.max(cfg.autoplayDelay, 600));
  }

  markActive(0);
  layout(0);

  return {
    count,
    get index() { return focus; },
    navigateBy,
    setFocus,
    setPaused(v: boolean) { paused = v; },
    destroy() {
      tween?.kill(); clearTimeout(wheelTimer); clearInterval(autoTimer); ro.disconnect();
      if (cfg.wheel) root.removeEventListener('wheel', onWheel);
      root.replaceChildren();
    },
  };
}
