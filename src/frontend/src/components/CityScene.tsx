import { Html } from "@react-three/drei";
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
  // Cars placed ON roads (roads at z=-20,0,20 and x=-20,0,20)
  const positions: [number, number][] = [
    // On horizontal road z=0
    [5, -2],
    [-8, 2],
    [15, -2],
    [-12, 2],
    [28, -2],
    [-28, 2],
    // On horizontal road z=-20
    [8, -22],
    [22, -18],
    [-5, -22],
    [-22, -18],
    // On horizontal road z=20
    [-5, 22],
    [25, 18],
    [-18, 22],
    [12, 18],
    // On vertical road x=0
    [2, 10],
    [-2, -10],
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
      {/* Ground — bright sunny green grass */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color="#5a9e48" />
      </mesh>

      {/* Sidewalks (light concrete strips alongside roads) — horizontal */}
      {[-20, 0, 20].map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`sw-h-${z}-${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.004, z + side * 6.5]}
          >
            <planeGeometry args={[140, 2.5]} />
            <meshLambertMaterial color="#d4cfc4" />
          </mesh>
        )),
      )}

      {/* Sidewalks — vertical */}
      {[-20, 0, 20].map((x) =>
        [-1, 1].map((side) => (
          <mesh
            key={`sw-v-${x}-${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x + side * 6.5, 0.004, 0]}
          >
            <planeGeometry args={[2.5, 140]} />
            <meshLambertMaterial color="#d4cfc4" />
          </mesh>
        )),
      )}

      {/* Road grid - horizontal (dark asphalt) — wider roads */}
      {[-20, 0, 20].map((z) => (
        <mesh
          key={`hr-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, z]}
        >
          <planeGeometry args={[140, 12]} />
          <meshLambertMaterial color="#2a2a2a" />
        </mesh>
      ))}

      {/* Road grid - vertical (dark asphalt) — wider roads */}
      {[-20, 0, 20].map((x) => (
        <mesh
          key={`vr-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.01, 0]}
        >
          <planeGeometry args={[12, 140]} />
          <meshLambertMaterial color="#2a2a2a" />
        </mesh>
      ))}

      {/* Road edge lines — horizontal roads, white solid edges */}
      {[-20, 0, 20].map((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`edge-h-${z}-${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, z + side * 5.6]}
          >
            <planeGeometry args={[140, 0.3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )),
      )}

      {/* Road edge lines — vertical roads, white solid edges */}
      {[-20, 0, 20].map((x) =>
        [-1, 1].map((side) => (
          <mesh
            key={`edge-v-${x}-${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x + side * 5.6, 0.02, 0]}
          >
            <planeGeometry args={[0.3, 140]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )),
      )}

      {/* Center lane dashes — horizontal roads (bright yellow dashes) */}
      {[-20, 0, 20].map((z) =>
        Array.from({ length: 25 }, (_, i) => {
          const xPos = -72 + i * 6;
          return (
            <mesh
              key={`dash-h-${z}-${xPos}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[xPos, 0.025, z]}
            >
              <planeGeometry args={[3.8, 0.35]} />
              <meshBasicMaterial color="#ffee00" />
            </mesh>
          );
        }),
      )}

      {/* Center lane dashes — vertical roads (bright yellow dashes) */}
      {[-20, 0, 20].map((x) =>
        Array.from({ length: 25 }, (_, i) => {
          const zPos = -72 + i * 6;
          return (
            <mesh
              key={`dash-v-${x}-${zPos}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x, 0.025, zPos]}
            >
              <planeGeometry args={[0.35, 3.8]} />
              <meshBasicMaterial color="#ffee00" />
            </mesh>
          );
        }),
      )}

      {/* Lane divider dashes — horizontal roads (white, inner lanes) */}
      {[-20, 0, 20].map((z) =>
        [-1, 1].map((lane) =>
          Array.from({ length: 25 }, (_, i) => {
            const xPos = -72 + i * 6;
            return (
              <mesh
                key={`ldash-h-${z}-${lane}-${xPos}`}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[xPos, 0.022, z + lane * 2.8]}
              >
                <planeGeometry args={[2.5, 0.18]} />
                <meshBasicMaterial color="#cccccc" transparent opacity={0.7} />
              </mesh>
            );
          }),
        ),
      )}

      {/* Lane divider dashes — vertical roads (white, inner lanes) */}
      {[-20, 0, 20].map((x) =>
        [-1, 1].map((lane) =>
          Array.from({ length: 25 }, (_, i) => {
            const zPos = -72 + i * 6;
            return (
              <mesh
                key={`ldash-v-${x}-${lane}-${zPos}`}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[x + lane * 2.8, 0.022, zPos]}
              >
                <planeGeometry args={[0.18, 2.5]} />
                <meshBasicMaterial color="#cccccc" transparent opacity={0.7} />
              </mesh>
            );
          }),
        ),
      )}

      {/* Buildings */}
      {buildings.map((b) => (
        <mesh key={`b-${b.x}-${b.z}`} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshLambertMaterial color={b.color} />
        </mesh>
      ))}

      {/* Building windows (reflective glass in daylight) */}
      {buildings.slice(0, 15).map((b) => (
        <mesh
          key={`bw-${b.x}-${b.z}`}
          position={[b.x, b.h * 0.6, b.z + b.d / 2 + 0.01]}
        >
          <planeGeometry args={[b.w * 0.7, b.h * 0.5]} />
          <meshBasicMaterial color="#88ccff" transparent opacity={0.15} />
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
        {/* Floating label above bank */}
        <Html
          position={[0, 12, 0]}
          center
          distanceFactor={18}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              background: "rgba(180,0,40,0.92)",
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 2,
              padding: "5px 14px",
              borderRadius: 4,
              border: "2px solid #ff4466",
              boxShadow: "0 2px 12px rgba(255,34,68,0.7)",
              whiteSpace: "nowrap",
              textShadow: "0 1px 4px #000",
              pointerEvents: "none",
            }}
          >
            🏦 BANK
          </div>
        </Html>
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
        {/* Floating label above gun shop */}
        <Html
          position={[0, 10, 0]}
          center
          distanceFactor={18}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              background: "rgba(140,100,0,0.92)",
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 2,
              padding: "5px 14px",
              borderRadius: 4,
              border: "2px solid #ffcc00",
              boxShadow: "0 2px 12px rgba(255,204,0,0.7)",
              whiteSpace: "nowrap",
              textShadow: "0 1px 4px #000",
              pointerEvents: "none",
            }}
          >
            🔫 GUN SHOP
          </div>
        </Html>
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

      {/* Street lights (daytime — lights off, just the poles) */}
      {[
        [-10, -10],
        [10, -10],
        [-10, 10],
        [10, 10],
        [0, -20],
        [0, 20],
        [-20, 0],
        [20, 0],
        [-20, -20],
        [20, -20],
        [-20, 20],
        [20, 20],
      ].map(([lx, lz]) => (
        <group key={`sl-${lx}-${lz}`} position={[lx, 0, lz]}>
          {/* Pole */}
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 7, 6]} />
            <meshLambertMaterial color="#777777" />
          </mesh>
          {/* Arm */}
          <mesh position={[0.6, 6.8, 0]}>
            <boxGeometry args={[1.4, 0.12, 0.2]} />
            <meshLambertMaterial color="#777777" />
          </mesh>
          {/* Light fixture */}
          <mesh position={[1.2, 6.6, 0]}>
            <boxGeometry args={[0.5, 0.25, 0.4]} />
            <meshLambertMaterial color="#aaaaaa" />
          </mesh>
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

      {/* Decorative city boundary walls / distant hills */}
      {([70, -70] as number[]).map((x) => (
        <mesh key={`wall-x-${x}`} position={[x, 5, 0]}>
          <boxGeometry args={[1, 20, 160]} />
          <meshLambertMaterial color="#5a8040" transparent opacity={0.5} />
        </mesh>
      ))}
      {([70, -70] as number[]).map((z) => (
        <mesh key={`wall-z-${z}`} position={[0, 5, z]}>
          <boxGeometry args={[160, 20, 1]} />
          <meshLambertMaterial color="#5a8040" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
