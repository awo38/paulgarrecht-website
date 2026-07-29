# Paul Garrecht — Portfolio (Next.js rewrite)

This is the new Next.js + TypeScript build of the site — an award-level,
scroll-driven "engineering story" experience (hand sketch → engineering →
CAD → manufacturing → commissioning), replacing the static-HTML site at the
repository root. It is being built **phase by phase**; the legacy static
site (`../index.html` etc.) stays live and untouched until this rewrite has
reached full parity and is explicitly swapped in.

## Status

- **Phase 1 (done):** Hero — name/title/CTA, a pressure-vessel technical
  sketch that draws itself in on load (`components/BlueprintVessel.tsx`),
  smooth scrolling (Lenis + GSAP ticker, `components/SmoothScroll.tsx`), a
  CAD-style crosshair cursor with a live coordinate readout and hover
  measurement bracket (`components/CustomCursor.tsx`), and the dark
  industrial background grid.
- **Phase 2 (done):** the "Blueprint" scroll story
  (`components/BlueprintStory.tsx`) — a pinned, scrub-driven section where
  the hero's vessel (shared geometry in `components/vessel-geometry.ts`)
  gains reference axes, construction lines, a wall-thickness dimension and a
  hand-written margin note (Caveat font) as you scroll, fully reversible in
  both directions, with a static fallback under `prefers-reduced-motion`.
- **Phase 3 (done):** the "Engineering" scroll story
  (`components/EngineeringStory.tsx`) — the same vessel, decluttered of the
  Blueprint section's axes/construction lines, gaining real documentation
  as you scroll: ISO-style weld symbols with leaders on both girth seams,
  a material callout (1.4571 / X6CrNiMoTi17-12-2), a routed pipe connection
  to a flange (DN50 · PN16), and a DIN/EN/ISO standards stamp. Same
  pinned-timeline mechanic and reduced-motion fallback as phase 2; renders
  the vessel in its own wider local viewBox so the annotation labels have
  room without affecting the shared geometry used elsewhere.
- **Phase 4 (done):** the "CAD" scroll story (`components/CADStory.tsx`) —
  the flat 2D drawing fades to a ghost as an isometric wireframe cylinder
  (two elliptical cap cross-sections + vertical ribs) takes its place; the
  far/hidden half of each cap arc dims in first, then drops out entirely
  ("hidden lines disappear"); what remains thickens and brightens to a
  crisp finish ("edges become crisp"); a small continuous 3D tilt (CSS
  `perspective` + GSAP `rotationY/rotationX`, independent of scroll) stands
  in for "small camera movement" ahead of a real Three.js pass in a later
  phase. Status labels (DRAHTMODELL → VERDECKTE LINIEN ENTFERNT → KANTEN
  BEREINIGT) track the transformation. Same pin/scrub mechanic and
  reduced-motion fallback as phases 2–3.
- **Phase 5 (done):** the "Manufacturing" scroll story
  (`components/ManufacturingStory.tsx`) — the crisp CAD wireframe from phase
  4 (rendered here already-finished) receives a steel-gradient surface fill
  as you scroll, the cap seams recolor to orange to mark them as actual weld
  seams, and a flange assembles onto the side nozzle with its six bolts
  popping into place one by one (`back.out` easing), followed by foot plates
  landing under the support legs. Status labels (STAHLOBERFLÄCHE →
  SCHWEISSNÄHTE → VERSCHRAUBT) track the stages. Same pin/scrub mechanic,
  ambient 3D tilt and reduced-motion fallback as phase 4.

  Note for anyone extending this file: SVG shape elements (`<ellipse>`,
  `<circle>`, `<rect>`) without an explicit `transform-box` resolve
  `transform-origin` against their own bounding box, not the SVG's user
  coordinate space — passing absolute canvas coordinates (e.g. `"368px
  262px"`) as `transformOrigin` scales the element from a point wildly
  outside itself. The plain `"center"` keyword (or `"50% 50%"`) is what you
  want for "scale from its own middle," and is what every scale-pop element
  in this component uses.

  The isometric cap arcs/ribs, the flange + bolt ring, the foot plates and
  the steel-gradient color stops were pulled out of this component into
  `vessel-geometry.ts` (`VESSEL_CAP_FRONT_ARCS`/`VESSEL_CAP_BACK_ARCS`/
  `VESSEL_RIBS`/`VESSEL_FLANGE`/`VESSEL_BOLTS`/`VESSEL_FOOT_PLATES`/
  `VESSEL_STEEL_GRADIENT_STOPS`) so the CAD, Manufacturing and Commissioning
  sections all render the identical "finished" vessel instead of three
  subtly-drifting copies; `CADStory.tsx` was updated to import the same
  constants. Each section still needs its own `<linearGradient>` with a
  unique `id` (SVG gradient ids are document-global and each section is its
  own `<svg>`), just fed from the shared stops.
