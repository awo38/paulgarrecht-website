"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// "About Me" as a machine data sheet instead of a biography — a stainless
// steel nameplate riveted at the corners, engraved fields instead of prose.
// Unlike the five scroll-story sections above, this isn't pinned or
// scrubbed: it's a normal section that simply reveals once when scrolled
// into view, since there's no multi-stage transformation to narrate here.
const FIELDS = [
  { label: "Name", value: "Paul Garrecht" },
  { label: "Position", value: "Projektingenieur / Einsatzleiter" },
  { label: "Spezialisierung", value: "Industrieanlagenbau — Kerntechnischer Rückbau" },
  { label: "Arbeitgeber", value: "MHC Anlagentechnik (seit 2019)" },
  { label: "Ausbildung", value: "B.Eng. Mechatronik — DHBW Mannheim" },
  { label: "Zertifizierung", value: "IWE — Internationaler Schweißfachingenieur (seit 2023)" },
  { label: "Software", value: "SolidWorks · AutoCAD · Excel VBA" },
  { label: "Normen", value: "DIN EN 13480 · EN 1090 · ISO 3834" },
  { label: "Werkstoffe", value: "1.4571 · 316L · 304L" },
  { label: "Standort", value: "Ladenburg, DE" },
] as const;

export default function AboutNameplate() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(captionRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
      gsap.from(plateRef.current, {
        opacity: 0,
        y: 32,
        scale: 0.98,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative px-6 py-28 md:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div ref={captionRef} className="mb-14 max-w-[52ch]">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Profil</div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Statt einer Biografie — ein Typenschild.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Wie bei jedem Bauteil, das die Werkstatt verlässt: Kennwerte statt Prosa.
          </p>
        </div>

        <div
          ref={plateRef}
          className="relative mx-auto max-w-[880px] rounded-md border border-metal/40 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.5)] md:p-12"
          style={{
            background:
              "linear-gradient(135deg, #3a4046 0%, #6b7480 22%, #464c53 45%, #7d8794 62%, #3f454b 100%)",
          }}
        >
          {/* corner rivets */}
          {[
            "top-3 left-3",
            "top-3 right-3",
            "bottom-3 left-3",
            "bottom-3 right-3",
          ].map((pos) => (
            <span
              key={pos}
              className={`absolute h-2.5 w-2.5 rounded-full ${pos}`}
              style={{
                background: "radial-gradient(circle at 35% 30%, #dfe3e6, #6b7178 60%, #33373b)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
              }}
            />
          ))}

          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-background/40 pb-5">
            <h3
              className="font-mono text-lg font-semibold uppercase tracking-[0.2em] text-background"
              style={{ textShadow: "0 1px 0 rgba(255,255,255,0.25), 0 -1px 0 rgba(0,0,0,0.55)" }}
            >
              Engineer Profile
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-background/70">
              Modell PG-2019 · Seriennr. IWE-2023-01
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.label} className="flex flex-col gap-1 border-b border-background/20 pb-3">
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/60">
                  {field.label}
                </dt>
                <dd
                  className="font-mono text-sm font-medium text-background"
                  style={{ textShadow: "0 1px 0 rgba(255,255,255,0.2)" }}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
