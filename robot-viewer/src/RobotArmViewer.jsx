import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Bounds, Html } from '@react-three/drei';

const MODEL_URL = '/models/robot-arm.glb';
const HDRI_URL = '/hdri/studio_small_03_1k.hdr';

function Model(props) {
  // Load the real GLB exactly as authored — no placeholder geometry, no material overrides.
  const { scene } = useGLTF(MODEL_URL);

  useEffect(() => {
    // GLTF meshes don't cast/receive shadows by default; enabling it is a render
    // flag on the existing meshes, not a material change.
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
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

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
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
          <Bounds fit clip observe margin={1.3}>
            <group rotation={[0, Math.PI * 0.12, 0]}>
              <Model />
            </group>
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
