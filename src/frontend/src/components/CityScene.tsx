import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import type { CityConfig } from "../cityConfigs";

interface BuildingData {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
}

interface CarData {
  x: number;
  z: number;
  rotation: number;
  color: string;
  hp: number;
}

interface CitySceneProps {
  cityConfig: CityConfig;
  playerPosition: THREE.Vector3;
  onCarDestroyed?: (index: number) => void;
  carHits?: Record<number, number>;
}

const CAR_COLORS = [
  "#cc2222",
  "#2244cc",
  "#226622",
  "#888822",
  "#882288",
  "#cc8822",
  "#228888",
];

function generateBuildings(cityConfig: CityConfig): BuildingData[] {
  const buildings: BuildingData[] = [];
  const rng = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Grid-based city layout
  const positions: [number, number][] = [
    // North block
    [-35, -30],
    [-25, -30],
    [-15, -30],
    [5, -30],
    [15, -30],
    [30, -30],
    // South block
    [-30, 30],
    [-18, 30],
    [-5, 30],
    [10, 30],
    [25, 30],
    [38, 30],
    // West block
    [-40, -15],
    [-40, 0],
    [-40, 15],
    // East block
    [40, -15],
    [40, 0],
    [40, 15],
    // Central blocks (avoiding bank at 20,0 and gun shop at -20,15)
    [-10, -15],
    [-10, 0],
    [-10, 15],
    [10, -15],
    [10, 0],
    [-30, -15],
    [-30, 0],
    [-30, 15],
    [30, -15],
    [30, 0],
    [30, 15],
    // Near bank area (but not on bank)
    [35, -10],
    [35, 5],
    [35, 20],
    // Near gun shop
    [-35, 20],
    [-25, 5],
    [-15, 20],
  ];

  positions.forEach(([bx, bz], i) => {
    const w = 4 + rng(i * 13) * 6;
    const h = 5 + rng(i * 7) * 22;
    const d = 4 + rng(i * 17) * 6;
    const colorIdx = Math.floor(rng(i * 3) * cityConfig.buildingColors.length);
    buildings.push({
      x: bx,
      z: bz,
      w,
      h,
      d,
      color: cityConfig.buildingColors[colorIdx],
    });
  });

  return buildings;
}

function generateCars(): CarData[] {
  const cars: CarData[] = [];
  const positions: [number, number][] = [
    [5, -8],
    [-8, 5],
    [15, 12],
    [-12, -8],
    [8, 20],
    [22, -12],
    [-22, -5],
    [12, -20],
    [-5, 18],
    [28, 8],
    [-18, 22],
    [18, -18],
    [-8, -22],
    [25, 22],
    [-25, -18],
  ];

  positions.forEach(([x, z], i) => {
    cars.push({
      x,
      z,
      rotation: (i * Math.PI) / 4,
      color: CAR_COLORS[i % CAR_COLORS.length],
      hp: 100,
    });
  });

  return cars;
}

