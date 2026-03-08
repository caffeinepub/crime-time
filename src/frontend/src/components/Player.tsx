import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { WEAPON_CONFIGS, useGameStore } from "../store";
import type { ProjectileData } from "./Projectiles";

export interface PlayerHandle {
  getPosition: () => THREE.Vector3;
  getAimDirection: () => THREE.Vector3;
}

interface PlayerProps {
  onShoot: (proj: ProjectileData) => void;
  onExplosion: (pos: [number, number, number]) => void;
}

let projIdCounter = 1;

export const Player = forwardRef<PlayerHandle, PlayerProps>(
  ({ onShoot }, ref) => {
    const { camera } = useThree();
    const meshRef = useRef<THREE.Group>(null);
    const positionRef = useRef(new THREE.Vector3(0, 0, 0));
    const aimRef = useRef(new THREE.Vector3(1, 0, 0));
    const keysRef = useRef<Set<string>>(new Set());
    const lastShot = useRef(0);
    const isShooting = useRef(false);
    const mouseRef = useRef({ x: 0, y: 0 });
    const yawRef = useRef(0);

    const { activeWeapon, weapons, addNotification } = useGameStore();
    // Store ref to avoid calling useGameStore inside useFrame
    const storeRef = useRef(useGameStore.getState);
    storeRef.current = useGameStore.getState;

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (e.type === "keydown") {
          keysRef.current.add(k);
          // Weapon switching
          if (k === "1" || k === "2" || k === "3" || k === "4") {
            const wId = Number.parseInt(k) - 1;
            if (weapons.includes(wId)) {
              useGameStore.getState().switchWeapon(wId);
            }
          }
        } else {
          keysRef.current.delete(k);
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement) {
          yawRef.current -= e.movementX * 0.003;
          mouseRef.current.x += e.movementX;
          mouseRef.current.y += e.movementY;
        } else {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.x = nx * 50;
        }
      };

      const onMouseDown = (e: MouseEvent) => {
        if (e.button === 0) isShooting.current = true;
      };
      const onMouseUp = (e: MouseEvent) => {
        if (e.button === 0) isShooting.current = false;
      };

      const onSpaceDown = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          isShooting.current = true;
        }
      };
      const onSpaceUp = (e: KeyboardEvent) => {
        if (e.code === "Space") isShooting.current = false;
      };

      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("keydown", onSpaceDown);
      window.addEventListener("keyup", onSpaceUp);

      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("keydown", onSpaceDown);
        window.removeEventListener("keyup", onSpaceUp);
      };
    }, [weapons]);

    useImperativeHandle(ref, () => ({
      getPosition: () => positionRef.current.clone(),
      getAimDirection: () => aimRef.current.clone(),
    }));

    useFrame((_, delta) => {
      const keys = keysRef.current;
      const speed = 8;

      // Movement based on yaw
      let moveX = 0;
      let moveZ = 0;
      if (keys.has("w") || keys.has("arrowup")) moveZ -= 1;
      if (keys.has("s") || keys.has("arrowdown")) moveZ += 1;
      if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
      if (keys.has("d") || keys.has("arrowright")) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= len;
        moveZ /= len;

        // Rotate movement by yaw
        const cosY = Math.cos(yawRef.current);
        const sinY = Math.sin(yawRef.current);
        const worldX = moveX * cosY - moveZ * sinY;
        const worldZ = moveX * sinY + moveZ * cosY;

        positionRef.current.x += worldX * speed * delta;
        positionRef.current.z += worldZ * speed * delta;
        positionRef.current.y = 0;

        // Clamp to city bounds
        positionRef.current.x = Math.max(
          -55,
          Math.min(55, positionRef.current.x),
        );
        positionRef.current.z = Math.max(
          -55,
          Math.min(55, positionRef.current.z),
        );

        // Face movement direction
        aimRef.current.set(worldX, 0, worldZ).normalize();
        if (meshRef.current) {
          meshRef.current.rotation.y = Math.atan2(worldX, worldZ);
        }
      }

      // Update aim based on yaw (where camera faces)
      aimRef.current.set(
        Math.sin(yawRef.current),
        0,
        -Math.cos(yawRef.current),
      );

      // Camera follow
      const camOffset = new THREE.Vector3(
        Math.sin(yawRef.current) * -10,
        6,
        Math.cos(yawRef.current) * 10,
      );
      camera.position.lerp(positionRef.current.clone().add(camOffset), 0.12);
      camera.lookAt(
        positionRef.current.clone().add(new THREE.Vector3(0, 1, 0)),
      );

      // Update mesh position
      if (meshRef.current) {
        meshRef.current.position.copy(positionRef.current);
      }

      // Shooting
      if (isShooting.current) {
        const now = Date.now();
        const weapon = WEAPON_CONFIGS[activeWeapon];
        if (weapon && now - lastShot.current >= weapon.fireRate) {
          // Access store state directly — not a React hook
          const gs = storeRef.current();
          const consumeAmmo = gs.useAmmo;
          const hasAmmo = consumeAmmo(activeWeapon);
          if (hasAmmo) {
            lastShot.current = now;
            const projPos = positionRef.current
              .clone()
              .add(new THREE.Vector3(0, 1.2, 0));
            const direction = aimRef.current.clone().normalize();
            onShoot({
              id: projIdCounter++,
              position: projPos,
              direction,
              speed: weapon.id === 3 ? 25 : 40,
              damage: weapon.damage,
              distanceTraveled: 0,
              isRocket: weapon.id === 3,
            });

            if (storeRef.current().wantedLevel === 0) {
              storeRef.current().increaseWanted(1);
              addNotification("WANTED! ★", "#ff2244");
            }
          } else {
            if (now - lastShot.current > 2000) {
              lastShot.current = now;
              addNotification("OUT OF AMMO!", "#ff8800");
            }
          }
        }
      }
    });

    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.7, 1.4, 0.5]} />
          <meshLambertMaterial color="#cc2222" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshLambertMaterial color="#ffaa88" />
        </mesh>
        {/* Weapon */}
        <mesh position={[0.4, 0.9, 0.3]}>
          <boxGeometry args={[0.1, 0.1, 0.5]} />
          <meshLambertMaterial
            color={WEAPON_CONFIGS[activeWeapon]?.color ?? "#888"}
          />
        </mesh>
      </group>
    );
  },
);

Player.displayName = "Player";
