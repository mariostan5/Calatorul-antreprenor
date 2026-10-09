const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer:fine)').matches;
const fmt = (v, d = 0) => v.toLocaleString('ro-RO', {minimumFractionDigits:d, maximumFractionDigits:d});

/* ---------- content ---------- */
// [image, destination, place, period] in date order; dates from the Travorium World Tours list
const TOURS = [
  ['shanghai','Shanghai','China','7 – 13 Decembrie 2026'],
  ['dubai','Dubai','Emiratele Arabe Unite','8 – 13 Decembrie 2026'],
  ['danang','Vietnam','Da Nang','8 – 13 Decembrie 2026'],
  ['las-vegas','Las Vegas','SUA','16 – 20 Decembrie 2026'],
  ['bali','Bali','Indonezia','12 – 17 Ianuarie 2027'],
  ['phuket','Phuket','Thailanda','19 – 24 Ianuarie 2027'],
  ['cancun','Cancun','Mexic','21 – 25 Aprilie 2027'],
];
// [photo file, caption]
const SHOTS = [
  ['grup','Comunitatea în deșert · Dubai'],['marrakesh-piata','Piața Marrakesh · Maroc'],['dubai-burj','Burj Khalifa noaptea · Dubai'],
  ['bali-templu','Templu balinez · Bali'],['algarve','Pe stâncă la ocean · Algarve'],['maroc-intrare','Intrare tradițională · Maroc'],
  ['dubai-barca','Pe barcă · Dubai Marina'],['sfinx','Sfinxul Bucegi · România'],['bali-rafting','Rafting pe râu · Bali'],
  ['bali-atv','Aventură ATV · Bali'],['munte','Excursie la munte · România'],['londra','Eveniment tematic · Londra'],
  ['bali-porti','Porți de templu · Bali'],['malaezia','Templu tradițional · Malaezia'],['marrakesh-piscina','La piscină · Marrakesh'],
  ['dubai-cina','Cină de grup · Dubai Marina'],
];
// the "hand" of holidays in step 2; the middle one gets picked
const FAN = [['dubai','Dubai'],['phuket','Phuket'],['bali','Bali'],['cancun','Cancun'],['shanghai','Shanghai']];
// land on a 2.5° grid (Natural Earth 110m), one hex string per row, 144 columns from 180°W, rows from 82°N
const MAP = '000000003ffbffffc0000000000600000000/0000000157dfffff000780000000c0000000/0000006d9000ffff00000001c007fc01c000/00000385aa803ffe0000000600ffff600000/00e0007e6ff03ffe000030021bffffffff00/87ffffc47a381ff00003ff2bfbffffffffff/f7fffffff83a1f83c007bcffffffffffffff/09fffffff01c0e00001f7fffffffffffffff/03ffffffc0700200003e7ffffffffffffc78/00407fffe07e000002063fffffffffff0180/01001ffffc7f0000021cfffffffffffe0380/00000ffffeffc0000f3fffffffffffff0300/000007ffffff4000037fffffffffffff0000/000001fffff4e00003ffffffffffffff0000/000003ffffff000000fff5fffffffffe0000/000003fffff000000fe9e0fffffffffcc000/000003ffffe000000f12efffffffff708000/000001ffff8000000f02dffffffffe200000/000001ffffc0000000f003ffffffff130000/0000007fff00000007f003ffffffff080000/0000001ffe0000000ffeffffffffff800000/0000003f810000001fffffe7ffffff800000/0000000f810000003ffffdfbffffff000000/00000007800000003ffffdff0ffffe800000/00400003884000007ffffefe07e7e0000000/00000001f83c00003ffffe7e07c3c0800000/000000005c0000007fffff780701e0800000/000000000e0000007fffffc00301f0c00000/00000000023900003ffffff0030160400000/00000000017f00001ffffff0008100600000/00000000007fc0000f3ffff0000082000000/00000000007ff000000fffe0000106000000/0000000000fff000000fff8000008ec00000/0000000000fffc00000fff800000ce840000/0000000000ffff800007ff0000004003c000/0000000000ffffc00007ff0000002801e000/00000000007fffc00007ff00000000001080/00000000007fff800007ff00000000000000/00000000003fff000007ff100000002c4000/00000000001fff000007ff300000007ec001/00000000000fff000007fc300000007fe000/00000000000fff000003fc60000003fff020/00000000000ff8000003fc60000007fff800/00000000000ff8000003f800000007fff800/00000000001ff0000001f800000003fff800/00000000001fe0000001f000000003f7f800/00000000001fe0000001800000000303f000/00000000001f80000000000000000000f000/00000000001e000000000000000000000002/00000000003c000000000000000000002004/00000000001c000000000000000000000018/000000000038000000000000000000000000/000000000038000000000000100000000000/000000000030800000000000000000000000/000000000018000000000000000000000000';

