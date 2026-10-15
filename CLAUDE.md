# Proiect
Site-ul „Călătorul Antreprenor”: club de călătorii (Club) + parte de business (Business Class). Limba: română.
Direcție de design: brandul Călătorul Antreprenor de pe calatorulantreprenor.com (fundal #FAFAF9, carduri albe cu bordură #E7E5E4, galben #FACC15 pentru ce se apasă, albastru #115089 pentru linii și accente mici, titluri Oswald, text Inter), pe structura „creative-tech studio” (grilă cu linii de 1px, etichete Geist Mono). Temă luminoasă implicit, cea întunecată din meniu. Tot textul în română.
Pagina principală (src/pages/index.astro): hero ca pe getartcraft.com: intro (logo-ul singur în centru → urcă la locul lui, „CĂLĂTORUL” / „ANTREPRENOR” se scriu literă cu literă, textul vine din blur) și spirala three.js din src/scripts/spiral.ts (doar poze din călătoriile clubului, din folderul Desktop/Travorium → public/spiral/pNN.webp, care plutesc lent spre tine, arce în culorile brandului; la hover spirala se oprește, cardul crește pe loc la ~27% din lățimea ecranului, ca pe getartcraft.com; click = vizualizare pe tot ecranul). Apoi marquee, 01 Beneficii, 02 Libertate, 03 Comunitate, 04 Oportunitate, CTA final, footer; pe desktop indicatorul de secțiuni + rigla din dreapta.
Conținutul detaliat stă pe paginile deschise de „Descoperă”: /club, /destinatii, /business-class, /comunitate.
Destinațiile sunt GENERICE și rotative (Bali, Maldive, Bora Bora, Dubai, Tokyo, Islanda, Machu Picchu, Cape Town), nu o destinație fixă.

Plan de lucru: `Prompturi_Claude_Code_Calatorul_Antreprenor.md` (prompturile 0–14, date pe rând).
Referință existentă: `legacy/` (index.html, site.css, site.js, assets/) = prototipul static vechi (sursă pentru animațiile de refolosit: hublou, avionul care decolează, linia punctată, cei 3 pași, polaroidele, biletul final). Landing vechi: https://github.com/mariostan5/landing-page
`docs/Plan_site_nou_CA.docx`: încă nu există în proiect; când apare, completează acest fișier cu ce lipsește din el.

# Stack
Astro + GSAP (ScrollTrigger, SplitText) + Lenis. Găzduire pe Vercel (import din GitHub; fiecare push pe main publică). Fonturi din Google Fonts (Base.astro). Conținut editabil cu Keystatic. Formulare și leaduri în Brevo. Anti-spam: Cloudflare Turnstile.

# Design tokens (nu inventa altele; sursa: src/styles/tokens.css)
Sursa adevărului: src/styles/tokens.css (--accent = galben pentru suprafețe, --accent-ink = albastru pentru linii/text mic; numele vechi --ink, --navy, --cream, --gold sunt alias-uri). Logo: public/brand-logo.webp (rotund, acuarelă).
Fonturi: Oswald 600–700 pentru titluri · Inter pentru text · Geist Mono MAJUSCULE cu 0.12em pentru meniu, etichete, butoane. În fiecare titlu mare, UN cuvânt-cheie în Instrument Serif italic (`<em>`), cu punctuația în interiorul lui.
Butoane: principal = galben cu text negru (pe site-ul vechi textul alb pe galben nu se citea); secundar = transparent cu contur; colțuri 6px, carduri 12px.

# Reguli de animație
- Lenis cu inerție fină. Nu bloca niciodată scroll-ul.
- Curbe: expo.out pentru apariții (1.1–1.4s), power3.inOut pentru tranziții (0.8s). Fără bounce sau elastic.
- Titluri: rânduri care urcă din mască (SplitText), cu 0.08s între ele.
- Imagini: se deschid din mască și se micșorează de la 115% la 100%.
- Cifre: urcă de la 0 în 1.6s, cu tabular-nums.
- Fiecare secțiune intră în focus la scroll (blur 8px → 0, opacitate .4 → 1); secțiunile fixate (pin) au data-pinned și nu primesc efectul.
- prefers-reduced-motion: rămân doar fade-uri. Textul trebuie să fie lizibil și fără JavaScript.
- Pe mobil: secțiunile fixate sunt mai scurte, cele orizontale devin carusel cu swipe, fără cursor custom.

# Performanță (obligatoriu)
LCP sub 2.5s pe 4G, sub 150 KB JavaScript inițial, imagini AVIF/WebP, Lighthouse mobil minimum 90.
Three.js și scena 3D se încarcă DUPĂ prima afișare (import dinamic); JS-ul inițial rămâne mic.

# Ton
Spunem: proces, timp, efort, sprijin, rezultate care diferă de la om la om.
Nu spunem: „bani ușori”, „venit pasiv garantat”, „renunță la job”. Fără mașini de lux sau teancuri de bani. Sumele apar doar cu eticheta „ilustrativ”.

# Mod de lucru
Lucrează pe secțiuni. După fiecare secțiune: rulează build-ul, verifică pe 1440px (DEOCAMDATĂ DOAR DESKTOP; mobilul, 375px, îl facem mai târziu, la cererea mea), apoi spune-mi ce să testez. Nu publica nimic pe domeniu fără să scriu „publică”.

# Unde stau lucrurile
- Pagina principală: `src/pages/index.astro` (capitolele) + `src/scripts/hero.ts` (intro: logo din nori → meniu) + `src/scripts/journey.ts` (scena three.js; zborul rulează ca un film: un scroll/tastă (GSAP Observer) pornește un tween GSAP al ceasului filmului până la oprirea următoare, înapoi = fade; pagina e blocată pe un ecran până după ultima oprire, apoi merge la footer; hero = video în buclă `public/hero/jet-loop.mp4`; cadrele din `public/journey/{f,g,i,c,l}/` la 24 fps, toate 1280×720, tăiate din `../Assets/raw video/` cu ffmpeg, benzile negre decupate; KEYS = traseul (cu zoom/offset ca să se alinieze clipurile), STOPS = opririle, pozele comunității = DepthCarousel (React Bits portat în TS: `src/scripts/depth-carousel.ts` + `.css`), ușile se deschid în shader, HOTS = markerele). Intro: `public/hero/clouds.mp4`.
- Comunitatea: `src/pages/comunitate.astro`; postările vin din `src/content/community/*.json`.
- Secțiuni refolosite pe /club și /business-class: `src/components/sections/`.
- Date editabile: `src/config.ts` (WhatsApp, link webinar, firmă), `src/data/stats.ts` (cifre), `src/data/countries.ts` (țările membrilor), `src/content/{destinations,events,community}/*.json`.
- Animații comune: `src/scripts/animations/motion.ts` (Lenis, GSAP, reveal-uri, butoane magnetice).
- `legacy/` = prototipul vechi, doar ca referință.
- GitHub: https://github.com/mariostan5/Calatorul-antreprenor (privat, `main`). Push doar când cere utilizatorul. Deploy planificat pe Vercel (import din GitHub).
