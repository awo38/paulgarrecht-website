"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  VESSEL_STROKES,
  VESSEL_CAP_FRONT_ARCS,
  VESSEL_RIBS,
  VESSEL_FLANGE,
  VESSEL_BOLTS,
  VESSEL_FOOT_PLATES,
  VESSEL_STEEL_GRADIENT_STOPS,
} from "@/components/vessel-geometry";

gsap.registerPlugin(ScrollTrigger);

// Section 4 of the scroll story: picks up the crisp isometric wireframe
// from the CAD section (rendered here already-finished, static) and lets
// the workshop take over as you scroll — a steel-gradient surface fills
// the shell, the cap seams recolor to mark where they're actually welded,
// a flange assembles onto the nozzle with its bolts popping into place one
// by one, and foot plates land under the support legs. Same pin/scrub
// timeline mechanic, reversibility and reduced-motion fallback as the
// previous three sections.
const MFG_VIEWBOX = "0 0 520 640";

const STATUS_LABELS = ["STAHLOBERFLÄCHE", "SCHWEISSNÄHTE", "VERSCHRAUBT"] as const;

export default function ManufacturingStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const steelFillRef = useRef<SVGPathElement>(null);
  const seamRefs = useRef<(SVGPathElement | null)[]>([]);
  const flangeRef = useRef<SVGEllipseElement>(null);
  const boltRefs = useRef<(SVGCircleElement | null)[]>([]);
  const footRefs = useRef<(SVGRectElement | null)[]>([]);
  const statusRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const seams = seamRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const bolts = boltRefs.current.filter((c): c is SVGCircleElement => Boolean(c));
    const feet = footRefs.current.filter((r): r is SVGRectElement => Boolean(r));
    const statuses = statusRefs.current.filter((t): t is SVGTextElement => Boolean(t));

    if (reduceMotion) {
      if (sectionRef.current) sectionRef.current.style.height = "auto";
      if (steelFillRef.current) steelFillRef.current.style.opacity = "0.85";
      seams.forEach((p) => {
        p.style.stroke = "var(--orange)";
        p.style.strokeWidth = "2";
      });
      if (flangeRef.current) flangeRef.current.setAttribute("opacity", "1");
      bolts.forEach((c) => c.setAttribute("opacity", "1"));
      feet.forEach((r) => r.setAttribute("opacity", "1"));
      statuses.forEach((t, i) => t.setAttribute("opacity", i === statuses.length - 1 ? "1" : "0"));
      if (captionRef.current) captionRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      if (steelFillRef.current) gsap.set(steelFillRef.current, { opacity: 0 });
      gsap.set([flangeRef.current, ...bolts, ...feet], { opacity: 0, scale: 0.3, transformOrigin: "center" });
      gsap.set(statuses, { opacity: 0 });
      if (captionRef.current) captionRef.current.style.opacity = "0";

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          pin: stageRef.current,
          anticipatePin: 1,
        },
      });

      tl.to(captionRef.current, { opacity: 1, duration: 0.3 }, 0)
        .to(steelFillRef.current, { opacity: 0.85, duration: 1, ease: "power1.inOut" }, 0.3)
        .to(statusRefs.current[0], { opacity: 1, duration: 0.3 }, 0.6)
        .to(statusRefs.current[0], { opacity: 0, duration: 0.3 }, 1.4)
        .to(seams, { stroke: "var(--orange)", strokeWidth: 2.2, duration: 0.6, stagger: 0.2 }, 1.5)
        .to(statusRefs.current[1], { opacity: 1, duration: 0.3 }, 1.7)
        .to(statusRefs.current[1], { opacity: 0, duration: 0.3 }, 2.5)
        .to(flangeRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, 2.6)
        .to(bolts, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.12, ease: "back.out(2)" }, 2.9)
        .to(feet, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.15, ease: "back.out(1.7)" }, 3.5)
        .to(statusRefs.current[2], { opacity: 1, duration: 0.35 }, 3.7);

      if (tiltRef.current) {
        gsap.to(tiltRef.current, {
          rotationY: 7,
          rotationX: -2.5,
          duration: 6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformPerspective: 1400,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="manufacturing" className="relative h-[280vh]">
      <div
        ref={stageRef}
        className="flex h-svh w-full items-center overflow-hidden px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div ref={captionRef} className="lg:col-span-4" style={{ opacity: 0 }}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">04 — Fertigung</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Wo Stahl Gestalt annimmt.
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-muted">
              Oberfläche, Schweißnaht, Flansch und Verschraubung — jedes Bauteil findet in der
              Werkstatt seinen Platz, bevor die Anlage steht.
            </p>
          </div>

          <div className="relative lg:col-span-8" style={{ perspective: "1400px" }}>
            <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
              <svg
                viewBox={MFG_VIEWBOX}
                className="mx-auto h-auto w-full max-w-[520px]"
                role="img"
                aria-label="Gefertigter Druckbehälter mit Stahloberfläche, Schweißnähten, Flansch und Stützfüßen"
              >
                <defs>
                  <linearGradient id="mfg-steel-gradient" x1="0" y1="0" x2="1" y2="0">
                    {VESSEL_STEEL_GRADIENT_STOPS.map((stop) => (
                      <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                </defs>

                <path ref={steelFillRef} d={VESSEL_STROKES[0]} fill="url(#mfg-steel-gradient)" stroke="none" />

                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {VESSEL_STROKES.map((d, i) => (
                    <path
                      key={`hull-${i}`}
                      d={d}
                      stroke={i === 0 ? "var(--foreground)" : "var(--blue)"}
                      strokeWidth={i === 0 ? 2 : 1.4}
                      opacity={i === 0 ? 1 : i === 4 ? 0.3 : 0.8}
                    />
                  ))}

                  {VESSEL_RIBS.map((d, i) => (
                    <path key={`rib-${i}`} d={d} stroke="var(--foreground)" strokeWidth={1} opacity={0.5} />
                  ))}

                  {VESSEL_CAP_FRONT_ARCS.map((d, i) => (
                    <path
                      key={`seam-${i}`}
                      ref={(el) => {
                        seamRefs.current[i] = el;
                      }}
                      d={d}
                      stroke="var(--foreground)"
                      strokeWidth={1.6}
                    />
                  ))}
                </g>

                <ellipse
                  ref={flangeRef}
                  cx={VESSEL_FLANGE.x}
                  cy={VESSEL_FLANGE.y}
                  rx={VESSEL_FLANGE.rx}
                  ry={VESSEL_FLANGE.ry}
                  fill="var(--metal)"
                  stroke="var(--foreground)"
                  strokeWidth={1}
                />

                {VESSEL_BOLTS.map((b, i) => (
                  <circle
                    key={`bolt-${i}`}
                    ref={(el) => {
                      boltRefs.current[i] = el;
                    }}
                    cx={b.x}
                    cy={b.y}
                    r={2}
                    fill="var(--background)"
                    stroke="var(--foreground)"
                    strokeWidth={0.75}
                  />
                ))}

                {VESSEL_FOOT_PLATES.map((f, i) => (
                  <rect
                    key={`foot-${i}`}
                    ref={(el) => {
                      footRefs.current[i] = el;
                    }}
                    x={f.x}
                    y={f.y}
                    width={f.w}
                    height={f.h}
                    rx={1.5}
                    fill="var(--metal)"
                    stroke="var(--foreground)"
                    strokeWidth={1}
                  />
                ))}

                <g fontFamily="var(--font-mono)" fontSize={11} letterSpacing={0.5} fill="var(--muted)" textAnchor="end">
                  {STATUS_LABELS.map((label, i) => (
                    <text
                      key={label}
                      ref={(el) => {
                        statusRefs.current[i] = el;
                      }}
                      x={496}
                      y="60"
                    >
                      {label}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