$('.stops').innerHTML = TOURS.map(([f,city,place,when],i)=>
  `<article class="stop"><div class="stop-media"><img src="assets/destinatii/${f}.jpg" alt="${city}, ${place}" loading="lazy"></div><div class="stop-info"><div><span class="label">${String(i+1).padStart(2,'0')} · ${place}</span><h3>${city}</h3></div><p class="when"><span>Perioada</span>${when}</p></div></article>`).join('');
$('.fan').innerHTML = FAN.map(([f,c],i)=>`<figure class="fcard${i===2?' pick':''}" style="z-index:${i===2?5:3-Math.abs(i-2)}"><img src="assets/destinatii/${f}.jpg" alt=""><figcaption>${c}</figcaption></figure>`).join('');
// rendered twice so the wall can loop seamlessly; each polaroid gets its own tilt and height
const TILT = [-4,3,-2,5,-3,2,-5,3.5,-1.5,4,-3.5,2.5,-2.5,4.5,-4.5,1.5], DROP = [0,34,-14,22,-26,10,30,-8,18,-20,26,-4,14,-18,32,-12];
const shots = hidden => SHOTS.map(([f,c],i)=>
  `<figure class="polaroid" style="--r:${TILT[i]}deg;--y:${DROP[i]}px"${hidden?' aria-hidden="true"':''}><div class="photo"><img src="assets/comunitate/${f}.jpg" alt="${hidden?'':c}" draggable="false" loading="lazy"></div><figcaption>${c}</figcaption></figure>`).join('');
$('.track').innerHTML = shots(false) + shots(true);
// headings: one masked span per word, so they can rise word by word
$$('[data-split]').forEach(h=>h.innerHTML = h.textContent.trim().split(/\s+/).map(w=>`<span class="w"><span>${w}</span></span>`).join(' '));

/* ---------- smooth scroll ----------
   The three pinned sections (hero, inside, how) are measured first (refreshPriority), so every
   trigger further down already counts the scroll space they add. */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0,0);
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({lerp:.085, wheelMultiplier:.9});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = y => lenis ? lenis.scrollTo(y,{duration:1.6}) : scrollTo({top:y,behavior:reduce?'auto':'smooth'});
const menu = $('#menu'), burger = $('.nav-burger');
const setMenu = open => { menu.hidden = !open; burger.setAttribute('aria-expanded', open); open ? lenis?.stop() : lenis?.start(); };
burger.addEventListener('click',()=>setMenu(true));
$('.menu-close').addEventListener('click',()=>setMenu(false));
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); setMenu(false); scrollToY(t.getBoundingClientRect().top + scrollY);
}));

/* ---------- 1. hero zoom through the window ---------- */
const cabinImg = $('.cabin img'), skyImg = $('.sky img');
// scale at which the glass opening (~49% x 52% of the photo) covers the viewport
const zoomTo = () => Math.max(innerWidth/(cabinImg.offsetWidth*.49), innerHeight/(cabinImg.offsetHeight*.52))*1.12;
gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=160%',scrub:1,pin:true,invalidateOnRefresh:true,refreshPriority:1}})
  .to('.hero-copy',{yPercent:-45,opacity:0,ease:'power1.in',duration:.35},0)
  .to('.hero-shade',{opacity:0,duration:.2},0)
  .fromTo('.cabin',{scale:1},{scale:zoomTo,ease:'power2.in',duration:1},0)
  .fromTo(skyImg,{scale:1.35},{scale:1.06,ease:'power1.inOut',duration:1},0)
  .to('.cabin',{autoAlpha:0,duration:.1},.9);

/* ---------- 2. the clouds turn into the night-blue page ---------- */
gsap.to('.sky-tint',{opacity:1,ease:'none',scrollTrigger:{trigger:'.transit',start:'top bottom',end:'bottom 55%',scrub:true}});
gsap.to(skyImg,{yPercent:-6,ease:'none',scrollTrigger:{trigger:'.transit',start:'top bottom',end:'bottom top',scrub:true}});
ScrollTrigger.create({trigger:'#drumuri',start:'top top',onEnter:()=>gsap.set('.sky',{visibility:'hidden'}),onLeaveBack:()=>gsap.set('.sky',{visibility:'visible'})});

