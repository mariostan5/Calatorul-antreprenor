/* Home opening: the logo condenses out of warm clouds, the clouds part on the jet, and the logo
   lands in the nav. Resolves when the clouds part, so the first title can rise with the reveal. */
import { $, $$, gsap, reducedMotion } from './animations/motion';

export function startIntro(): Promise<void> {
  const intro = $('.intro')!, logo = $('.intro-logo')!;
  const navBits = $$('.nav-brand img, .nav-brand span, .nav-links a, .nav-cta');
  const showNav = () => gsap.to(navBits, { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.05 });

  // skipped when coming back from another page of the site
  let back = false;
  try { back = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* bad referrer */ }
  if (back) { intro.remove(); gsap.set(navBits, { opacity: 1 }); return Promise.resolve(); }

  return new Promise((done) => {
    if (reducedMotion()) {
      gsap.timeline({ onComplete: () => intro.remove() })
        .from('.intro-mark', { opacity: 0, duration: 0.8 })
        .to(intro, { opacity: 0, duration: 0.8 }, 1.4)
        .add(done, 1.6)
        .add(showNav, 1.6);
      return;
    }
    const nav = $('.nav-brand img')!;
    const toNav = (axis: 'x' | 'y') => () => {
      const a = logo.getBoundingClientRect(), b = nav.getBoundingClientRect();
      return axis === 'x' ? b.left + b.width / 2 - (a.left + a.width / 2) : b.top + b.height / 2 - (a.top + a.height / 2);
    };
    const tl = gsap.timeline({ onComplete: () => intro.remove() })
      .from(logo, { opacity: 0, scale: 0.78, filter: 'blur(18px)', duration: 1.5, ease: 'expo.out' }, 0.1)
      .from('.intro-name', { opacity: 0, y: 12, letterSpacing: '.7em', duration: 1.3, ease: 'expo.out' }, 0.4)
      .to('.intro-front.l', { xPercent: -14, duration: 2.4, ease: 'power2.out' }, 0)
      .to('.intro-front.r', { xPercent: 14, duration: 2.4, ease: 'power2.out' }, 0)
      .addLabel('out', 1.75)
      .set(intro, { pointerEvents: 'none' }, 'out')
      // the clouds part like flying out of them, revealing the jet
      .to('.intro-front.l', { xPercent: -90, scale: 1.8, opacity: 0, duration: 1, ease: 'power3.in' }, 'out')
      .to('.intro-front.r', { xPercent: 90, scale: 1.8, opacity: 0, duration: 1, ease: 'power3.in' }, 'out')
      .to('.intro-base, .intro-veil', { opacity: 0, scale: 1.4, duration: 1, ease: 'power2.inOut' }, 'out+=.1')
      .to('.intro-name', { opacity: 0, y: -8, duration: 0.4, ease: 'power2.in' }, 'out')
      .to(logo, { x: toNav('x'), y: toNav('y'), scale: () => nav.getBoundingClientRect().width / logo.offsetWidth, backgroundColor: '#F3EEE4', duration: 1, ease: 'power3.inOut' }, 'out')
      .set(logo, { opacity: 0 })
      .add(done, 'out+=.5')
      .add(showNav, 'out+=.85');
    // someone already scrolling or clicking doesn't wait for the show
    const hurry = () => tl.timeScale(3);
    addEventListener('wheel', hurry, { once: true, passive: true });
    addEventListener('pointerdown', hurry, { once: true });
    addEventListener('keydown', hurry, { once: true });
  });
}
