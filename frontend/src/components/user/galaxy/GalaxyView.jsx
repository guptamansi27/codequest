import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Lock, Rocket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import {
  galaxyMeta,
  galaxyToModule,
  getChallengeModule,
  getModuleProgress,
  isChallengeLive,
  isSubmissionPassed,
  mapBackendChallenge,
  moduleOrder,
} from "../utils/challengeMapper";
import { notify } from "../../../utils/notifications";
import GalaxyLoadingOverlay from "./GalaxyLoadingOverlay";
import Planet from "./Planet";
import SpaceEffects from "./SpaceEffects";
import { loadGalaxyData } from "./galaxyData";

function OrbitRing({ radius }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 128]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.16} />
    </mesh>
  );
}

const createSunTexture = (locked) => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  const colors = locked
    ? {
        core: "#cbd5e1",
        mid: "#64748b",
        edge: "#1f2937",
        flare: "#e2e8f0",
      }
    : {
        core: "#fff7ad",
        mid: "#f97316",
        edge: "#7c2d12",
        flare: "#fed7aa",
      };

  const baseGradient = context.createRadialGradient(82, 72, 10, 132, 136, 168);
  baseGradient.addColorStop(0, colors.core);
  baseGradient.addColorStop(0.28, colors.flare);
  baseGradient.addColorStop(0.62, colors.mid);
  baseGradient.addColorStop(1, colors.edge);
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, size, size);

  const highlightGradient = context.createRadialGradient(62, 52, 4, 62, 52, 80);
  highlightGradient.addColorStop(0, "rgba(255,255,255,0.7)");
  highlightGradient.addColorStop(0.36, "rgba(255,255,255,0.22)");
  highlightGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = highlightGradient;
  context.fillRect(0, 0, size, size);

  context.globalCompositeOperation = "screen";
  context.strokeStyle = locked ? "rgba(226,232,240,0.16)" : "rgba(255,247,173,0.28)";
  context.lineWidth = 9;
  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.ellipse(128, 128 + index * 9, 82 - index * 10, 12, -0.28 + index * 0.22, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

function FinalProjectSun({ locked }) {
  const groupRef = useRef(null);
  const sunTexture = useMemo(() => createSunTexture(locked), [locked]);

  useEffect(() => {
    return () => {
      sunTexture.dispose();
    };
  }, [sunTexture]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.9) * 0.035;
    groupRef.current.rotation.y += 0.004;
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <pointLight color={locked ? "#64748b" : "#f97316"} intensity={locked ? 1.3 : 4.8} distance={9} />
      <mesh>
        <sphereGeometry args={[0.78, 64, 64]} />
        <meshStandardMaterial
          map={sunTexture}
          color="#ffffff"
          emissive={locked ? "#111827" : "#f97316"}
          emissiveIntensity={locked ? 0.12 : 0.92}
          metalness={0.1}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[0.24, 0.22, 0.68]} scale={0.22}>
        <sphereGeometry args={[0.78, 24, 24]} />
        <meshBasicMaterial color={locked ? "#e2e8f0" : "#fff7ad"} transparent opacity={locked ? 0.2 : 0.42} />
      </mesh>
      <mesh scale={1.75}>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshBasicMaterial color={locked ? "#64748b" : "#f97316"} transparent opacity={locked ? 0.08 : 0.16} />
      </mesh>
      <mesh scale={2.1}>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshBasicMaterial color={locked ? "#94a3b8" : "#facc15"} transparent opacity={locked ? 0.04 : 0.08} />
      </mesh>
      <mesh rotation={[1.08, 0.12, 0.42]}>
        <torusGeometry args={[1.08, 0.012, 8, 128]} />
        <meshBasicMaterial color={locked ? "#94a3b8" : "#fbbf24"} transparent opacity={locked ? 0.16 : 0.34} />
      </mesh>
      <Html center distanceFactor={8} position={[0, -1.28, 0]}>
        <div className={`sun-label ${locked ? "is-locked" : ""}`}>
          {locked ? <Lock /> : <Rocket />}
          {locked ? "Complete Galaxy" : "Galaxy Complete"}
        </div>
      </Html>
    </group>
  );
}