/* ---------- reveals used everywhere ---------- */
const onEnter = (el, start, fn) => ScrollTrigger.create({trigger:el,start,once:true,onEnter:fn});
$$('[data-split]').forEach(h=>gsap.from(h.querySelectorAll('.w>span'),{yPercent:115,duration:1.3,ease:'expo.out',stagger:.06,
  scrollTrigger:{trigger:h,start:'top 86%',toggleActions:'play none none reverse'}}));
$$('[data-reveal]').forEach(el=>gsap.from(el,{y:40,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%',toggleActions:'play none none reverse'}}));
// a gold hairline that draws itself (--s goes 0 → 1)
const drawLine = (el, delay = 0) => onEnter(el,'top 85%',()=>gsap.to(el,{'--s':1,duration:1.4,delay,ease:'expo.inOut'}));

/* ---------- 3. two paths ---------- */
gsap.from('.path-card',{clipPath:'inset(12% 8% 12% 8% round 24px)',duration:1.6,ease:'expo.out',stagger:.18,
  scrollTrigger:{trigger:'.paths-grid',start:'top 80%',toggleActions:'play none none reverse'}});
if (fine) $$('.path-card').forEach(card=>{
  const rx = gsap.quickTo(card,'rotationX',{duration:.8,ease:'power3'}), ry = gsap.quickTo(card,'rotationY',{duration:.8,ease:'power3'});
  card.addEventListener('pointermove',e=>{ const r = card.getBoundingClientRect(); ry(((e.clientX-r.left)/r.width-.5)*7); rx(-((e.clientY-r.top)/r.height-.5)*7); });
  card.addEventListener('pointerleave',()=>{ rx(0); ry(0); });
});

/* ---------- 4. numbers count up ---------- */
$$('.stat').forEach((s,i)=>{
  drawLine(s, i*.12);
  const b = s.querySelector('b'), to = +b.dataset.count, suf = b.dataset.suffix || '', o = {v:0};
  onEnter(s,'top 85%',()=>gsap.to(o,{v:to,duration:1.8,delay:i*.12,ease:'power3.out',onUpdate:()=>b.textContent = fmt(Math.round(o.v)) + suf}));
});

/* ---------- 5. mission: the dotted world and the routes out of Romania ---------- */
const world = $('.world');
{
  let dots = '';
  MAP.split('/').forEach((row,r)=>[...row].forEach((h,k)=>{ const v = parseInt(h,16);
    for (let b = 0; b < 4; b++) if (v & (8>>b)) { const c = k*4+b, lon = -178.75+c*2.5, lat = 80.75-r*2.5, ro = lon>20 && lon<30 && lat>43 && lat<48.5;
      dots += `<circle cx="${c*10+5}" cy="${r*10+5}" r="2.6"${ro?' class="ro"':''}/>`; } }));
  const P = (lon,lat) => [(lon+180)*4, (82-lat)*4], [hx,hy] = P(26.1,44.4);
  // [city, lon, lat, label side]
  const CITIES = [['Dubai',55.3,25.2,1],['Shanghai',121.5,31.2,1],['Da Nang',108.2,16.1,1],['Phuket',98.4,7.9,-1],['Bali',115.2,-8.4,1],['Las Vegas',-115.1,36.2,-1],['Cancun',-86.8,21.2,1]];
  const arcs = CITIES.map(([,lon,lat])=>{ const [x,y] = P(lon,lat), d = Math.hypot(x-hx,y-hy); return `<path class="arc" d="M${hx} ${hy}Q${(hx+x)/2} ${(hy+y)/2-d*.3} ${x} ${y}"/>`; }).join('');
  const city = (name,x,y,side,cls) => `<g class="city ${cls}"><circle class="ring" cx="${x}" cy="${y}" r="6"/><circle cx="${x}" cy="${y}" r="6"/><text x="${x+side*16}" y="${y+7}" text-anchor="${side>0?'start':'end'}">${name}</text></g>`;
  world.innerHTML = `<g class="land">${dots}</g>${arcs}${CITIES.map(([n,lon,lat,s])=>{ const [x,y] = P(lon,lat); return city(n,x,y,s,''); }).join('')}${city('București',hx,hy,-1,'home')}`;
  gsap.from(world.querySelectorAll('.land circle'),{opacity:0,duration:.8,stagger:{each:.0008,from:'random'},scrollTrigger:{trigger:world,start:'top 85%'}});
  const arcEls = $$('.world .arc'), cityEls = $$('.world .city:not(.home)');
  arcEls.forEach(a=>{ const L = a.getTotalLength(); gsap.set(a,{strokeDasharray:L,strokeDashoffset:L}); });
  gsap.to(arcEls,{strokeDashoffset:0,ease:'none',stagger:.35,scrollTrigger:{trigger:'.mission',start:'top 65%',end:'bottom 75%',scrub:1,
    onUpdate:()=>arcEls.forEach((a,i)=>cityEls[i].classList.toggle('on', gsap.getProperty(a,'strokeDashoffset') < 2))}});
}

/* ---------- 6. the club from inside: the cards slide sideways while the section holds ---------- */
const insideTrack = $('.inside-track'), mm = gsap.matchMedia();
mm.add('(min-width: 768px)', ()=>{
  const dist = () => insideTrack.scrollWidth - innerWidth;
  gsap.to(insideTrack,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.inside',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,refreshPriority:1}});
});
// each mini screen plays when its card comes into view
const countTo = (el, from, to, d, suf = '') => { const o = {v:from}; return gsap.fromTo(o,{v:from},{v:to,duration:1.6,ease:'power3.inOut',onUpdate:()=>el.textContent = fmt(o.v,d) + suf}); };
const PLAY = {
  points: c => gsap.timeline().call(()=>c.querySelector('.ui-btn').classList.remove('done'))
    .add(countTo(c.querySelector('[data-n]'),5152,3352,0),.5).fromTo(c.querySelector('.ui-bar i'),{scaleX:1},{scaleX:.65,duration:1.6,ease:'power3.inOut'},.5)
    .call(()=>c.querySelector('.ui-btn').classList.add('done'),null,2.2),
  cashback: c => { const tl = gsap.timeline(); c.querySelectorAll('[data-cb]').forEach((el,i)=>tl.add(countTo(el,0,+el.dataset.cb,2,' €'),.4+i*.5)); return tl; },
  group: c => countTo(c.querySelector('[data-g]'),0,26,0).delay(.3),
};
const playing = new Map();
const live = new IntersectionObserver(es=>es.forEach(e=>{
  const c = e.target; c.classList.toggle('live', e.isIntersecting);
  playing.get(c)?.kill(); playing.delete(c);
  if (e.isIntersecting && PLAY[c.dataset.ui]) playing.set(c, PLAY[c.dataset.ui](c));
}),{threshold:.55});
$$('.ui-card').forEach(c=>live.observe(c));

/* ---------- 7. world tours: cards open as they arrive ---------- */
$$('.stop').forEach(s=>ScrollTrigger.create({trigger:s,start:'top 85%',onEnter:()=>s.classList.add('in'),onLeaveBack:()=>s.classList.remove('in')}));

/* ---------- 8. how it works: card → hand of holidays → enjoy & repeat ---------- */
const howSteps = $$('.how-steps li'), STEP_AT = [0,1.05,2.05], STEP_SHOW = [.75,1.85,3];
gsap.set('.badge',{xPercent:-50});
// the step list follows the timeline itself (not the scroll event), so it stays right while scrub catches up
const howTl = gsap.timeline({scrollTrigger:{trigger:'.how',start:'top top',end:'+=260%',scrub:1,pin:true,refreshPriority:1},
  onUpdate:()=>{ const t = howTl.time(), end = howTl.duration();
    howSteps.forEach((li,i)=>{ const a = STEP_AT[i], b = STEP_AT[i+1] ?? end;
      li.classList.toggle('on', t>=a && (t<b || i===2)); li.style.setProperty('--p', gsap.utils.clamp(0,1,(t-a)/(b-a))); }); }})
  .fromTo('.member',{rotationY:-70,rotationX:12,y:90,autoAlpha:0,scale:.85},{rotationY:0,rotationX:0,y:0,autoAlpha:1,scale:1,duration:.5,ease:'power2.out'},0)
  .fromTo('.s1 .badge',{scale:.4,autoAlpha:0},{scale:1,autoAlpha:1,duration:.2,ease:'back.out(2)'},.45)
  .to('.member',{y:-80,rotationY:28,autoAlpha:0,duration:.35,ease:'power2.in'},1)
  .to('.s1 .badge',{scale:.6,autoAlpha:0,duration:.2},1)
  .fromTo('.fcard',{xPercent:0,yPercent:0,rotation:0,y:90,autoAlpha:0},{xPercent:i=>(i-2)*52,yPercent:i=>Math.abs(i-2)*7,rotation:i=>(i-2)*9,y:0,autoAlpha:1,duration:.5,stagger:.04,ease:'power3.out'},1.12)
  .to('.fcard.pick',{y:-44,scale:1.14,duration:.25,ease:'power2.out'},1.7)
  .fromTo('.s2 .badge',{scale:.4,autoAlpha:0},{scale:1,autoAlpha:1,duration:.2,ease:'back.out(2)'},1.75)
  .to('.fcard',{xPercent:0,yPercent:0,rotation:0,y:-70,autoAlpha:0,duration:.35,stagger:.02,ease:'power2.in'},2)
  .to('.s2 .badge',{autoAlpha:0,duration:.2},2)
  .fromTo('.loop',{scale:.55,rotation:-40,autoAlpha:0},{scale:1,rotation:0,autoAlpha:1,duration:.5,ease:'power3.out'},2.1)
  .fromTo('.loop-ring',{rotation:0},{rotation:300,duration:1.1,ease:'none'},2.1)
  .fromTo('.loop-orbit',{rotation:0},{rotation:-360,duration:1.1,ease:'none'},2.1);
howSteps.forEach((li,i)=>li.querySelector('button').addEventListener('click',()=>{
  const st = howTl.scrollTrigger; scrollToY(st.start + (st.end-st.start)*STEP_SHOW[i]/howTl.duration());
}));
if (fine) {
  const hv = $('.how-visual'), rx = gsap.quickTo('.how-tilt','rotationX',{duration:.6,ease:'power3'}), ry = gsap.quickTo('.how-tilt','rotationY',{duration:.6,ease:'power3'});
  hv.addEventListener('pointermove',e=>{ const r = hv.getBoundingClientRect(); ry(((e.clientX-r.left)/r.width-.5)*14); rx(-((e.clientY-r.top)/r.height-.5)*14); });
  hv.addEventListener('pointerleave',()=>{ rx(0); ry(0); });
}

/* ---------- 9. Business Class: the cabin curtain opens ---------- */
gsap.timeline({scrollTrigger:{trigger:'.biz',start:'top 55%',end:'top top',scrub:1}})
  .to('.curtain-label',{opacity:0,scale:.92,duration:.3},0)
  .to('.curtain-l',{xPercent:-101,duration:1,ease:'power2.inOut'},.1)
  .to('.curtain-r',{xPercent:101,duration:1,ease:'power2.inOut'},.1);
$$('.biz-pillars li').forEach(li=>{
  drawLine(li);
  gsap.from(li.children,{y:30,opacity:0,duration:1.2,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:li,start:'top 85%',toggleActions:'play none none reverse'}});
});
drawLine($('.journey-steps'));
gsap.from('.journey-steps li',{y:30,opacity:0,duration:1.2,ease:'expo.out',stagger:.12,scrollTrigger:{trigger:'.journey-steps',start:'top 85%',toggleActions:'play none none reverse'}});

/* ---------- 10. events: countdown to the next live webinar (Thursday 21:00, Romanian time) ---------- */
const TZ = 'Europe/Bucharest';
const tzParts = d => Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,hourCycle:'h23',weekday:'short',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(d).map(p=>[p.type,p.value]));
// how far Romanian clocks are ahead of UTC at moment t, in ms
const roOffset = t => { const p = tzParts(t); return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute) - Math.floor(t/6e4)*6e4; };
function nextWebinar(now = Date.now()){
  const p = tzParts(now), dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
  // ponytail: uses today's offset, so the week the clocks change it can be an hour off
  const t = Date.UTC(+p.year,+p.month-1,+p.day + (4-dow+7)%7, 21) - roOffset(now);
  return t <= now ? t + 7*864e5 : t;
}
const webinarAt = nextWebinar();
// visitors outside Romania also see the time on their own clock
if (roOffset(webinarAt) !== -new Date(webinarAt).getTimezoneOffset()*6e4)
  $('[data-local]').textContent = ' · la tine: ' + new Intl.DateTimeFormat('ro-RO',{weekday:'long',hour:'2-digit',minute:'2-digit'}).format(webinarAt);
const cdEls = Object.fromEntries($$('[data-cd]').map(e=>[e.dataset.cd,e]));
function tick(){
  const s = Math.max(0, Math.floor((webinarAt - Date.now())/1000)), pad = n => String(n).padStart(2,'0');
  cdEls.d.textContent = s/86400|0; cdEls.h.textContent = pad(s%86400/3600|0); cdEls.m.textContent = pad(s%3600/60|0); cdEls.s.textContent = pad(s%60);
}
tick(); setInterval(tick,1000);
gsap.from('.ticket',{x:60,opacity:0,duration:1.2,ease:'expo.out',stagger:.14,scrollTrigger:{trigger:'.tickets',start:'top 80%',toggleActions:'play none none reverse'}});

/* ---------- 11. community wall: drifts on its own; drag with the mouse or swipe to move it ---------- */
const wall = $('.gallery-stage'), track = $('.track');
let wallX = 0, wallVel = 0, half = 1, dragging = false, hovering = false, lastPX = 0;
const measureWall = () => half = track.scrollWidth/2 || 1;
measureWall(); addEventListener('resize',measureWall);
gsap.ticker.add((t,dt)=>{
  if (!dragging) { wallVel *= .94; wallX += wallVel - (hovering ? 0 : (reduce ? .015 : .05)*dt); }
  wallX %= half; if (wallX > 0) wallX -= half;
  track.style.transform = `translate3d(${wallX}px,0,0)`;
});
wall.addEventListener('pointerenter',e=>{ if (e.pointerType==='mouse') hovering = true; });
wall.addEventListener('pointerleave',()=>hovering = false);
wall.addEventListener('pointerdown',e=>{ dragging = true; lastPX = e.clientX; wallVel = 0; wall.setPointerCapture(e.pointerId); wall.classList.add('grabbing'); });
wall.addEventListener('pointermove',e=>{ if (!dragging) return; const dx = e.clientX-lastPX; lastPX = e.clientX; wallX += dx; wallVel = dx; });
const letGo = () => { dragging = false; wall.classList.remove('grabbing'); };
wall.addEventListener('pointerup',letGo); wall.addEventListener('pointercancel',letGo);
// a polaroid "develops" each time it slides into view, and fades back once it leaves
const develop = new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('dev',e.isIntersecting)),{threshold:.4});
$$('.polaroid').forEach(p=>develop.observe(p));

