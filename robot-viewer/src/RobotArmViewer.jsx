import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  useAnimations,
  Environment,
  ContactShadows,
  OrbitControls,
  Bounds,
  useBounds,
  Html,
} from '@react-three/drei';

const MODEL_URL = '/models/robot-arm.glb';
const HDRI_URL = '/hdri/studio_small_03_1k.hdr';

// This GLB (unlike the earlier single-mesh export) ships 16 real parts, each
// with its own baked Blender explosion->assembly clip running from t=0
// (exploded) to t=DURATION (assembled) on the same shared timeline — verified
// directly against the glTF's keyframe data before wiring this up. So the
// scroll-scrub below just scrubs THREE.AnimationMixer time per part instead of
// hand-lerping a single transform. Model is already Y-up as exported — no
// axis-fix rotation needed here (checked visually before skipping it).
const DURATION = 2.5;

// The source file also contains a stray "Cube" node/clip: a tiny 24-vertex
// box with its own placeholder material, sitting off to the side of the arm.
// It's a leftover default object from the Blender scene, not a robot part —
// dropped on load (see AssemblyRig) so it neither renders nor skews framing.
const STRAY_NODE_NAME = 'Cube';

// Scroll progress is split into two acts: [0, ASSEMBLE_END] drives the
// explosion/assembly above, [ZOOM_START, 1] drives the camera push into the
// control panel mounted on the arm's shoulder (see CameraZoomRig). The model
// is fully assembled for the whole zoom act.
const ASSEMBLE_END = 0.6;
const ZOOM_START = 0.6;
const ZOOM_END = 1;

// World-space position of the small display panel on the shoulder module,
// found by raycasting a click onto the assembled model (see README) — not
// guessed, since there's no "screen" node name to go by.
const SCREEN_TARGET = new THREE.Vector3(55.68, 78.82, 8.63);
// Close-up camera position framing that panel head-on, offset outward from the
// panel along the shoulder's normal.
const SCREEN_CAMERA_POS = new THREE.Vector3(85.5, 80.3, 11.2);

function AssemblyRig({ progressRef, screenOverlayRef }) {
  const groupRef = useRef(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const bounds = useBounds();
  const hasFitted = useRef(false);

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

    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === `${STRAY_NODE_NAME}Action`) return;
      // .play() activates the action inside the mixer; pausing immediately
      // freezes it so we can scrub .time by hand every frame below instead of
      // letting it advance with real elapsed time.
      action.reset().play();
      action.paused = true;
    });

    // Bounds must frame the ASSEMBLED pose, not whatever scroll position
    // happens to be active when this mounts: push every action to the end of
    // its clip once, force-evaluate the mixer, measure, then hand that box to
    // Bounds directly — never derived from the live, scroll-driven pose.
    if (!hasFitted.current) {
      hasFitted.current = true;
      Object.values(actions).forEach((action) => {
        if (action) action.time = DURATION;
      });
      mixer.update(0);
      const box = new THREE.Box3().setFromObject(scene);
      bounds.refresh(box).fit().clip();
    }
  }, [scene, actions, mixer, bounds]);

  useFrame(() => {
    const t = THREE.MathUtils.clamp(progressRef.current / ASSEMBLE_END, 0, 1) * DURATION;
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === `${STRAY_NODE_NAME}Action`) return;
      action.time = t;
    });
    mixer.update(0);
  });

  return (
    <>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
      <Html
        position={SCREEN_TARGET}
        center
        occlude={false}
        distanceFactor={8}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div ref={screenOverlayRef} style={{ opacity: 0 }}>
          <CareerScreen />
        </div>
      </Html>
    </>
  );
}

