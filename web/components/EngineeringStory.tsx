"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VESSEL_STROKES } from "@/components/vessel-geometry";

gsap.registerPlugin(ScrollTrigger);

// Wider than the shared vessel viewBox (0 0 480 640) — this section hangs
// annotation labels off the right edge of the vessel, so its own canvas
// gets extra margin there. The vessel path data is in absolute coordinates
// and doesn't care what viewBox it's rendered in, so this doesn't affect
// the identical geometry used in the hero or the Blueprint section.
const ENGINEERING_VIEWBOX = "0 0 560 640";

// Section 2 of the scroll story: the same vessel, but the hand-drafting
// clutter from the Blueprint section (axes, construction lines) is gone —
// "the drawing becomes cleaner" — replaced by the documentation that turns
// a sketch into something a workshop can actually build from: weld symbols
// on the girth seams, a material callout, a routed pipe connection, and a
// standards stamp. Same pinned/scrubbed single-timeline mechanic as
// BlueprintStory, so it is exactly reversible with scroll.
const WELD_LEADERS = [
  "M300,140 L360,120 L410,120",
  "M300,460 L360,480 L410,480",
] as const;

const WELD_SYMBOLS = [
  { d: "M366,120 L374,110 L382,120 Z", labelX: 414, labelY: 124, label: "a4 · DVS 1912" },
  { d: "M366,480 L374,470 L382,480 Z", labelX: 414, labelY: 484, label: "WIG · 1.4404" },
] as const;

const MATERIAL_LEADER = "M170,300 L100,270";
const PIPE_ROUTE = "M368,262 L440,262 L440,360 L512,360 M512,350 L512,370";

export default function EngineeringStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  const weldLeaderRefs = useRef<(SVGPathElement | null)[]>([]);
  const weldSymbolRefs = useRef<(SVGPathElement | null)[]>([]);
  const weldLabelRefs = useRef<(SVGTextElement | null)[]>([]);
  const materialLeaderRef = useRef<SVGPathElement>(null);
  const materialLabelRef = useRef<SVGGElement>(null);
  const pipeRouteRef = useRef<SVGPathElement>(null);
  const pipeLabelRef = useRef<SVGTextElement>(null);
  const specBlockRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const weldLeaders = weldLeaderRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const weldSymbols = weldSymbolRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const weldLabels = weldLabelRefs.current.filter((t): t is SVGTextElement => Boolean(t));
    const drawnPaths = [...weldLeaders, materialLeaderRef.current, pipeRouteRef.current].filter(
      (p): p is SVGPathElement => Boolean(p)
    );
    const fadeGroups = [...weldSymbols, ...weldLabels, materialLabelRef.current, pipeLabelRef.current, specBlockRef.current].filter(
      (el): el is SVGGraphicsElement => Boolean(el)
    );

    if (reduceMotion) {
      if (sectionRef.current) sectionRef.current.style.height = "auto";
      drawnPaths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      fadeGroups.forEach((el) => el.setAttribute("opacity", "1"));
      if (captionRef.current) captionRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      drawnPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(fadeGroups, { opacity: 0 });
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
        .to(weldLeaders, { strokeDashoffset: 0, duration: 0.9, stagger: 0.3, ease: "power1.inOut" }, 0.2)
        .to(weldSymbols, { opacity: 1, duration: 0.3, stagger: 0.3 }, 1.0)
        .to(weldLabels, { opacity: 1, duration: 0.35, stagger: 0.3 }, 1.15)
        .to(materialLeaderRef.current, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, 2.0)
        .to(materialLabelRef.current, { opacity: 1, duration: 0.4 }, 2.4)
        .to(pipeRouteRef.current, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, 2.9)
        .to(pipeLabelRef.current, { opacity: 1, duration: 0.4 }, 3.5)
        .to(specBlockRef.current, { opacity: 1, duration: 0.5 }, 3.9);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="engineering" className="relative h-[280vh]">
      <div
        ref={stageRef}
        className="flex h-svh w-full items-center overflow-hidden px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div ref={captionRef} className="lg:col-span-4" style={{ opacity: 0 }}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">02 — Engineering</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Vom Strich zur Norm.
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-muted">
              Schweißnahtsymbole, Werkstoffkennwerte und Normverweise machen aus einer Skizze eine
              belastbare Fertigungsunterlage.
            </p>
          </div>

          <div className="relative lg:col-span-8">
            <svg
              viewBox={ENGINEERING_VIEWBOX}
              className="mx-auto h-auto w-full max-w-[520px]"
              role="img"
              aria-label="Technische Fertigungszeichnung mit Schweißnahtsymbolen, Werkstoffangabe und Rohrleitungsanschluss"
            >
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {VESSEL_STROKES.map((d, i) => (
                  <path
                    key={`base-${i}`}
                    d={d}
                    stroke={i === 0 ? "var(--metal)" : "var(--blue)"}
                    strokeWidth={i === 0 ? 2 : 1.4}
                    opacity={i === 4 ? 0.3 : 0.8}
                  />
                ))}

                {WELD_LEADERS.map((d, i) => (
                  <path
                    key={`weld-leader-${i}`}
                    ref={(el) => {
                      weldLeaderRefs.current[i] = el;
                    }}
                    d={d}
                    stroke="var(--metal)"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                ))}

                {WELD_SYMBOLS.map((symbol, i) => (
                  <path
                    key={`weld-symbol-${i}`}
                    ref={(el) => {
                      weldSymbolRefs.current[i] = el;
                    }}
                    d={symbol.d}
                    fill="var(--orange)"
                    stroke="none"
                  />
                ))}

                <path ref={materialLeaderRef} d={MATERIAL_LEADER} stroke="var(--metal)" strokeWidth={1} opacity={0.7} />
                <path ref={pipeRouteRef} d={PIPE_ROUTE} stroke="var(--blue)" strokeWidth={1.4} opacity={0.85} />
              </g>

              {WELD_SYMBOLS.map((symbol, i) => (
                <text
                  key={`weld-label-${i}`}
                  ref={(el) => {
                    weldLabelRefs.current[i] = el;
                  }}
                  x={symbol.labelX}
                  y={symbol.labelY}
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  letterSpacing={0.3}
                  fill="var(--orange)"
                >
                  {symbol.label}
                </text>
              ))}

              <g ref={materialLabelRef} fontFamily="var(--font-mono)" fill="var(--blue)" textAnchor="end">
                <text x={96} y="262" fontSize={13} fontWeight={600}>1.4571</text>
                <text x={96} y="276" fontSize={9} letterSpacing={0.3} fill="var(--muted)">
                  X6CrNiMoTi17-12-2
                </text>
              </g>

              <text
                ref={pipeLabelRef}
                x={512}
                y="378"
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize={11}
                letterSpacing={0.3}
                fill="var(--blue)"
              >
                DN50 · PN16
              </text>

              <g ref={specBlockRef} fontFamily="var(--font-mono)" fill="var(--muted)" textAnchor="end">
                <text x={536} y="600" fontSize={10} letterSpacing={0.4}>DIN EN 13480</text>
                <text x={536} y="614" fontSize={10} letterSpacing={0.4}>EN 1090-2 · ISO 3834-2</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
