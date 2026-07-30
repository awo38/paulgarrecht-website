"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import BlueprintVessel from "@/components/BlueprintVessel";

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-reveal]", {
        opacity: 0,
        y: 18,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.15,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative flex min-h-svh w-full items-center overflow-hidden px-6 pt-28 pb-16 md:px-10 lg:px-16"
    >
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div
            data-hero-reveal
            className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted"
          >
            Paul Garrecht — Project Engineer
          </div>

          <h1
            data-hero-reveal
            className="font-display text-[15vw] font-semibold leading-[0.92] tracking-tight sm:text-7xl lg:text-[5.5rem] xl:text-[6.25rem]"
          >
            PROJECT
            <br />
            <span className="text-orange">ENGINEER</span>
          </h1>

          <div
            data-hero-reveal
            className="mt-7 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.18em] text-blue"
          >
            <span className="whitespace-nowrap">Mechanical Engineering</span>
            <span className="text-blue/40">·</span>
            <span className="whitespace-nowrap">Plant Design</span>
            <span className="text-blue/40">·</span>
            <span className="whitespace-nowrap">Kerntechnischer Rückbau</span>
          </div>

          <p data-hero-reveal className="mt-7 max-w-[46ch] text-base leading-relaxed text-muted">
            Mechatronik-Ingenieur und internationaler Schweißfachingenieur (IWE), seit 2019 bei{" "}
            <span className="font-medium text-foreground">MHC Anlagentechnik</span> verantwortlich
            für Planung und Einsatzleitung im Betrieb, der Stilllegung und dem Rückbau
            kerntechnischer Anlagen.
          </p>

          <div data-hero-reveal className="mt-10">
            <a
              href="#projects"
              data-cursor-hover
              className="group inline-flex items-center gap-3 border border-metal/30 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:border-orange hover:text-orange"
            >
              Projekte entdecken
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <BlueprintVessel className="mx-auto h-auto w-full max-w-[480px]" />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted md:flex">
        <span>Scrollen</span>
        <span className="relative h-9 w-px overflow-hidden bg-metal/25">
          <span className="absolute inset-x-0 top-0 h-1/3 animate-[scrolldown_1.6s_ease-in-out_infinite] bg-orange" />
        </span>
      </div>

      <style>{`
        @keyframes scrolldown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
      `}</style>
    </section>
  );
}
