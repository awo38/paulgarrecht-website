import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// A handful of wireframe "planets" floating in the hero. Mouse contact
// bounces them away (spring-damped impulse); scrolling migrates each one
// from its idle float onto a specific bullet-list marker further down the
// hero content, where it settles as that item's actual marker dot.
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

const DOCK_SCALE = 0.22;
const BOUNCE_STRENGTH = 900;
const SPRING_STIFFNESS = 130;
const SPRING_DAMPING = 11;

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

function Planet({ config, progressRef, rootRef, idleLayoutRef }) {
  const meshRef = useRef(null);
  const velocity = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const dockedPos = useRef(new THREE.Vector3());
  const fromPos = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const markerElRef = useRef(null);

  useEffect(() => {
    markerElRef.current = document.getElementById(config.markerId);
  }, [config.markerId]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const layout = idleLayoutRef.current;

    // Critically-damped-ish spring pulling the bounce offset back to zero —
    // this is what makes a touched planet "bounce away" and settle back.
    const springAccel = offset.current
      .clone()
      .multiplyScalar(-SPRING_STIFFNESS)
      .addScaledVector(velocity.current, -SPRING_DAMPING);
    velocity.current.addScaledVector(springAccel, dt);
    offset.current.addScaledVector(velocity.current, dt);

    const floatX = Math.sin(t * config.speed + config.phase) * config.ampX;
    const floatY = Math.cos(t * config.speed * 0.85 + config.phase) * config.ampY;
    fromPos.current.set(
      layout.originX + layout.width * config.biasX + floatX,
      layout.originY + layout.height * config.biasY + floatY,
      0
    );

    const progress = progressRef.current;
    let scale = 1;
    if (progress <= 0 || !markerElRef.current || !rootRef.current) {
      tmpTarget.current.copy(fromPos.current);
    } else {
      markerWorldPos(markerElRef.current, rootRef.current, dockedPos.current);
      const eased = easeSmoothstep(progress);
      tmpTarget.current.lerpVectors(fromPos.current, dockedPos.current, eased);
      scale = THREE.MathUtils.lerp(1, DOCK_SCALE, eased);
    }

    mesh.position.set(
      tmpTarget.current.x + offset.current.x * (1 - progress),
      tmpTarget.current.y + offset.current.y * (1 - progress),
      0
    );
    mesh.scale.setScalar(scale);
    mesh.rotation.x += dt * 0.3;
    mesh.rotation.y += dt * 0.45;
  });

  function handlePointerEnter(e) {
    e.stopPropagation();
    const dir = meshRef.current.position.clone().sub(e.point);
    dir.z = 0;
    if (dir.lengthSq() < 1) dir.set(Math.random() - 0.5, Math.random() - 0.5, 0);
    dir.normalize();
    velocity.current.addScaledVector(dir, BOUNCE_STRENGTH);
  }

  return (
    <mesh ref={meshRef} onPointerEnter={handlePointerEnter}>
      <icosahedronGeometry args={[config.radius, 1]} />
      <meshBasicMaterial wireframe color={config.color} transparent opacity={0.8} />
    </mesh>
  );
}

function Planets({ progressRef, rootRef }) {
  const { size } = useThree();
  const idleLayoutRef = useRef({ originX: 0, originY: 0, width: size.width, height: size.height });

  useEffect(() => {
    idleLayoutRef.current = { originX: 0, originY: 0, width: size.width, height: size.height };
  }, [size.width, size.height]);

  return (
    <>
      {PLANETS.map((config) => (
        <Planet key={config.markerId} config={config} progressRef={progressRef} rootRef={rootRef} idleLayoutRef={idleLayoutRef} />
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
