import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// A handful of wireframe "planets" floating in the hero, like balloons on a
// string: mouse proximity pushes them away with a soft, continuous force,
// and a loose spring pulls them back. Scrolling migrates each one from its
// idle float onto a specific bullet-list marker further down the hero
// content, where it settles as that item's actual marker dot — uniform in
// size and color there, so the list reads cleanly instead of looking messy.
//
// Positions live directly in CSS-pixel world units: the Canvas uses R3F's
// orthographic-camera default sizing (frustum = +-canvasWidth/2 x
// +-canvasHeight/2), so 1 world unit = 1 CSS pixel and a DOM element's
// on-screen position converts to a world position with plain subtraction —
// no perspective project/unproject needed.
const PLANETS = [
  { markerId: 'bullet-marker-0', radius: 34, color: '#FF7A00', biasX: 0.10, biasY: -0.22, speed: 0.55, phase: 0.0, ampX: 22, ampY: 16 },
  { markerId: 'bullet-marker-1', radius: 26, color: '#3B82F6', biasX: 0.32, biasY: -0.02, speed: 0.42, phase: 1.4, ampX: 16, ampY: 24 },
  { markerId: 'bullet-marker-2', radius: 40, color: '#FF7A00', biasX: 0.44, biasY: -0.30, speed: 0.35, phase: 3.1, ampX: 26, ampY: 14 },
  { markerId: 'bullet-marker-3', radius: 22, color: '#94A3B8', biasX: 0.20, biasY: 0.22, speed: 0.6, phase: 4.6, ampX: 14, ampY: 20 },
  { markerId: 'bullet-marker-4', radius: 30, color: '#3B82F6', biasX: 0.40, biasY: 0.30, speed: 0.48, phase: 2.2, ampX: 20, ampY: 18 },
];

// All docked markers end up this exact pixel radius and this exact color,
// regardless of each planet's own floating radius/color — otherwise the
// bullet list reads as a messy mismatch of sizes and colors once docked.
const DOCKED_RADIUS_PX = 7;
const DOCKED_COLOR = new THREE.Color('#FF7A00');

// Continuous "personal space" repulsion, not a one-shot impulse from a
// raycast hit point: for a straight-on orthographic camera, the raycast hit
// point on a sphere is always wherever the cursor pixel is, so "direction
// from hit point to center" carries no real signal (worst right at dead
// center, which is the single most common hit location) — that's what made
// the old approach feel random and miss some planets. Comparing the mouse's
// own world position to each planet's center instead gives a well-defined
// push direction every time, for every planet, continuously as long as the
// cursor is nearby — like a hand approaching a balloon.
const INFLUENCE_PAD = 70;
const REPULSE_STRENGTH = 2200;
// Loose, under-damped spring (balloon-on-a-string): lower stiffness and
// lighter damping than a snappy UI spring, so a touched planet drifts out,
// overshoots a little on the way back, and settles gradually instead of
// snapping back instantly.
const SPRING_STIFFNESS = 45;
const SPRING_DAMPING = 5.5;

function easeSmoothstep(t) {
  return t * t * (3 - 2 * t);
}

function markerWorldPos(markerEl, rootEl, out) {
  const m = markerEl.getBoundingClientRect();
  const r = rootEl.getBoundingClientRect();
  const cx = m.left + m.width / 2 - r.left;
  const cy = m.top + m.height / 2 - r.top;
  out.set(cx - r.width / 2, r.height / 2 - cy, 0);
  return out;
}

