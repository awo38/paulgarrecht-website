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

// Section 5, the last of the scroll story: the finished, assembled vessel
// from Manufacturing (rendered here already-complete, static) comes alive
// as you scroll — an indicator lamp lights up, an instrument gauge appears
// with its needle settling into a reading, a warning lamp starts a slow,
// subtle blink, and a few soft wisps of steam begin drifting from the
// vent. Everything stays very light — no flashing, no billowing steam,
// per the brief ("nothing exaggerated"). The lamp blink, needle wobble and
// steam drift are independent ambient loops (like the CAD/Manufacturing
// tilt) that start once revealed and keep going, rather than being tied
// to scroll position themselves.
const COMM_VIEWBOX = "0 0 520 640";

const LAMP_BOX = { x: 190, y: 105, w: 28, h: 14 };
const LAMP_GREEN = { cx: 198, cy: 112, r: 2.2 };
const LAMP_AMBER = { cx: 210, cy: 112, r: 2.2 };

const GAUGE = { x: 225, y: 320, r: 16 };
const GAUGE_TICKS = [
  "M211,312 L215,314.5",
  "M217,306 L220,310",
  "M225,304 L225,309",
  "M233,306.1 L230,310",
  "M239,312 L235,315",
] as const;
const NEEDLE_LENGTH = 12;
const NEEDLE_BASE_ANGLE = 20;
const NEEDLE_WOBBLE = 4;

function needlePoint(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: GAUGE.x + NEEDLE_LENGTH * Math.sin(rad),
    y: GAUGE.y - NEEDLE_LENGTH * Math.cos(rad),
  };
}

const STEAM_PUFFS = [
  { x: 238, y: 40, delay: 0 },
  { x: 246, y: 36, delay: 1.1 },
  { x: 233, y: 44, delay: 2.2 },
] as const;

const STATUS_LABELS = ["SYSTEMPRÜFUNG", "MESSTECHNIK AKTIV", "IN BETRIEB"] as const;

