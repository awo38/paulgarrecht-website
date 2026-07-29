"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Contact, styled like a machine control interface rather than a form: a
// system-status readout, terminal-style inputs, and a button that runs
// through a short "connection" sequence before doing exactly what the
// legacy static site's form already did — open the visitor's mail client
// with a prefilled message to the real address, since this is a static
// site with no backend to actually receive submissions.
const CONTACT_EMAIL = "hallo@paulgarrecht.de";

type ConnectionState = "idle" | "connecting" | "connected";

export default function ContactTerminal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ConnectionState>("idle");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(panelRef.current, {
        opacity: 0,
        y: 28,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state !== "idle") return;

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    setState("connecting");
    window.setTimeout(() => {
      setState("connected");
      const subject = encodeURIComponent(`Kontaktanfrage von ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      window.setTimeout(() => setState("idle"), 2600);
    }, 750);
  }

  return (
    <section ref={sectionRef} id="contact" className="relative px-6 py-28 md:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 max-w-[52ch]">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Kontakt</div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Lassen Sie uns sprechen.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Offen für Austausch rund um kerntechnischen Rückbau, Projektingenieurwesen oder
            technische Zusammenarbeit.
          </p>
        </div>

        <div
          ref={panelRef}
          className="relative overflow-hidden rounded-md border border-blue/25 bg-foreground/[0.03]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue/15 px-6 py-4 md:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Kontakt-Terminal
            </span>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className="status-dot h-2 w-2 rounded-full" style={{ background: "#3ddc73" }} />
              System Status:{" "}
              <span className="text-foreground">
                {state === "idle" && "Verfügbar"}
                {state === "connecting" && "Verbindung wird aufgebaut …"}
                {state === "connected" && "Verbindung hergestellt"}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 p-6 md:p-8 lg:grid-cols-[1.1fr_0.7fr] lg:gap-16">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <TerminalField id="cf-name" name="name" label="Input_01 · Name" placeholder="Ihr Name" required />
              <TerminalField
                id="cf-email"
                name="email"
                type="email"
                label="Input_02 · E-Mail"
                placeholder="ihre@email.de"
                required
              />
              <TerminalField
                id="cf-message"
                name="message"
                as="textarea"
                label="Input_03 · Nachricht"
                placeholder="Ihre Nachricht"
                rows={4}
                required
              />

              <button
                type="submit"
                data-cursor-hover
                disabled={state !== "idle"}
                className="terminal-btn group mt-2 inline-flex w-fit items-center gap-3 rounded-sm border px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-300 disabled:cursor-default"
                style={{
                  borderColor: state === "connected" ? "#3ddc73" : "var(--metal)",
                  color: state === "connected" ? "#3ddc73" : "var(--foreground)",
                }}
              >
                {state === "idle" && (
                  <>
                    Verbindung herstellen
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
                {state === "connecting" && (
                  <>
                    <span className="terminal-spinner h-2 w-2 rounded-full bg-orange" />
                    Verbinde …
                  </>
                )}
                {state === "connected" && <>Verbindung hergestellt ✓</>}
              </button>
              <p className="font-mono text-[11px] text-muted">
                Öffnet Ihr E-Mail-Programm mit vorausgefüllter Nachricht an {CONTACT_EMAIL}.
              </p>
            </form>

            <div className="flex flex-col gap-3">
              <a
                href="https://www.linkedin.com/in/paulgarrecht/"
                target="_blank"
                rel="noopener"
                data-cursor-hover
                className="flex items-center justify-between rounded-sm border border-blue/20 px-5 py-4 transition-colors hover:border-blue/50"
              >
                <span className="font-mono text-xs uppercase tracking-[0.15em]">LinkedIn</span>
                <span className="font-mono text-xs text-orange">→</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                data-cursor-hover
                className="flex items-center justify-between rounded-sm border border-blue/20 px-5 py-4 transition-colors hover:border-blue/50"
              >
                <span className="font-mono text-xs uppercase tracking-[0.15em]">E-Mail</span>
                <span className="font-mono text-xs text-orange">→</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-blue/10 pt-8 font-mono text-xs uppercase tracking-widest text-muted">
          <span>© 2026 Paul Garrecht</span>
          <span>Ladenburg, DE</span>
        </div>
      </div>

      <style>{`
        .status-dot { animation: statusPulse 2.4s ease-in-out infinite; }
        @keyframes statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .terminal-spinner { animation: terminalSpin 0.7s ease-in-out infinite; }
        @keyframes terminalSpin { 0%, 100% { transform: scale(0.6); opacity: 0.5; } 50% { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .status-dot, .terminal-spinner { animation: none; }
        }
      `}</style>
    </section>
  );
}

function TerminalField({
  id,
  name,
  label,
  placeholder,
  type = "text",
  as = "input",
  rows,
  required,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  as?: "input" | "textarea";
  rows?: number;
  required?: boolean;
}) {
  const sharedClassName =
    "w-full rounded-sm border border-blue/25 bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-orange";
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea id={id} name={name} placeholder={placeholder} rows={rows} required={required} className={`${sharedClassName} resize-none`} />
      ) : (
        <input id={id} name={name} type={type} placeholder={placeholder} required={required} className={sharedClassName} />
      )}
    </div>
  );
}
