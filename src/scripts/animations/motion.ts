import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

export const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/** True when the visitor asked for reduced motion: only fades allowed. */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(pointer: fine)').matches;
export const isMobile = () => innerWidth < 768;
/** Business Class and everything after it moves at half speed. */
export const pace = (el: Element) => (el.closest('[data-calm]') ? 2 : 1);
export const fmt = (v: number, d = 0) =>
  v.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d });

export let lenis: Lenis | null = null;

/** Lenis driven by GSAP's ticker so ScrollTrigger and smooth scroll share one clock. */
export function initScroll() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!reducedMotion()) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // in-page links glide there (and work the same from /#id links on the home page)
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || a.pathname !== location.pathname || !a.hash) return;
    const t = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    history.replaceState(null, '', a.hash);
  });
}

export function scrollToEl(el: Element | number) {
  const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + scrollY;
  lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

const fadeIn = (el: Element) =>
  gsap.from(el, { opacity: 0, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });

/** Count a [data-count] element up from 0 (1.6s, tabular nums), keeping its suffix. */
export function countUp(el: HTMLElement, delay = 0) {
  const to = +el.dataset.count!, d = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '', o = { v: 0 };
  el.textContent = fmt(0, d) + suf;
  return gsap.to(o, { v: to, duration: 1.6, delay, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v, d) + suf) });
}

/** Shared reveals: [data-split] titles, [data-reveal] blocks, [data-img] images, [data-count] numbers. */
export function initReveals() {
  const rm = reducedMotion();

  $$('[data-split]').forEach((el) => {
    if (rm) return fadeIn(el);
    const k = pace(el);
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'ln',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.25 * k,
          ease: 'expo.out',
          stagger: 0.08 * k,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });

  $$('[data-reveal]').forEach((el) => {
    if (rm) return fadeIn(el);
    const k = pace(el);
    // clearProps: hover effects may use translate afterwards
    gsap.from(el, { y: 40, opacity: 0, duration: 1.2 * k, ease: 'expo.out', clearProps: 'transform,translate,rotate,scale', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  $$('[data-img]').forEach((el) => {
    if (rm) return fadeIn(el);
    const k = pace(el);
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      .fromTo(el, { clipPath: 'inset(14% 10% 14% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3 * k, ease: 'expo.out' })
      .from($('img', el), { scale: 1.15, duration: 1.6 * k, ease: 'expo.out' }, 0);
  });

  $$('[data-count]').forEach((el) => {
    if (rm || el.closest('[data-count-manual]')) return;
    el.textContent = fmt(0, +(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => countUp(el) });
  });
}

/** Buttons that lean toward the pointer (desktop only). */
export function initMagnetic() {
  if (!finePointer() || reducedMotion()) return;
  $$('[data-magnetic]').forEach((b) => {
    const bx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * 0.25);
      by((e.clientY - r.top - r.height / 2) * 0.35);
    });
    b.addEventListener('pointerleave', () => (bx(0), by(0)));
  });
}

export { gsap, ScrollTrigger, SplitText };
