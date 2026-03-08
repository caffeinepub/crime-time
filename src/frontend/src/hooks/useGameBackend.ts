import { useCallback } from "react";
import { useActor } from "./useActor";

export function useGameBackend() {
  const { actor } = useActor();

  const loadProgress = useCallback(async () => {
    if (!actor) return null;
    try {
      return await actor.loadGameProgress();
    } catch {
      return null;
    }
  }, [actor]);

  const saveProgress = useCallback(
    async (
      currentCity: number,
      totalMoney: number,
      weaponIds: number[],
      health: number,
    ) => {
      if (!actor) return;
      try {
        await actor.saveGameProgress(
          BigInt(currentCity),
          BigInt(totalMoney),
          weaponIds.map((w) => BigInt(w)),
          BigInt(health),
        );
      } catch {
        // silently fail
      }
    },
    [actor],
  );

  const getLeaderboard = useCallback(async () => {
    if (!actor) return [];
    try {
      return await actor.getLeaderboard();
    } catch {
      return [];
    }
  }, [actor]);

  return { loadProgress, saveProgress, getLeaderboard, hasActor: !!actor };
}
