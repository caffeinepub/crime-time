import { useFrame } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { CityConfig } from "../cityConfigs";

export interface NPC {
  id: number;
  type: "pedestrian" | "guard" | "cop";
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  direction: THREE.Vector3;
  speed: number;
  lastAttack: number;
  state: "patrol" | "chase" | "flee" | "dead";
  patrolTarget: THREE.Vector3;
  color: string;
}

export interface NPCsHandle {
  getNPCPositions: () => { id: number; position: THREE.Vector3; hp: number }[];
  hitNpc: (id: number, damage: number) => void;
  getNPCs: () => NPC[];
}

interface NPCsProps {
  playerPosition: THREE.Vector3;
  wantedLevel: number;
  inBank: boolean;
  cityConfig: CityConfig;
  onDamagePlayer: (dmg: number) => void;
  onNpcKilled: (type: NPC["type"]) => void;
  onExplosion?: (pos: [number, number, number]) => void;
}

let npcIdCounter = 1000;

function randomPatrolTarget(
  center: THREE.Vector3,
  radius: number,
): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius;
  return new THREE.Vector3(
    center.x + Math.cos(angle) * dist,
    0,
    center.z + Math.sin(angle) * dist,
  );
}

function createPedestrian(index: number): NPC {
  const angle = (index / 10) * Math.PI * 2 + Math.random();
  const dist = 10 + Math.random() * 30;
  return {
    id: npcIdCounter++,
    type: "pedestrian",
    position: new THREE.Vector3(
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist,
    ),
    hp: 30,
    maxHp: 30,
    direction: new THREE.Vector3(1, 0, 0),
    speed: 2 + Math.random(),
    lastAttack: 0,
    state: "patrol",
    patrolTarget: new THREE.Vector3(
      Math.random() * 40 - 20,
      0,
      Math.random() * 40 - 20,
    ),
    color: `hsl(${Math.random() * 360}, 30%, 50%)`,
  };
}

function createGuard(index: number, hp: number): NPC {
  const angle = (index / 8) * Math.PI * 2;
  const r = 3 + Math.random() * 4;
  return {
    id: npcIdCounter++,
    type: "guard",
    position: new THREE.Vector3(
      20 + Math.cos(angle) * r,
      0,
      Math.sin(angle) * r,
    ),
    hp,
    maxHp: hp,
    direction: new THREE.Vector3(1, 0, 0),
    speed: 3,
    lastAttack: 0,
    state: "patrol",
    patrolTarget: new THREE.Vector3(
      20 + Math.random() * 8 - 4,
      0,
      Math.random() * 8 - 4,
    ),
    color: "#1144ff",
  };
}

function createCop(_index: number, hp: number): NPC {
  const angle = Math.random() * Math.PI * 2;
  const dist = 20 + Math.random() * 15;
  return {
    id: npcIdCounter++,
    type: "cop",
    position: new THREE.Vector3(
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist,
    ),
    hp,
    maxHp: hp,
    direction: new THREE.Vector3(1, 0, 0),
    speed: 4,
    lastAttack: 0,
    state: "chase",
    patrolTarget: new THREE.Vector3(0, 0, 0),
    color: "#2266ff",
  };
}

function HPBar({
  hp,
  maxHp,
  position,
}: { hp: number; maxHp: number; position: THREE.Vector3 }) {
  const ratio = hp / maxHp;
  return (
    <group position={[position.x, position.y + 2.5, position.z]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.15, 0.05]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      <mesh position={[(ratio - 1) * 0.6, 0, 0.01]}>
        <boxGeometry args={[1.2 * ratio, 0.12, 0.05]} />
        <meshBasicMaterial
          color={ratio > 0.5 ? "#00ff44" : ratio > 0.25 ? "#ffaa00" : "#ff2244"}
        />
      </mesh>
    </group>
  );
}