function Planet({ config, progressRef, rootRef, idleLayoutRef, mouseWorldRef }) {
  const meshRef = useRef(null);
  const velocity = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const dockedPos = useRef(new THREE.Vector3());
  const fromPos = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const pushDir = useRef(new THREE.Vector2());
  const markerElRef = useRef(null);
  const startColor = useRef(new THREE.Color(config.color));

  useEffect(() => {
    markerElRef.current = document.getElementById(config.markerId);
  }, [config.markerId]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const layout = idleLayoutRef.current;
    const progress = progressRef.current;

    const floatX = Math.sin(t * config.speed + config.phase) * config.ampX;
    const floatY = Math.cos(t * config.speed * 0.85 + config.phase) * config.ampY;
    fromPos.current.set(
      layout.originX + layout.width * config.biasX + floatX,
      layout.originY + layout.height * config.biasY + floatY,
      0
    );

    // Mouse-proximity repulsion — only while still floating (docked markers
    // shouldn't get bumped around by the cursor moving over the text).
    if (progress <= 0.01 && mouseWorldRef.current) {
      pushDir.current.set(
        fromPos.current.x + offset.current.x - mouseWorldRef.current.x,
        fromPos.current.y + offset.current.y - mouseWorldRef.current.y
      );
      const dist = pushDir.current.length();
      const influenceRadius = config.radius + INFLUENCE_PAD;
      if (dist < influenceRadius) {
        const falloff = 1 - dist / influenceRadius;
        pushDir.current.normalize();
        velocity.current.x += pushDir.current.x * falloff * REPULSE_STRENGTH * dt;
        velocity.current.y += pushDir.current.y * falloff * REPULSE_STRENGTH * dt;
      }
    }

    // Loose spring pulling the displacement back to zero.
    const springAccel = offset.current
      .clone()
      .multiplyScalar(-SPRING_STIFFNESS)
      .addScaledVector(velocity.current, -SPRING_DAMPING);
    velocity.current.addScaledVector(springAccel, dt);
    offset.current.addScaledVector(velocity.current, dt);

    let scale = 1;
    if (progress <= 0 || !markerElRef.current || !rootRef.current) {
      tmpTarget.current.copy(fromPos.current);
    } else {
      markerWorldPos(markerElRef.current, rootRef.current, dockedPos.current);
      const eased = easeSmoothstep(progress);
      tmpTarget.current.lerpVectors(fromPos.current, dockedPos.current, eased);
      scale = THREE.MathUtils.lerp(1, DOCKED_RADIUS_PX / config.radius, eased);
      mesh.material.color.lerpColors(startColor.current, DOCKED_COLOR, eased);
    }

    mesh.position.set(
      tmpTarget.current.x + offset.current.x * (1 - progress),
      tmpTarget.current.y + offset.current.y * (1 - progress),
      0
    );
    mesh.scale.setScalar(scale);
    mesh.rotation.x += dt * 0.25;
    mesh.rotation.y += dt * 0.35;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[config.radius, 1]} />
      <meshBasicMaterial wireframe color={config.color} transparent opacity={0.8} />
    </mesh>
  );
}

function Planets({ progressRef, rootRef }) {
  const { size } = useThree();
  const idleLayoutRef = useRef({ originX: 0, originY: 0, width: size.width, height: size.height });
  const mouseWorldRef = useRef(new THREE.Vector2(-99999, -99999));

  useEffect(() => {
    idleLayoutRef.current = { originX: 0, originY: 0, width: size.width, height: size.height };
  }, [size.width, size.height]);

  // Tracked once per frame at the parent level (not per-planet) from R3F's
  // own normalized pointer state — no manual DOM listeners needed.
  useFrame((state) => {
    mouseWorldRef.current.set((state.pointer.x * size.width) / 2, (state.pointer.y * size.height) / 2);
  });

  return (
    <>
      {PLANETS.map((config) => (
        <Planet
          key={config.markerId}
          config={config}
          progressRef={progressRef}
          rootRef={rootRef}
          idleLayoutRef={idleLayoutRef}
          mouseWorldRef={mouseWorldRef}
        />
      ))}
    </>
  );
}

export default function PlanetsHero({ style, className }) {
  const rootRef = useRef(null);
  const progressRef = useRef(0);

  // Scroll-scrubbed, no autoplay: progress 0 = planets float freely, 1 = each
  // has migrated onto its bullet-list marker. Reuses the host page's GSAP
  // ScrollTrigger/Lenis setup when present; falls back to a plain scroll
  // listener so the component still works standalone.
  useEffect(() => {
    const heroEl = document.getElementById('hero') || rootRef.current;
    if (!heroEl) return;

    function setProgress(p) {
      progressRef.current = p;
    }

    if (window.gsap && window.ScrollTrigger) {
      const st = window.ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => setProgress(self.progress),
      });
      return () => st.kill();
    }

    let queued = false;
    function computeAndEmit() {
      queued = false;
      const total = heroEl.offsetHeight - window.innerHeight;
      const scrolled = -heroEl.getBoundingClientRect().top;
      setProgress(total > 0 ? THREE.MathUtils.clamp(scrolled / total, 0, 1) : 1);
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(computeAndEmit);
    }
    computeAndEmit();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div ref={rootRef} className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas orthographic camera={{ position: [0, 0, 100], near: 0.1, far: 1000, zoom: 1 }}>
        <Planets progressRef={progressRef} rootRef={rootRef} />
      </Canvas>
    </div>
  );
}
