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

## Echte Multi-Part-Explosion + gebackene Kamera-Fahrt (aktuelles Modell)

`robot-arm.glb` ist ein vom Nutzer bereitgestellter Export mit **16 separaten
Nodes/Meshes** (Sockel, Achsen, Greifer-Segmente, Bedienpanel, …), von denen
jedes seinen **eigenen, in Blender animierten** Explosions→Montage-Clip
mitbringt (`obj_0Action` … `obj_14Action`, je 60 Keyframes, Zeitbereich
`0.0417`–`2.5` Sekunden). Eine spätere Export-Iteration hat zusätzlich einen
**eigenen Kamera-Node samt Animation** hinzugefügt (`CameraAction.001`,
`0`–`3.75` Sekunden, `gltf.cameras[0]`) — die komplette Kamerafahrt vom
Weitwinkel-Establishing-Shot bis zum Nahaufnahme-Zoom aufs Bedienpanel ist
also bereits im Modell enthalten, nicht mehr im Code gebaut. Alle Zeitbereiche
wurden vor dem Einbau direkt gegen die glTF-Keyframe-Daten verifiziert, nicht
angenommen.

`t=0` ist jeweils die exploded/Weitwinkel-Pose (identisch mit der statischen
Node-`translation`, die ohne Animation angezeigt würde), `t=Ende` die
vollständig montierte Pose bzw. der Nahaufnahme-Zoom.

### Scroll-Scrubbing beider Clip-Arten parallel

`RobotArmViewer.jsx` nutzt `@react-three/drei`s `useAnimations`, aktiviert
alle Clips einmalig (`action.play()` gefolgt von `action.paused = true`) und
scrubbt danach **pro Frame** nur noch:

```js
action.time = progress * action.getClip().duration;
mixer.update(0);
```

— für *jeden* Clip (die 15 Objekt-Clips **und** den Kamera-Clip) mit demselben
`progress` (0–1 über den gepinnten Hero-Bereich), aber jeweils gegen die
**eigene** Clip-Dauer skaliert. Das bedeutet: Montage (2.5s) und Kamerafahrt
(3.75s) laufen unterschiedlich schnell, aber beide erreichen ihr Ende exakt
bei `progress = 1` — kein manuelles Phasen-Splitting (kein `ASSEMBLE_END`/
`ZOOM_START` mehr wie in einer früheren, jetzt ersetzten Fassung) nötig.