export default function GalaxyView({ type = "html" }) {
  const navigate = useNavigate();
  const galaxy = galaxyMeta[type] || galaxyMeta.html;
  const moduleName = galaxyToModule[type] || "HTML";
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
        notify.apiError(error, "Galaxy challenges could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [moduleName]);

  const isGalaxyUnlocked = useMemo(() => {
    const currentIndex = moduleOrder.indexOf(moduleName);
    if (currentIndex <= 0) return true;

    return moduleOrder.slice(0, currentIndex).every((previousModule) =>
      getModuleProgress(challenges, submissions, previousModule).isComplete
    );
  }, [challenges, moduleName, submissions]);

  const mappedChallenges = useMemo(() => {
    const moduleChallenges = challenges
      .filter(
        (challenge) =>
          challenge.challenge_type === "CHALLENGE" &&
          getChallengeModule(challenge) === moduleName &&
          challenge.is_active
      )
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time) || a.id - b.id);

    return moduleChallenges.map((challenge, index) => ({
      node: {
        id: String(challenge.id),
        label: String(index + 1),
        angle: (360 / Math.max(moduleChallenges.length, 1)) * index,
        orbit: index % 2 === 0 ? 1 : 2,
        status: !isGalaxyUnlocked
          ? "locked"
          : !isChallengeLive(challenge)
            ? "locked"
          : isSubmissionPassed(submissions, challenge.id)
            ? "completed"
            : "unlocked",
      },
      challenge: mapBackendChallenge(challenge),
    }));
  }, [challenges, isGalaxyUnlocked, moduleName, submissions]);

  const allComplete =
    mappedChallenges.length > 0 &&
    mappedChallenges.every(({ node }) => node.status === "completed");

  return (
    <section className="three-galaxy-page three-detail-page">
      <div className="three-detail-topbar">
        <div>
          <h1>{galaxy.title}</h1>
          <p>{galaxy.subtitle}</p>
        </div>
      </div>

      {!isGalaxyUnlocked && !loading && (
        <div className="three-locked-banner">Complete previous galaxies before entering {galaxy.name}.</div>
      )}

      {loading && <GalaxyLoadingOverlay label={`Loading ${galaxy.name}...`} />}

      {!loading && mappedChallenges.length === 0 && (
        <div className="three-loading-panel">No active challenges are available in this galaxy yet.</div>
      )}

      <div
        className={`three-canvas-wrap three-system-wrap ${loading ? "is-loading" : "is-ready"}`}
        aria-label={`${galaxy.title} 3D planets`}
        onWheelCapture={(event) => event.preventDefault()}
      >
        <Canvas
          camera={{ position: [0, 6.5, 9.5], fov: 48 }}
          dpr={[1, 1.6]}
        >
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 12, 24]} />
          <ambientLight intensity={0.28} />
          <pointLight position={[0, 6, 4]} intensity={1.5} color="#bfdbfe" />
          <Stars radius={90} depth={55} count={5200} factor={4.2} saturation={0} fade speed={0.4} />
          <SpaceEffects rocketCount={4} shootingStarCount={6} starCount={340} />
          <OrbitRing radius={3.05} />
          <OrbitRing radius={4.8} />
          <FinalProjectSun locked={!allComplete} />
          {mappedChallenges.map(({ node, challenge }) => (
            <Planet
              challenge={challenge}
              key={node.id}
              node={node}
              onOpen={(id) => navigate(`/user/challenge/${id}`)}
            />
          ))}
          <OrbitControls
            enablePan={false}
            minDistance={6.2}
            maxDistance={13}
            zoomSpeed={0.65}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>

      <div className="three-legend">
        <span><i className="legend-completed" /> Completed</span>
        <span><i className="legend-unlocked" /> Unlocked</span>
        <span><i className="legend-locked" /> Locked</span>
      </div>
    </section>
  );
}
