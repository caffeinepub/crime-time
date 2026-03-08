import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { CITY_CONFIGS } from "./cityConfigs";
import { BankOverlay } from "./components/BankOverlay";
import { CityScene } from "./components/CityScene";
import { type ExplosionData, Explosions } from "./components/Explosions";
import { GunShop } from "./components/GunShop";
import { HUD } from "./components/HUD";
import { NPCs, type NPCsHandle } from "./components/NPCs";
import { Player, type PlayerHandle } from "./components/Player";
import { type ProjectileData, Projectiles } from "./components/Projectiles";
import {
  CityTravelButton,
  DeadScreen,
  LeaderboardScreen,
  MainMenu,
} from "./components/Screens";
import { useGameStore } from "./store";

// Shared player position ref accessible to HUD
export const sharedPlayerPos = { current: new THREE.Vector3(0, 0, 0) };

// Shared proximity state: which building the player is near
export const sharedProximity = {
  current: null as null | "bank" | "gunshop",
};

export function Game() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#87CEEB",
      }}
    >
      {/* 3D Canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          visibility:
            phase === "playing" || phase === "dead" ? "visible" : "hidden",
        }}
      >
        <Canvas
          camera={{ position: [0, 6, 10], fov: 60 }}
          shadows
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#87CEEB" }}
        >
          <GameScene />
        </Canvas>
      </div>

      {/* 2D overlays on top of canvas */}
      {(phase === "playing" || phase === "dead") && (
        <>
          <HUD />
          <GunShop />
          <BankOverlay />
          <CityTravelButton />
        </>
      )}

      {/* Full screen overlays */}
      <MainMenu />
      <DeadScreen />
      <LeaderboardScreen />
    </div>
  );
}

