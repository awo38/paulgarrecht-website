"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { VESSEL_VIEWBOX, VESSEL_STROKES } from "@/components/vessel-geometry";

// A hand-drawn-feeling technical sketch of a pressure vessel that draws
// itself in on load, like a pencil tracing a blueprint: each stroke gets its
// own length via getTotalLength(), starts fully dash-offset (invisible), and
// animates to 0 offset in sequence — hull first, then nozzles and the
// support skirt, then the dimension lines, with the text annotations fading
// in last once the linework is mostly settled. A very slow, small vertical
// drift keeps it from feeling frozen once the intro finishes.
const STROKES = VESSEL_STROKES;

const DIMENSIONS = [
  // 5: height dimension line (left)
  "M112,90 L132,90 M112,510 L132,510 M120,90 L120,510",
  // 6: diameter dimension line (bottom)
  "M170,548 L170,568 M310,548 L310,568 M170,558 L310,558",
] as const;

const LABELS = [
  { x: 96, y: 300, text: "H 2400", anchor: "end" as const, rotate: -90 },
  { x: 240, y: 590, text: "⌀ 1200", anchor: "middle" as const, rotate: 0 },
  { x: 378, y: 264, text: "DN50", anchor: "start" as const, rotate: 0 },
  { x: 240, y: 30, text: "N1", anchor: "middle" as const, rotate: 0 },
];

export default function BlueprintVessel({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const cornerTagRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paths = strokeRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const labels = labelRefs.current.filter((t): t is SVGTextElement => Boolean(t));

    if (reduceMotion) {
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      labels.forEach((t) => t.setAttribute("opacity", "1"));
      cornerTagRef.current?.setAttribute("opacity", "1");
      return;
    }

    const ctx = gsap.context(() => {
      paths.forEach((path, i) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: i < STROKES.length ? 1.1 : 0.7,
          delay: i < STROKES.length ? i * 0.35 : STROKES.length * 0.35 + (i - STROKES.length) * 0.25,
          ease: "power2.out",
        });
      });

      const introDuration = STROKES.length * 0.35 + DIMENSIONS.length * 0.25 + 0.9;

      gsap.set(labels, { opacity: 0, y: 6 });
      gsap.to(labels, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power1.out",
        delay: introDuration - 0.2,
      });

      if (cornerTagRef.current) {
        gsap.set(cornerTagRef.current, { opacity: 0 });
        gsap.to(cornerTagRef.current, { opacity: 1, duration: 0.6, delay: introDuration });
      }

      // Subtle idle float once the sketch has finished drawing itself.
      if (groupRef.current) {
        gsap.to(groupRef.current, {
          y: 7,
          duration: 5.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: introDuration + 0.3,
        });
      }
    }, svgRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={VESSEL_VIEWBOX}
      className={className}
      role="img"
      aria-label="Technische Skizze eines Druckbehälters"
    >
      <g
        ref={groupRef}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {STROKES.map((d, i) => (
          <path
            key={`stroke-${i}`}
            ref={(el) => {
              strokeRefs.current[i] = el;
            }}
            d={d}
            stroke={i === 0 ? "var(--metal)" : "var(--blue)"}
            strokeWidth={i === 0 ? 2 : 1.4}
            opacity={i === 4 ? 0.35 : 0.85}
          />
        ))}
        {DIMENSIONS.map((d, i) => (
          <path
            key={`dim-${i}`}
            ref={(el) => {
              strokeRefs.current[STROKES.length + i] = el;
            }}
            d={d}
            stroke="var(--orange)"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}
        {LABELS.map((label, i) => (
          <text
            key={label.text}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            fontFamily="var(--font-mono)"
            fontSize={12}
            letterSpacing={0.5}
            fill="var(--orange)"
            transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
          >
            {label.text}
          </text>
        ))}
      </g>
      <g ref={cornerTagRef} fontFamily="var(--font-mono)" fill="var(--muted)" opacity={0}>
        <text x={16} y="622" fontSize={10} letterSpacing={0.5}>
          DWG NO. PV-2026-01 · REV A
        </text>
        <text x={464} y="622" fontSize={10} letterSpacing={0.5} textAnchor="end">
          SCALE 1:20
        </text>
      </g>
    </svg>
  );
}