export default function CommissioningStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const lampBoxRef = useRef<SVGRectElement>(null);
  const greenLampRef = useRef<SVGCircleElement>(null);
  const amberLampRef = useRef<SVGCircleElement>(null);
  const gaugeDialRef = useRef<SVGCircleElement>(null);
  const gaugeTickRefs = useRef<(SVGPathElement | null)[]>([]);
  const needleRef = useRef<SVGLineElement>(null);
  const steamRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const statusRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ticks = gaugeTickRefs.current.filter((p): p is SVGPathElement => Boolean(p));
    const steamPuffs = steamRefs.current.filter((e): e is SVGEllipseElement => Boolean(e));
    const statuses = statusRefs.current.filter((t): t is SVGTextElement => Boolean(t));
    const restPoint = needlePoint(NEEDLE_BASE_ANGLE);

    if (reduceMotion) {
      if (sectionRef.current) sectionRef.current.style.height = "auto";
      [lampBoxRef.current, greenLampRef.current, amberLampRef.current, gaugeDialRef.current, needleRef.current].forEach(
        (el) => el?.setAttribute("opacity", "1")
      );
      ticks.forEach((p) => p.setAttribute("opacity", "1"));
      steamPuffs.forEach((p) => p.setAttribute("opacity", "0.22"));
      if (needleRef.current) {
        needleRef.current.setAttribute("x2", String(restPoint.x));
        needleRef.current.setAttribute("y2", String(restPoint.y));
      }
      statuses.forEach((t, i) => t.setAttribute("opacity", i === statuses.length - 1 ? "1" : "0"));
      if (captionRef.current) captionRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(
        [lampBoxRef.current, greenLampRef.current, gaugeDialRef.current, ...ticks, needleRef.current],
        { opacity: 0, scale: 0.4, transformOrigin: "center" }
      );
      gsap.set(amberLampRef.current, { opacity: 0, scale: 0.4, transformOrigin: "center" });
      gsap.set(steamPuffs, { opacity: 0, scale: 0.6, transformOrigin: "center" });
      gsap.set(statuses, { opacity: 0 });
      if (needleRef.current) {
        needleRef.current.setAttribute("x2", String(GAUGE.x));
        needleRef.current.setAttribute("y2", String(GAUGE.y - NEEDLE_LENGTH));
      }
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
        .to([lampBoxRef.current, greenLampRef.current], { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" }, 0.3)
        .to(statusRefs.current[0], { opacity: 1, duration: 0.3 }, 0.6)
        .to(statusRefs.current[0], { opacity: 0, duration: 0.3 }, 1.5)
        .to(gaugeDialRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "power1.out" }, 1.6)
        .to(ticks, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.06 }, 2.0)
        .to(needleRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "power1.out" }, 2.3)
        .to(
          { angle: 0 },
          {
            angle: 1,
            duration: 0.6,
            onUpdate: function () {
              const p = needlePoint(this.targets()[0].angle * NEEDLE_BASE_ANGLE);
              needleRef.current?.setAttribute("x2", String(p.x));
              needleRef.current?.setAttribute("y2", String(p.y));
            },
          },
          2.3
        )
        .to(statusRefs.current[1], { opacity: 1, duration: 0.3 }, 2.6)
        .to(statusRefs.current[1], { opacity: 0, duration: 0.3 }, 3.4)
        .to(amberLampRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, 3.5)
        .to(steamPuffs, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.2 }, 3.7)
        .to(statusRefs.current[2], { opacity: 1, duration: 0.35 }, 4.0);

      // Independent ambient loops — start once this section is revealed and
      // keep going, standing in for "the machine is now alive," not tied to
      // scroll position.
      if (amberLampRef.current) {
        gsap.to(amberLampRef.current, {
          opacity: 0.35,
          duration: 1.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 3.9,
        });
      }
      if (needleRef.current) {
        const wobble = { t: 0 };
        gsap.to(wobble, {
          t: 1,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.9,
          onUpdate: () => {
            const angle = NEEDLE_BASE_ANGLE + (wobble.t - 0.5) * 2 * NEEDLE_WOBBLE;
            const p = needlePoint(angle);
            needleRef.current?.setAttribute("x2", String(p.x));
            needleRef.current?.setAttribute("y2", String(p.y));
          },
        });
      }
      steamRefs.current.forEach((puff, i) => {
        if (!puff) return;
        gsap.to(puff, {
          attr: { cy: STEAM_PUFFS[i].y - 42 },
          opacity: 0,
          scale: 1.7,
          duration: 3.6,
          ease: "power1.out",
          repeat: -1,
          delay: 4.2 + STEAM_PUFFS[i].delay,
        });
      });

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
    <section ref={sectionRef} id="commissioning" className="relative h-[280vh]">
      <div
        ref={stageRef}
        className="flex h-svh w-full items-center overflow-hidden px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div ref={captionRef} className="lg:col-span-4" style={{ opacity: 0 }}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">05 — Inbetriebnahme</div>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Die Anlage erwacht.
            </h2>
            <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-muted">
              Messtechnik, Statusleuchten, erster Druck — aus Stahl und Schweißnaht wird eine
              Anlage im Betrieb.
            </p>
          </div>

          <div className="relative lg:col-span-8" style={{ perspective: "1400px" }}>
            <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
              <svg
                viewBox={COMM_VIEWBOX}
                className="mx-auto h-auto w-full max-w-[520px]"
                role="img"
                aria-label="Inbetriebnahme des Druckbehälters mit Statusleuchten, Messgerät und Dampfaustritt"
              >
                <defs>
                  <linearGradient id="comm-steel-gradient" x1="0" y1="0" x2="1" y2="0">
                    {VESSEL_STEEL_GRADIENT_STOPS.map((stop) => (
                      <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                </defs>

                <path d={VESSEL_STROKES[0]} fill="url(#comm-steel-gradient)" stroke="none" opacity={0.85} />

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
                    <path key={`seam-${i}`} d={d} stroke="var(--orange)" strokeWidth={2.2} />
                  ))}
                </g>

                <ellipse
                  cx={VESSEL_FLANGE.x}
                  cy={VESSEL_FLANGE.y}
                  rx={VESSEL_FLANGE.rx}
                  ry={VESSEL_FLANGE.ry}
                  fill="var(--metal)"
                  stroke="var(--foreground)"
                  strokeWidth={1}
                />
                {VESSEL_BOLTS.map((b, i) => (
                  <circle key={`bolt-${i}`} cx={b.x} cy={b.y} r={2} fill="var(--background)" stroke="var(--foreground)" strokeWidth={0.75} />
                ))}
                {VESSEL_FOOT_PLATES.map((f, i) => (
                  <rect key={`foot-${i}`} x={f.x} y={f.y} width={f.w} height={f.h} rx={1.5} fill="var(--metal)" stroke="var(--foreground)" strokeWidth={1} />
                ))}

                {/* Steam wisps rising from the top vent */}
                {STEAM_PUFFS.map((puff, i) => (
                  <ellipse
                    key={`steam-${i}`}
                    ref={(el) => {
                      steamRefs.current[i] = el;
                    }}
                    cx={puff.x}
                    cy={puff.y}
                    rx={6}
                    ry={3}
                    fill="var(--metal)"
                  />
                ))}

                {/* Indicator lamp panel */}
                <rect
                  ref={lampBoxRef}
                  x={LAMP_BOX.x}
                  y={LAMP_BOX.y}
                  width={LAMP_BOX.w}
                  height={LAMP_BOX.h}
                  rx={2}
                  fill="var(--background)"
                  stroke="var(--metal)"
                  strokeWidth={1}
                />
                <circle ref={greenLampRef} cx={LAMP_GREEN.cx} cy={LAMP_GREEN.cy} r={LAMP_GREEN.r} fill="#3ddc73" />
                <circle ref={amberLampRef} cx={LAMP_AMBER.cx} cy={LAMP_AMBER.cy} r={LAMP_AMBER.r} fill="var(--orange)" />

                {/* Pressure gauge */}
                <circle ref={gaugeDialRef} cx={GAUGE.x} cy={GAUGE.y} r={GAUGE.r} fill="var(--background)" stroke="var(--metal)" strokeWidth={1.2} />
                {GAUGE_TICKS.map((d, i) => (
                  <path
                    key={`tick-${i}`}
                    ref={(el) => {
                      gaugeTickRefs.current[i] = el;
                    }}
                    d={d}
                    stroke="var(--muted)"
                    strokeWidth={1}
                    fill="none"
                  />
                ))}
                <line ref={needleRef} x1={GAUGE.x} y1={GAUGE.y} x2={GAUGE.x} y2={GAUGE.y - NEEDLE_LENGTH} stroke="var(--orange)" strokeWidth={1.4} strokeLinecap="round" />
                <circle cx={GAUGE.x} cy={GAUGE.y} r={1.5} fill="var(--orange)" />

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
