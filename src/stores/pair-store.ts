import { v4 as uuid } from "uuid";
import { create } from "zustand";
import type { PlayerPair } from "@types";
import { usePlayerStore } from "./player-store";

/**
 * State interface for player pairs
 *
 * This interface defines the structure of the pair state.
 */
interface PairState {
  /**
   * List of active player pairs
   *
   * This array stores all the active player pairs.
   */
  pairs: PlayerPair[];
}

/**
 * Actions interface for managing player pairs
 *
 * This interface defines the actions that can be performed on player pairs.
 */
interface PairActions {
  /**
   * Creates a new player pair
   *
   * This action creates a new player pair with the given player IDs and name.
   * It first validates the pair using the validatePair action, then creates a new pair with a unique ID and timestamp.
   * Finally, it updates the player partner references.
   *
   * @param playerIds The IDs of the two players to pair.
   * @param name The name of the pair.
   */
  createPair: (playerIds: [string, string], name: string) => void;

  /**
   * Removes a player pair
   *
   * This action removes a player pair with the given ID.
   * It first clears the partner references for both players, then removes the pair from the pairs list.
   *
   * @param pairId The ID of the pair to remove.
   */
  deletePair: (pairId: string) => void;

  /**
   * Gets the paired player ID for a given player
   *
   * This action returns the ID of the player paired with the given player.
   * If the player is not in a pair, it returns null.
   *
   * @param playerId The ID of the player to find the pair for.
   * @returns The ID of the paired player, or null if not in a pair.
   */
  getPairedPlayer: (playerId: string) => string | null;

  /**
   * Validates if two players can be paired
   *
   * This action checks if two players can be paired.
   * It checks if both players exist and are available, and if neither player is already in a pair.
   *
   * @param playerIds The IDs of the two players to validate.
   * @returns True if the players can be paired, false otherwise.
   */
  validatePair: (playerIds: [string, string]) => boolean;

  /**
   * Updates player partner references
   *
   * This action updates the partner references for two players.
   * It updates the first player's partner ID, and if the second player exists, it updates their partner ID as well.
   * If the second ID is null, it handles the unpair operation.
   *
   * @param playerIds The IDs of the two players to update.
   */
  updatePlayerPartners: (playerIds: [string, string | null]) => void;
}

/**
 * Type alias for the pair store
 *
 * This type alias combines the PairState and PairActions interfaces.
 */
type UsePairStore = PairState & PairActions;

/**
 * Creates the pair store
 *
 * This function creates the pair store using the create function from zustand.
 * It initializes the pairs array and defines the actions for managing player pairs.
 */
export const usePairStore = create<UsePairStore>((set, get) => ({
  pairs: [],

  /**
   * Validates if two players can be paired
   *
   * This action checks if two players can be paired.
   * It checks if both players exist and are available, and if neither player is already in a pair.
   *
   * @param playerIds The IDs of the two players to validate.
   * @returns True if the players can be paired, false otherwise.
   */
  validatePair: (playerIds) => {
    const playerStore = usePlayerStore.getState();
    const players = playerStore.players;

    // Check if both players exist and are available
    const validPlayers = playerIds.every((id) => {
      const player = players.find((p) => p.id === id);
      return player && player.status === "available";
    });

    // Check if neither player is already in a pair
    const notPaired = playerIds.every((id) => !get().getPairedPlayer(id));

    return validPlayers && notPaired;
  },

  /**
   * Creates a new player pair
   *
   * This action creates a new player pair with the given player IDs and name.
   * It first validates the pair using the validatePair action, then creates a new pair with a unique ID and timestamp.
   * Finally, it updates the player partner references.
   *
   * @param playerIds The IDs of the two players to pair.
   * @param name The name of the pair.
   */
  createPair: (playerIds, name) => {
    if (!get().validatePair(playerIds)) return;

    set((state) => ({
      pairs: [
        ...state.pairs,
        {
          id: uuid(),
          playerIds,
          name,
          createdAt: Date.now(),
        },
      ],
    }));

    get().updatePlayerPartners(playerIds);
  },

  /**
   * Removes a player pair
   *
   * This action removes a player pair with the given ID.
   * It first clears the partner references for both players, then removes the pair from the pairs list.
   *
   * @param pairId The ID of the pair to remove.
   */
  deletePair: (pairId) => {
    const pair = get().pairs.find((p) => p.id === pairId);
    if (!pair) return;

    // Clear partner IDs before removing pair
    get().updatePlayerPartners([pair.playerIds[0], null]);
    get().updatePlayerPartners([pair.playerIds[1], null]);

    set((state) => ({
      pairs: state.pairs.filter((pair) => pair.id !== pairId),
    }));
  },

  /**
   * Gets the paired player ID for a given player
   *
   * This action returns the ID of the player paired with the given player.
   * If the player is not in a pair, it returns null.
   *
   * @param playerId The ID of the player to find the pair for.
   * @returns The ID of the paired player, or null if not in a pair.
   */
  getPairedPlayer: (playerId) => {
    const { pairs } = get();
    const pair = pairs.find((p) => p.playerIds.includes(playerId));
    if (!pair) return null;
    return pair.playerIds.find((id) => id !== playerId) || null;
  },

  /**
   * Updates player partner references
   *
   * This action updates the partner references for two players.
   * It updates the first player's partner ID, and if the second player exists, it updates their partner ID as well.
   * If the second ID is null, it handles the unpair operation.
   *
   * @param playerIds The IDs of the two players to update.
   */
  updatePlayerPartners: (playerIds) => {
    const [playerId1, playerId2] = playerIds;
    const playerStore = usePlayerStore.getState();

    // Find the players to update
    const player1 = playerStore.players.find((p) => p.id === playerId1);

    // Update first player
    if (player1) {
      playerStore.updatePlayer({
        ...player1,
        partnerId: playerId2 || undefined,
      });
    }

    // Update second player if it exists
    if (playerId2) {
      const player2 = playerStore.players.find((p) => p.id === playerId2);

      if (player2) {
        playerStore.updatePlayer({ ...player2, partnerId: playerId1 });
      }
    }
  },
}));
