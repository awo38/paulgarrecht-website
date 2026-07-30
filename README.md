# paulgarrecht-website

Persönliche Portfolio-Website von Paul Garrecht — Projektingenieur & Einsatzleiter im kerntechnischen Rückbau bei MHC Anlagentechnik.

Die Seite ist gleichzeitig ein kleines Hobby-Projekt: ein reales Beispiel dafür, wie man mit KI-Tools (Claude, Claude Code) etwas baut, statt nur ein Spielzeug-Demo.

## Stack

- Statisches HTML/JS, keine Build-Tools zum Ausliefern der Seite
- [Tailwind CSS](https://tailwindcss.com/) — einmalig lokal zu `vendor/tailwind/tailwind.css` kompiliert (siehe `tailwind-src/`), im Browser läuft kein Build-Schritt
- Hero-3D-Modell: echtes GLB-Modell (`models/robot-arm.glb`), gerendert über eine React/`@react-three/fiber`/`@react-three/drei`-Komponente (`robot-viewer/`), die einmalig zu einem einzelnen Skript gebaut und als `vendor/robot-viewer/robot-viewer.js` eingebunden wird — siehe `robot-viewer/README.md`
- [GSAP](https://gsap.com/) + ScrollTrigger für Reveal-Effekte beim Scrollen
- [Lenis](https://lenis.darkroom.engineering/) für butterweiches Smooth-Scrolling, synchronisiert mit GSAPs Ticker
- Fonts: Space Grotesk, Inter, IBM Plex Mono (Google Fonts)

### Tailwind neu kompilieren

Nur nötig, wenn neue Utility-Klassen in `index.html` verwendet werden:

```bash
bash tailwind-src/build.sh
```

Schreibt das Ergebnis nach `vendor/tailwind/tailwind.css` (das ist die Datei, die die Seite tatsächlich lädt).

### 3D-Viewer neu bauen

Nur nötig, wenn `robot-viewer/src/RobotArmViewer.jsx` geändert wird:

```bash
cd robot-viewer
npm install   # einmalig
npm run build:embed
cp dist-embed/robot-viewer.js ../vendor/robot-viewer/robot-viewer.js
```

Details siehe `robot-viewer/README.md`.

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
- `robot-viewer/` — eigenständiges Vite+React-Projekt für den 3D-Modell-Viewer (`RobotArmViewer.jsx`); das kompilierte Ergebnis liegt in `vendor/robot-viewer/`
- `models/robot-arm.glb`, `hdri/studio_small_03_1k.hdr` — Assets für den 3D-Viewer (lokal gehostet, keine Drittanbieter-CDNs)
- `vendor/` — lokal vorgehaltene Bibliotheken (GSAP, Lenis, Tailwind-Output, 3D-Viewer-Bundle) statt Drittanbieter-CDNs
