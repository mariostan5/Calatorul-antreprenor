# Prompturi pentru Claude Code: site-ul Călătorul Antreprenor

**Cum le folosești:**

1. Deschide Claude Code în folderul proiectului (unde ai sau vei avea repo-ul).
2. Pune documentul `Plan_site_nou_CA.docx` în folder, în `docs/`.
3. Dă prompturile **pe rând, câte unul**. După fiecare: verifici în browser (`npm run dev`), ceri corecturi, apoi dai `commit`.
4. Nu sări peste Promptul 0. El creează `CLAUDE.md`, „memoria” proiectului, pe care Claude Code o citește automat la fiecare sesiune.

---

## PROMPT 0: Contextul proiectului (CLAUDE.md)

```
Creează în rădăcina proiectului un fișier CLAUDE.md cu regulile de mai jos. Citește și docs/Plan_site_nou_CA.docx (dacă există) și adaugă tot ce lipsește de acolo.

# Proiect
Site-ul „Călătorul Antreprenor”: club de călătorii (Club) + parte de business (Business Class). Limba: română.
Concept: tot site-ul e un ZBOR CU UN AVION PRIVAT. La scroll, vizitatorul se mișcă natural prin avion, dintr-o zonă în alta. Fiecare secțiune = o zonă din avion.
Destinațiile sunt GENERICE și rotative (Bali, Maldive, Bora Bora, Dubai, Tokyo, Islanda, Machu Picchu, Cape Town), nu o destinație fixă.

# Stack
Astro + GSAP (ScrollTrigger, SplitText) + Lenis. Găzduire pe Cloudflare Pages. Conținut editabil cu Keystatic. Formulare și leaduri în Brevo. Anti-spam: Cloudflare Turnstile.

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
Secvențele de cadre se încarcă DUPĂ ce prima imagine e vizibilă (lazy, progresiv).

# Ton
Spunem: proces, timp, efort, sprijin, rezultate care diferă de la om la om.
Nu spunem: „bani ușori”, „venit pasiv garantat”, „renunță la job”. Fără mașini de lux sau teancuri de bani. Sumele apar doar cu eticheta „ilustrativ”.

# Mod de lucru
Lucrează pe secțiuni. După fiecare secțiune: rulează build-ul, verifică pe 375px și 1440px, apoi spune-mi ce să testez. Nu publica nimic pe domeniu fără să scriu „publică”.
```

---

## PROMPT 1: Pornirea proiectului

```
Inițializează proiectul Astro (TypeScript, fără framework UI în plus) cu structura:
src/components/sections/ (câte un fișier pe secțiune), src/components/ui/, src/scripts/animations/, src/styles/tokens.css, src/content/ (destinații, evenimente, postări comunitate), public/frames/ (secvențe de cadre), public/media/.
Instalează gsap și lenis. Creează tokens.css cu culorile și fonturile din CLAUDE.md (fonturi self-hosted, cu font-display: swap).
Creează un layout de bază cu Lenis + ScrollTrigger sincronizate și un utilitar care respectă prefers-reduced-motion.
Dacă există codul landing-ului vechi (https://github.com/mariostan5/landing-page), analizează-l și listează-mi ce animații putem refolosi: hublou, avionul care decolează, linia punctată, cei 3 pași, polaroidele, biletul final. Nu le muta încă.
```

---

## PROMPT 2: Motorul „Zborul prin avion” (piesa principală)

```
Construiește componenta JetJourney: fundalul fix al paginii principale, care simulează mersul prin avionul privat la scroll.

Cum funcționează:
- Un <canvas> full-screen, fixat (position: sticky în spatele secțiunilor).
- Primește o listă de „zone”. Fiecare zonă are o secvență de cadre WebP (public/frames/<zona>/0001.webp...), o imagine statică de rezervă (poster) și id-ul secțiunii HTML de care e legată.
- La scroll (ScrollTrigger cu scrub: 1, smooth), canvas-ul desenează cadrul corespunzător progresului, ca la paginile de produs Apple. Între zone, ultimul cadru al unei zone = primul cadru al următoarei, deci mișcarea e continuă.
- Încărcare: întâi poster-ul primei zone (pentru LCP), apoi cadrele zonei curente, apoi ale zonelor următoare, în fundal. Dacă un cadru nu e încărcat încă, se desenează cel mai apropiat cadru disponibil.
- Peste canvas: un gradient subtil (ink 0–40%), ca textul să fie mereu lizibil.
- Parallax ușor la mișcarea mouse-ului (max 1.5%, doar desktop).
- Mobil: jumătate din cadre (din 2 în 2) și rezoluție 1080px lățime.
- prefers-reduced-motion sau conexiune lentă (navigator.connection.saveData): fără secvențe, doar crossfade 0.8s între postere.

Până primesc cadrele reale, generează placeholder-e: 3 zone a câte 60 de cadre, gradienturi din paletă cu numărul cadrului scris pe ele, ca să pot testa sincronizarea.
Adaugă și un script npm „frames” care ia un .mp4 din /source-videos/<zona>.mp4 și scoate cadre WebP (ffmpeg): 24 cadre pe secundă, 1920px și 1080px, calitate 70.
```

