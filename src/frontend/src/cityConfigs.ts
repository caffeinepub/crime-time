export interface CityConfig {
  name: string;
  unlockCost: number;
  guardCount: number;
  guardHp: number;
  copCount: number;
  copHp: number;
  bankReward: number;
  color: string;
  fogColor: string;
  groundColor: string;
  buildingColors: string[];
}

export const CITY_CONFIGS: CityConfig[] = [
  {
    name: "Liberty City",
    unlockCost: 0,
    guardCount: 2,
    guardHp: 50,
    copCount: 2,
    copHp: 40,
    bankReward: 2000,
    color: "#ff2244",
    fogColor: "#1a1a2e",
    groundColor: "#1a1a1a",
    buildingColors: ["#2a2a2a", "#333333", "#222222", "#2d2d2d", "#282828"],
  },
  {
    name: "Vice City",
    unlockCost: 5000,
    guardCount: 3,
    guardHp: 75,
    copCount: 4,
    copHp: 60,
    bankReward: 4000,
    color: "#ff44aa",
    fogColor: "#2e1a2a",
    groundColor: "#1e1a1e",
    buildingColors: ["#3a1a3a", "#2a1a3a", "#3a1a2a", "#2d1d2d", "#281828"],
  },
  {
    name: "San Andreas",
    unlockCost: 15000,
    guardCount: 4,
    guardHp: 100,
    copCount: 6,
    copHp: 80,
    bankReward: 7000,
    color: "#ffaa00",
    fogColor: "#2e2a1a",
    groundColor: "#1e1a10",
    buildingColors: ["#3a3010", "#2a280a", "#3a3218", "#302810", "#282210"],
  },
  {
    name: "Chicago",
    unlockCost: 35000,
    guardCount: 5,
    guardHp: 130,
    copCount: 8,
    copHp: 100,
    bankReward: 12000,
    color: "#00aaff",
    fogColor: "#1a2030",
    groundColor: "#141820",
    buildingColors: ["#1a2030", "#202840", "#1a2235", "#182030", "#162030"],
  },
  {
    name: "New York",
    unlockCost: 70000,
    guardCount: 6,
    guardHp: 160,
    copCount: 10,
    copHp: 120,
    bankReward: 20000,
    color: "#aaffaa",
    fogColor: "#202025",
    groundColor: "#1a1a1c",
    buildingColors: ["#242428", "#2a2a30", "#222224", "#202022", "#282830"],
  },
  {
    name: "Tokyo",
    unlockCost: 120000,
    guardCount: 8,
    guardHp: 200,
    copCount: 12,
    copHp: 150,
    bankReward: 35000,
    color: "#ff0088",
    fogColor: "#1a0a20",
    groundColor: "#100810",
    buildingColors: ["#2a0a2a", "#1a0818", "#300a30", "#200820", "#280828"],
  },
  {
    name: "London",
    unlockCost: 200000,
    guardCount: 10,
    guardHp: 250,
    copCount: 15,
    copHp: 180,
    bankReward: 60000,
    color: "#ffd700",
    fogColor: "#202020",
    groundColor: "#181818",
    buildingColors: ["#282820", "#302820", "#282818", "#2a2818", "#303020"],
  },
];
