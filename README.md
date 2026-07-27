# paulgarrecht-website

Persönliche Portfolio-Website von Paul Garrecht — Projektingenieur & Einsatzleiter im kerntechnischen Rückbau bei MHC Anlagentechnik.

Die Seite ist gleichzeitig ein kleines Hobby-Projekt: ein reales Beispiel dafür, wie man mit KI-Tools (Claude, Claude Code) etwas baut, statt nur ein Spielzeug-Demo.

## Stack

- Statisches HTML/JS, keine Build-Tools zum Ausliefern der Seite
- [Tailwind CSS](https://tailwindcss.com/) — einmalig lokal zu `vendor/tailwind/tailwind.css` kompiliert (siehe `tailwind-src/`), im Browser läuft kein Build-Schritt
- [Three.js](https://threejs.org/) für das 3D-Robotermodell im Hero (prozedurale Geometrie, kein externes Modell) inkl. Wireframe → CAD → Render-Materialübergang
- [GSAP](https://gsap.com/) + ScrollTrigger für die scroll-gesteuerte Montage im Hero und die Reveal-Effekte auf der restlichen Seite
- [Lenis](https://lenis.darkroom.engineering/) für butterweiches Smooth-Scrolling, synchronisiert mit GSAPs Ticker
- Fonts: Space Grotesk, Inter, IBM Plex Mono (Google Fonts)

### Tailwind neu kompilieren

Nur nötig, wenn neue Utility-Klassen in `index.html` verwendet werden:

```bash
bash tailwind-src/build.sh
```

Schreibt das Ergebnis nach `vendor/tailwind/tailwind.css` (das ist die Datei, die die Seite tatsächlich lädt).

## Lokal ansehen

Kein Build-Schritt nötig — einfach `index.html` im Browser öffnen, oder für sauberes lokales Serving:

```bash
python3 -m http.server 8000
```

dann `http://localhost:8000` öffnen.

## Deployment

Gedacht für [Vercel](https://vercel.com) (Static-Site-Import, kein Framework nötig) oder GitHub Pages. Bei Vercel: Repo importieren, kein Build-Command nötig, Output-Directory `.` (Root).

## Struktur

- `index.html` — die eigentliche Website
- `dokumente.html` — Zertifikate & Dokumente
- `impressum.html` — Impressum & Datenschutzhinweise
- `tailwind-src/` — Tailwind-Quellkonfiguration (`tailwind.config.js`, `input.css`, `build.sh`); das kompilierte Ergebnis liegt in `vendor/tailwind/`
- `vendor/` — lokal vorgehaltene Bibliotheken (Three.js, GSAP, Lenis, Tailwind-Output) statt Drittanbieter-CDNs