---

## PROMPT 3: Meniul și Hero „Îmbarcarea” (secțiunile 1–2)

```
Secțiunea 1, Meniul: Club · Destinații · Business Class · Academie · Comunitate + butonul auriu „Webinar gratuit”. Apare după intro. La scroll devine sticlă mată (backdrop-blur, navy 60%). Se ascunde când cobori și revine când urci. Logo mic, care apare după primul ecran. Pe mobil: meniu full-screen cu linkurile care urcă din mască.

Secțiunea 2, Hero „Îmbarcarea” (zona JetJourney: ușa avionului, apoi interiorul):
- Titlu: „Călătorește ca un antreprenor.” Subtitlu: „Vacanțe la prețuri de membru și o comunitate care construiește.”
- Butoane: „Webinar gratuit” (gold, umplere la hover, efect magnetic pe desktop) și „Descoperă clubul” (contur).
- Animație: titlul urcă rând cu rând. La primul scroll, camera intră pe ușa avionului (primele cadre JetJourney). Avionul mic de pe linia punctată decolează sub titlu (refolosește animația din landing).
- Un indicator mic, în DM Mono: „ÎMBARCARE · POARTA 01”, care se schimbă la fiecare zonă (de exemplu „CABINĂ · ALT 11.000 M”).
```

---

## PROMPT 4: Două drumuri + Cifre (secțiunile 3–4)

```
Secțiunea 3, Două drumuri (zona JetJourney: culoarul care se desparte).
Titlu: „Vrei să călătorești? Sau vrei să construiești?”
Două carduri mari:
- Club (cer, lumină), cu etichetele: Vacanțe la preț de membru · 2.000+ destinații · Excursii de grup · Comunitate
- Business Class (bleumarin, auriu), cu etichetele: Training · Mentorat · Evenimente · Plan pe 90 de zile
Cardurile se dezvăluie din mască, unul după altul. La hover: înclinare 3D de maximum 6° și parallax pe poză. Click → /club sau /business-class.

Secțiunea 4, Cifre (zona: ecranele de deasupra scaunelor). Afișate ca ecrane de bord:
700+ membri · 2.000+ destinații · [X] țări ale membrilor · [X] excursii de grup pe an.
Cifrele urcă de la 0 în 1.6s când intră în ecran, iar deasupra fiecăreia se desenează o linie aurie. Pune cifrele într-un fișier de date, ca să le pot schimba ușor.
```

---

## PROMPT 5: Misiunea, harta de zbor (secțiunea 5)

```
Secțiunea 5, Misiunea (zona JetJourney: ecranul cu harta de zbor din cabină).
Text: „Români din toată lumea, conectați prin călătorii.”
Construiește o hartă a lumii din puncte (SVG generat dintr-un dataset de țări, fără bibliotecă grea), stilizată ca ecranul de zbor dintr-un avion: fundal ink, puncte cream 20%, țările membrilor aurii.
La scroll: punctele țărilor se aprind pe rând, iar rutele de zbor se desenează ca arce punctate între ele, cu un avion mic care merge pe arc. Afișează și datele de zbor în DM Mono: „ALT 11.000 m · VITEZĂ 890 km/h · TIMP RĂMAS 02:14”.
Lista de țări vine dintr-un fișier de date.
```

---

## PROMPT 6: Clubul, văzut din interior (secțiunea 6)

```
Secțiunea 6, Clubul văzut din interior (zona JetJourney: ecranele din spătarele scaunelor).
Secțiunea stă fixată, iar 6 carduri de sticlă alunecă pe orizontală la scroll. Fiecare card e un mini-ecran care se animă când ajunge în centru:
1. Rezervare cu puncte (punctele scad, apare „Confirmat”)
2. Voucher de bun venit (se dezlipește)
3. Cashback 3% (cifra urcă)
4. Excursie de grup (avatarele se adaugă pe rând)
5. Chat-ul comunității (mesajele apar unul după altul)
6. Academie (un bilet de workshop se ștampilează)
Pe mobil: carusel cu swipe (scroll-snap), fără fixare.
```

---

## PROMPT 7: Destinații + Cum funcționează (secțiunile 7–8)

