import { Float, Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  galaxyMeta,
  getModuleProgress,
  moduleOrder,
  moduleToGalaxy,
} from "../utils/challengeMapper";
import { notify } from "../../../utils/notifications";
import GalaxyLoadingOverlay from "./GalaxyLoadingOverlay";
import SpaceEffects from "./SpaceEffects";
import { loadGalaxyData } from "./galaxyData";

const selectPositions = {
  html: [-5.8, 0.25, 0],
  css: [-1.95, -0.1, 0],
  javascript: [1.95, -0.1, 0],
  react: [5.8, 0.25, 0],
};

const galaxyVisualThemes = {
  html: {
    surface: "#38bdf8",
    secondary: "#1d4ed8",
    accent: "#a5f3fc",
    ring: "#7dd3fc",
    locked: "#1e3a5f",
    lockedAccent: "#38bdf8",
  },
  css: {
    surface: "#22c55e",
    secondary: "#0f766e",
    accent: "#bbf7d0",
    ring: "#34d399",
    locked: "#244b3a",
    lockedAccent: "#34d399",
  },
  javascript: {
    surface: "#facc15",
    secondary: "#f97316",
    accent: "#fef08a",
    ring: "#fde047",
    locked: "#5b4616",
    lockedAccent: "#facc15",
  },
  react: {
    surface: "#60a5fa",
    secondary: "#8b5cf6",
    accent: "#67e8f9",
    ring: "#a78bfa",
    locked: "#38305f",
    lockedAccent: "#a78bfa",
  },
};

function GalaxySphere({ galaxy, index, onOpen }) {
  const groupRef = useRef(null);
  const sphereRef = useRef(null);
  const ringRef = useRef(null);
  const auraRef = useRef(null);
  const introRef = useRef(0);
  const lockedToastId = `locked-galaxy-${galaxy.id}`;
  const [hovered, setHovered] = useState(false);
  const position = selectPositions[galaxy.id] || [(index - 1.5) * 3.8, 0, 0];
  const visual = galaxyVisualThemes[galaxy.id] || galaxyVisualThemes.html;
  const activeColor = galaxy.locked ? visual.locked : visual.surface;
  const accentColor = galaxy.locked ? visual.lockedAccent : visual.accent;
  const ringColor = galaxy.locked ? visual.lockedAccent : visual.ring;

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      introRef.current = Math.min(1, introRef.current + delta * (1.15 + index * 0.12));
      const eased = 1 - Math.pow(1 - introRef.current, 3);
      const targetScale = hovered && !galaxy.locked ? 1.14 : 1;
      groupRef.current.scale.setScalar(Math.max(0.04, eased * targetScale));
    }

    if (!sphereRef.current) return;
    const time = clock.getElapsedTime();
    sphereRef.current.rotation.y += galaxy.locked ? 0.002 : 0.006 + index * 0.001;
    sphereRef.current.rotation.x = Math.sin(time * 0.55 + index) * 0.12;

    if (ringRef.current) {
      ringRef.current.rotation.z += galaxy.locked ? 0.0015 : 0.004;
      ringRef.current.rotation.x = 1.1 + Math.sin(time * 0.4 + index) * 0.08;
    }

    if (auraRef.current) {
      auraRef.current.scale.setScalar((hovered && !galaxy.locked ? 1.34 : 1.22) + Math.sin(time * 1.5 + index) * 0.018);
    }
  });

  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = galaxy.locked ? "not-allowed" : "pointer";
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "";
  };

  const openGalaxy = () => {
    if (galaxy.locked) {
      notify.info(`${galaxy.name} unlocks after you complete ${galaxy.requiredName}.`, {
        toastId: lockedToastId,
      });
      return;
    }
    onOpen(galaxy.id);
  };

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <Float speed={1.15 + index * 0.18} floatIntensity={0.48} rotationIntensity={0.22}>
      <group
        ref={groupRef}
        position={position}
        onClick={openGalaxy}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <pointLight color={accentColor} intensity={hovered && !galaxy.locked ? 3.4 : 1.9} distance={6.6} />
        <mesh ref={auraRef}>
          <sphereGeometry args={[1.05, 48, 48]} />
          <meshBasicMaterial
            color={ringColor}
            depthWrite={false}
            transparent
            opacity={galaxy.locked ? 0.05 : hovered ? 0.12 : 0.06}
          />
        </mesh>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[1.0, 64, 64]} />
          <meshStandardMaterial
            color={activeColor}
            emissive={galaxy.locked ? visual.locked : visual.secondary}
            emissiveIntensity={hovered && !galaxy.locked ? 0.9 : galaxy.locked ? 0.18 : 0.48}
            metalness={0.22}
            roughness={0.28}
            transparent={galaxy.locked}
            opacity={galaxy.locked ? 0.78 : 1}
          />
        </mesh>
        <mesh position={[0.34, 0.32, 0.82]} scale={galaxy.locked ? 0.28 : 0.36}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={galaxy.locked ? 0.2 : 0.55}
            transparent
            opacity={galaxy.locked ? 0.55 : 0.78}
            roughness={0.24}
          />
        </mesh>
        <mesh position={[-0.42, -0.18, 0.76]} scale={galaxy.locked ? 0.18 : 0.24}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={visual.secondary}
            emissive={visual.secondary}
            emissiveIntensity={galaxy.locked ? 0.14 : 0.42}
            transparent
            opacity={galaxy.locked ? 0.42 : 0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[-0.12, 0.0, 0.94]} rotation={[0, 0.15, -0.35]}>
          <torusGeometry args={[0.72, 0.018, 8, 96]} />
          <meshBasicMaterial color={accentColor} transparent opacity={galaxy.locked ? 0.24 : 0.48} />
        </mesh>
        <mesh position={[0.0, -0.28, 0.92]} rotation={[0, -0.2, 0.24]}>
          <torusGeometry args={[0.58, 0.012, 8, 96]} />
          <meshBasicMaterial color={visual.secondary} transparent opacity={galaxy.locked ? 0.16 : 0.34} />
        </mesh>
        <mesh ref={ringRef} rotation={[1.08, 0.2, index * 0.45]}>
          <torusGeometry args={[1.28, 0.024, 10, 128]} />
          <meshBasicMaterial color={ringColor} transparent opacity={galaxy.locked ? 0.34 : hovered ? 0.78 : 0.52} />
        </mesh>
        <mesh rotation={[0, 0, index * 0.18]}>
          <torusGeometry args={[1.18, 0.026, 10, 128]} />
          <meshBasicMaterial color={ringColor} transparent opacity={galaxy.locked ? 0.24 : hovered ? 0.56 : 0.38} />
        </mesh>
        <mesh rotation={[1.42, -0.35, -index * 0.35]}>
          <torusGeometry args={[1.08, 0.012, 8, 128]} />
          <meshBasicMaterial color={accentColor} transparent opacity={galaxy.locked ? 0.2 : 0.34} />
        </mesh>
        <Html center distanceFactor={7.5} position={[0, -1.75, 0]}>
          <button
            className={`three-galaxy-label ${galaxy.locked ? "is-locked" : ""}`}
            style={{ "--galaxy-accent": ringColor }}
            onClick={(event) => {
              event.stopPropagation();
              openGalaxy();
            }}
            type="button"
          >
            <strong>{galaxy.name}</strong>
            <span>{galaxy.locked ? `Locked until ${galaxy.requiredName}` : `${galaxy.progress}% progress`}</span>
            {galaxy.locked && <Lock size={14} />}
          </button>
        </Html>
      </group>
    </Float>
  );
}