export function CityScene({
  cityConfig,
  playerPosition,
  carHits = {},
}: CitySceneProps) {
  const buildings = useMemo(() => generateBuildings(cityConfig), [cityConfig]);
  const cars = useMemo(() => generateCars(), []);
  const groundRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // Nothing dynamic in scene geometry
  });

  return (
    <group>
      {/* Ground */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <planeGeometry args={[120, 120]} />
        <meshLambertMaterial color={cityConfig.groundColor} />
      </mesh>

      {/* Road grid - horizontal */}
      {[-20, 0, 20].map((z) => (
        <mesh
          key={`hr-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, z]}
        >
          <planeGeometry args={[120, 8]} />
          <meshLambertMaterial color="#111111" />
        </mesh>
      ))}

      {/* Road grid - vertical */}
      {[-20, 0, 20].map((x) => (
        <mesh
          key={`vr-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0, 0]}
        >
          <planeGeometry args={[8, 120]} />
          <meshLambertMaterial color="#111111" />
        </mesh>
      ))}

      {/* Road markings - dashes */}
      {Array.from({ length: 20 }, (_, i) => {
        const xPos = -55 + i * 6;
        return (
          <mesh
            key={`dash-h-${xPos}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[xPos, 0.01, 0]}
          >
            <planeGeometry args={[3, 0.3]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
        );
      })}

      {/* Buildings */}
      {buildings.map((b) => (
        <mesh key={`b-${b.x}-${b.z}`} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshLambertMaterial color={b.color} />
        </mesh>
      ))}

      {/* Building windows (simple emissive planes) */}
      {buildings.slice(0, 15).map((b) => (
        <mesh
          key={`bw-${b.x}-${b.z}`}
          position={[b.x, b.h * 0.6, b.z + b.d / 2 + 0.01]}
        >
          <planeGeometry args={[b.w * 0.7, b.h * 0.5]} />
          <meshBasicMaterial color="#ffff88" transparent opacity={0.08} />
        </mesh>
      ))}

      {/* BANK building */}
      <group position={[20, 0, 0]}>
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[10, 8, 10]} />
          <meshLambertMaterial color="#2a2a44" />
        </mesh>
        {/* Bank columns */}
        {[-3.5, -1.5, 1.5, 3.5].map((cx) => (
          <mesh key={`col-${cx}`} position={[cx, 3, 5.1]}>
            <cylinderGeometry args={[0.25, 0.25, 6, 6]} />
            <meshLambertMaterial color="#444466" />
          </mesh>
        ))}
        {/* Bank sign */}
        <mesh position={[0, 8.8, 0]}>
          <boxGeometry args={[8, 1.2, 0.3]} />
          <meshLambertMaterial color="#ff2244" />
        </mesh>
        {/* Bank entrance zone indicator */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.5]}>
          <planeGeometry args={[5, 2]} />
          <meshBasicMaterial color="#ff2244" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* GUN SHOP building */}
      <group position={[-20, 0, 15]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[8, 6, 8]} />
          <meshLambertMaterial color="#332200" />
        </mesh>
        {/* Gun shop sign */}
        <mesh position={[0, 6.5, 0]}>
          <boxGeometry args={[6, 1, 0.3]} />
          <meshLambertMaterial color="#ffcc00" />
        </mesh>
        {/* Gun shop entrance zone indicator */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4.5]}>
          <planeGeometry args={[4, 2]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Parked cars */}
      {cars.map((car, i) => {
        const isDestroyed = (carHits[i] ?? 0) >= 100;
        return (
          <group
            key={`car-${car.x}-${car.z}`}
            position={[car.x, 0, car.z]}
            rotation={[0, car.rotation, 0]}
          >
            {/* Car body */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[2, 0.8, 4]} />
              <meshLambertMaterial
                color={isDestroyed ? "#333333" : car.color}
              />
            </mesh>
            {/* Car roof */}
            <mesh position={[0, 0.95, -0.3]}>
              <boxGeometry args={[1.6, 0.6, 2.2]} />
              <meshLambertMaterial
                color={isDestroyed ? "#222222" : car.color}
              />
            </mesh>
            {/* Wheels */}
            {(
              [
                [-0.9, 0.2, 1.3, "fl"],
                [0.9, 0.2, 1.3, "fr"],
                [-0.9, 0.2, -1.3, "rl"],
                [0.9, 0.2, -1.3, "rr"],
              ] as [number, number, number, string][]
            ).map(([wx, wy, wz, wk]) => (
              <mesh
                key={wk}
                position={[wx, wy, wz]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
                <meshLambertMaterial color="#111111" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Street lights */}
      {[
        [-10, -10],
        [10, -10],
        [-10, 10],
        [10, 10],
        [0, -20],
        [0, 20],
        [-20, 0],
        [20, 0],
      ].map(([lx, lz]) => (
        <group key={`sl-${lx}-${lz}`} position={[lx, 0, lz]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 6, 4]} />
            <meshLambertMaterial color="#444444" />
          </mesh>
          <mesh position={[0.5, 5.8, 0]}>
            <boxGeometry args={[1.2, 0.15, 0.3]} />
            <meshLambertMaterial color="#444444" />
          </mesh>
          <pointLight
            position={[0.5, 5.5, 0]}
            color={cityConfig.color}
            intensity={2}
            distance={12}
          />
        </group>
      ))}

      {/* Player position indicator on ground (shadow ring) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[playerPosition.x, 0.02, playerPosition.z]}
      >
        <ringGeometry args={[0.6, 0.8, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>

      {/* Ambient atmospheric fog effect at edges */}
      {([60, -60] as number[]).map((x) => (
        <mesh key={`fog-x-${x}`} position={[x, 10, 0]}>
          <boxGeometry args={[1, 30, 120]} />
          <meshBasicMaterial
            color={cityConfig.fogColor}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      {([60, -60] as number[]).map((z) => (
        <mesh key={`fog-z-${z}`} position={[0, 10, z]}>
          <boxGeometry args={[120, 30, 1]} />
          <meshBasicMaterial
            color={cityConfig.fogColor}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