function GameScene() {
  const playerRef = useRef<PlayerHandle>(null);
  const npcsRef = useRef<NPCsHandle>(null);
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [carHits] = useState<Record<number, number>>({});
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0, 0));
  const expIdCounter = useRef(0);

  const {
    currentCity,
    phase,
    inBank,
    inGunShop,
    bankRobbed,
    wantedLevel,
    takeDamage,
    increaseWanted,
    setInBank,
    setInGunShop,
    addMoney,
    addNotification,
    setBankRobbed,
    tickWantedDecay,
  } = useGameStore();

  const cityConfig = CITY_CONFIGS[currentCity];

  const handleShoot = useCallback((proj: ProjectileData) => {
    setProjectiles((p) => [...p, proj]);
  }, []);

  const handleExplosion = useCallback((pos: [number, number, number]) => {
    expIdCounter.current++;
    setExplosions((e) => [
      ...e,
      { id: expIdCounter.current, position: pos, startTime: Date.now() },
    ]);
  }, []);

  const handleProjectilesUpdate = useCallback((updated: ProjectileData[]) => {
    setProjectiles(updated);
  }, []);

  const handleNpcHit = useCallback((npcId: number, damage: number) => {
    npcsRef.current?.hitNpc(npcId, damage);
  }, []);

  const handleNpcKilled = useCallback(
    (type: "pedestrian" | "guard" | "cop") => {
      increaseWanted(type === "pedestrian" ? 2 : 1);
      const msg =
        type === "guard"
          ? "GUARD DOWN! ⚠"
          : type === "cop"
            ? "COP DOWN! ★★"
            : "MURDER! ★";
      const color = type === "pedestrian" ? "#ff2244" : "#ff8800";
      addNotification(msg, color);
    },
    [increaseWanted, addNotification],
  );

  const handleExplosionDone = useCallback((id: number) => {
    setExplosions((e) => e.filter((ex) => ex.id !== id));
  }, []);

  // Interact key (E)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "e" || phase !== "playing") return;

      const pos = playerRef.current?.getPosition();
      if (!pos) return;

      const bankPos = new THREE.Vector3(20, 0, 0);
      const shopPos = new THREE.Vector3(-20, 0, 15);

      // Enter bank
      if (!inBank && !inGunShop && pos.distanceTo(bankPos) < 9) {
        setInBank(true);
        addNotification("ENTERING BANK — GUARDS ALERT!", "#ff2244");
        increaseWanted(1);
        return;
      }

      // Rob bank
      if (inBank && !bankRobbed) {
        setBankRobbed(true);
        const reward = cityConfig.bankReward;
        addMoney(reward);
        increaseWanted(3);
        addNotification(`BANK ROBBED! +$${reward.toLocaleString()}`, "#ffcc00");
        return;
      }

      // Open gun shop
      if (!inGunShop && !inBank && pos.distanceTo(shopPos) < 8) {
        setInGunShop(true);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    phase,
    inBank,
    inGunShop,
    bankRobbed,
    cityConfig,
    setInBank,
    setInGunShop,
    addMoney,
    addNotification,
    increaseWanted,
    setBankRobbed,
  ]);

  // Wanted level decay
  useEffect(() => {
    const interval = setInterval(() => tickWantedDecay(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [tickWantedDecay]);

  // Auto-exit bank
  useEffect(() => {
    if (!inBank) return;
    const interval = setInterval(() => {
      const pos = playerRef.current?.getPosition();
      if (pos && pos.distanceTo(new THREE.Vector3(20, 0, 0)) > 16) {
        setInBank(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [inBank, setInBank]);

  // Auto-close gun shop
  useEffect(() => {
    if (!inGunShop) return;
    const interval = setInterval(() => {
      const pos = playerRef.current?.getPosition();
      if (pos && pos.distanceTo(new THREE.Vector3(-20, 0, 15)) > 12) {
        setInGunShop(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [inGunShop, setInGunShop]);

  // Update player pos ref (for NPCs and shared)
  useEffect(() => {
    const interval = setInterval(() => {
      const pos = playerRef.current?.getPosition();
      if (pos) {
        sharedPlayerPos.current.copy(pos);
        setPlayerPos(pos.clone());

        // Update proximity for E-to-enter HUD prompt
        const bankPos = new THREE.Vector3(20, 0, 0);
        const shopPos = new THREE.Vector3(-20, 0, 15);
        if (!inBank && !inGunShop && pos.distanceTo(bankPos) < 9) {
          sharedProximity.current = "bank";
        } else if (!inGunShop && !inBank && pos.distanceTo(shopPos) < 8) {
          sharedProximity.current = "gunshop";
        } else {
          sharedProximity.current = null;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [inBank, inGunShop]);

  const fogColor = new THREE.Color("#c9e8f8");

  return (
    <>
      {/* Bright sunny daytime lighting */}
      <ambientLight intensity={1.2} color="#fff8e8" />
      <directionalLight
        position={[60, 100, 40]}
        intensity={5.0}
        color="#fffde0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={250}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      {/* Fill light from opposite side — soft blue skylight */}
      <directionalLight
        position={[-40, 60, -30]}
        intensity={1.2}
        color="#b8d8f8"
      />
      {/* Ground bounce light */}
      <hemisphereLight args={["#87ceeb", "#6aaa50", 0.8]} />

      {/* Clear sunny sky — push fog very far for crisp visibility */}
      <fog attach="fog" args={[fogColor, 120, 350]} />
      <Sky
        distance={450000}
        sunPosition={[150, 60, 80]}
        inclination={0.48}
        azimuth={0.22}
        turbidity={1}
        rayleigh={0.3}
        mieCoefficient={0.001}
        mieDirectionalG={0.95}
      />

      {/* Bright visible sun sphere with glow halo */}
      <mesh position={[150, 120, 80]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      {/* Sun glow halo */}
      <mesh position={[150, 120, 80]}>
        <sphereGeometry args={[14, 16, 16]} />
        <meshBasicMaterial color="#ffff88" transparent opacity={0.12} />
      </mesh>

      {/* City world */}
      <CityScene
        cityConfig={cityConfig}
        playerPosition={playerPos}
        carHits={carHits}
      />

      {/* Player */}
      <Player
        ref={playerRef}
        onShoot={handleShoot}
        onExplosion={handleExplosion}
      />

      {/* NPCs */}
      <NPCs
        ref={npcsRef}
        playerPosition={playerPos}
        wantedLevel={wantedLevel}
        inBank={inBank}
        cityConfig={cityConfig}
        onDamagePlayer={takeDamage}
        onNpcKilled={handleNpcKilled}
      />

      {/* Projectiles */}
      <Projectiles
        projectiles={projectiles}
        onProjectilesUpdate={handleProjectilesUpdate}
        onExplosion={(exp) => setExplosions((e) => [...e, exp])}
        getNpcPositions={() => npcsRef.current?.getNPCPositions() ?? []}
        onNpcHit={handleNpcHit}
      />

      {/* Explosion VFX */}
      <Explosions
        explosions={explosions}
        onExplosionDone={handleExplosionDone}
      />
    </>
  );
}