`gltf.cameras[0]` wird per `useThree().set({ camera: gltf.cameras[0] })` einmalig
zur aktiven R3F-Kamera gemacht, sobald das GLB geladen ist. Es gibt **kein**
`<OrbitControls>` und **kein** `<Bounds>` mehr — die komplette Kamerafahrt ist
vollständig durch das Modell vorgegeben, keine Nutzerinteraktion während der
Fahrt (siehe Anfrage: "kein OrbitControls während der gesamten gescripteten
Fahrt").

Modell ist bereits Y-up exportiert (visuell in einer eigenständigen Three.js-
Testseite ohne R3F verifiziert) — keine `ZUP_TO_YUP`-Rotation nötig. Die Datei
enthält außerdem einen einzelnen Node namens `Cube`: eine winzige 24-Vertex-Box
mit eigenem Platzhalter-Material, die abseits des Arms auf dem Boden sitzt —
offensichtlich ein liegengebliebenes Blender-Default-Objekt, kein Teil des
Roboters. Wird beim Laden per `scene.getObjectByName('Cube')` entfernt
(Geometrie *und* zugehörige Animation werden nie abgespielt).

Der gepinnte Hero-Bereich (`#hero`, 300vh, sticky-pin bei 100svh — siehe
`index.html`) liefert die Scroll-Runway. Technisch erstellt die Komponente
einen `ScrollTrigger` (`scrub`) auf dem globalen `window.gsap`/
`window.ScrollTrigger` der Host-Seite — dasselbe GSAP/Lenis-Setup, das der
Rest der Seite für Scroll-Effekte nutzt. Ohne diese Globals fällt sie auf
einen einfachen `scroll`/`resize`-Listener mit derselben Fortschritts-Formel
zurück, bleibt also auch eigenständig lauffähig. Der Fortschritt (0–1) wird
zusätzlich als `assembly-progress`-`CustomEvent` auf dem Wurzel-Element
ausgesendet (für z. B. die Info-Chips im Hero, siehe `index.html`).

### Materialfarbe wirkte unter dem Studio-HDRI blass/pink

Unter dem Studio-HDRI (`<Environment>`) erschien das rote Gehäusematerial
deutlich verwaschen/pink statt gesättigt rot. Verifiziert (in einer
eigenständigen Three.js-Testseite, mit demselben HDRI + PMREM, ganz ohne
R3F/drei), dass das **keine** R3F/drei-Eigenheit ist, sondern eine reine
PBR-Lichtinteraktion: Die eher glänzigen Materialien (`roughness ≈ 0.5`,
`metalness 0`) nehmen die hellen Studio-Reflexionen als IBL-Speculars auf, was
die gesättigte Diffusfarbe aufhellt. Statt die Materialien selbst zu verändern
(ausdrücklich nicht gewünscht), wird stattdessen die **Environment-Intensität**
global gedämpft: `<Environment ... environmentIntensity={0.12}>` (drei-Prop,
mappt auf `scene.environmentIntensity`, three.js ≥ r159).

## Bildschirm-Tracking + Werdegang-Overlay

Das kleine Anzeige-Panel an der Schulter des Arms ist Node **`obj_2_2`**:
`obj_2` ist die Schulter-Baugruppe, GLTFLoader zerlegt deren 4 Materialien in
Kind-Meshes `obj_2_1`..`obj_2_4`, und `obj_2_2` trägt das hellblau-graue
"Screen-Glas"-Material — per `scene.traverse()` gefunden und dessen
Weltposition gegen einen früher per Klick-Raycast ermittelten Referenzpunkt
verifiziert (siehe Git-Historie), nicht geraten.

Pro Frame wird die Weltraum-Bounding-Box von `obj_2_2` (`Box3.setFromObject`)
neu vermessen (der Node bewegt sich ja mit der Montage-Animation), alle 8
Ecken werden per `Vector3.project(camera)` in Normalized-Device-Coordinates
projiziert und in CSS-Pixel relativ zum Canvas-Container umgerechnet
(`(ndc*0.5+0.5) * size.width/height`, Y invertiert). Das Ergebnis positioniert
und skaliert einen absolut positionierten DOM-Container exakt über dem echten
Bildschirm-Mesh, unabhängig davon, wo Montage-Animation und Kamera gerade
stehen.

**Es erscheint nichts, bevor die Kamera am Bildschirm angekommen ist**: Der
Container bleibt bis `progress = SCREEN_REVEAL_START` (0.85) komplett
transparent und blendet erst danach ein (linear bis `progress = 1`). Das
Werdegang-Overlay (`CareerScreen`) zeigt den beruflichen Werdegang mit live
hochzählenden Countern (Jahre/Monate/Tage/Std/Min/Sek seit dem jeweiligen
Datum, kalenderkorrekt berechnet in `diffBreakdown()` — echte
Monats-/Jahresgrenzen über `Date`-Arithmetik, kein Millisekunden-Delta).

Da der getrackte Bildschirm-Rect anfangs (kurz nach `SCREEN_REVEAL_START`)
noch recht klein ist, aber `CareerScreen` eine feste Wunschgröße hat, wird die
Karte per `transform: scale(...)` an den jeweils aktuellen Rect angepasst
(nie größer als ihre natürliche Größe, aber beliebig kleiner) statt einfach
abgeschnitten zu werden. Die natürliche Größe wird einmalig beim ersten Frame
per `getBoundingClientRect()` gemessen (bevor je ein Transform angewendet
wurde) und danach wiederverwendet. Alle Positions-/Größen-/Opacity-Updates
laufen direkt per Ref/`style.*`-Zuweisung in `useFrame`, nicht über
React-State, um keinen Re-Render pro Frame auszulösen.

## Kein Rahmen + Vollbild-Übernahme am Ende ("die Seite baut sich im Bildschirm auf")

`.viewer-wrap` hat bewusst **keine** Border/Glass-Optik mehr (kein `glass`,
kein `border-radius`) — die Szene soll wie ein nahtloser Teil der Seite
wirken, nicht wie ein eingerahmtes Widget, gerade weil sie sich am Ende der
Sequenz zum kompletten Viewport aufweitet.

Ab `EXPAND_START` (0.85, synchron mit `SCREEN_REVEAL_START`) wächst
`RobotArmViewer`s Wurzel-`<div>` (per Ref direkt manipuliert, nicht über
React-State) von seiner gedockten Seitenposition zu einem `position: fixed`-
Overlay, das bei `progress = 1` exakt den ganzen Viewport (`0,0,innerWidth,
innerHeight`) einnimmt — der Bildschirm, in den die Kamera zoomt, füllt damit
am Ende buchstäblich die ganze Seite. Technik: die gedockte Rect (`getBoundingClientRect()`)
wird einmalig eingefroren, sobald `progress` über `EXPAND_START` steigt; die
Zwischenwerte sind reine `lerp()`s zwischen dieser Rect und dem Vollbild-Rect,
pro Scroll-Tick neu berechnet — voll reversibel, kein Autoplay, keine
CSS-Transition auf Position/Größe (nur auf `opacity`, s. u.), damit nichts
gegenüber dem Scroll nachhinkt.

Da `position: fixed` weder von den `position: sticky`-Ancestors (`.hero-pin`)
noch von `overflow: hidden` auf `.viewer-wrap` eingefangen wird (keiner der
Ancestors setzt `transform`/`filter`/`perspective`, was sonst einen
Containing-Block für Fixed-Descendants aufspannen würde — und Lenis läuft
hier über echtes natives Scrollen, nicht über eine transformierte
Scroll-Wrapper-Div, vor dem Einbau anhand von `vendor/lenis/lenis.css`
verifiziert), wächst das Overlay tatsächlich relativ zum echten Viewport,
nicht nur innerhalb seines Grid-Containers.

### Danach: Fade-out und Übergabe an die echte Seite

Sobald der Nutzer über das Ende der Sequenz hinausscrollt, muss das
Vollbild-Overlay verschwinden (sonst blockiert es für immer die eigentliche
Seite darunter, da `position: fixed` unabhängig vom normalen Dokumentfluss
bleibt). Das klingt nach einem Job für GSAP ScrollTriggers `isActive`/
`onLeave`/`onEnterBack` — beide Wege wurden ausprobiert und beide zeigten
dieselbe Grenzfall-Falle: sie kippen bereits **exakt bei** `progress = 1`,
nicht erst nachdem tatsächlich weitergescrollt wurde (verifiziert per
Playwright: `onLeave` feuerte schon beim ersten Erreichen des Endpunkts).
Zusätzlich feuert ein scrub-gebundenes `onUpdate` grundsätzlich nur, solange
sich am gemeldeten `progress` selbst etwas ändert — sobald der bei `1`
einrastet, bleiben spätere Scroll-Events dieses Triggers unbeachtet, selbst
wenn real weitergescrollt wird.

Deshalb läuft die "past end"-Erkennung als **komplett eigenständiger**
`scroll`/`resize`-Listener, unabhängig von GSAPs Trigger-Zustandsmaschine:
er vergleicht die rohe Scroll-Position direkt gegen `heroEl`s eigene
Höhe/Position mit einem festen Zusatz-Puffer (`PAST_END_BUFFER_PX = 24`) und
schaltet erst danach `opacity` auf `0` (mit einer echten CSS-`transition`,
da dieser Übergang — anders als Position/Größe oben — bewusst NICHT
scroll-synchron sein soll, sondern weich einblendet/ausblendet).
