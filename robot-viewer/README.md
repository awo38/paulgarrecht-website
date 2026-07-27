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

## Echte Multi-Part-Explosion (aktuelles Modell)

Das aktuelle `robot-arm.glb` ist ein zweiter, vom Nutzer bereitgestellter
Export und unterscheidet sich grundlegend vom ursprünglichen: **16 separate
Nodes/Meshes** (Sockel, Achsen, Greifer-Segmente, Bedienpanel, …), von denen
jedes seinen **eigenen, in Blender animierten** Explosions→Montage-Clip
mitbringt (`obj_0Action` … `obj_14Action`, je 60 Keyframes, Zeitbereich
`0.0417`–`2.5` Sekunden auf einer gemeinsamen Timeline — vor dem Einbau direkt
gegen die glTF-Keyframe-Daten verifiziert, nicht angenommen). `t=0` ist die
exploded Pose (identisch mit der statischen Node-`translation`, die ohne
Animation angezeigt würde), `t=2.5` die vollständig montierte Pose.

`RobotArmViewer.jsx` nutzt dafür `@react-three/drei`s `useAnimations`, aktiviert
alle Clips einmalig (`action.play()` gefolgt von `action.paused = true`) und
scrubbt danach pro Frame nur noch `action.time` + `mixer.update(0)` anhand des
Scroll-Fortschritts (`[0, ASSEMBLE_END]` → `[0, DURATION]`) — kein
`useFrame`-Lerp einzelner Transforms mehr wie beim vorherigen Modell, da die
eigentliche Bewegung schon in den Clips steckt.

Modell ist bereits Y-up exportiert (visuell in einer eigenständigen Three.js-
Testseite ohne R3F verifiziert, bevor auf einen Achsen-Fix verzichtet wurde) —
anders als das ursprüngliche Modell ist hier **keine** `ZUP_TO_YUP`-Rotation
nötig.

Die Datei enthält außerdem einen einzelnen Node namens `Cube`: eine winzige
24-Vertex-Box mit eigenem Platzhalter-Material, die abseits des Arms auf dem
Boden sitzt — offensichtlich ein liegengebliebenes Blender-Default-Objekt,
kein Teil des Roboters. Wird beim Laden per `scene.getObjectByName('Cube')`
entfernt (Geometrie *und* zugehörige Animation werden nie abgespielt), damit
er weder rendert noch die `<Bounds>`-Rahmung verfälscht.

`<Bounds>` muss dabei die **montierte** Pose rahmen, nicht die (exploded)
Ruhe-Transform der Nodes: Beim ersten Laden werden einmalig alle Actions auf
`action.time = DURATION` gesetzt, der Mixer force-aktualisiert (`mixer.update(0)`),
die resultierende `Box3` vermessen und erst dann an `bounds.refresh(box).fit().clip()`
übergeben — exakt dieselbe "erst rendern/messen, dann zurück auf den
Scroll-Wert"-Reihenfolge wie beim vorherigen Modell, nur jetzt gegen die
Mixer-Zeit statt gegen eine Wrapper-Transform.

Der gepinnte Hero-Bereich (`#hero`, 300vh, sticky-pin bei 100svh — siehe
`index.html`) liefert die Scroll-Runway: Bei `scrollY = 0` ist das Modell
exploded, bei Fortschritt `ASSEMBLE_END` (0.6) vollständig zusammengebaut;
zurückscrollen fährt die Animation exakt rückwärts (voll bidirektional, kein
Timer, keine feste Dauer, da direkt über `action.time` und nicht über
`action.play()`/Echtzeit gesteuert).

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

### Materialfarbe wirkte unter dem Studio-HDRI blass/pink

Nach dem Modellwechsel erschien das rote Gehäusematerial unter dem
Studio-HDRI (`<Environment>`) deutlich verwaschen/pink statt gesättigt rot.
Verifiziert (in einer eigenständigen Three.js-Testseite, mit demselben
HDRI + PMREM, ganz ohne R3F/drei), dass das **keine** R3F/drei-Eigenheit ist,
sondern eine reine PBR-Lichtinteraktion: Die eher glänzigen Materialien
(`roughness ≈ 0.5`, `metalness 0`) nehmen die hellen Studio-Reflexionen als
IBL-Speculars auf, was die gesättigte Diffusfarbe aufhellt. Statt die
Materialien selbst zu verändern (ausdrücklich nicht gewünscht), wird stattdessen
die **Environment-Intensität** global gedämpft: `<Environment ... environmentIntensity={0.12}>`
(drei-Prop, mappt auf `scene.environmentIntensity`, three.js ≥ r159) — reduziert
nur den IBL-Beitrag, ohne `material.color`/`envMapIntensity` je Material
anzufassen.

## Zweiter Scroll-Akt: Kamera-Zoom auf das Bedienpanel + Werdegang-Overlay

Nach der Montage (Fortschritt `ASSEMBLE_END` = 0.6) folgt ein zweiter Akt
(`ZOOM_START` = 0.6 bis `1`): die Kamera fährt aus der Übersichtsposition
(der von `<Bounds>` einmalig berechneten Rahmung) nah an das kleine
Anzeige-Panel an der Schulter des Arms heran. Dessen Weltkoordinate
(`SCREEN_TARGET`) wurde nicht geraten, sondern durch einen Klick-Raycast auf
das zusammengebaute Modell empirisch ermittelt (`event.point`, in einer
eigenständigen Three.js-Testseite mit sichtbarem Raycast-Log) — die Nodes
heißen generisch `obj_0` … `obj_14`, es gibt also keinen selbsterklärenden
Namen, an dem sich das Panel automatisch finden ließe. `SCREEN_CAMERA_POS`
ist ebenso eine feste, im Code verifizierte Konstante (kein
Laufzeit-Trial-and-Error) — verifiziert per Screenshot-Vergleich über den
vollen Scroll-Bereich.

Sobald der Zoom-Akt beginnt, wird `<OrbitControls>` unmontiert (statt nur
`enabled={false}` zu setzen): Die Komponente ruft pro Frame intern trotzdem
`controls.update()` auf, was mit einer direkten `camera.position`/`lookAt`-
Manipulation kollidieren und die Kamera zurückspringen lassen würde. Eine
eigene `CameraZoomRig`-Komponente übernimmt die Kamera stattdessen komplett
und interpoliert (smoothstep-geglättet) zwischen der einmalig beim
Akt-Wechsel eingefangenen Ruhepose und `SCREEN_CAMERA_POS`/`SCREEN_TARGET`.
Beim Zurückscrollen unter `ZOOM_START` wird `<OrbitControls>` wieder
gemountet und explizit auf die gemerkte Ruhepose (`target`-Prop) gesetzt,
damit der nächste manuelle Orbit nicht ruckartig zu einem falschen
Drehpunkt zurückspringt.

Auf dem Panel selbst blendet ein `<Html>`-Overlay (`CareerScreen`) den
beruflichen Werdegang mit live hochzählenden Countern ein (Jahre/Monate/
Tage/Std/Min/Sek seit dem jeweiligen Datum, kalenderkorrekt berechnet in
`diffBreakdown()` — kein einfaches Millisekunden-Delta, sondern echte
Monats-/Jahresgrenzen inkl. Schaltjahren über `Date`-Arithmetik). Die
Deckkraft des Overlays ist an den Zoom-Fortschritt gekoppelt (Fade-in ab
`zoomT > 0.35`) und wird direkt per Ref/`style.opacity` pro Frame gesetzt,
nicht über React-State, um keinen Re-Render pro Frame auszulösen.
