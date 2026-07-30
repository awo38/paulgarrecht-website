"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VESSEL_VIEWBOX, VESSEL_STROKES } from "@/components/vessel-geometry";

gsap.registerPlugin(ScrollTrigger);

// Section 1 of the scroll story: the vessel from the hero is already drawn
// — this section is the formal engineering drawing being built up around
// it as you scroll, one drafting layer at a time: reference axes, then
// construction lines, then a dimension, then a handwritten margin note.
// Everything is driven by one GSAP timeline pinned + scrubbed to this
// section's own scroll distance, so scrolling forward/back moves the
// drawing forward/back exactly in step — no autoplay.
const AXES = [
  "M28,600 L456,600 M448,592 L456,600 L448,608",
  "M32,616 L32,24 M24,32 L32,24 L40,32",
] as const;

const CONSTRUCTION = [
  "M170,140 L64,140 M170,460 L64,460 M64,140 L64,460",
  "M64,175 L92,140",
] as const;

const WALL_DIMENSION = "M300,335 L300,365 M316,335 L316,365 M300,350 L316,350";

const LEADER = "M300,136 Q288,116 264,98";

export default function BlueprintStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const axesRefs = useRef<(SVGPathElement | null)[]>([]);
  const constructionRefs = useRef<(SVGPathElement | null)[]>([]);
  const wallDimRef = useRef<SVGPathElement>(null);
  const wallLabelRef = useRef<SVGTextElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const noteRef = useRef<SVGTextElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const axisLabelsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const axesPaths = axesRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const constructionPaths = constructionRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const drawnPaths = [...axesPaths, ...constructionPaths, wallDimRef.current, leaderRef.current].filter(
      (p): p is SVGPathElement => Boolean(p)
    );

    if (reduceMotion) {
      // No scroll-scrub, so the tall pin spacer would otherwise just be
      // dead empty scroll space — collapse it back to a normal section.
      if (sectionRef.current) sectionRef.current.style.height = "auto";
      drawnPaths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      [wallLabelRef.current, noteRef.current].forEach((t) => t?.setAttribute("opacity", "1"));
      axisLabelsRef.current?.setAttribute("opacity", "1");
      if (captionRef.current) captionRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      drawnPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set([wallLabelRef.current, noteRef.current], { opacity: 0 });
      gsap.set(axisLabelsRef.current, { opacity: 0 });
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
        .to(axesPaths, { strokeDashoffset: 0, duration: 1, stagger: 0.3, ease: "power1.inOut" }, 0.15)
        .to(axisLabelsRef.current, { opacity: 1, duration: 0.3 }, 1.2)
        .to(constructionPaths, { strokeDashoffset: 0, duration: 0.8, stagger: 0.25, ease: "power1.inOut" }, 1.5)
        .to(wallDimRef.current, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, 2.3)
        .to(wallLabelRef.current, { opacity: 1, duration: 0.35 }, 2.7)
        .to(leaderRef.current, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, 3.1)
        .to(noteRef.current, { opacity: 1, duration: 0.4 }, 3.5);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="blueprint" className="relative h-[280vh]">
      <div
        ref={stageRef}
        className="flex h-svh w-full items-center overflow-hidden px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div ref={captionRef} className="lg:col-span-4" style={{ opacity: 0 }}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">01 — Blueprint</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Der erste Strich.
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-muted">
              Bevor eine Anlage gebaut wird, entsteht sie auf dem Papier: Achsen, Hilfslinien und
              Bemaßung — jede Entscheidung dokumentiert, bevor die erste Schweißnaht gesetzt wird.
            </p>
          </div>

          <div className="relative lg:col-span-8">
            <svg viewBox={VESSEL_VIEWBOX} className="mx-auto h-auto w-full max-w-[520px]" role="img" aria-label="Technische Konstruktionszeichnung des Druckbehälters">
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {VESSEL_STROKES.map((d, i) => (
                  <path
                    key={`base-${i}`}
                    d={d}
                    stroke={i === 0 ? "var(--metal)" : "var(--blue)"}
                    strokeWidth={i === 0 ? 2 : 1.4}
                    opacity={i === 4 ? 0.35 : 0.85}
                  />
                ))}

                {AXES.map((d, i) => (
                  <path
                    key={`axis-${i}`}
                    ref={(el) => {
                      axesRefs.current[i] = el;
                    }}
                    d={d}
                    stroke="var(--muted)"
                    strokeWidth={1}
                    opacity={0.55}
                  />
                ))}

                {CONSTRUCTION.map((d, i) => (
                  <path
                    key={`construction-${i}`}
                    ref={(el) => {
                      constructionRefs.current[i] = el;
                    }}
                    d={d}
                    stroke="var(--blue)"
                    strokeWidth={1}
                    opacity={0.4}
                  />
                ))}

                <path ref={wallDimRef} d={WALL_DIMENSION} stroke="var(--orange)" strokeWidth={1} opacity={0.7} />
                <path ref={leaderRef} d={LEADER} stroke="var(--metal)" strokeWidth={1} opacity={0.55} />
              </g>

              <g ref={axisLabelsRef} fontFamily="var(--font-mono)" fontSize={11} letterSpacing={0.5} fill="var(--muted)">
                <text x={452} y="616" textAnchor="end">X</text>
                <text x={32} y="16" textAnchor="middle">Y</text>
              </g>

              <text
                ref={wallLabelRef}
                x={322}
                y="354"
                fontFamily="var(--font-mono)"
                fontSize={11}
                letterSpacing={0.5}
                fill="var(--orange)"
              >
                s = 8
              </text>

              <text
                ref={noteRef}
                x={452}
                y="132"
                textAnchor="end"
                fontFamily="var(--font-hand)"
                fontSize={22}
                fill="var(--foreground)"
                transform="rotate(-4 452 132)"
              >
                Maße vor Fertigung prüfen
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
