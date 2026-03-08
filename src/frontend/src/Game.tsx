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

export function Game() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#080808",
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
          style={{ background: "#080808" }}
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
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const npcPositions = npcsRef.current?.getNPCPositions() ?? [];

  const fogColor = new THREE.Color(cityConfig.fogColor);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        position={[0, 20, 0]}
        intensity={0.5}
        color={cityConfig.color}
      />

      {/* Atmosphere */}
      <fog attach="fog" args={[fogColor, 35, 100]} />
      <Sky
        distance={450000}
        sunPosition={[100, 5, 100]}
        inclination={0}
        azimuth={0.25}
        turbidity={20}
        rayleigh={0.2}
      />

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
        npcPositions={npcPositions}
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
