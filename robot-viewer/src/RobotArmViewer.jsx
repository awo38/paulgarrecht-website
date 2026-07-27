import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows, Html } from '@react-three/drei';

const MODEL_URL = '/models/robot-arm.glb';
const HDRI_URL = '/hdri/studio_small_03_1k.hdr';

// This export (unlike the previous one) ships its own baked camera animation
// ("CameraAction.001", 3.75s) alongside the 16 per-part explosion->assembly
// clips (2.5s each) — verified directly against the glTF's keyframe data
// before wiring this up. Both kinds of clip are scrubbed by the SAME 0..1
// scroll progress value, each scaled against its OWN clip duration:
//   action.time = progress * action.getClip().duration
// Since every clip reaches its own end exactly at progress=1 regardless of
// its native length, the assembly and the camera move independently but
// always finish together — no manual phase-splitting (no ASSEMBLE_END/
// ZOOM_START) needed like the previous hand-lerped camera required.
const STRAY_NODE_NAME = 'Cube';

// The screen/display mesh, identified by traversing the loaded scene (see
// README): node "obj_2" is the shoulder module; GLTFLoader splits its 4
// materials into child meshes "obj_2_1".."obj_2_4", and "obj_2_2" is the one
// using the light-cyan "screen glass" material — confirmed by checking that
// material's world position lands on the same point a raycast click on the
// panel hit in the previous model version.
const SCREEN_NODE_NAME = 'obj_2_2';

// Nothing overlays the 3D scene until the camera has essentially arrived at
// the screen — the career readout only ever appears ON the screen, never
// earlier in the ride.
const SCREEN_REVEAL_START = 0.85;