- **Phase 6 (done):** the "Commissioning" scroll story
  (`components/CommissioningStory.tsx`) — the last of the five scroll-story
  sections. Picks up the finished, assembled vessel from Manufacturing
  (rendered already-complete, static) and brings it to life as you scroll:
  a green running lamp lights up, a pressure gauge appears with its needle
  settling into a reading, an amber lamp arrives and starts a slow subtle
  blink, and a few soft steam wisps begin drifting from the top vent.
  Status labels (SYSTEMPRÜFUNG → MESSTECHNIK AKTIV → IN BETRIEB) track the
  stages. The lamp blink, needle wobble and steam drift are independent
  ambient loops — like the CAD/Manufacturing tilt — that start once
  revealed and keep going rather than being tied to scroll position;
  amplitudes are kept deliberately small per the brief ("nothing
  exaggerated"). The needle rotation is animated by recomputing its `x2`/
  `y2` endpoint via trig in an `onUpdate` callback rather than a CSS
  `rotation` transform, sidestepping the transform-origin bounding-box trap
  above entirely for a small pivoting shape. Same pin/scrub mechanic and
  reduced-motion fallback (steady lamps, resting needle, static faint
  steam, no tilt) as the previous sections.

  This completes the "hand sketch → engineering → CAD → manufacturing →
  commissioning" scroll story from the original brief.
- **Phase 7 (done):** the About section (`components/AboutNameplate.tsx`)
  — "instead of a biography, a machine data sheet." A stainless-steel
  nameplate (brushed-metal gradient, corner rivets, engraved-look text via
  layered `text-shadow`) with real fields instead of prose: Name, Position,
  Spezialisierung, Arbeitgeber (MHC Anlagentechnik, seit 2019), Ausbildung
  (B.Eng. Mechatronik), Zertifizierung (IWE, seit 2023), Software
  (SolidWorks · AutoCAD · Excel VBA — pulled from the real skills list in
  the legacy static site's `#skills-grid`, not invented), Normen (DIN EN
  13480 · EN 1090 · ISO 3834, consistent with the Engineering section),
  Werkstoffe and Standort. Unlike the five scroll-story sections, this is
  **not** pinned or scrubbed — it's a normal section that simply reveals
  once (fade + slight scale-up) when scrolled into view, since there's no
  multi-stage transformation to narrate here; reduced-motion just skips the
  reveal and shows it immediately.
- **Phase 8 (done):** the Projects section (`components/ProjectDossiers.tsx`)
  — displayed like engineering documentation sheets, not a portfolio
  gallery. Deliberately does **not** use the brief's literal example fields
  (Project Number / Volume / Pressure / Weight / Completion Status): those
  fit a vessel-fabrication project list, not Paul's actual work, which is
  four ongoing professional focus areas (Rückbau, Piping/Druckgeräte, IWE/
  Qualitätssicherung, Einsatzleitung — the same four already on the legacy
  static site's `#projects-grid`) without disclosable project-specific
  numbers. Fabricating volume/pressure/weight figures for real work would
  misrepresent it, so each card instead documents Bereich (domain) and
  Rolle (Paul's actual function), which are true. Hover animation: the
  brief's "blueprint transforms into final render," done at card scale — a
  small vessel-silhouette icon (same shared hull path) goes from a thin
  dashed blue outline to a solid, steel-gradient-filled render on `:hover`,
  in pure CSS (`group-hover` + `transition`), since it's a hover
  micro-interaction rather than a scroll narrative. Cards fade/stagger in
  once when scrolled into view, same non-scrubbed pattern as the About
  section.
- **Not yet built:** the contact "control interface" section.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger ·
Lenis · Three.js / @react-three/fiber (for later 3D phases) · Framer Motion.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```

## Notes for this Next.js version

This project was scaffolded on Next.js 16, which has notable breaking
changes from earlier majors — see `AGENTS.md` in this directory before
assuming an API from older Next.js knowledge still applies.