```
Secțiunea 7, Destinații (zona JetJourney: hublourile).
Un hublou mare în centru. La scroll, priveliștea din el se schimbă prin crossfade între destinațiile din src/content/destinations (generice: Bali, Maldive, Bora Bora, Dubai, Tokyo, Islanda...). Lângă hublou: următoarele 5–7 tururi, cu dată și poză. Linia punctată a avionului trece prin fiecare oprire (refolosește-o din landing). Link: „Toate destinațiile”.
Fiecare tur din colecție are pagina lui, /destinatii/[slug], generată automat.

Secțiunea 8, Cum funcționează: Te înscrii · Alegi vacanța · Te bucuri și repeți. Mută scena existentă din landing (cardul de membru, evantaiul de vacanțe, bucla) și leag-o de linia avionului.
```

---

## PROMPT 8: Trecerea în Business Class (secțiunea 9)

```
Secțiunea 9, Business Class (zona JetJourney: perdeaua cabinei, apoi lounge-ul).
Momentul-cheie al paginii: o perdea de cabină (două panouri textile, cu umbre realiste făcute din CSS și gradiente) se deschide pe orizontală, legată de scroll. Fundalul trece în bleumarin profund, iar din acest punct toate animațiile merg la jumătate de viteză și au mai mult spațiu liber.
Titlu: „Pentru cei care vor mai mult decât vacanțe.”
Trei piloni: Învață · Construiește · Crește, cu titluri strânse și cifre în DM Mono.
Sub secțiune, nota de venituri: „Rezultatele diferă de la om la om și depind de timpul și efortul investit.” cu link spre /nota-venituri.
```

---

## PROMPT 9: Evenimente + Comunitate (secțiunile 10–11)

```
Secțiunea 10, Evenimente (zona: masa din lemn de nuc a lounge-ului).
Webinarul următor are numărătoare inversă (joi, 21:00, ora României). Următoarele 3 workshop-uri sunt afișate ca boarding pass-uri: dată, oră (în fusul vizitatorului + ora României), trainer, locuri rămase. Biletele intră pe rând. La hover primesc o ștampilă „Confirmat”.
Datele vin din colecția src/content/events (editabilă cu Keystatic). Evenimentele trecute se ascund automat.

Secțiunea 11, Comunitate (teaser): peretele cu polaroide (din landing, cu poze care se „developează”) + 4–6 video-mărturii verticale care pornesc fără sunet la hover sau tap. Buton: „Intră în comunitate” → /comunitate (cu tranziția din Promptul 12).
```

---

## PROMPT 10: Întrebări frecvente, Final, Footer, WhatsApp (12–14)

```
Secțiunea 12, Întrebări frecvente: grupate pe Club · Business · Webinar. Acordeon care se deschide lin (fără salt de pagină), folosind <details> nativ ca să meargă și fără JS. Include întrebările „Este MLM?” și „Cât timp îmi ia?”, cu răspunsuri lăsate placeholder, pe care le completez eu.

Secțiunea 13, Final dublu: două bilete de avion, „Webinar gratuit (joi, 21:00)” și „Workshop Business Class”. Avionul aterizează pe bilet (refolosește animația din landing).

Secțiunea 14, Footer: apare de sub ultima secțiune, ca o cortină. Logo mare, coloane de linkuri, WhatsApp, social, pagini legale, ANPC. Datele firmei le pun ca placeholder.

Pe toate paginile: un buton WhatsApp discret în dreapta jos, cu link wa.me într-o variabilă de configurare.
```

---

## PROMPT 11: Tranzițiile dintre pagini

```
Implementează tranzițiile dintre pagini cu Astro View Transitions (ClientRouter) + GSAP.
Tranziția standard: o cortină bleumarin acoperă ecranul și un avion mic îl traversează pe linia punctată, în 0.7s. Dacă prefers-reduced-motion: doar fade.
Asigură-te că după fiecare navigare Lenis și ScrollTrigger se reinițializează corect, fără animații duble și fără memory leaks (cleanup pe astro:before-swap).
```

---

## PROMPT 12: Pagina Comunitate, care „aterizează” în alt loc

