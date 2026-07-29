"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VESSEL_STROKES } from "@/components/vessel-geometry";

gsap.registerPlugin(ScrollTrigger);

// Section 3 of the scroll story: the flat 2D drawing from the previous two
// sections fades to a ghost as an isometric wireframe cylinder — built from
// two elliptical "cap" cross-sections and vertical ribs — takes its place.
// The far (hidden) half of each cap ellipse is drawn dim first, then its
// opacity drops to zero ("hidden lines disappear"), and what's left
// thickens and brightens to a crisp finish ("edges become crisp"). A
// small, continuous, independent tilt on the whole wireframe stands in for
// "small camera movement" — a real Three.js pass comes in a later phase,
// this is the flat-SVG version of the same beat.
const CAD_VIEWBOX = "0 0 520 640";

const CAP_FRONT_ARCS = [
  "M170,140 A70,16 0 0 0 310,140",
  "M170,460 A70,16 0 0 1 310,460",
] as const;

const CAP_BACK_ARCS = [
  "M170,140 A70,16 0 0 1 310,140",
  "M170,460 A70,16 0 0 0 310,460",
] as const;

const RIBS = [
  "M170,140 L170,460",
  "M205,140 L205,460",
  "M275,140 L275,460",
  "M310,140 L310,460",
] as const;

const STATUS_LABELS = ["DRAHTMODELL", "VERDECKTE LINIEN ENTFERNT", "KANTEN BEREINIGT"] as const;

export default function CADStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const hullRefs = useRef<(SVGPathElement | null)[]>([]);
  const frontArcRefs = useRef<(SVGPathElement | null)[]>([]);
  const backArcRefs = useRef<(SVGPathElement | null)[]>([]);
  const ribRefs = useRef<(SVGPathElement | null)[]>([]);
  const statusRefs = useRef<(SVGTextElement | null)[]>([]);
  const crispTargetRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hulls = hullRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const frontArcs = frontArcRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const backArcs = backArcRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const ribs = ribRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const statuses = statusRefs.current.filter((t): t is SVGTextElement => Boolean(t));
    const crispTargets = crispTargetRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const drawnPaths = [...frontArcs, ...backArcs, ...ribs];

    if (reduceMotion) {
      if (sectionRef.current) sectionRef.current.style.height = "auto";
      drawnPaths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      hulls.forEach((p) => p.setAttribute("opacity", "0.12"));
      backArcs.forEach((p) => p.setAttribute("opacity", "0"));
      crispTargets.forEach((p) => {
        p.style.stroke = "var(--foreground)";
        p.style.strokeWidth = "2";
        p.setAttribute("opacity", "1");
      });
      statuses.forEach((t, i) => t.setAttribute("opacity", i === statuses.length - 1 ? "1" : "0"));
      if (captionRef.current) captionRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      drawnPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(backArcs, { opacity: 0.4 });
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
        .to(hulls, { opacity: 0.12, duration: 1, ease: "power1.inOut" }, 0.3)
        .to(frontArcs, { strokeDashoffset: 0, duration: 0.8, stagger: 0.2, ease: "power1.inOut" }, 0.5)
        .to(backArcs, { strokeDashoffset: 0, duration: 0.8, stagger: 0.2, ease: "power1.inOut" }, 0.5)
        .to(ribs, { strokeDashoffset: 0, duration: 0.6, stagger: 0.15, ease: "power1.inOut" }, 1.0)
        .to(statusRefs.current[0], { opacity: 1, duration: 0.3 }, 1.2)
        .to(statusRefs.current[0], { opacity: 0, duration: 0.3 }, 2.1)
        .to(backArcs, { opacity: 0, duration: 0.5, stagger: 0.1 }, 2.1)
        .to(statusRefs.current[1], { opacity: 1, duration: 0.3 }, 2.3)
        .to(statusRefs.current[1], { opacity: 0, duration: 0.3 }, 3.1)
        .to(crispTargets, { strokeWidth: 2, stroke: "var(--foreground)", opacity: 1, duration: 0.6 }, 3.1)
        .to(statusRefs.current[2], { opacity: 1, duration: 0.3 }, 3.3);

      // Small, continuous camera-like tilt — independent of scroll, always
      // gently drifting, standing in for the "small camera movement" beat.
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
    <section ref={sectionRef} id="cad" className="relative h-[280vh]">
      <div
        ref={stageRef}
        className="flex h-svh w-full items-center overflow-hidden px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div ref={captionRef} className="lg:col-span-4" style={{ opacity: 0 }}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">03 — CAD</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Vom Papier zum Volumen.
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-muted">
              Aus der Linie wird ein Volumenkörper: Kanten werden eindeutig, verdeckte Linien
              verschwinden — die Grundlage für Fertigung und Montage.
            </p>
          </div>

          <div className="relative lg:col-span-8" style={{ perspective: "1400px" }}>
            <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
              <svg
                viewBox={CAD_VIEWBOX}
                className="mx-auto h-auto w-full max-w-[520px]"
                role="img"
                aria-label="CAD-Drahtmodell des Druckbehälters mit Kantenbereinigung"
              >
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {VESSEL_STROKES.map((d, i) => (
                    <path
                      key={`hull-${i}`}
                      ref={(el) => {
                        hullRefs.current[i] = el;
                      }}
                      d={d}
                      stroke={i === 0 ? "var(--metal)" : "var(--blue)"}
                      strokeWidth={i === 0 ? 2 : 1.4}
                      opacity={i === 4 ? 0.3 : 0.8}
                    />
                  ))}

                  {CAP_BACK_ARCS.map((d, i) => (
                    <path
                      key={`cap-back-${i}`}
                      ref={(el) => {
                        backArcRefs.current[i] = el;
                      }}
                      d={d}
                      stroke="var(--muted)"
                      strokeWidth={1}
                    />
                  ))}

                  {CAP_FRONT_ARCS.map((d, i) => (
                    <path
                      key={`cap-front-${i}`}
                      ref={(el) => {
                        frontArcRefs.current[i] = el;
                        crispTargetRefs.current[i] = el;
                      }}
                      d={d}
                      stroke="var(--blue)"
                      strokeWidth={1.4}
                      opacity={0.85}
                    />
                  ))}

                  {RIBS.map((d, i) => (
                    <path
                      key={`rib-${i}`}
                      ref={(el) => {
                        ribRefs.current[i] = el;
                        crispTargetRefs.current[CAP_FRONT_ARCS.length + i] = el;
                      }}
                      d={d}
                      stroke="var(--blue)"
                      strokeWidth={1}
                      opacity={0.7}
                    />
                  ))}
                </g>

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
