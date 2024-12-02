import { create } from "zustand";
import { usePlayerStore } from "@stores";
import type { Player, PlayerPair } from "@types";
import { generateUniqueId } from "@utils";

interface PairState {
  /**
   * List of all player pairs
   */
  pairs: PlayerPair[];

  /**
   * Creates a new pair
   *
   * @param pairName Pair name
   * @param firstPlayerId First player ID
   * @param secondPlayerId Second player ID
   */
  createPair: (
    pairName: string,
    firstPlayerId: string,
    secondPlayerId: string,
  ) => void;

  /**
   * Deletes a pair
   *
   * @param pairId Pair ID to delete
   */
  deletePair: (pairId: string) => void;

  /**
   * Gets a player's paired partner
   *
   * @param playerId Player ID to find partner for
   * @returns The paired player or null if not paired
   */
  // getPairedPlayer: (playerId: string) => Player | null;

  /**
   * Checks if two players can be paired
   *
   * @param firstPlayerId First player ID
   * @param secondPlayerId Second player ID
   * @returns Whether the players can be paired
   */
  canPairPlayers: (firstPlayerId: string, secondPlayerId: string) => boolean;

  /**
   * Gets available players for pairing
   */
  getAvailablePlayersForPairing: () => Player[];

  /**
   * Gets all pairs
   *
   * @returns List of all pairs
   */
  getPairs: () => PlayerPair[];
}

export const usePairStore = create<PairState>((set, get) => {
  // Lazily get state stores to avoid circular dependency
  const getPlayerStore = () => usePlayerStore.getState();

  return {
    pairs: [],

    createPair: (pairName, firstPlayerId, secondPlayerId) => {
      if (!get().canPairPlayers(firstPlayerId, secondPlayerId)) {
        console.warn("Cannot pair players");
        return;
      }

      const newPair: PlayerPair = {
        id: generateUniqueId(),
        playerIds: [firstPlayerId, secondPlayerId],
        createdAt: Date.now(),
        name: pairName,
      };

      set((state) => ({
        pairs: [...state.pairs, newPair],
      }));
    },

    deletePair: (pairId) => {
      set((state) => ({
        pairs: state.pairs.filter((p) => p.id !== pairId),
      }));
    },

    // getPairedPlayer: (playerId) => {
    //   const { pairs } = get();
    //   const { players } = getPlayerStore();

    //   const pair = pairs.find((p) => p.playerIds.includes(playerId));

    //   if (!pair) return null;

    //   const partnerId =
    //     pair.playerIds[0] === playerId ? pair.playerIds[1] : pair.playerIds[0];

    //   return players.find((p) => p.id === partnerId) || null;
    // },

    getAvailablePlayersForPairing: () => {
      const players = getPlayerStore().players;
      const pairs = get().pairs;

      return players.filter(
        (p) =>
          p.status === "available" &&
          !pairs.some((pair) => pair.playerIds.includes(p.id)),
      );
    },

    canPairPlayers: (firstPlayerId, secondPlayerId) => {
      const { pairs } = get();
      const { players } = getPlayerStore();

      // Check if players exist
      const firstPlayer = players.find((p) => p.id === firstPlayerId);
      const secondPlayer = players.find((p) => p.id === secondPlayerId);

      if (!firstPlayer || !secondPlayer) {
        console.warn("One or both players not found");
        return false;
      }

      // Check if either player is already paired
      const existingPair = pairs.find(
        (p) =>
          p.playerIds.includes(firstPlayerId) ||
          p.playerIds.includes(secondPlayerId),
      );

      if (existingPair) {
        console.warn("One or both players already paired");
        return false;
      }

      return true;
    },

    getPairs: () => get().pairs,
  };
});
