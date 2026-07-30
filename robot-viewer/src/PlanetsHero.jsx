import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// A handful of wireframe "planets" floating freely across the whole open
// area of the hero, like balloons adrift in a room: each one is a free
// particle that continually picks a new random point somewhere in that
// shared area and ambles toward it, so over time every planet visits the
// entire space rather than orbiting near where it started. Mouse proximity
// pushes it away with a soft, continuous impulse, and it coasts on that
// push — losing speed gradually to air-resistance-style damping, not
// snapping back — before ambling onward. Scrolling migrates each one from
// wherever it currently is onto a specific bullet-list marker further down
// the hero content, where it settles as that item's actual marker dot —
// uniform in size and color there, so the list reads cleanly instead of
// looking messy.
//
// Positions live directly in CSS-pixel world units: the Canvas uses R3F's
// orthographic-camera default sizing (frustum = +-canvasWidth/2 x
// +-canvasHeight/2), so 1 world unit = 1 CSS pixel and a DOM element's
// on-screen position converts to a world position with plain subtraction —
// no perspective project/unproject needed.
const PLANETS = [
  { markerId: 'bullet-marker-0', radius: 34, color: '#FF7A00', speed: 0.9, phase: 0.3 },
  { markerId: 'bullet-marker-1', radius: 26, color: '#3B82F6', speed: 1.15, phase: 2.1 },
  { markerId: 'bullet-marker-2', radius: 40, color: '#FF7A00', speed: 0.75, phase: 4.4 },
  { markerId: 'bullet-marker-3', radius: 22, color: '#94A3B8', speed: 1.3, phase: 1.0 },
  { markerId: 'bullet-marker-4', radius: 30, color: '#3B82F6', speed: 1.0, phase: 3.2 },
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
const REPULSE_STRENGTH = 1500;
// Gentle proportional steering toward the current wander waypoint — low
// enough that the path curves smoothly across the whole area over several
// seconds instead of snapping toward it like a spring.
const WANDER_GAIN = 0.35;
// How long a planet ambles toward one waypoint before picking a new one,
// randomized per-leg and scaled by each planet's own `speed`.
const WANDER_RETARGET_MIN = 3.5;
const WANDER_RETARGET_MAX = 8;
// Air-resistance-style exponential velocity decay (per second) — a pushed
// planet coasts and gradually loses speed rather than rubber-banding back.
const FRICTION = 0.7;
// Energy kept when bouncing off the edge of the shared free-roam area.
const BOUNCE_RESTITUTION = 0.55;

function pickWanderTarget(bounds, radius, out) {
  const xMin = bounds.xMin + radius;
  const xMax = Math.max(xMin, bounds.xMax - radius);
  const yMin = bounds.yMin + radius;
  const yMax = Math.max(yMin, bounds.yMax - radius);
  out.set(
    THREE.MathUtils.lerp(xMin, xMax, Math.random()),
    THREE.MathUtils.lerp(yMin, yMax, Math.random()),
    0
  );
  return out;
}

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

function Planet({ config, progressRef, rootRef, boundsRef, mouseWorldRef }) {
  const meshRef = useRef(null);
  const pos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const accel = useRef(new THREE.Vector3());
  const wanderTarget = useRef(new THREE.Vector3());
  const wanderTimer = useRef((config.phase % 2) + 0.2);
  const dockedPos = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const pushDir = useRef(new THREE.Vector2());
  const markerElRef = useRef(null);
  const startColor = useRef(new THREE.Color(config.color));
  const initialized = useRef(false);

  useEffect(() => {
    markerElRef.current = document.getElementById(config.markerId);
  }, [config.markerId]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const bounds = boundsRef.current;
    const progress = progressRef.current;

    if (!initialized.current) {
      pickWanderTarget(bounds, config.radius, pos.current);
      pickWanderTarget(bounds, config.radius, wanderTarget.current);
      initialized.current = true;
    }

    // Amble toward a randomly (re-)chosen point somewhere in the whole
    // shared free-roam area, so over time every planet visits the entire
    // space instead of circling near where it started.
    wanderTimer.current -= dt;
    if (wanderTimer.current <= 0) {
      pickWanderTarget(bounds, config.radius, wanderTarget.current);
      wanderTimer.current = THREE.MathUtils.lerp(WANDER_RETARGET_MIN, WANDER_RETARGET_MAX, Math.random()) / config.speed;
    }
    accel.current.set(
      (wanderTarget.current.x - pos.current.x) * WANDER_GAIN * config.speed,
      (wanderTarget.current.y - pos.current.y) * WANDER_GAIN * config.speed,
      0
    );

    // Mouse-proximity repulsion — only while still floating (docked markers
    // shouldn't get bumped around by the cursor moving over the text).
    if (progress <= 0.01 && mouseWorldRef.current) {
      pushDir.current.set(pos.current.x - mouseWorldRef.current.x, pos.current.y - mouseWorldRef.current.y);
      const dist = pushDir.current.length();
      const influenceRadius = config.radius + INFLUENCE_PAD;
      if (dist < influenceRadius) {
        const falloff = 1 - dist / influenceRadius;
        pushDir.current.normalize();
        velocity.current.x += pushDir.current.x * falloff * REPULSE_STRENGTH * dt;
        velocity.current.y += pushDir.current.y * falloff * REPULSE_STRENGTH * dt;
      }
    }

    velocity.current.addScaledVector(accel.current, dt);
    velocity.current.multiplyScalar(Math.exp(-FRICTION * dt));
    pos.current.addScaledVector(velocity.current, dt);

    // Safety containment against the shared free-roam area's edges (mostly
    // relevant right after a hard mouse push near the boundary) — a soft
    // bounce, not a hard clamp.
    const xMin = bounds.xMin + config.radius;
    const xMax = bounds.xMax - config.radius;
    const yMin = bounds.yMin + config.radius;
    const yMax = bounds.yMax - config.radius;
    if (pos.current.x > xMax) {
      pos.current.x = xMax;
      velocity.current.x = -Math.abs(velocity.current.x) * BOUNCE_RESTITUTION;
    } else if (pos.current.x < xMin) {
      pos.current.x = xMin;
      velocity.current.x = Math.abs(velocity.current.x) * BOUNCE_RESTITUTION;
    }
    if (pos.current.y > yMax) {
      pos.current.y = yMax;
      velocity.current.y = -Math.abs(velocity.current.y) * BOUNCE_RESTITUTION;
    } else if (pos.current.y < yMin) {
      pos.current.y = yMin;
      velocity.current.y = Math.abs(velocity.current.y) * BOUNCE_RESTITUTION;
    }

    let scale = 1;
    if (progress <= 0 || !markerElRef.current || !rootRef.current) {
      tmpTarget.current.copy(pos.current);
    } else {
      markerWorldPos(markerElRef.current, rootRef.current, dockedPos.current);
      const eased = easeSmoothstep(progress);
      tmpTarget.current.lerpVectors(pos.current, dockedPos.current, eased);
      scale = THREE.MathUtils.lerp(1, DOCKED_RADIUS_PX / config.radius, eased);
      mesh.material.color.lerpColors(startColor.current, DOCKED_COLOR, eased);
    }

    mesh.position.copy(tmpTarget.current);
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

// One shared free-roam area for every planet — the right-hand portion of
// the hero, clear of the text column on the left and the header/scroll-cue
// margins top and bottom — rather than a small personal patch per planet.
// World x=0 is the canvas's horizontal center, so a positive xMin already
// keeps the whole area clear of the text block on the left half.
function computeBounds(size) {
  return {
    xMin: size.width * 0.03,
    xMax: size.width * 0.49,
    yMin: -size.height * 0.38,
    yMax: size.height * 0.38,
  };
}

function Planets({ progressRef, rootRef }) {
  const { size } = useThree();
  const boundsRef = useRef(computeBounds(size));
  const mouseWorldRef = useRef(new THREE.Vector2(-99999, -99999));

  useEffect(() => {
    boundsRef.current = computeBounds(size);
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
          boundsRef={boundsRef}
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
