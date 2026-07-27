import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Bounds, useBounds, Html } from '@react-three/drei';
import { useSpring, animated, easings } from '@react-spring/three';

const MODEL_URL = '/models/robot-arm.glb';
const HDRI_URL = '/hdri/studio_small_03_1k.hdr';

// The source GLB is exported Z-up (common from Blender pipelines that skip the
// usual Z-up -> Y-up conversion); rotating -90deg around X puts it back on its
// feet in three.js's Y-up world. This lives on a static outer wrapper — fixed
// once, no runtime trial-and-error — so it never fights the entrance animation
// below, which operates purely in the now-correct local frame.
const ZUP_TO_YUP = [-Math.PI / 2, 0, 0];

// Single-object "entrance" pose (see RobotArmViewer.jsx module comment below
// for why this isn't a multi-part explosion).
const EXPLODED = { position: [1.6, 2.6, -1.8], scale: 0.45, rotation: [0, -1.1, 0] };
const ASSEMBLED = { position: [0, 0, 0], scale: 1, rotation: [0, 0, 0] };
const ENTRANCE_DURATION_MS = 2000;

function AssemblyRig({ playToken }) {
  const { scene } = useGLTF(MODEL_URL);
  const bounds = useBounds();
  const hasFitted = useRef(false);

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

  // Bounds must frame the ASSEMBLED pose, not whatever the entrance spring is
  // doing when it happens to mount. So: compute a Box3 from the geometry in
  // its rest transform (identity + the static Z-up fix only) and hand that to
  // Bounds directly, once — never from the live, animated node.
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

  const [spring, api] = useSpring(() => ({
    from: EXPLODED,
    to: EXPLODED,
    immediate: true,
  }));

  function assemble() {
    api.start({
      to: ASSEMBLED,
      config: { duration: ENTRANCE_DURATION_MS, easing: easings.easeOutBack },
    });
  }

  const playedRef = useRef(false);
  useEffect(() => {
    if (!playToken || playedRef.current) return;
    playedRef.current = true;
    assemble();
  }, [playToken]);

  function replay() {
    api.set(EXPLODED);
    assemble();
  }

  return (
    <group rotation={ZUP_TO_YUP}>
      <animated.group position={spring.position} scale={spring.scale} rotation={spring.rotation} onClick={replay}>
        <primitive object={scene} />
      </animated.group>
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
  const [playToken, setPlayToken] = useState(0);

  // Play the entrance once the viewer first scrolls into view, not immediately
  // on page load if the hero isn't in the viewport yet.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlayToken((t) => t + 1);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={className} style={{ width: '100%', height: '100%', cursor: 'pointer', ...style }}>
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
            <AssemblyRig playToken={playToken} />
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
