import { create } from "zustand";

export type GamePhase = "menu" | "playing" | "dead" | "leaderboard";

export interface Notification {
  id: number;
  text: string;
  color: string;
}

export interface GameState {
  // Player
  health: number;
  money: number;
  currentCity: number;
  weapons: number[];
  activeWeapon: number;
  ammo: Record<number, number>;
  wantedLevel: number;
  lastCrimeTime: number;

  // Game phase
  phase: GamePhase;
  inBank: boolean;
  inGunShop: boolean;
  bankRobbed: boolean;

  // Notifications
  notifications: Notification[];
  notifCounter: number;

  // Actions
  addMoney: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  increaseWanted: (amount?: number) => void;
  decreaseWanted: () => void;
  buyWeapon: (weaponId: number, cost: number) => boolean;
  switchWeapon: (weaponId: number) => void;
  useAmmo: (weaponId: number) => boolean;
  reloadAmmo: (weaponId: number, amount: number) => void;
  setPhase: (phase: GamePhase) => void;
  setCity: (cityId: number) => void;
  setInBank: (v: boolean) => void;
  setInGunShop: (v: boolean) => void;
  setBankRobbed: (v: boolean) => void;
  addNotification: (text: string, color?: string) => void;
  removeNotification: (id: number) => void;
  tickWantedDecay: (now: number) => void;
  resetGame: () => void;
  loadProgress: (
    city: number,
    money: number,
    weapons: number[],
    health: number,
  ) => void;
}

export const WEAPON_CONFIGS = [
  {
    id: 0,
    name: "Pistol",
    damage: 25,
    fireRate: 500,
    ammoMax: 60,
    cost: 0,
    color: "#888888",
  },
  {
    id: 1,
    name: "Shotgun",
    damage: 70,
    fireRate: 1200,
    ammoMax: 30,
    cost: 500,
    color: "#c8a060",
  },
  {
    id: 2,
    name: "SMG",
    damage: 18,
    fireRate: 150,
    ammoMax: 120,
    cost: 1200,
    color: "#4488cc",
  },
  {
    id: 3,
    name: "Rocket",
    damage: 200,
    fireRate: 2000,
    ammoMax: 10,
    cost: 3000,
    color: "#ff4400",
  },
];

const initialAmmo: Record<number, number> = {
  0: 60,
  1: 0,
  2: 0,
  3: 0,
};

const initialState = {
  health: 100,
  money: 0,
  currentCity: 0,
  weapons: [0],
  activeWeapon: 0,
  ammo: { ...initialAmmo },
  wantedLevel: 0,
  lastCrimeTime: 0,
  phase: "menu" as GamePhase,
  inBank: false,
  inGunShop: false,
  bankRobbed: false,
  notifications: [] as Notification[],
  notifCounter: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  addMoney: (amount) => set((s) => ({ money: s.money + amount })),

  takeDamage: (amount) =>
    set((s) => {
      const newHealth = Math.max(0, s.health - amount);
      if (newHealth <= 0) {
        return { health: 0, phase: "dead" as GamePhase };
      }
      return { health: newHealth };
    }),

  heal: (amount) => set((s) => ({ health: Math.min(100, s.health + amount) })),

  increaseWanted: (amount = 1) =>
    set((s) => ({
      wantedLevel: Math.min(5, s.wantedLevel + amount),
      lastCrimeTime: Date.now(),
    })),

  decreaseWanted: () =>
    set((s) => ({ wantedLevel: Math.max(0, s.wantedLevel - 1) })),

  buyWeapon: (weaponId, cost) => {
    const s = get();
    if (s.money < cost || s.weapons.includes(weaponId)) return false;
    const wc = WEAPON_CONFIGS[weaponId];
    set((st) => ({
      money: st.money - cost,
      weapons: [...st.weapons, weaponId],
      ammo: { ...st.ammo, [weaponId]: wc.ammoMax },
    }));
    return true;
  },

  switchWeapon: (weaponId) =>
    set((s) => {
      if (s.weapons.includes(weaponId)) return { activeWeapon: weaponId };
      return {};
    }),

  useAmmo: (weaponId) => {
    const s = get();
    if ((s.ammo[weaponId] ?? 0) <= 0) return false;
    set((st) => ({
      ammo: { ...st.ammo, [weaponId]: (st.ammo[weaponId] ?? 0) - 1 },
    }));
    return true;
  },

  reloadAmmo: (weaponId, amount) =>
    set((s) => ({
      ammo: {
        ...s.ammo,
        [weaponId]: Math.min(
          WEAPON_CONFIGS[weaponId]?.ammoMax ?? 60,
          (s.ammo[weaponId] ?? 0) + amount,
        ),
      },
    })),

  setPhase: (phase) => set({ phase }),

  setCity: (cityId) =>
    set({
      currentCity: cityId,
      inBank: false,
      inGunShop: false,
      bankRobbed: false,
    }),

  setInBank: (v) => set({ inBank: v }),

  setInGunShop: (v) => set({ inGunShop: v }),

  setBankRobbed: (v) => set({ bankRobbed: v }),

  addNotification: (text, color = "#ffcc00") => {
    const id = get().notifCounter + 1;
    set((s) => ({
      notifCounter: id,
      notifications: [...s.notifications, { id, text, color }],
    }));
    setTimeout(() => {
      get().removeNotification(id);
    }, 3000);
  },

  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  tickWantedDecay: (now) => {
    const s = get();
    if (s.wantedLevel > 0 && now - s.lastCrimeTime > 30000) {
      set({ wantedLevel: Math.max(0, s.wantedLevel - 1), lastCrimeTime: now });
    }
  },

  resetGame: () =>
    set({
      ...initialState,
      phase: "playing",
      ammo: { ...initialAmmo },
      notifications: [],
      notifCounter: 0,
    }),

  loadProgress: (city, money, weapons, health) =>
    set((s) => {
      const newWeapons = weapons.length > 0 ? weapons : [0];
      const newAmmo: Record<number, number> = { ...s.ammo };
      for (const wId of newWeapons) {
        newAmmo[wId] = WEAPON_CONFIGS[wId]?.ammoMax ?? 60;
      }
      return {
        currentCity: city,
        money,
        weapons: newWeapons,
        health: Math.max(10, health),
        ammo: newAmmo,
        activeWeapon: newWeapons[0] ?? 0,
      };
    }),
}));
