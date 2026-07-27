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
`iife`) zu einem einzigen, selbst-mountenden Skript, das React, R3F, drei.js
und drei/postprocessing-Abhängigkeiten bündelt. Das Skript sucht beim Laden
nach einem Element mit `id="robot-arm-root"` und rendert die Komponente
hinein.

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
