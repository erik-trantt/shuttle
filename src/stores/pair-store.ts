import { create } from "zustand";
import { usePlayerStore } from "./player-store";
import type { Player, PlayerPair } from "@types";
import { useGameStore } from "@stores";
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
  getPairedPlayer: (playerId: string) => Player | null;

  /**
   * Gets initial selection for game
   *
   * @param size Number of players to select
   * @returns List of initially selected players
   */
  getInitialSelection: (size: number) => Player[];

  /**
   * Checks if two players can be paired
   *
   * @param firstPlayerId First player ID
   * @param secondPlayerId Second player ID
   * @returns Whether the players can be paired
   */
  canPairPlayers: (firstPlayerId: string, secondPlayerId: string) => boolean;

  /**
   * Validates player selection based on game settings and pair status
   *
   * @param players Players to validate
   * @returns Whether the selection is valid
   */
  validatePlayerSelection: (players: Player[]) => boolean;

  /**
   * Gets all pairs
   *
   * @returns List of all pairs
   */
  getPairs: () => PlayerPair[];
}

export const usePairStore = create<PairState>((set, get) => ({
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

  getPairedPlayer: (playerId) => {
    const { pairs } = get();
    const { players } = usePlayerStore.getState();

    const pair = pairs.find((p) => p.playerIds.includes(playerId));

    if (!pair) return null;

    const partnerId =
      pair.playerIds[0] === playerId ? pair.playerIds[1] : pair.playerIds[0];

    return players.find((p) => p.id === partnerId) || null;
  },

  validatePlayerSelection: (players) => {
    const { settings } = useGameStore.getState();
    const { getPairedPlayer } = get();

    // Check if selection size matches required player number
    if (players.length > settings.playerNumber) {
      return false;
    }

    // If no players selected, that's valid
    if (players.length === 0) {
      return true;
    }

    // Check if initial player is paired
    const initialPlayer = players[0];
    const isInitialPaired = getPairedPlayer(initialPlayer.id) !== null;

    // Get paired and single players
    const pairedPlayers = players.filter((player) =>
      getPairedPlayer(player.id),
    );
    const singlePlayers = players.filter(
      (player) => !getPairedPlayer(player.id),
    );

    if (isInitialPaired) {
      // When initial player is paired, enforce paired double format
      // Must have either 2 pairs (4 paired players) or 1 pair + 2 singles
      return (
        (pairedPlayers.length === 4 && singlePlayers.length === 0) ||
        (pairedPlayers.length === 2 && singlePlayers.length === 2)
      );
    } else {
      // For regular format, follow game settings
      if (settings.allowPairs) {
        // Allow mix of pairs and singles
        return (
          (pairedPlayers.length === 2 && singlePlayers.length === 2) ||
          (pairedPlayers.length === 0 && singlePlayers.length === 4)
        );
      } else {
        // No pairs allowed
        return pairedPlayers.length === 0 && singlePlayers.length === 4;
      }
    }
  },

  getInitialSelection: (size) => {
    const { getSortedAvailablePlayers: getAvailablePlayers } =
      usePlayerStore.getState();
    const availablePlayers = getAvailablePlayers();

    if (availablePlayers.length === 0) return [];

    const selection: Player[] = [];
    let index = 0;

    while (selection.length < size && index < availablePlayers.length) {
      const player = availablePlayers[index];
      const pairedPlayer = get().getPairedPlayer(player.id);

      // Add player and their pair if possible
      if (pairedPlayer) {
        if (selection.length + 2 <= size) {
          selection.push(player, pairedPlayer);
        }
      } else {
        if (selection.length + 1 <= size) {
          selection.push(player);
        }
      }

      index++;
    }

    return selection;
  },

  canPairPlayers: (firstPlayerId, secondPlayerId) => {
    const { pairs } = get();
    const { players } = usePlayerStore.getState();

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
}));
