import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const rand = (min, max) => min + Math.random() * (max - min);

const getBounds = (viewport) => ({
  halfWidth: Math.max(viewport.width / 2, 10),
  halfHeight: Math.max(viewport.height / 2, 5.8),
});

const edgeSpawn = (viewport) => {
  const { halfWidth, halfHeight } = getBounds(viewport);
  const edge = Math.floor(Math.random() * 4);
  const z = rand(-7.5, -3.5);
  if (edge === 0) return { position: [-halfWidth - 1.5, rand(-halfHeight, halfHeight), z], velocity: [rand(0.022, 0.04), rand(-0.009, 0.014), 0] };
  if (edge === 1) return { position: [halfWidth + 1.5, rand(-halfHeight, halfHeight), z], velocity: [rand(-0.04, -0.022), rand(-0.009, 0.014), 0] };
  if (edge === 2) return { position: [rand(-halfWidth, halfWidth), halfHeight + 1.2, z], velocity: [rand(-0.02, 0.02), rand(-0.038, -0.022), 0] };
  return { position: [rand(-halfWidth, halfWidth), -halfHeight - 1.2, z], velocity: [rand(-0.02, 0.02), rand(0.022, 0.038), 0] };
};

function CosmicDust({ count = 72 }) {
  const pointsRef = useRef(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = rand(-10, 10);
      values[index * 3 + 1] = rand(-5.5, 5.5);
      values[index * 3 + 2] = rand(-9, -2.5);
    }
    return values;
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    pointsRef.current.rotation.z = Math.sin(time * 0.08) * 0.035;
    pointsRef.current.rotation.y = time * 0.012;
    pointsRef.current.material.opacity = 0.12 + Math.sin(time * 0.45) * 0.025;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#67e8f9" size={0.055} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function TwinklingStars({ count = 260 }) {
  const pointsRef = useRef(null);
  const starData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = [];

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = rand(-12, 12);
      positions[index * 3 + 1] = rand(-7, 7);
      positions[index * 3 + 2] = rand(-14, -4);
      seeds.push(rand(0, Math.PI * 2));
    }

    return { positions, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    pointsRef.current.material.opacity = 0.22 + Math.sin(time * 0.7 + starData.seeds[0]) * 0.05;
    pointsRef.current.rotation.y = Math.sin(time * 0.04) * 0.025;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[starData.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#dbeafe" size={0.026} transparent opacity={0.24} depthWrite={false} />
    </points>
  );
}

function RocketCraft({ seed }) {
  const viewport = useThree((state) => state.viewport);
  const groupRef = useRef(null);
  const motionRef = useRef({ ...edgeSpawn(viewport), curve: rand(-0.012, 0.012), age: rand(0, 9), seed });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    motion.age += 0.016;
    const curve = Math.sin(clock.getElapsedTime() * 0.42 + motion.seed) * motion.curve;
    motion.position[0] += motion.velocity[0];
    motion.position[1] += motion.velocity[1] + curve;

    const { halfWidth, halfHeight } = getBounds(viewport);
    const outOfBounds =
      Math.abs(motion.position[0]) > halfWidth + 2.4 ||
      Math.abs(motion.position[1]) > halfHeight + 2 ||
      motion.age > 42;
    if (outOfBounds) {
      motionRef.current = { ...edgeSpawn(viewport), curve: rand(-0.012, 0.012), age: 0, seed: rand(0, 10) };
      return;
    }

    const [x, y, z] = motion.position;
    const angle = Math.atan2(motion.velocity[1] + curve, motion.velocity[0]) - Math.PI / 2;
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.z = angle;
  });

  return (
    <group ref={groupRef} scale={0.22}>
      <pointLight color="#67e8f9" intensity={0.78} distance={2.2} />
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.18, 0.36, 18]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.18} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.48, 18]} />
        <meshStandardMaterial color="#94a3b8" emissive="#0f172a" emissiveIntensity={0.08} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.58, 0]}>
        <coneGeometry args={[0.22, 0.7, 18]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, -0.98, 0]}>
        <coneGeometry args={[0.34, 1.15, 18]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

const shootingStarSpawn = (viewport) => {
  const { halfWidth, halfHeight } = getBounds(viewport);
  return {
    position: [rand(-halfWidth - 1.5, halfWidth * 0.72), rand(-halfHeight * 0.1, halfHeight + 1.7), rand(-6.2, -4.2)],
    speed: rand(0.12, 0.18),
  };
};

function ShootingStar({ seed }) {
  const viewport = useThree((state) => state.viewport);
  const groupRef = useRef(null);
  const motionRef = useRef({ ...shootingStarSpawn(viewport), age: -rand(2, 11), seed });

  useFrame(() => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    motion.age += 0.016;

    if (motion.age < 0) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    motion.position[0] += motion.speed;
    motion.position[1] -= motion.speed * 0.62;
    groupRef.current.position.set(...motion.position);

    const life = Math.min(1, motion.age / 1.8);
    const fade = life < 0.2 ? life / 0.2 : 1 - Math.max(0, life - 0.68) / 0.32;
    groupRef.current.children.forEach((child) => {
      if (child.material) child.material.opacity = Math.max(0, fade) * (child.userData.baseOpacity || 1);
    });

    if (motion.age > 1.8) {
      motionRef.current = { ...shootingStarSpawn(viewport), age: -rand(1.8, 8), seed: rand(0, 10) };
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, -0.56]}>
      <mesh position={[-0.54, 0, 0]} userData={{ baseOpacity: 0.36 }}>
        <planeGeometry args={[1.55, 0.018]} />
        <meshBasicMaterial color="#bfdbfe" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh userData={{ baseOpacity: 0.72 }}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function SpaceEffects({ rocketCount = 3, starCount = 260, shootingStarCount = 5 }) {
  const rockets = useMemo(() => Array.from({ length: Math.min(Math.max(rocketCount, 2), 4) }, () => rand(0, 10)), [rocketCount]);
  const shootingStars = useMemo(
    () => Array.from({ length: Math.min(Math.max(shootingStarCount, 3), 7) }, () => rand(0, 10)),
    [shootingStarCount]
  );

  return (
    <>
      <TwinklingStars count={starCount} />
      <CosmicDust />
      {rockets.map((seed) => <RocketCraft key={`rocket-${seed}`} seed={seed} />)}
      {shootingStars.map((seed) => <ShootingStar key={`shooting-star-${seed}`} seed={seed} />)}
    </>
  );
}
