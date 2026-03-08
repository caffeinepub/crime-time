import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PlayerProgress {
    totalMoney: bigint;
    weaponIds: Array<bigint>;
    currentCity: bigint;
    health: bigint;
}
export interface backendInterface {
    getLeaderboard(): Promise<Array<PlayerProgress>>;
    loadGameProgress(): Promise<PlayerProgress>;
    saveGameProgress(currentCity: bigint, totalMoney: bigint, weaponIds: Array<bigint>, health: bigint): Promise<void>;
}
