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
