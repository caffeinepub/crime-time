# Crime Time

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full 3D open-world crime game built with React Three Fiber
- Third-person GTA-style follow camera
- Player character with WASD movement and mouse-aim controls
- 3D city environment: buildings, roads, parked cars, pedestrians, a bank building, and a gun shop
- Bank robbery mechanic: enter bank, fight armed guards, collect cash bags, escape cops
- Crime actions: shoot pedestrians/enemies, destroy cars (explode on enough damage), blow up buildings
- Wanted system: committing crimes raises wanted level, cops spawn and chase player
- Gun shop: visible on map, purchase weapons with earned money (pistol, shotgun, rocket launcher, SMG)
- 7 cities with progressive difficulty: tougher guards, more cops, higher money thresholds to unlock next city
- City travel: unlock next city when player earns enough money (threshold increases per city)
- HUD: money counter, health bar, wanted level (stars), ammo count, current city name, minimap
- Weapon system: switch between owned weapons, different damage/fire rate/ammo per gun
- Persistence: save player progress (money, weapons, current city) to backend canister

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan

### Backend (Motoko)
- Store player profile: current city index, total money earned, owned weapons, health
- Save/load progress endpoints
- Leaderboard: top money earned per player

### Frontend (React Three Fiber)
- Game engine loop with `useFrame`
- City scene: procedural grid-based city layout with colored box buildings, roads, sidewalks
- Player controller: WASD movement, third-person camera orbit, pointer-lock mouse aim
- NPC system: pedestrians (flee on crime), guards (patrol bank, attack on intrusion), cops (spawn on wanted level)
- Bank interior: separate room with guards and cash collectibles
- Gun shop: enter building, buy weapon UI overlay
- Weapon system: pistol (free/default), shotgun ($500), SMG ($1200), rocket launcher ($3000)
- Explosion VFX: particle burst + shockwave ring for cars/buildings
- HUD overlay: health, money, wanted stars, ammo, city name
- City progression: 7 city configs with increasing cop count, guard HP, money thresholds
- City unlock modal: trigger when threshold met, confirm travel
- Game state: zustand store for player stats, game phase, weapon inventory
- Persistence: save/load from backend on game start/end
