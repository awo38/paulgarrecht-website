// Shared silhouette for the pressure-vessel sketch used across sections —
// the hero draws this in once on load, the blueprint scroll story reuses
// the exact same geometry so it reads as the same machine, just examined
// more closely, rather than a different drawing.
export const VESSEL_VIEWBOX = "0 0 480 640";

export const VESSEL_STROKES = [
  // 0: main hull outline — one continuous closed contour
  "M170,140 L170,460 Q170,510 240,510 Q310,510 310,460 L310,140 Q310,90 240,90 Q170,90 170,140 Z",
  // 1: top nozzle stub
  "M225,90 L225,45 L255,45 L255,90",
  // 2: side nozzle stub + flange
  "M310,250 L368,250 L368,278 L310,278 M368,244 L368,284",
  // 3: support skirt legs + base line
  "M197,508 L182,578 M283,508 L298,578 M162,578 L318,578",
  // 4: centerline axis
  "M240,58 L240,562",
] as const;

// Isometric cylinder wireframe (CAD section onward): two elliptical cap
// cross-sections and the vertical ribs between them, shared so the CAD,
// Manufacturing and Commissioning sections all render the exact same
// "finished" 3D reading of the vessel instead of subtly different ones.
export const VESSEL_CAP_FRONT_ARCS = [
  "M170,140 A70,16 0 0 0 310,140",
  "M170,460 A70,16 0 0 1 310,460",
] as const;

export const VESSEL_CAP_BACK_ARCS = [
  "M170,140 A70,16 0 0 1 310,140",
  "M170,460 A70,16 0 0 0 310,460",
] as const;

export const VESSEL_RIBS = [
  "M170,140 L170,460",
  "M205,140 L205,460",
  "M275,140 L275,460",
  "M310,140 L310,460",
] as const;

// The assembled flange + bolt ring on the side nozzle, and the foot plates
// under the support skirt — shared between Manufacturing (where they
// assemble in) and Commissioning (where they're simply already there).
export const VESSEL_FLANGE = { x: 368, y: 262, rx: 14, ry: 7 };

export const VESSEL_BOLTS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: VESSEL_FLANGE.x + VESSEL_FLANGE.rx * Math.cos(rad),
    y: VESSEL_FLANGE.y + VESSEL_FLANGE.ry * Math.sin(rad),
  };
});

export const VESSEL_FOOT_PLATES = [
  { x: 172, y: 578, w: 20, h: 10 },
  { x: 288, y: 578, w: 20, h: 10 },
] as const;

// Color stops for the "steel" gradient fill on the hull — each section
// gives its own <linearGradient> a unique id (SVG gradient ids must be
// unique per document, and each scroll-story section is its own <svg>),
// but they all read from these same stops so the material looks identical.
export const VESSEL_STEEL_GRADIENT_STOPS = [
  { offset: "0%", color: "#4a5259" },
  { offset: "18%", color: "#aab4bf" },
  { offset: "38%", color: "#6b7480" },
  { offset: "58%", color: "#c7d0d8" },
  { offset: "78%", color: "#7d8794" },
  { offset: "100%", color: "#4a5259" },
] as const;