export const NPCs = forwardRef<NPCsHandle, NPCsProps>(
  (
    {
      playerPosition,
      wantedLevel,
      inBank,
      cityConfig,
      onDamagePlayer,
      onNpcKilled,
    },
    ref,
  ) => {
    const npcsRef = useRef<NPC[]>([]);
    const prevInBank = useRef(false);
    const prevWanted = useRef(0);
    const meshRefs = useRef<Record<number, THREE.Group>>({});

    // Initialize pedestrians once
    useEffect(() => {
      const peds: NPC[] = Array.from({ length: 10 }, (_, i) =>
        createPedestrian(i),
      );
      npcsRef.current = peds;
    }, []);

    // Spawn guards when entering bank
    useEffect(() => {
      if (inBank && !prevInBank.current) {
        const guards = Array.from({ length: cityConfig.guardCount }, (_, i) =>
          createGuard(i, cityConfig.guardHp),
        );
        npcsRef.current = [
          ...npcsRef.current.filter((n) => n.type !== "guard"),
          ...guards,
        ];
      } else if (!inBank && prevInBank.current) {
        npcsRef.current = npcsRef.current.filter((n) => n.type !== "guard");
      }
      prevInBank.current = inBank;
    }, [inBank, cityConfig]);

    // Spawn cops based on wanted level
    useEffect(() => {
      const prev = prevWanted.current;
      if (wantedLevel > prev) {
        const existing = npcsRef.current.filter((n) => n.type === "cop");
        const needed = Math.min(cityConfig.copCount, wantedLevel * 2);
        const toAdd = Math.max(0, needed - existing.length);
        const newCops = Array.from({ length: toAdd }, (_, i) =>
          createCop(i, cityConfig.copHp),
        );
        if (newCops.length > 0) {
          npcsRef.current = [...npcsRef.current, ...newCops];
        }
      } else if (wantedLevel === 0) {
        npcsRef.current = npcsRef.current.filter((n) => n.type !== "cop");
      }
      prevWanted.current = wantedLevel;
    }, [wantedLevel, cityConfig]);

    useImperativeHandle(ref, () => ({
      getNPCPositions: () =>
        npcsRef.current.map((n) => ({
          id: n.id,
          position: n.position.clone(),
          hp: n.hp,
        })),
      hitNpc: (id: number, damage: number) => {
        const npc = npcsRef.current.find((n) => n.id === id);
        if (npc && npc.hp > 0) {
          npc.hp -= damage;
          if (npc.hp <= 0) {
            npc.hp = 0;
            npc.state = "dead";
            onNpcKilled(npc.type);
          }
        }
      },
      getNPCs: () => npcsRef.current,
    }));

    useFrame((_, delta) => {
      const now = Date.now();
      const playerPos = playerPosition.clone();

      for (const npc of npcsRef.current) {
        if (npc.state === "dead") continue;

        const distToPlayer = npc.position.distanceTo(playerPos);

        // AI state transitions
        if (npc.type === "pedestrian") {
          if (wantedLevel > 0 || distToPlayer < 8) {
            npc.state = "flee";
          } else {
            npc.state = "patrol";
          }
        } else if (npc.type === "guard") {
          if (inBank) {
            npc.state = distToPlayer < 30 ? "chase" : "patrol";
          }
        } else if (npc.type === "cop") {
          npc.state = "chase";
        }

        // Movement
        if (npc.state === "flee") {
          const away = npc.position.clone().sub(playerPos).normalize();
          npc.position.addScaledVector(away, npc.speed * delta);
          npc.position.y = 0;
        } else if (npc.state === "chase") {
          const toward = playerPos.clone().sub(npc.position).normalize();
          npc.position.addScaledVector(toward, npc.speed * delta);
          npc.position.y = 0;

          // Attack if close
          if (distToPlayer < 2.5 && now - npc.lastAttack > 1000) {
            npc.lastAttack = now;
            const dmg = npc.type === "cop" ? 8 : 12;
            onDamagePlayer(dmg);
          }
        } else if (npc.state === "patrol") {
          const toTarget = npc.patrolTarget.clone().sub(npc.position);
          if (toTarget.length() < 1) {
            npc.patrolTarget = randomPatrolTarget(
              npc.type === "guard"
                ? new THREE.Vector3(20, 0, 0)
                : new THREE.Vector3(0, 0, 0),
              npc.type === "guard" ? 6 : 25,
            );
          } else {
            const dir = toTarget.normalize();
            npc.position.addScaledVector(dir, npc.speed * delta);
            npc.position.y = 0;
          }
        }

        // Update mesh position
        const mesh = meshRefs.current[npc.id];
        if (mesh) {
          mesh.position.copy(npc.position);
        }
      }
    });

    return (
      <>
        {npcsRef.current.map((npc) => (
          <group
            key={npc.id}
            ref={(el) => {
              if (el) meshRefs.current[npc.id] = el;
            }}
            position={npc.position.toArray()}
          >
            {npc.state !== "dead" ? (
              <>
                {/* Body */}
                <mesh position={[0, 0.75, 0]}>
                  <boxGeometry args={[0.6, 1.2, 0.4]} />
                  <meshLambertMaterial color={npc.color} />
                </mesh>
                {/* Head */}
                <mesh position={[0, 1.7, 0]}>
                  <boxGeometry args={[0.45, 0.45, 0.45]} />
                  <meshLambertMaterial
                    color={npc.type === "cop" ? "#ffccaa" : "#ffaa88"}
                  />
                </mesh>
                {/* HP bar for guards and cops */}
                {(npc.type === "guard" || npc.type === "cop") && (
                  <HPBar
                    hp={npc.hp}
                    maxHp={npc.maxHp}
                    position={new THREE.Vector3(0, 0, 0)}
                  />
                )}
              </>
            ) : (
              // Dead body - flat on ground
              <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.6, 1.8, 0.2]} />
                <meshLambertMaterial color="#660000" />
              </mesh>
            )}
          </group>
        ))}
      </>
    );
  },
);

NPCs.displayName = "NPCs";
