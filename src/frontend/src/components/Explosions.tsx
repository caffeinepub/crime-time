import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface ExplosionData {
  id: number;
  position: [number, number, number];
  startTime: number;
}

interface ParticleState {
  positions: THREE.Vector3[];
  velocities: THREE.Vector3[];
  startTime: number;
}

interface ExplosionProps {
  explosion: ExplosionData;
  onDone: (id: number) => void;
}

function Explosion({ explosion, onDone }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef<ParticleState>({
    positions: [],
    velocities: [],
    startTime: explosion.startTime,
  });
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const doneRef = useRef(false);

  const PARTICLE_COUNT = 16;

  useEffect(() => {
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.push(new THREE.Vector3(0, 0, 0));
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * Math.cos(upAngle) * (3 + Math.random() * 5),
          Math.sin(upAngle) * (3 + Math.random() * 6),
          Math.sin(angle) * Math.cos(upAngle) * (3 + Math.random() * 5),
        ),
      );
    }
    stateRef.current = {
      positions,
      velocities,
      startTime: explosion.startTime,
    };
  }, [explosion.startTime]);

  useFrame((_, delta) => {
    if (doneRef.current) return;
    const elapsed = (Date.now() - stateRef.current.startTime) / 1000;
    if (elapsed > 1.2) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone(explosion.id);
      }
      return;
    }
    const progress = elapsed / 1.2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const vel = stateRef.current.velocities[i];
      const pos = stateRef.current.positions[i];
      pos.x += vel.x * delta;
      pos.y += vel.y * delta - 9.8 * delta * elapsed;
      pos.z += vel.z * delta;

      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.copy(pos);
        mesh.position.add(new THREE.Vector3(...explosion.position));
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 1 - progress;
        const s = (1 - progress) * 0.3;
        mesh.scale.setScalar(s);
      }
    }
  });

  const colors = ["#ff4400", "#ff8800", "#ffcc00", "#ff2200"];

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => `p${i}`).map(
        (pKey, i) => (
          <mesh
            key={pKey}
            ref={(el) => {
              if (el) meshRefs.current[i] = el;
            }}
            position={explosion.position}
          >
            <sphereGeometry args={[0.3, 4, 4]} />
            <meshBasicMaterial
              color={colors[i % colors.length]}
              transparent
              opacity={1}
            />
          </mesh>
        ),
      )}
    </group>
  );
}

interface ExplosionsProps {
  explosions: ExplosionData[];
  onExplosionDone: (id: number) => void;
}

export function Explosions({ explosions, onExplosionDone }: ExplosionsProps) {
  return (
    <>
      {explosions.map((exp) => (
        <Explosion key={exp.id} explosion={exp} onDone={onExplosionDone} />
      ))}
    </>
  );
}