function AssemblyRig({ progressRef, screenOverlayRef, cardRef }) {
  const groupRef = useRef(null);
  const { scene, animations, cameras } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const { set } = useThree();
  const screenObjRef = useRef(null);
  const hasSetCamera = useRef(false);
  const boxTmp = useRef(new THREE.Box3());
  const cornerTmp = useRef(
    Array.from({ length: 8 }, () => new THREE.Vector3())
  );
  const naturalSize = useRef(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        // Render flags only — no material overrides (PBR materials as authored).
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const stray = scene.getObjectByName(STRAY_NODE_NAME);
    if (stray && stray.parent) stray.parent.remove(stray);

    screenObjRef.current = scene.getObjectByName(SCREEN_NODE_NAME);

    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === `${STRAY_NODE_NAME}Action`) return;
      // .play() activates the action inside the mixer; pausing immediately
      // freezes it so we can scrub .time by hand every frame below instead of
      // letting it advance with real elapsed time.
      action.reset().play();
      action.paused = true;
    });
  }, [scene, actions]);

  useEffect(() => {
    if (hasSetCamera.current || !cameras || !cameras[0]) return;
    hasSetCamera.current = true;
    // Fully authored camera move (see module comment) — this replaces R3F's
    // default Canvas camera entirely; no OrbitControls, no manual framing.
    set({ camera: cameras[0] });
  }, [cameras, set]);

  useFrame(({ camera, size }) => {
    const progress = progressRef.current;
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === `${STRAY_NODE_NAME}Action`) return;
      action.time = progress * action.getClip().duration;
    });
    mixer.update(0);

    const screenObj = screenObjRef.current;
    if (!screenObj || !screenOverlayRef.current) return;

    screenObj.updateWorldMatrix(true, false);
    const box = boxTmp.current.setFromObject(screenObj);
    const corners = cornerTmp.current;
    corners[0].set(box.min.x, box.min.y, box.min.z);
    corners[1].set(box.min.x, box.min.y, box.max.z);
    corners[2].set(box.min.x, box.max.y, box.min.z);
    corners[3].set(box.min.x, box.max.y, box.max.z);
    corners[4].set(box.max.x, box.min.y, box.min.z);
    corners[5].set(box.max.x, box.min.y, box.max.z);
    corners[6].set(box.max.x, box.max.y, box.min.z);
    corners[7].set(box.max.x, box.max.y, box.max.z);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const corner of corners) {
      corner.project(camera);
      const x = (corner.x * 0.5 + 0.5) * size.width;
      const y = (1 - (corner.y * 0.5 + 0.5)) * size.height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const el = screenOverlayRef.current;
    const rectW = Math.max(0, maxX - minX);
    const rectH = Math.max(0, maxY - minY);
    el.style.left = `${minX}px`;
    el.style.top = `${minY}px`;
    el.style.width = `${rectW}px`;
    el.style.height = `${rectH}px`;

    const revealT = progress <= SCREEN_REVEAL_START ? 0 : (progress - SCREEN_REVEAL_START) / (1 - SCREEN_REVEAL_START);
    el.style.opacity = String(THREE.MathUtils.clamp(revealT, 0, 1));

    // Scale the career card to fit whatever size the tracked screen rect
    // currently is, instead of letting it clip/overflow while the rect is
    // still small early in the reveal. Measured once, lazily, before any
    // transform has ever been applied (so the measurement is the card's true
    // untransformed size), then reused for the rest of the session.
    if (cardRef.current) {
      if (!naturalSize.current) {
        const r = cardRef.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) naturalSize.current = { width: r.width, height: r.height };
      }
      if (naturalSize.current) {
        const scale = Math.min(rectW / naturalSize.current.width, rectH / naturalSize.current.height, 1);
        cardRef.current.style.transform = `scale(${Math.max(scale, 0.001)})`;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function diffBreakdown(from, to) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  let hours = to.getHours() - from.getHours();
  let minutes = to.getMinutes() - from.getMinutes();
  let seconds = to.getSeconds() - from.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  return { years, months, days, hours, minutes, seconds };
}

const MILESTONES = [
  { label: 'B.Eng. Mechatronik', since: new Date(2019, 8, 1) },
  { label: 'Int. Schweißfachingenieur (IWE)', since: new Date(2022, 2, 1) },
  { label: 'Einsatzleitung KHG', since: new Date(2019, 8, 1) },
];

function CareerScreen() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        width: 260,
        fontFamily: "'IBM Plex Mono', Menlo, monospace",
        background: 'rgba(11, 15, 20, 0.92)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: 6,
        padding: '14px 16px',
        boxShadow: '0 0 24px rgba(255, 122, 0, 0.15)',
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#FF7A00',
          marginBottom: 10,
        }}
      >
        Werdegang — Live
      </div>
      {MILESTONES.map((m) => {
        const d = diffBreakdown(m.since, now);
        return (
          <div key={m.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>
              {m.label} · seit {pad(m.since.getDate())}.{pad(m.since.getMonth() + 1)}.{m.since.getFullYear()}
            </div>
            <div style={{ fontSize: 11, color: '#F8FAFC', letterSpacing: '0.02em' }}>
              {d.years}J {d.months}M {d.days}T · {pad(d.hours)}:{pad(d.minutes)}:{pad(d.seconds)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

useGLTF.preload(MODEL_URL);

function Loader() {
  return (
    <Html center>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#94A3B8',
          whiteSpace: 'nowrap',
        }}
      >
        Lädt Modell…
      </div>
    </Html>
  );
}

export default function RobotArmViewer({ style, className }) {
  const rootRef = useRef(null);
  const progressRef = useRef(0);
  const screenOverlayRef = useRef(null);
  const cardRef = useRef(null);

  // Drive the whole sequence purely from scroll position (0..1 across the
  // pinned hero). Reuses the host page's existing GSAP ScrollTrigger (already
  // synced with its Lenis smooth-scroll setup) so the model tracks scroll
  // exactly like the rest of the page's scroll-linked effects. Falls back to
  // a plain scroll listener if GSAP isn't present, so the component still
  // works standalone.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const heroEl = document.getElementById('hero') || el;

    function emitProgress(p) {
      progressRef.current = p;
      el.dispatchEvent(new CustomEvent('assembly-progress', { detail: { progress: p }, bubbles: true }));
    }

    if (window.gsap && window.ScrollTrigger) {
      const st = window.ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => emitProgress(self.progress),
      });
      return () => st.kill();
    }

    let queued = false;
    function computeAndEmit() {
      queued = false;
      const total = heroEl.offsetHeight - window.innerHeight;
      const scrolled = -heroEl.getBoundingClientRect().top;
      emitProgress(total > 0 ? THREE.MathUtils.clamp(scrolled / total, 0, 1) : 1);
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
    <div ref={rootRef} className={className} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      <Canvas shadows dpr={[1, 2]}>
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />

        <Suspense fallback={<Loader />}>
          <AssemblyRig progressRef={progressRef} screenOverlayRef={screenOverlayRef} cardRef={cardRef} />
          <Environment files={HDRI_URL} environmentIntensity={0.12} />
        </Suspense>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={12} blur={2.4} far={6} />
      </Canvas>

      {/* Positioned/sized every frame (see AssemblyRig's useFrame) to match the
          screen mesh's projected on-screen rect, so the career readout looks
          embedded in the physical display rather than floating over the
          scene. Stays fully transparent until the camera has essentially
          arrived (see SCREEN_REVEAL_START) — nothing appears earlier in the ride. */}
      <div
        ref={screenOverlayRef}
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        {/* Scaled (not clipped) to fit the tracked rect — see naturalSize in
            AssemblyRig's useFrame. transform-origin center keeps it anchored
            in the middle of the screen as it grows. */}
        <div ref={cardRef} style={{ transformOrigin: 'center center' }}>
          <CareerScreen />
        </div>
      </div>
    </div>
  );
}