/* ---------- 12. FAQ: opening an answer changes the page height, so re-measure after it ---------- */
$$('.faq-list details').forEach(d=>d.addEventListener('toggle',()=>setTimeout(()=>ScrollTrigger.refresh(),650)));

/* ---------- the flight ----------
   One dotted line runs through every section (each section draws its own "leg", so pinned
   sections keep theirs in place). The plane sits on a fixed horizontal line just under the
   hero title; as the page scrolls, it is placed wherever the legs cross that line, and it
   lands in the hub between the two final tickets. Each leg starts where the previous one
   ended and swings to its own lane: the middle, the left edge, or the gap between two columns. */
const flight = $('.flight'), landIcon = $('.hub-plane');
let FLY_Y = 0, legs = [];
// layout box of el inside host, ignoring transforms (reveal animations, the hero fade)
const boxIn = (el, host) => { let x = 0, y = 0, n = el; while (n && n !== host) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return {x, y, w:el.offsetWidth, h:el.offsetHeight}; };
// one smooth curve through every point (Catmull-Rom), with no corners anywhere; it leaves and
// arrives vertically, so where one section's leg meets the next the line runs on unbroken
const curve = pts => {
  const n = pts.length, P = [[pts[1][0], pts[0][1]-80], ...pts, [pts[n-2][0], pts[n-1][1]+80]];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < P.length-2; i++) {
    const [x0,y0] = P[i-1], [x1,y1] = P[i], [x2,y2] = P[i+1], [x3,y3] = P[i+2], h = y2-y1;
    // keep the control points inside the segment's height so the line never turns back upward
    d += ` C${x1+(x2-x0)/6} ${Math.min(y1+(y2-y0)/6, y1+h*.9)} ${x2-(x3-x1)/6} ${Math.max(y2-(y3-y1)/6, y1+h*.1)} ${x2} ${y2}`;
  }
  return d;
};
const edgeX = () => innerWidth < 768 ? 10 : Math.min(64, Math.max(16, innerWidth*.04))*.45;
const gapX = host => { const a = boxIn(host.querySelector('[data-col="a"]'), host), b = boxIn(host.querySelector('[data-col="b"]'), host); return (a.x + a.w + b.x)/2; };
// where the line runs inside a section, after it has swung in from the previous one
function route(host, W, H, mob){
  const cx = W/2;
  if (host.classList.contains('tours')) {
    // through the middle of every photo, swinging out to alternate sides between them
    const ys = $$('.stop-media').map(m=>{ const b = boxIn(m, host); return b.y + b.h/2; }), pts = [];
    ys.forEach((y,k)=>{ if (k && !mob) pts.push([cx + (k%2 ? 1 : -1)*W*.17, (ys[k-1]+y)/2]); pts.push([cx,y]); });
    pts.push([mob ? edgeX() : cx, H]);
    return {pts, stops:ys};
  }
  if (host.classList.contains('how-stage')) {
    if (mob) return {pts:[[edgeX(),H]]};
    const c = boxIn($('.how-copy'), host), v = boxIn($('.how-visual'), host), lane = (c.x + c.w + v.x)/2;
    return {pts:[[lane,H*.2],[lane,H]]};
  }
  if (host.classList.contains('biz')) {
    if (mob) return {pts:[[edgeX(),H]]};
    // the gap between the words and the pillars, then the middle of the four steps
    const g = boxIn($('.biz-grid'), host), j = boxIn($('.journey-steps'), host), lane = gapX(host);
    return {pts:[[lane,g.y],[lane,g.y+g.h],[cx,j.y-40],[cx,H]]};
  }
  if (host.classList.contains('final')) {
    const hub = boxIn($('.hub-ring'), host), hy = hub.y + hub.h/2;
    return {pts:[[cx, hy - Math.min(160, hy*.4)],[hub.x + hub.w/2, hy]]};
  }
  const lane = (mob && host.dataset.laneM) || host.dataset.lane || 'center';
  const x = lane === 'edge' || (mob && lane === 'gap') ? edgeX() : lane === 'gap' ? gapX(host) : cx;
  return {pts:[[x,H]]};
}
function buildFlight(){
  const mob = innerWidth < 768, heroStage = $('.hero-stage'), anchor = $('.flight-anchor');
  FLY_Y = boxIn(anchor, heroStage).y + anchor.offsetHeight/2;
  let prevX = heroStage.offsetWidth/2;
  legs = $$('.leg').map((svg,i)=>{
    const host = svg.parentElement, W = host.offsetWidth, H = host.offsetHeight;
    let pts, stops = [];
    if (host === heroStage) pts = [[W/2,FLY_Y],[W/2,H]];
    else {
      // the swing takes longer the further it has to travel sideways, so it never turns sharply
      const r = route(host, W, H, mob), first = r.pts[0], T = Math.min(H*.45, Math.max(120, Math.abs(first[0]-prevX)*.5));
      pts = [[prevX,0]];
      if (Math.abs(first[0]-prevX) > 1 && first[1] > T + 40) pts.push([first[0], T]);
      pts.push(...r.pts); stops = r.stops || [];
    }
    prevX = pts[pts.length-1][0];
    const gaps = $$('[data-gap]').filter(el=>host.contains(el)).map(el=>boxIn(el, host));
    const mask = `leg-mask-${i}`, d = curve(pts), sx = W/2;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.innerHTML = `<defs><mask id="${mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${
      gaps.map(g=>`<rect x="${g.x-16}" y="${g.y-14}" width="${g.w+32}" height="${g.h+28}" rx="12" fill="#000"/>`).join('')}</mask></defs>
      <g mask="url(#${mask})"><path class="leg-base" d="${d}"/><path class="leg-drawn" d="${d}"/></g>
      <g class="leg-stops">${stops.map(y=>`<circle cx="${sx}" cy="${y}" r="7"/>`).join('')}</g>`;
    const drawn = svg.querySelector('.leg-drawn'), len = drawn.getTotalLength();
    drawn.style.strokeDasharray = len;
    return {svg, drawn, len, y0:pts[0][1], y1:pts[pts.length-1][1], stops:stops.map((y,k)=>({y, el:svg.querySelectorAll('circle')[k]}))};
  });
  fly();
}
// every leg only ever goes downward, so binary-search the length that reaches a given height
const lenAtY = (g, y) => { let lo = 0, hi = g.len; for (let k=0;k<22;k++){ const m = (lo+hi)/2; g.drawn.getPointAtLength(m).y < y ? lo = m : hi = m; } return lo; };
function fly(){
  if (!legs.length) return;
  let hit = null;
  for (const g of legs) {
    const r = g.svg.getBoundingClientRect(), y = FLY_Y - r.top;
    const l = y <= g.y0 ? 0 : y >= g.y1 ? g.len : lenAtY(g, y);
    g.drawn.style.strokeDashoffset = g.len - l;
    g.stops.forEach(s=>s.el.classList.toggle('on', y >= s.y - 2));
    if (!hit && y >= g.y0 - 1 && y <= g.y1 + 1) hit = {g, r, l};
  }
  const last = legs[legs.length-1], docked = !hit && FLY_Y - last.svg.getBoundingClientRect().top > last.y1;
  if (!hit) hit = docked ? {g:last, r:last.svg.getBoundingClientRect(), l:last.len} : {g:legs[0], r:legs[0].svg.getBoundingClientRect(), l:0};
  const {g, r, l} = hit, l2 = Math.max(1, Math.min(g.len, l+1)), p = g.drawn.getPointAtLength(l2-1), q = g.drawn.getPointAtLength(l2);
  flight.style.transform = `translate(${r.left+p.x}px,${r.top+p.y}px) rotate(${Math.atan2(q.y-p.y, q.x-p.x)*180/Math.PI + 90}deg)`;
  flight.classList.toggle('docked', docked);
  flight.classList.toggle('idle', scrollY < 8);
  landIcon.classList.toggle('land', docked);
}
buildFlight();
ScrollTrigger.addEventListener('refresh', buildFlight);
// re-place the plane for a few frames after every scroll change, so it is measured after the
// pinned sections have moved (a big jump would otherwise leave it where it was)
let flownAt = -1, settle = 0;
gsap.ticker.add(()=>{ if (scrollY !== flownAt) { flownAt = scrollY; settle = 3; } if (settle > 0) { settle--; fly(); } });

