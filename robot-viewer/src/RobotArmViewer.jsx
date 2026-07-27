import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Bounds, useBounds, Html } from '@react-three/drei';

const MODEL_URL = '/models/robot-arm.glb';
const HDRI_URL = '/hdri/studio_small_03_1k.hdr';

// The source GLB is exported Z-up (common from Blender pipelines that skip the
// usual Z-up -> Y-up conversion); rotating -90deg around X puts it back on its
// feet in three.js's Y-up world. This lives on a static outer wrapper — fixed
// once, no runtime trial-and-error — so it never fights the scroll-driven
// assembly transform below, which operates purely in the now-correct local frame.
const ZUP_TO_YUP = [-Math.PI / 2, 0, 0];

// Single-object "exploded" vs. "assembled" pose (see module comment in
// AssemblyRig for why this isn't a multi-part explosion) — interpolated
// directly from scroll progress, not animated on a timer.
const EXPLODED = { position: [1.6, 2.6, -1.8], scale: 0.45, rotation: [0, -1.1, 0] };
const ASSEMBLED = { position: [0, 0, 0], scale: 1, rotation: [0, 0, 0] };

function lerp3(a, b, t) {
  return [
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  ];
}

function AssemblyRig({ progressRef }) {
  const { scene } = useGLTF(MODEL_URL);
  const bounds = useBounds();
  const hasFitted = useRef(false);
  const rigRef = useRef(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        // Render flags only — no material overrides.
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // Diagnostic: log the GLB's real node structure. For this particular
    // model this prints exactly one node/mesh (see README) — there is no
    // per-part hierarchy to explode. Kept in so re-exporting the source
    // model with separate objects is immediately verifiable here.
    // eslint-disable-next-line no-console
    console.log('[RobotArmViewer] GLB node structure:');
    scene.traverse((child) => {
      // eslint-disable-next-line no-console
      console.log(` - name="${child.name || '(unnamed)'}" type=${child.type}`);
    });
  }, [scene]);

  // Bounds must frame the ASSEMBLED pose, not whatever scroll position happens
  // to be active when this mounts. So: compute a Box3 from the geometry in its
  // rest transform (identity + the static Z-up fix only) and hand that to
  // Bounds directly, once — never from the live, scroll-driven node.
  const restBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    box.applyMatrix4(new THREE.Matrix4().makeRotationX(ZUP_TO_YUP[0]));
    return box;
  }, [scene]);

  useEffect(() => {
    if (hasFitted.current) return;
    hasFitted.current = true;
    bounds.refresh(restBox).fit().clip();
  }, [restBox, bounds]);

  useFrame(() => {
    const g = rigRef.current;
    if (!g) return;
    const t = progressRef.current;
    g.position.set(...lerp3(EXPLODED.position, ASSEMBLED.position, t));
    g.rotation.set(...lerp3(EXPLODED.rotation, ASSEMBLED.rotation, t));
    g.scale.setScalar(THREE.MathUtils.lerp(EXPLODED.scale, ASSEMBLED.scale, t));
  });

  return (
    <group rotation={ZUP_TO_YUP}>
      <group ref={rigRef}>
        <primitive object={scene} />
      </group>
    </group>
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

  // Drive the assembly purely from scroll position: 0 = exploded, 1 =
  // assembled. Reuses the host page's existing GSAP ScrollTrigger (already
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
            <AssemblyRig progressRef={progressRef} />
          </Bounds>
          <Environment files={HDRI_URL} />
        </Suspense>

        <ContactShadows position={[0, -0.01, 0]} opacity={0.55} scale={12} blur={2.4} far={6} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          minDistance={1.5}
          maxDistance={16}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
    </div>
  );
}