```
Construiește pagina /comunitate. De fiecare dată când e deschisă, „aterizează” într-o altă destinație din lume.

Date: src/content/landings/, cu 8–10 destinații (Bali, Maldive, Bora Bora, Dubai, Tokyo, Islanda, Machu Picchu, Cape Town). Fiecare are: nume, țară, fus orar, imagine hero (AVIF + WebP), clip opțional de 4–6s (mp4, fără sunet, loop), culoare de accent, coordonate.
Alegere: o destinație aleatorie, diferită de ultima vizitată (salvată în localStorage, cu try/catch). Pentru SEO și no-JS, se randează o destinație implicită, care apoi se schimbă pe client înainte de prima afișare (ascunsă de tranziție).

Tranziția de intrare (doar spre /comunitate, înlocuiește cortina standard), cam 2.2s în total, sărită la al doilea click:
1. Ecranul se întunecă și apare harta de zbor (refolosește harta din Promptul 5), cu ruta desenată spre destinație și textul „ZBOR CA-[nr] → BORA BORA”.
2. Tranziție prin hublou: o mască circulară, cu nori (straturi PNG care trec cu parallax).
3. Masca hubloului se mărește până acoperă tot ecranul, dezvăluind destinația. Camera face un zoom-out lent de la 115% la 100%.
4. Titlul: „Comunitatea · Ai aterizat în Bora Bora”, plus ora locală live (DM Mono), care urcă rând cu rând.

Conținutul paginii:
- Anunțuri (fixate sus, editabile din Keystatic).
- Galeria călătoriilor noastre: grid masonry cu poze din src/content/community, filtre pe destinație și an, lightbox fluid (zoom din poziția miniaturii, cu FLIP).
- Buton: „Trimite pozele tale” → formular sau WhatsApp. Postarea directă a membrilor vine în Etapa 4, cu conturi.
- Un mic selector „Schimbă destinația ✈”, care refolosește tranziția cu altă destinație.
```

---

## PROMPT 13: Mobil, accesibilitate, performanță

```
Fă un audit complet și rezolvă problemele:
- Testează la 375px, 768px și 1440px. Secțiunile fixate sunt mai scurte pe mobil, cele orizontale devin carusel, fără hover-only.
- prefers-reduced-motion: verifică fiecare secțiune.
- Lighthouse mobil: minimum 90 la Performance, Accessibility, SEO. LCP sub 2.5s pe 4G simulat. JS inițial sub 150 KB.
- Secvențele de cadre: verifică să nu blocheze prima afișare. Măsoară câți MB se descarcă în primele 5 secunde pe mobil.
- Contrast text/fundal (WCAG AA) peste toate zonele JetJourney.
- Navigare cu tastatura: focus vizibil, meniu, acordeon, lightbox.
Dă-mi un raport scurt: ce era greșit și ce ai schimbat.
```

---

## PROMPT 14: SEO, formulare, lansare

```
1. SEO: titlu, descriere și imagine OG pe fiecare pagină. Schema.org Event pentru webinar și workshop-uri, Organization pe acasă. Sitemap. Redirecturi 301 de la adresele vechi (de exemplu /platit-sa-calatoresti → /webinar) în public/_redirects.
2. Formular de înscriere la evenimente: nume, email, WhatsApp, țară, bifă GDPR. Validare pe server (Cloudflare Pages Function), Turnstile, trimitere în Brevo, pe lista evenimentului, cu sursa (UTM). Cheile API stau doar în variabile de mediu, niciodată în cod.
3. Keystatic configurat pentru: destinații, evenimente, aterizări, postări comunitate, anunțuri.
4. Deploy pe Cloudflare Pages, cu link de preview pentru fiecare branch. NU conecta domeniul calatorulantreprenor.com până nu scriu „publică”.
```

---

## Anexă: prompturi pentru imagini și clipuri (OpenArt sau alt generator)

**Stilul comun.** Pune-l la începutul fiecărui prompt, ca toate scenele să arate ca același avion:

> Photorealistic interior of an ultra-luxury private jet, cream leather seats, dark walnut wood panels, subtle gold accents, warm soft light, cinematic, shallow depth of field, editorial luxury, 16:9, no text, no people, no logos

**Cele 9 zone (imagini cheie, pe care le folosești și ca poster):**

1. Ușa: *view from the airstairs into the open jet door at golden hour, warm light inside*
2. Culoarul: *central aisle splitting, bright cabin on the left, closed navy curtain on the right*
3. Ecrane: *overhead cabin screens glowing softly*
4. Harta de zbor: *cabin wall screen showing an elegant dark world flight map*
5. Spătare: *row of seatback screens, warm reflections*
6. Hublou: *large oval window, view of [ocean / desert / mountains / city at night]*
7. Perdeaua: *heavy navy cabin curtain, slightly open, gold light behind*
8. Lounge: *deep navy lounge, curved sofa, walnut table with boarding passes*
9. Aterizare: *window view of a runway at sunset, wheels touching down*

**Clipurile dintre zone:** folosește un model video cu cadru de start și cadru de final (first/last frame). Start = imaginea zonei N, final = imaginea zonei N+1. Promptul de mișcare:

> slow smooth dolly forward camera movement, steady, no cuts, no shake, 5 seconds

Salvează clipurile ca `source-videos/<zona>.mp4`, apoi rulează `npm run frames`.

**Destinațiile pentru Comunitate** (câte una pe destinație):

> Breathtaking aerial establishing shot of [Bora Bora overwater bungalows / Bali rice terraces / Maldives sandbank / Dubai skyline at dusk / Tokyo at night / Iceland black beach / Machu Picchu at sunrise / Cape Town Table Mountain], golden hour, cinematic, 16:9, no text