export default function GalaxySelect() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadGalaxyData({ force: true })
      .then(({ challenges: challengeRows, submissions: submissionRows }) => {
        if (!isMounted) return;
        setChallenges(challengeRows);
        setSubmissions(submissionRows);
      })
      .catch((error) => {
        notify.apiError(error, "Challenge galaxies could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const galaxies = useMemo(() => {
    return moduleOrder.reduce((state, moduleName) => {
      const meta = galaxyMeta[moduleToGalaxy[moduleName]];
      const progress = getModuleProgress(challenges, submissions, moduleName);
      const locked = !state.previousComplete;
      const galaxy = {
        ...meta,
        progress: progress.progress,
        total: progress.total,
        completed: progress.completed,
        locked,
        requiredName: state.previousName,
      };

      return {
        previousComplete: progress.isComplete,
        previousName: meta.name,
        galaxies: [...state.galaxies, galaxy],
      };
    }, { previousComplete: true, previousName: "", galaxies: [] }).galaxies;
  }, [challenges, submissions]);

  return (
    <section className="three-galaxy-page three-select-page">
      <div className="three-scene-copy">
        <h1>Universe of Knowledge</h1>
        <p>Complete each galaxy to unlock the next technology path.</p>
      </div>

      {loading && <GalaxyLoadingOverlay label="Loading galaxies..." />}

      <div
        className={`three-canvas-wrap ${loading ? "is-loading" : "is-ready"}`}
        aria-label="Interactive galaxy selection"
        onWheelCapture={(event) => event.preventDefault()}
      >
        <Canvas
          camera={{ position: [0, 2.4, 9.5], fov: 48 }}
          dpr={[1, 1.6]}
        >
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.35} />
          <pointLight position={[0, 3, 4]} intensity={2.1} color="#ffffff" />
          <Stars radius={80} depth={48} count={4600} factor={4} saturation={0} fade speed={0.45} />
          <SpaceEffects rocketCount={4} shootingStarCount={6} starCount={280} />
          {galaxies.map((galaxy, index) => (
            <GalaxySphere
              galaxy={galaxy}
              index={index}
              key={galaxy.id}
              onOpen={(id) => navigate(`/user/galaxy/${id}`)}
            />
          ))}
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={6.8}
            maxDistance={12}
            zoomSpeed={0.65}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Canvas>
      </div>
    </section>
  );
}
