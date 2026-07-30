"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VESSEL_VIEWBOX, VESSEL_STROKES, VESSEL_STEEL_GRADIENT_STOPS } from "@/components/vessel-geometry";

gsap.registerPlugin(ScrollTrigger);

// Projects, displayed like engineering documentation sheets rather than a
// portfolio gallery — no fabricated project numbers, volumes or pressures,
// since these are Paul's real, ongoing focus areas (from the legacy static
// site's #projects-grid), not one-off jobs with disclosable specs. Each
// card carries the same small vessel-silhouette "drawing" in the corner;
// on hover it goes from a thin dashed blueprint line to a solid, filled,
// crisp render — the card-level echo of the CAD section's "blueprint
// becomes a finished model" beat, done in pure CSS since it's a hover
// micro-interaction, not a scroll narrative.
const DOSSIERS = [
  {
    ref: "REF. 01",
    title: "Rückbau kerntechnischer Anlagen",
    description:
      "Planung und technische Begleitung von Rückbau- und Stilllegungsmaßnahmen — von der Konzeption bis zur Umsetzung vor Ort.",
    bereich: "Rückbau · Stilllegung",
    rolle: "Planung & Genehmigung",
  },
  {
    ref: "REF. 02",
    title: "Rohrleitungs- & Druckgerätetechnik",
    description: "Auslegung und Bewertung von Rohrleitungssystemen und Druckgeräten nach DIN EN 13480.",
    bereich: "Piping · Druckgeräte",
    rolle: "Auslegung & Bewertung",
  },
  {
    ref: "REF. 03",
    title: "Schweißtechnische Qualitätssicherung",
    description: "Fachliche Bewertung schweißtechnischer Prozesse als internationaler Schweißfachingenieur (IWE).",
    bereich: "IWE · Qualitätssicherung",
    rolle: "Fachliche Bewertung",
  },
  {
    ref: "REF. 04",
    title: "Einsatzleitung vor Ort",
    description: "Koordination und Steuerung technischer Teams im laufenden Betrieb kerntechnischer Anlagen.",
    bereich: "Einsatzleitung · Koordination",
    rolle: "Projektsteuerung",
  },
] as const;

export default function ProjectDossiers() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const cards = cardRefs.current.filter((c): c is HTMLDivElement => Boolean(c));

    const ctx = gsap.context(() => {
      gsap.from(captionRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
      gsap.from(cards, {
        opacity: 0,
        y: 28,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative px-6 py-28 md:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div ref={captionRef} className="mb-14 max-w-[52ch]">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Schwerpunkte</div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Woran ich arbeite.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Dokumentiert wie ein Bauteil — nicht als Projektliste, sondern als das, was ich fachlich
            verantworte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {DOSSIERS.map((d, i) => (
            <div
              key={d.ref}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-cursor-hover
              className="dossier-card group relative overflow-hidden rounded-md border border-blue/25 bg-foreground/[0.03] p-7 transition-colors duration-300 hover:border-blue/50 md:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{d.ref}</span>
                <svg viewBox={VESSEL_VIEWBOX} className="dossier-icon h-14 w-11 shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id={`dossier-steel-${i}`} x1="0" y1="0" x2="1" y2="0">
                      {VESSEL_STEEL_GRADIENT_STOPS.map((stop) => (
                        <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                      ))}
                    </linearGradient>
                  </defs>
                  <path
                    className="dossier-icon-path"
                    d={VESSEL_STROKES[0]}
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth={6}
                    strokeDasharray="16 12"
                    opacity={0.6}
                    style={{ ["--dossier-fill" as string]: `url(#dossier-steel-${i})` }}
                  />
                </svg>
              </div>

              <h3 className="font-display text-xl font-semibold">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{d.description}</p>

              <div className="mt-7 grid grid-cols-2 gap-4 border-t border-blue/15 pt-5">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Bereich</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground">{d.bereich}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Rolle</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground">{d.rolle}</dd>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dossier-icon-path {
          transition: stroke 0.4s ease, stroke-width 0.4s ease, stroke-dasharray 0.4s ease, opacity 0.4s ease, fill 0.4s ease;
        }
        .group:hover .dossier-icon-path {
          stroke: var(--foreground);
          stroke-width: 14;
          stroke-dasharray: 0;
          opacity: 1;
          fill: var(--dossier-fill);
        }
      `}</style>
    </section>
  );
}
