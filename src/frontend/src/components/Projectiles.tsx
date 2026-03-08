import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { ExplosionData } from "./Explosions";

export interface ProjectileData {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  distanceTraveled: number;
  isRocket: boolean;
}

interface ProjectilesProps {
  projectiles: ProjectileData[];
  onProjectilesUpdate: (updated: ProjectileData[]) => void;
  onExplosion: (exp: ExplosionData) => void;
  npcPositions: { id: number; position: THREE.Vector3; hp: number }[];
  onNpcHit: (npcId: number, damage: number) => void;
}

export function Projectiles({
  projectiles,
  onProjectilesUpdate,
  onExplosion,
  npcPositions,
  onNpcHit,
}: ProjectilesProps) {
  const meshRefs = useRef<Record<number, THREE.Mesh>>({});
  const expCounter = useRef(0);

  useFrame((_, delta) => {
    const toRemove = new Set<number>();

    for (const proj of projectiles) {
      proj.position.addScaledVector(proj.direction, proj.speed * delta);
      proj.distanceTraveled += proj.speed * delta;

      const mesh = meshRefs.current[proj.id];
      if (mesh) {
        mesh.position.copy(proj.position);
      }

      if (proj.distanceTraveled > 80) {
        toRemove.add(proj.id);
        continue;
      }

      // Check NPC hits
      let hitNpc = false;
      for (const npc of npcPositions) {
        if (npc.hp <= 0) continue;
        const dist = proj.position.distanceTo(npc.position);
        if (dist < (proj.isRocket ? 3 : 1.2)) {
          onNpcHit(npc.id, proj.damage);
          if (proj.isRocket) {
            expCounter.current++;
            onExplosion({
              id: expCounter.current,
              position: [proj.position.x, proj.position.y, proj.position.z],
              startTime: Date.now(),
            });
          }
          toRemove.add(proj.id);
          hitNpc = true;
          break;
        }
      }

      if (!hitNpc && proj.position.y < -1) {
        toRemove.add(proj.id);
      }
    }

    if (toRemove.size > 0) {
      const remaining = projectiles.filter((p) => !toRemove.has(p.id));
      // Clean up refs
      for (const id of toRemove) {
        delete meshRefs.current[id];
      }
      onProjectilesUpdate(remaining);
    }
  });

  return (
    <>
      {projectiles.map((proj) => (
        <mesh
          key={proj.id}
          position={proj.position.toArray()}
          ref={(el) => {
            if (el) meshRefs.current[proj.id] = el;
          }}
        >
          {proj.isRocket ? (
            <>
              <cylinderGeometry args={[0.1, 0.2, 0.6, 6]} />
              <meshBasicMaterial color="#ff4400" />
            </>
          ) : (
            <>
              <sphereGeometry args={[0.1, 4, 4]} />
              <meshBasicMaterial color="#ffff88" />
            </>
          )}
        </mesh>
      ))}
    </>
  );
}