// Camera-only rig: pushes the camera from wherever it rested (the Bounds-fit
// overview pose, captured once in RobotArmViewer when the zoom act begins)
// toward a close-up on the panel as the ZOOM_START..ZOOM_END scroll range is
// scrubbed. OrbitControls is unmounted for the duration (see RobotArmViewer)
// so nothing fights this frame-by-frame camera.position/lookAt override.
function CameraZoomRig({ progressRef, restPoseRef, screenOverlayRef }) {
  const { camera } = useThree();
  const lookAtTmp = useRef(new THREE.Vector3());

  useFrame(() => {
    const progress = progressRef.current;
    const zoomT = THREE.MathUtils.clamp((progress - ZOOM_START) / (ZOOM_END - ZOOM_START), 0, 1);

    if (screenOverlayRef.current) {
      const FADE_START = 0.35;
      const opacity = zoomT <= FADE_START ? 0 : (zoomT - FADE_START) / (1 - FADE_START);
      screenOverlayRef.current.style.opacity = String(THREE.MathUtils.clamp(opacity, 0, 1));
    }

    if (zoomT <= 0) return;
    const rest = restPoseRef.current;
    if (!rest.pos || !rest.target) return;

    const eased = zoomT * zoomT * (3 - 2 * zoomT);
    camera.position.lerpVectors(rest.pos, SCREEN_CAMERA_POS, eased);
    lookAtTmp.current.lerpVectors(rest.target, SCREEN_TARGET, eased);
    camera.lookAt(lookAtTmp.current);
  });

  return null;
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
  const controlsRef = useRef(null);
  const rootRef = useRef(null);
  const progressRef = useRef(0);
  const screenOverlayRef = useRef(null);
  const restPoseRef = useRef({ pos: null, target: null });
  const zoomingRef = useRef(false);
  const [zooming, setZooming] = useState(false);

  // Drive the assembly + camera-zoom purely from scroll position: progress 0
  // is exploded, ASSEMBLE_END is fully assembled, and ZOOM_START..1 pushes the
  // camera into the panel (see ASSEMBLE_END/ZOOM_START above). Reuses the host
  // page's existing GSAP ScrollTrigger (already synced with its Lenis
  // smooth-scroll setup) so the model tracks scroll exactly like the rest of
  // the page's scroll-linked effects. Falls back to a plain scroll listener if
  // GSAP isn't present, so the component still works standalone.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const heroEl = document.getElementById('hero') || el;

    function emitProgress(p) {
      progressRef.current = p;
      const nowZooming = p >= ZOOM_START;
      if (nowZooming !== zoomingRef.current) {
        zoomingRef.current = nowZooming;
        // Capture the overview camera pose the instant the zoom act begins,
        // while OrbitControls is still mounted — this is what CameraZoomRig
        // lerps away from and back to. Read synchronously here (not in a
        // frame callback) so it happens before the OrbitControls unmount
        // below takes effect.
        if (nowZooming && controlsRef.current) {
          restPoseRef.current = {
            pos: controlsRef.current.object.position.clone(),
            target: controlsRef.current.target.clone(),
          };
        }
        setZooming(nowZooming);
      }
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
    <div ref={rootRef} className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, position: [1, 2, 7], near: 0.1, far: 100 }}>
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />

        <Suspense fallback={<Loader />}>
          <Bounds margin={1.3}>
            <AssemblyRig progressRef={progressRef} screenOverlayRef={screenOverlayRef} />
          </Bounds>
          <Environment files={HDRI_URL} environmentIntensity={0.12} />
        </Suspense>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={12} blur={2.4} far={6} />

        {/* Unmounted during the zoom act so its per-frame controls.update()
            can't fight CameraZoomRig's direct camera.position/lookAt writes.
            Re-targeting to the captured rest pose on remount avoids a pivot
            jump the next time the user orbits freely. */}
        {!zooming && (
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            target={restPoseRef.current.target ?? undefined}
            minDistance={1.5}
            maxDistance={16}
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />
        )}

        <CameraZoomRig progressRef={progressRef} restPoseRef={restPoseRef} screenOverlayRef={screenOverlayRef} />
      </Canvas>
    </div>
  );
}
