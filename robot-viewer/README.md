# robot-viewer

Trotz des (historisch gewachsenen) Ordnernamens: Dieses Unterprojekt enthält
aktuell **`PlanetsHero.jsx`** — eine Handvoll wireframe "Planeten"
(Icosaeder-Geometrie, `meshBasicMaterial({wireframe:true})`), die frei im
Hero schweben, bei Mausberührung wegbouncen und beim Scrollen zu den
Bullet-Point-Markern der Highlights-Liste im Hero-Text migrieren.

Ein früherer Ansatz (GLB-Roboterarm mit Explosions-/Kamera-Animation,
Bildschirm-Overlay mit Werdegang-Countern) wurde auf Nutzerwunsch verworfen
("ich mag den Roboterarm Hero einfach nicht") — siehe Git-Historie für
Details zu diesem Ansatz, falls er je wieder gebraucht wird. Modelle/HDRI aus
diesem Ansatz wurden aus dem Repo entfernt (~33 MB), `@react-three/drei` wird
aktuell nicht mehr genutzt (keine GLTF-/Environment-Loads mehr nötig).

Dieses Unterprojekt ist **nicht** Teil des Build-freien Haupt-Static-Sites.
Es wird einmalig lokal gebaut und das Ergebnis (`dist-embed/robot-viewer.js`)
wird manuell nach `../vendor/robot-viewer/robot-viewer.js` kopiert, wo die
Haupt-`index.html` es per normalem `<script>`-Tag einbindet.

## Entwicklung / Vorschau

```bash
npm install
npm run dev
```

Öffnet eine Vollbild-Vorschau der Komponente unter `http://localhost:5173`
(`src/App.jsx` — nur für lokale Entwicklung, nicht Teil des Deployments).

## Produktions-Bundle bauen

```bash
npm run build:embed
cp dist-embed/robot-viewer.js ../vendor/robot-viewer/robot-viewer.js
```

`vite.config.embed.js` baut `src/mount-embed.jsx` im Library-Modus (Format
`iife`) zu einem einzigen, selbst-mountenden Skript, das React, R3F und
three.js bündelt. Das Skript sucht beim Laden nach einem Element mit
`id="hero-scene-root"` und rendert `PlanetsHero` hinein — außer auf schmalen
Viewports oder bei `prefers-reduced-motion` (siehe unten), dann bleibt der
Container leer.

## Koordinatensystem: orthografische Kamera = CSS-Pixel

Der `<Canvas orthographic>` nutzt R3Fs Standard-Frustum-Größe für
orthografische Kameras (`±canvasWidth/2` × `±canvasHeight/2`), wodurch
**1 Welteinheit exakt 1 CSS-Pixel entspricht**. Das macht die Umrechnung
zwischen einer DOM-Element-Position (`getBoundingClientRect()`) und einer
3D-Weltposition trivial (reine Subtraktion, kein `project()`/`unproject()`
nötig, wie es für die perspektivische Kamera des vorherigen Roboterarm-Ansatzes
gebraucht wurde):

```js
worldX = domX_relativeToCanvas - canvasWidth / 2;
worldY = canvasHeight / 2 - domY_relativeToCanvas; // Y invertiert
```

`markerWorldPos()` in `PlanetsHero.jsx` macht genau das für jeden
`.bullet-marker`-Slot im Hero-Text.

## Bewegungslogik (alles in `useFrame`, kein React-State pro Frame)

Jeder Planet ist ein freies Partikel (`pos`/`velocity`, keine feste
Ankerposition mit Rückstell-Feder) mit drei überlagerten Kräften:

1. **Ambientes Wandern**: eine langsam rotierende Beschleunigung
   (`WANDER_STRENGTH`, aus `speed`/`phase` pro Planet abgeleitet) sorgt
   dafür, dass ein unberührter Planet trotzdem stetig meandert, statt
   still zu stehen.
2. **Maus-Abstoßung**: pro Frame wird die Weltposition des Mauszeigers
   (`state.pointer` von R3F, keine manuellen DOM-Listener) mit der
   tatsächlichen Planetenposition verglichen. Innerhalb eines
   Einflussradius (`config.radius + INFLUENCE_PAD`) bekommt `velocity`
   einen kontinuierlichen, falloff-skalierten Schubs weg vom Zeiger
   (`REPULSE_STRENGTH`). Kein Feder-Rückzug — der Planet treibt danach
   frei weiter und verliert Tempo nur durch Reibung
   (`FRICTION`, exponentieller Geschwindigkeits-Abbau pro Sekunde), wie ein
   Ballon, der angestoßen wird und langsam ausrollt statt zurückzuschnappen.
3. **Weiche Eingrenzung**: jeder Planet bewegt sich frei innerhalb eines
   eigenen Bereichs um seine aus dem Canvas-Seitenverhältnis abgeleitete
   Ruheposition (`biasX`/`biasY` × Canvas-Breite/-Höhe, proportional bei
   Resize) mit individuellem Halbmaß (`roamX`/`roamY`). Erreicht er den Rand
   dieses Bereichs, wird die Geschwindigkeitskomponente reflektiert und
   gedämpft (`BOUNCE_RESTITUTION`) — ein sanftes Abprallen, kein hartes Klemmen,
   das ihn aber aus der Textspalte und dem Revier der anderen Planeten
   heraushält.
4. **Scroll-Migration**: `progress` (0–1, aus GSAP `ScrollTrigger.scrub` auf
   `#hero`, mit Fallback auf einen einfachen `scroll`-Listener) lerpt
   (smoothstep-geglättet) zwischen der aktuellen, live simulierten Position
   und der pro Frame berechneten Marker-Weltposition, während gleichzeitig
   auf `DOCKED_RADIUS_PX` und `DOCKED_COLOR` interpoliert wird. Rein
   scroll-gesteuert, kein Autoplay, jederzeit durch Zurückscrollen umkehrbar.

Es gibt bewusst keine Planet-zu-Planet-Kollisionsvermeidung — beim freien
Wandern oder einem Bounce können sich zwei Planeten kurzzeitig visuell
überlappen. Für die aktuelle "Handvoll Planeten"-Größenordnung akzeptabel;
bei Bedarf ließe sich eine einfache paarweise Abstandsfeder ergänzen.

## Mobile / `prefers-reduced-motion`-Fallback

Unter 768px CSS-Breite gibt es im Hero nur noch eine einspaltige, volle
Textbreite — ohne freien Bereich, in dem Planeten schweben könnten, ohne
ständig auf dem Text zu liegen. `mount-embed.jsx` mountet die Szene deshalb
dort gar nicht erst (ebenso bei `prefers-reduced-motion: reduce`); `index.html`
gibt den `.bullet-marker`-Slots in genau diesen Fällen per CSS einen
schlichten, statischen Punkt, damit die Liste trotzdem wie eine bewusst
gestaltete Aufzählung aussieht.