/* ---------- nav: glass once you scroll, hides going down, returns going up ---------- */
const nav = $('.nav'), wa = $('.wa');
let navY = 0;
gsap.ticker.add(()=>{
  const y = scrollY;
  nav.classList.toggle('solid', y > 60);
  wa.classList.toggle('is-hidden', y < innerHeight*.8);
  if (Math.abs(y - navY) > 6) { nav.classList.toggle('away', y > navY && y > innerHeight*1.2); navY = y; }
});

/* ---------- footer rises from underneath ---------- */
gsap.from('.foot-inner',{yPercent:-28,ease:'none',scrollTrigger:{trigger:'.foot',start:'top bottom',end:'bottom bottom',scrub:true}});

/* ---------- cursor and magnetic buttons ---------- */
if (fine){
  const c = $('.cursor'), cx = gsap.quickTo(c,'x',{duration:.35,ease:'power3'}), cy = gsap.quickTo(c,'y',{duration:.35,ease:'power3'});
  addEventListener('pointermove',e=>{ cx(e.clientX); cy(e.clientY); c.style.opacity=1; });
  document.addEventListener('pointerover',e=>c.classList.toggle('hover',!!e.target.closest('a,button,summary')));
  $$('.btn,.nav-cta').forEach(b=>{
    const bx = gsap.quickTo(b,'x',{duration:.6,ease:'power3'}), by = gsap.quickTo(b,'y',{duration:.6,ease:'power3'});
    b.addEventListener('pointermove',e=>{ const r = b.getBoundingClientRect(); bx((e.clientX-r.left-r.width/2)*.25); by((e.clientY-r.top-r.height/2)*.35); });
    b.addEventListener('pointerleave',()=>{ bx(0); by(0); });
  });
}

/* ---------- intro ---------- */
if (!reduce) gsap.timeline()
  .from('.cabin img',{scale:1.22,duration:2.4,ease:'expo.out'},0)
  .from('.hero-kicker',{opacity:0,y:14,duration:1,ease:'power2.out'},.2)
  .from('.hero-title .line>span',{yPercent:110,duration:1.5,ease:'expo.out',stagger:.1},.25)
  .from('.hero-sub',{opacity:0,y:20,duration:1.2,ease:'power2.out'},.8)
  .from('.flight-ico',{scale:0,opacity:0,duration:.9,ease:'back.out(2)'},1)
  .from('.hero-actions .btn',{opacity:0,y:18,duration:1,ease:'power2.out',stagger:.1},1.1)
  .from('.nav',{opacity:0,y:-20,duration:1,ease:'power2.out'},1.2);
const goHash = () => { const t = location.hash && $(location.hash); if (t) scrollToY(t.getBoundingClientRect().top + scrollY); };
addEventListener('load',()=>{ ScrollTrigger.refresh(); measureWall(); goHash(); });
