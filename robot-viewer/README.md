# robot-viewer

Eigenständige React-Komponente (`RobotArmViewer.jsx`), die das echte GLB-Modell
`public/models/robot-arm.glb` mit `@react-three/fiber` + `@react-three/drei`
rendert (OrbitControls, Studio-Umgebungslicht, Contact Shadows, automatisches
Framing via `<Bounds>`). Keine erfundene Platzhalter-Geometrie — es wird
ausschließlich das vorhandene GLB geladen.

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
`iife`) zu einem einzigen, selbst-mountenden Skript, das React, R3F, drei und
three.js bündelt. Das Skript sucht beim Laden nach einem Element mit
`id="robot-arm-root"` und rendert die Komponente hinein.

Die Assets aus `public/` (`models/robot-arm.glb`, `hdri/*.hdr`) werden beim
Build automatisch mit nach `dist-embed/` kopiert — für das Haupt-Repo liegen
identische Kopien bereits unter `../models/` und `../hdri/` (Root-relative
Pfade wie `/models/robot-arm.glb`, damit sie unabhängig vom Bundle-Speicherort
auflösen).

## Warum ein eigenes HDRI vendoren?

`@react-three/drei`s `<Environment preset="studio">` lädt standardmäßig von
einem Drittanbieter-CDN (`raw.githack.com`). Um konsistent zu bleiben mit dem
Rest der Seite (keine Drittanbieter-Requests, siehe Datenschutzhinweis in
`impressum.html`), wird die HDRI-Datei stattdessen lokal vorgehalten und über
`<Environment files="/hdri/studio_small_03_1k.hdr">` geladen.

## Achsen-Fix (Z-up → Y-up)

`robot-arm.glb` ist offenbar ohne die übliche Z-up→Y-up-Konvertierung
exportiert worden — ungedreht schaut man von unten auf das Modell. Der Fix
liegt als feste Konstante `ZUP_TO_YUP = [-Math.PI / 2, 0, 0]` auf einer
statischen äußeren `<group>` in `RobotArmViewer.jsx`, nicht auf der Kamera —
`<Bounds>` zentriert dadurch weiterhin korrekt, unabhängig von der
ursprünglichen Achsausrichtung im Export.

## Warum keine Multi-Part-Explosion?

`robot-arm.glb` besteht laut `scene.traverse()` (wird beim Laden in die
Konsole geloggt) aus **genau einem Node und einem Mesh** — die Geometrie ist
zu einer einzigen, vollständig zusammenhängenden Fläche verschmolzen (siehe
Union-Find-Analyse über den Index-Buffer: 1 zusammenhängende Komponente,
28.763 Vertices). Es gibt keine separaten Objekte für Sockel/Achsen/Greifer,
die man unabhängig voneinander explodieren und wieder zusammenfliegen lassen
könnte, ohne die Geometrie künstlich (und unrealistisch) zu zerschneiden.

Stattdessen gibt es eine **scroll-gesteuerte Single-Object-Animation**: Das
gesamte Modell interpoliert direkt zwischen einer "exploded" Pose (leicht
verkleinert, versetzt, verdreht) und der Ruhepose, abhängig vom Scroll-
Fortschritt durch den gepinnten Hero-Bereich (`#hero`, 220vh, sticky-pin bei
100svh — siehe `index.html`). Bei `scrollY = 0` ist das Modell exploded, am
Ende des Pin-Bereichs vollständig zusammengebaut; zurückscrollen explodiert
es wieder (voll bidirektional, kein Timer, keine feste Dauer).

Technisch: Die Komponente erstellt einen `ScrollTrigger` (`scrub`) auf dem
globalen `window.gsap`/`window.ScrollTrigger` der Host-Seite — dasselbe
GSAP/Lenis-Setup, das der Rest der Seite für Scroll-Effekte nutzt, damit
nichts gegeneinander läuft. Ohne diese Globals (Komponente in einem anderen
Projekt ohne GSAP eingebettet) fällt sie auf einen einfachen
`scroll`/`resize`-Listener mit derselben Fortschritts-Formel zurück, bleibt
also auch eigenständig lauffähig. Der Fortschritt (0–1) wird zusätzlich als
`assembly-progress`-`CustomEvent` auf dem Wurzel-Element ausgesendet, damit
die statische Host-Seite z. B. die Info-Chips im Hero synchron dazu einblenden
kann (siehe `index.html`), ohne eigene Scroll-Logik duplizieren zu müssen.

Für eine echte Teile-Explosion müsste das Quellmodell mit erhaltener
Objekt-/Node-Hierarchie neu exportiert werden (z. B. in Blender vor dem
Export nicht alle Objekte zu einem Mesh vereinen/joinen). Der
`console.log`-Traversal in `RobotArmViewer.jsx` zeigt sofort, ob ein neu
exportiertes GLB mehrere Nodes enthält — dann lässt sich die
Per-Part-Staffelung entsprechend nachrüsten.
