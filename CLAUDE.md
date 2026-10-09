# Proiect
Site-ul „Călătorul Antreprenor”: club de călătorii (Club) + parte de business (Business Class). Limba: română.
Concept: tot site-ul e un ZBOR CU UN AVION PRIVAT. Referința de stil aleasă de utilizator: https://pasqua.it/ (scenă 3D în timp real, capitole, titluri mari, „Descoperă”, săgeți capitol anterior/următor).
Pagina principală = un zbor filmat, randat în Three.js: intro (logo-ul iese din nori și se așază în meniu), apoi la scroll cadrele video (avionul printre nori → intrarea în cockpit → cabina → lounge) și două poze (dormitorul, ușa spre coastă), pe 6 capitole: I Decolarea (hero) · II Business Class (cockpit, panoul de bord) · III Comunitatea (masa dintre scaune, biletele) · IV Academia (lounge, cartea) · V Clubul (dormitorul, patul) · VI Destinații (ușa deschisă). Click pe obiectul fiecărui capitol → pagina lui (biletele → /comunitate: feed cu postări din vacanțe și evenimente; deocamdată demo, fără conturi).
Conținutul detaliat stă pe paginile deschise de „Descoperă”: /club, /destinatii, /business-class, /comunitate.
Destinațiile sunt GENERICE și rotative (Bali, Maldive, Bora Bora, Dubai, Tokyo, Islanda, Machu Picchu, Cape Town), nu o destinație fixă.

Plan de lucru: `Prompturi_Claude_Code_Calatorul_Antreprenor.md` (prompturile 0–14, date pe rând).
Referință existentă: `legacy/` (index.html, site.css, site.js, assets/) = prototipul static vechi (sursă pentru animațiile de refolosit: hublou, avionul care decolează, linia punctată, cei 3 pași, polaroidele, biletul final). Landing vechi: https://github.com/mariostan5/landing-page
`docs/Plan_site_nou_CA.docx`: încă nu există în proiect; când apare, completează acest fișier cu ce lipsește din el.

# Stack
Astro + GSAP (ScrollTrigger, SplitText) + Lenis + Three.js (încărcat dinamic, după prima afișare). Găzduire pe Cloudflare Pages. Conținut editabil cu Keystatic. Formulare și leaduri în Brevo. Anti-spam: Cloudflare Turnstile.

# Design tokens (nu inventa altele)
ink #040B1F · navy #071433 · royal #0B1E4F · cream #F3EEE4 · gold #D8C08A
Fonturi: Cormorant Garamond (titluri), Manrope (text), DM Mono (cifre și etichete). FĂRĂ italice.
Club = aer, lumină, cer, alb cald. Business Class = bleumarin profund, auriu fin, mai puțină mișcare.

# Reguli de animație
- Lenis cu inerție fină. Nu bloca niciodată scroll-ul.
- Curbe: expo.out pentru apariții (1.1–1.4s), power3.inOut pentru tranziții (0.8s). Fără bounce sau elastic.
- Titluri: rânduri care urcă din mască (SplitText), cu 0.08s între ele.
- Imagini: se deschid din mască și se micșorează de la 115% la 100%.
- Cifre: urcă de la 0 în 1.6s, cu tabular-nums.
- Semnătura site-ului: linia punctată a avionului.
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
- Pagina principală: `src/pages/index.astro` (capitolele) + `src/scripts/hero.ts` (intro: logo din nori → meniu) + `src/scripts/journey.ts` (scena three.js; zborul rulează ca un film: un scroll/tastă (GSAP Observer) pornește un tween GSAP al ceasului filmului până la oprirea următoare, înapoi = fade; pagina e blocată pe un ecran până după ultima oprire, apoi merge la footer; hero = video în buclă `public/hero/jet-loop.mp4`; cadrele din `public/journey/{f,g,i,c,l}/` la 24 fps, toate 1280×720, tăiate din `../Assets/raw video/` cu ffmpeg, benzile negre decupate; KEYS = traseul (cu zoom/offset ca să se alinieze clipurile), STOPS/HOLD = opririle, galeria comunității pe rola din stânga, ușile se deschid în shader, HOTS = markerele). Intro: `public/hero/clouds.mp4`.
- Comunitatea: `src/pages/comunitate.astro`; postările vin din `src/content/community/*.json`.
- Secțiuni refolosite pe /club și /business-class: `src/components/sections/`.
- Date editabile: `src/config.ts` (WhatsApp, link webinar, firmă), `src/data/stats.ts` (cifre), `src/data/countries.ts` (țările membrilor), `src/content/{destinations,events,community}/*.json`.
- Animații comune: `src/scripts/animations/motion.ts` (Lenis, GSAP, reveal-uri, butoane magnetice).
- `legacy/` = prototipul vechi, doar ca referință.
- Nimic pe GitHub (push, repo, PR) până nu cere utilizatorul explicit.
