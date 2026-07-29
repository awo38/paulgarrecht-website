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
- **Not yet built:** the manufacturing → commissioning story sections, the
  "machine data sheet" About section, the engineering-documentation project
  cards, and the contact "control interface" section.

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
