"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(callback: () => void) {
  const mql = window.matchMedia(FINE_POINTER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getFinePointerSnapshot() {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function getFinePointerServerSnapshot() {
  return false;
}

// A CAD-style crosshair cursor: two hairlines crossing at the pointer plus a
// live coordinate readout, like a cursor position display in CAD software.
// Hovering an element tagged `data-cursor-hover` draws a small measurement
// bracket around the cursor instead. Position updates mutate ref styles
// directly (no React state per pointer move) to stay off the render path —
// this runs on every mousemove and must stay cheap.
export default function CustomCursor() {
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getFinePointerServerSnapshot
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const lineXRef = useRef<HTMLDivElement>(null);
  const lineYRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    let hoverDepth = 0;

    function onMove(e: MouseEvent) {
      const x = e.clientX;
      const y = e.clientY;
      if (lineXRef.current) lineXRef.current.style.transform = `translateY(${y}px)`;
      if (lineYRef.current) lineYRef.current.style.transform = `translateX(${x}px)`;
      if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px)`;
      if (bracketRef.current) bracketRef.current.style.transform = `translate(${x}px, ${y}px)`;
      if (coordRef.current) {
        coordRef.current.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
        coordRef.current.textContent = `X: ${x.toString().padStart(4, "0")} · Y: ${y.toString().padStart(4, "0")}`;
      }
    }

    function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor-hover]");
      if (target) {
        hoverDepth++;
        rootRef.current?.classList.add("cursor-hover-active");
      }
    }

    function onOut(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor-hover]");
      if (target) {
        hoverDepth = Math.max(0, hoverDepth - 1);
        if (hoverDepth === 0) rootRef.current?.classList.remove("cursor-hover-active");
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, true);
    window.addEventListener("mouseout", onOut, true);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver, true);
      window.removeEventListener("mouseout", onOut, true);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="cad-cursor pointer-events-none fixed inset-0 z-[999]" aria-hidden="true">
      <div ref={lineXRef} className="cad-cursor-line absolute left-0 top-0 h-px w-full" />
      <div ref={lineYRef} className="cad-cursor-line absolute left-0 top-0 h-full w-px" />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue"
      />
      <div
        ref={bracketRef}
        className="cursor-bracket absolute left-0 top-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-orange opacity-0 transition-opacity duration-150"
      />
      <div
        ref={coordRef}
        className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-wider text-blue/70"
      />
      <style>{`
        .cad-cursor-line { background-color: rgba(63, 169, 245, 0.35); transition: background-color 150ms; }
        .cad-cursor.cursor-hover-active .cad-cursor-line { background-color: rgba(247, 147, 30, 0.5); }
        .cad-cursor .cursor-bracket { opacity: 0; }
        .cad-cursor.cursor-hover-active .cursor-bracket { opacity: 1; }
      `}</style>
    </div>
  );
}
