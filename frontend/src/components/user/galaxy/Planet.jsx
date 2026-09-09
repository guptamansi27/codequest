import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const planetThemes = {
  completed: {
    color: "#86efac",
    mid: "#22c55e",
    shadow: "#047857",
    emissive: "#16a34a",
    glow: "#4ade80",
    spot: "#bbf7d0",
    label: "Completed",
  },
  unlocked: {
    color: "#93c5fd",
    mid: "#3b82f6",
    shadow: "#1d4ed8",
    emissive: "#2563eb",
    glow: "#60a5fa",
    spot: "#bfdbfe",
    label: "Unlocked",
  },
  locked: {
    color: "#94a3b8",
    mid: "#475569",
    shadow: "#1e293b",
    emissive: "#111827",
    spot: "#cbd5e1",
    label: "Locked",
  },
};

const lockedPlanetThemes = [
  { color: "#fb7185", mid: "#be123c", shadow: "#450a0a", emissive: "#450a0a", glow: "#fb7185", spot: "#fecdd3" },
  { color: "#c084fc", mid: "#7c3aed", shadow: "#2e1065", emissive: "#2e1065", glow: "#c084fc", spot: "#ddd6fe" },
  { color: "#22d3ee", mid: "#0891b2", shadow: "#083344", emissive: "#083344", glow: "#22d3ee", spot: "#cffafe" },
  { color: "#fbbf24", mid: "#d97706", shadow: "#422006", emissive: "#422006", glow: "#fbbf24", spot: "#fef3c7" },
];

const createPlanetTexture = (theme) => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  const baseGradient = context.createRadialGradient(84, 72, 8, 130, 140, 172);
  baseGradient.addColorStop(0, theme.spot || theme.color);
  baseGradient.addColorStop(0.28, theme.color);
  baseGradient.addColorStop(0.62, theme.mid || theme.emissive);
  baseGradient.addColorStop(1, theme.shadow || theme.emissive);
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, size, size);

  const glowGradient = context.createRadialGradient(54, 44, 4, 54, 44, 88);
  glowGradient.addColorStop(0, "rgba(255,255,255,0.55)");
  glowGradient.addColorStop(0.42, "rgba(255,255,255,0.18)");
  glowGradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glowGradient;
  context.fillRect(0, 0, size, size);

  context.globalCompositeOperation = "overlay";
  context.fillStyle = "rgba(255,255,255,0.12)";
  context.beginPath();
  context.ellipse(72, 168, 44, 12, -0.32, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(172, 92, 34, 9, 0.48, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export default function Planet({ node, challenge, onOpen }) {
  const groupRef = useRef(null);
  const meshRef = useRef(null);
  const introRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const isLocked = node.status === "locked";
  const theme = useMemo(() => {
    const lockedTheme = lockedPlanetThemes[(Number(node.label) - 1) % lockedPlanetThemes.length];
    return isLocked
      ? { ...planetThemes.locked, ...lockedTheme }
      : planetThemes[node.status] || planetThemes.unlocked;
  }, [isLocked, node.label, node.status]);
  const planetTexture = useMemo(() => createPlanetTexture(theme), [theme]);

  useEffect(() => {
    return () => {
      planetTexture.dispose();
      document.body.style.cursor = "";
    };
  }, [planetTexture]);

  const motion = useMemo(() => {
    const orbitDistance = node.orbitDistance || (node.orbit === 2 ? 4.8 : 3.05);
    const speed = node.speed || (node.orbit === 2 ? 0.16 : 0.24);
    const angle = ((node.angle || 0) * Math.PI) / 180;
    const size = node.size || (node.orbit === 2 ? 0.42 : 0.5);

    return { orbitDistance, speed, angle, size };
  }, [node.angle, node.orbit, node.orbitDistance, node.size, node.speed]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    const time = clock.getElapsedTime();
    const angle = motion.angle + time * motion.speed;
    const floating = Math.sin(time * 1.6 + motion.angle) * 0.12;
    introRef.current = Math.min(1, introRef.current + delta * 1.35);
    const eased = 1 - Math.pow(1 - introRef.current, 3);
    const scale = (hovered && !isLocked ? 1.18 : 1) * eased;

    groupRef.current.position.set(
      Math.cos(angle) * motion.orbitDistance,
      floating,
      Math.sin(angle) * motion.orbitDistance
    );
    groupRef.current.scale.setScalar(Math.max(0.04, scale));
    meshRef.current.rotation.y += 0.012;
  });

  const handlePointerOver = (event) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = isLocked ? "not-allowed" : "pointer";
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "";
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (!isLocked) {
      onOpen(node.id);
    }
  };

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <pointLight
        color={theme.glow || theme.color}
        intensity={hovered && !isLocked ? 2.4 : 1.15}
        distance={isLocked ? 3.2 : 4.5}
      />
      <mesh ref={meshRef}>
        <sphereGeometry args={[motion.size, 48, 48]} />
        <meshStandardMaterial
          map={planetTexture}
          color="#ffffff"
          emissive={theme.emissive}
          emissiveIntensity={hovered && !isLocked ? 0.72 : isLocked ? 0.08 : 0.28}
          metalness={0.18}
          roughness={0.3}
          transparent={isLocked}
          opacity={isLocked ? 0.72 : 1}
        />
      </mesh>
      <mesh position={[motion.size * 0.28, motion.size * 0.2, motion.size * 0.86]} scale={0.24}>
        <sphereGeometry args={[motion.size, 24, 24]} />
        <meshBasicMaterial color={theme.spot || theme.color} transparent opacity={isLocked ? 0.28 : 0.42} />
      </mesh>
      <mesh rotation={[1.02, 0.16, 0.38]}>
        <torusGeometry args={[motion.size * 1.08, 0.008, 8, 96]} />
        <meshBasicMaterial color={theme.glow || theme.color} transparent opacity={isLocked ? 0.22 : hovered ? 0.46 : 0.3} />
      </mesh>
      {isLocked && (
        <>
          <mesh scale={1.24} rotation={[1.05, 0.2, 0.45]}>
            <torusGeometry args={[motion.size * 1.14, 0.01, 8, 96]} />
            <meshBasicMaterial color={theme.glow} transparent opacity={0.38} />
          </mesh>
          <mesh scale={1.48}>
            <sphereGeometry args={[motion.size, 32, 32]} />
            <meshBasicMaterial color={theme.glow} transparent opacity={0.08} />
          </mesh>
        </>
      )}
      {!isLocked && (
        <mesh scale={hovered ? 1.55 : 1.32}>
          <sphereGeometry args={[motion.size, 32, 32]} />
          <meshBasicMaterial color={theme.color} transparent opacity={hovered ? 0.18 : 0.08} />
        </mesh>
      )}
      <Html center distanceFactor={9} position={[0, -0.82, 0]}>
        <div className={`planet-label is-${node.status}`}>
          <strong>{challenge?.title || `Level ${node.label}`}</strong>
          <span>{theme.label}</span>
        </div>
      </Html>
    </group>
  );
}
